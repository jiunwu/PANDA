/**
 * Shared metadata and text helpers for the public LegalSan clause demo.
 *
 * The model is a 6-layer transformer encoder with a mean-pooled sigmoid head
 * over eight unfair-clause categories, quantised to int8 (~24 MB). The label
 * order below is the order of the eight output units and must not be changed.
 */

export const MODEL_INFO = {
  name: 'LegalSan',
  sizeMB: 24,
  quantization: 'int8',
  layers: 6,
  hiddenSize: 768,
  maxTokens: 128,
  categories: 8,
};

export const CATEGORIES = [
  {
    id: 'ltd',
    index: 0,
    name: 'Limitation of liability',
    short: 'Liability',
    severity: 'high',
    summary:
      'The provider caps or excludes its own responsibility for damage it causes you.',
    watchFor: 'Blanket exclusions of "any and all" damages, or caps set at a token amount.',
  },
  {
    id: 'ter',
    index: 1,
    name: 'Unilateral termination',
    short: 'Termination',
    severity: 'high',
    summary:
      'Your account can be suspended or closed at the provider’s discretion, without cause or notice.',
    watchFor: '"At any time", "without notice", "for any reason or no reason".',
  },
  {
    id: 'ch',
    index: 2,
    name: 'Unilateral change',
    short: 'Change',
    severity: 'high',
    summary:
      'The provider may rewrite the contract later and treat your continued use as consent.',
    watchFor: 'Changes effective on posting, with no right to reject them.',
  },
  {
    id: 'cr',
    index: 3,
    name: 'Content removal',
    short: 'Content',
    severity: 'medium',
    summary:
      'Your content can be deleted or hidden at the provider’s discretion, sometimes irreversibly.',
    watchFor: 'Removal "without notice" combined with no obligation to keep a copy.',
  },
  {
    id: 'use',
    index: 4,
    name: 'Contract by using',
    short: 'By using',
    severity: 'medium',
    summary:
      'Merely browsing or using the service is deemed acceptance of the whole agreement.',
    watchFor: 'Consent inferred from access rather than from an explicit agreement.',
  },
  {
    id: 'law',
    index: 5,
    name: 'Choice of law',
    short: 'Governing law',
    severity: 'medium',
    summary:
      'A foreign legal system is imposed, which may be far less protective than your own.',
    watchFor: 'Law of the provider’s home state, chosen without regard to where you live.',
  },
  {
    id: 'j',
    index: 6,
    name: 'Jurisdiction',
    short: 'Jurisdiction',
    severity: 'medium',
    summary:
      'Disputes must be brought in distant courts, making enforcement impractical for you.',
    watchFor: 'Exclusive venue in a single county or country far from the consumer.',
  },
  {
    id: 'a',
    index: 7,
    name: 'Arbitration',
    short: 'Arbitration',
    severity: 'high',
    summary:
      'Court and class actions are replaced by private arbitration chosen by the provider.',
    watchFor: 'Jury-trial and class-action waivers bundled into the arbitration clause.',
  },
];

export const CATEGORY_BY_INDEX = CATEGORIES.reduce((acc, category) => {
  acc[category.index] = category;
  return acc;
}, {});

/**
 * A clause counts as flagged at or above this sigmoid probability.
 *
 * 0.40 is the threshold shipped with the checkpoint, and the one every
 * published LegalSan figure is measured at. Changing it here without re-running
 * scripts/eval-legalbench-unfair-tos.py would make the landing page advertise
 * numbers the demo no longer produces; a test pins the two together.
 */
export const FLAG_THRESHOLD = 0.4;

/** Clauses between this and FLAG_THRESHOLD are surfaced as "worth a look". */
export const WATCH_THRESHOLD = 0.25;

const SEVERITY_WEIGHT = { high: 1, medium: 0.65, low: 0.4 };

/* ─────────────────────────── clause segmentation ─────────────────────────── */

const MIN_CLAUSE_CHARS = 30;
const MAX_HEADING_CHARS = 80;
const SENTENCE_ENDERS = new Set(['.', ';', '!', '?']);

// Tokens that end in a period without ending a sentence.
const ABBREVIATIONS = new Set([
  'e.g', 'i.e', 'etc', 'no', 'nos', 'art', 'arts', 'sec', 'secs', 'para', 'paras',
  'cf', 'vs', 'v', 'inc', 'ltd', 'llc', 'plc', 'co', 'corp', 'gmbh', 'ag', 'sa',
  'mr', 'mrs', 'ms', 'dr', 'prof', 'st', 'approx', 'max', 'min', 'u.s', 'u.k',
  'eu', 'al', 'ca', 'fig', 'ph', 'dept',
]);

function isAbbreviation(textBefore) {
  const match = textBefore.match(/([A-Za-z.]+)$/);
  if (!match) return false;
  const word = match[1].replace(/\.$/, '').toLowerCase();
  if (!word) return false;
  // A single letter before a period is an initial ("U.S.", "(a).").
  if (word.length === 1) return true;
  return ABBREVIATIONS.has(word);
}

// "1." / "2)" / "(3)" / "12.4" list markers must not start a new clause.
function isListMarker(textBefore) {
  return /(^|[\s(])\d+(\.\d+)*$/.test(textBefore.trimEnd().slice(-12));
}

function isSentenceBoundary(text, position) {
  const char = text[position];
  if (!SENTENCE_ENDERS.has(char)) return false;

  const before = text.slice(Math.max(0, position - 14), position);
  const after = text.slice(position + 1);

  // A period inside a decimal or a version number ("19.99", "12.4").
  if (char === '.' && /^\d/.test(after) && /\d$/.test(before)) return false;
  if (char === '.' && (isAbbreviation(before) || isListMarker(before))) return false;

  // Must be followed by whitespace and then something that can open a clause.
  const gap = after.match(/^["'\u201c\u2018)\]]*\s*/)[0];
  if (!/\s/.test(gap) && after.length > 0) return false;

  const next = after.slice(gap.length);
  if (!next) return true;
  return /^[A-Z0-9(\u201c"\u2022\-\u2013]/.test(next);
}

/**
 * A heading is a short line that does not close with sentence punctuation —
 * "4. Suspension and termination", "LIMITATION OF LIABILITY". Headings carry no
 * obligation of their own, so they are segmented out and left unclassified
 * instead of being folded into the clause that follows them.
 */
function isHeading(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > MAX_HEADING_CHARS) return false;
  if (/[.;!?]$/.test(trimmed)) return false;
  return /[A-Za-z]/.test(trimmed);
}

/**
 * Splits a terms-of-service document into clause-sized spans, keeping the
 * character offsets so the original text can be highlighted in place.
 * Headings and other non-clause fragments are omitted from the result.
 */
export function splitClauses(text) {
  if (!text || !text.trim()) return [];

  const spans = [];
  let start = 0;

  const pushSpan = (from, to) => {
    const raw = text.slice(from, to);
    const leading = raw.match(/^\s*/)[0].length;
    const trailing = raw.match(/\s*$/)[0].length;
    const spanStart = from + leading;
    const spanEnd = to - trailing;
    if (spanEnd <= spanStart) return;
    const spanText = text.slice(spanStart, spanEnd);
    spans.push({
      start: spanStart,
      end: spanEnd,
      text: spanText,
      heading: isHeading(spanText),
    });
  };

  for (let i = 0; i < text.length; i += 1) {
    // A newline ends the current span when what precedes it reads as a heading,
    // or when the next line opens a new numbered section.
    if (text[i] === '\n') {
      const line = text.slice(start, i);
      const nextLine = text.slice(i + 1).match(/^[^\n]*/)[0];
      if (isHeading(line) || /^\s*\d+(\.\d+)*[.)]\s/.test(nextLine) || /^\s*$/.test(nextLine)) {
        pushSpan(start, i);
        start = i + 1;
        continue;
      }
    }
    if (isSentenceBoundary(text, i)) {
      pushSpan(start, i + 1);
      start = i + 1;
    }
  }
  pushSpan(start, text.length);

  // Fold short non-heading fragments into the preceding clause so that every
  // classified span carries enough context.
  const merged = [];
  for (const span of spans) {
    const previous = merged[merged.length - 1];
    const sameBlock = previous && !/\n\s*\n/.test(text.slice(previous.end, span.start));
    const foldable =
      previous && !previous.heading && !span.heading && span.text.length < MIN_CLAUSE_CHARS;
    if (foldable && sameBlock) {
      previous.end = span.end;
      previous.text = text.slice(previous.start, previous.end);
    } else {
      merged.push({ ...span });
    }
  }

  return merged.filter(
    (span) => !span.heading && /[A-Za-z]{3}/.test(span.text) && span.text.length >= 20
  );
}

/* ───────────────────────────── score reduction ───────────────────────────── */

/** Turns one clause's eight sigmoid outputs into sorted, labelled findings. */
export function findingsFor(scores, threshold = FLAG_THRESHOLD) {
  if (!scores) return [];
  return scores
    .map((score, index) => ({ score, category: CATEGORY_BY_INDEX[index] }))
    .filter((item) => item.category && item.score >= threshold)
    .sort((a, b) => b.score - a.score);
}

export function topScore(scores) {
  if (!scores || !scores.length) return 0;
  return scores.reduce((max, score) => (score > max ? score : max), 0);
}

export function verdictFor(scores) {
  const top = topScore(scores);
  if (top >= FLAG_THRESHOLD) return 'unfair';
  if (top >= WATCH_THRESHOLD) return 'watch';
  return 'clear';
}

/**
 * Aggregates a scanned document: which clauses are flagged, how often each
 * category appears, and a 0-100 concern index weighted by category severity.
 */
export function summarize(clauses) {
  const scored = clauses.filter((clause) => Array.isArray(clause.scores));
  const flagged = [];
  const watch = [];
  const categoryCounts = new Map();
  let weighted = 0;

  for (const clause of scored) {
    const findings = findingsFor(clause.scores);
    if (findings.length) {
      flagged.push({ ...clause, findings });
      for (const finding of findings) {
        const current = categoryCounts.get(finding.category.id) || {
          category: finding.category,
          count: 0,
          maxScore: 0,
        };
        current.count += 1;
        current.maxScore = Math.max(current.maxScore, finding.score);
        categoryCounts.set(finding.category.id, current);
      }
      const worst = findings[0];
      weighted += worst.score * (SEVERITY_WEIGHT[worst.category.severity] || 0.5);
    } else if (verdictFor(clause.scores) === 'watch') {
      watch.push(clause);
    }
  }

  // Saturating index: a handful of severe clauses is already "high concern".
  const concern = scored.length
    ? Math.round(100 * (1 - Math.exp(-weighted / 2.5)))
    : 0;

  return {
    total: scored.length,
    flagged,
    watchCount: watch.length,
    clearCount: scored.length - flagged.length - watch.length,
    categories: [...categoryCounts.values()].sort((a, b) => b.count - a.count),
    concern,
    level: concern >= 66 ? 'high' : concern >= 33 ? 'moderate' : 'low',
  };
}

export function formatPercent(score) {
  return `${Math.round(score * 100)}%`;
}
