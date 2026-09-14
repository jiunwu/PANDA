import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  CATEGORIES,
  FLAG_THRESHOLD,
  WATCH_THRESHOLD,
  splitClauses,
  findingsFor,
  verdictFor,
  summarize,
} from './legalsan';

describe('FLAG_THRESHOLD', () => {
  // The demo once flagged at 0.5 while every published figure was measured at
  // 0.40, so the landing page advertised numbers the demo could not produce.
  // Pin the browser constant to the one the evaluation scripts use.
  it('matches the threshold the evaluation scripts score at', () => {
    const shared = readFileSync(
      join(process.cwd(), 'scripts', 'legalsan_eval.py'),
      'utf8',
    );
    const match = shared.match(/^DEFAULT_THRESHOLD = ([\d.]+)$/m);
    expect(match).not.toBeNull();
    expect(FLAG_THRESHOLD).toBeCloseTo(Number(match[1]), 10);
  });

  it('leaves a watch band below it', () => {
    expect(WATCH_THRESHOLD).toBeLessThan(FLAG_THRESHOLD);
  });
});

describe('CATEGORIES', () => {
  it('describes the eight model outputs in output order', () => {
    expect(CATEGORIES).toHaveLength(8);
    expect(CATEGORIES.map((c) => c.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(CATEGORIES.map((c) => c.id)).toEqual([
      'ltd', 'ter', 'ch', 'cr', 'use', 'law', 'j', 'a',
    ]);
  });
});

describe('splitClauses', () => {
  it('returns nothing for empty input', () => {
    expect(splitClauses('')).toEqual([]);
    expect(splitClauses('   \n  ')).toEqual([]);
  });

  it('keeps offsets that map back to the original text', () => {
    const text =
      'We may terminate your account at any time. These Terms are governed by Irish law. You may cancel whenever you like.';
    const clauses = splitClauses(text);
    expect(clauses).toHaveLength(3);
    for (const clause of clauses) {
      expect(text.slice(clause.start, clause.end)).toBe(clause.text);
    }
  });

  it('does not split decimals, abbreviations or numbered markers', () => {
    const text =
      'Our liability shall not exceed US$ 19.99 per claim under sec. 4.2 of this agreement, e.g. for downtime. Any other remedy is expressly excluded.';
    const clauses = splitClauses(text);
    expect(clauses).toHaveLength(2);
    expect(clauses[0].text).toContain('19.99');
    expect(clauses[0].text).toContain('sec. 4.2');
    expect(clauses[0].text).toContain('e.g.');
    expect(clauses[1].text).toBe('Any other remedy is expressly excluded.');
  });

  it('drops headings so only clause text is classified', () => {
    const text = [
      'Acme Terms of Service',
      '',
      '4. Suspension and termination',
      'We may suspend your account at any time and without notice to you.',
    ].join('\n');
    const clauses = splitClauses(text);
    expect(clauses).toHaveLength(1);
    expect(clauses[0].text).toBe(
      'We may suspend your account at any time and without notice to you.'
    );
  });

  it('folds short fragments into the preceding clause', () => {
    const text =
      'We may remove any content that we believe breaches these rules at our sole discretion. No refunds.';
    const clauses = splitClauses(text);
    expect(clauses).toHaveLength(1);
    expect(clauses[0].text).toContain('No refunds.');
  });

  it('handles a single unpunctuated paragraph', () => {
    const text =
      'you agree that we may change these terms at any time without telling you first and that continued use means acceptance';
    expect(splitClauses(text)).toHaveLength(1);
  });
});

describe('findingsFor / verdictFor', () => {
  const scores = [0.91, 0.02, 0.6, 0.01, 0.3, 0.0, 0.0, 0.0];

  it('returns flagged categories ranked by probability', () => {
    const findings = findingsFor(scores);
    expect(findings.map((f) => f.category.id)).toEqual(['ltd', 'ch']);
    expect(findings[0].score).toBeCloseTo(0.91);
  });

  it('classifies clauses into unfair, watch and clear', () => {
    expect(verdictFor(scores)).toBe('unfair');
    expect(verdictFor([0.3, 0, 0, 0, 0, 0, 0, 0])).toBe('watch');
    expect(verdictFor([0.01, 0, 0, 0, 0, 0, 0, 0])).toBe('clear');
    expect(verdictFor(null)).toBe('clear');
  });
});

describe('summarize', () => {
  const zero = () => [0, 0, 0, 0, 0, 0, 0, 0];

  it('ignores clauses that have not been scored yet', () => {
    const summary = summarize([{ text: 'pending' }]);
    expect(summary.total).toBe(0);
    expect(summary.concern).toBe(0);
  });

  it('counts findings per category and grades the concern level', () => {
    const liability = zero();
    liability[0] = 0.99;
    const termination = zero();
    termination[1] = 0.98;
    const arbitration = zero();
    arbitration[7] = 0.95;
    const watch = zero();
    watch[3] = 0.3;

    const summary = summarize([
      { text: 'a', scores: liability },
      { text: 'b', scores: termination },
      { text: 'c', scores: arbitration },
      { text: 'd', scores: watch },
      { text: 'e', scores: zero() },
    ]);

    expect(summary.total).toBe(5);
    expect(summary.flagged).toHaveLength(3);
    expect(summary.watchCount).toBe(1);
    expect(summary.clearCount).toBe(1);
    expect(summary.categories.map((c) => c.category.id).sort()).toEqual(['a', 'ltd', 'ter']);
    expect(summary.level).toBe('high');
  });

  it('reports a low concern level for a clean document', () => {
    const summary = summarize([
      { text: 'a', scores: zero() },
      { text: 'b', scores: zero() },
    ]);
    expect(summary.flagged).toHaveLength(0);
    expect(summary.concern).toBe(0);
    expect(summary.level).toBe('low');
  });
});
