'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CATEGORIES,
  CATEGORY_BY_INDEX,
  FLAG_THRESHOLD,
  MODEL_INFO,
  formatPercent,
  splitClauses,
  summarize,
  verdictFor,
} from '@/lib/legalsan';
import { DEMO_CONTRACTS, DEFAULT_CONTRACT_ID } from '@/data/demo-contracts';

const PASTE_ID = 'paste';

const STAGE_LABEL = {
  runtime: 'Starting the inference runtime',
  vocab: 'Loading the vocabulary',
  model: `Downloading the model (${MODEL_INFO.sizeMB} MB, once)`,
  session: 'Preparing the neural network',
};

/** Splits the document into highlightable pieces: clause spans plus the text between them. */
function buildSegments(text, clauses) {
  const segments = [];
  let cursor = 0;
  clauses.forEach((clause, index) => {
    if (clause.start > cursor) {
      segments.push({ kind: 'plain', text: text.slice(cursor, clause.start) });
    }
    segments.push({ kind: 'clause', text: clause.text, index });
    cursor = clause.end;
  });
  if (cursor < text.length) {
    segments.push({ kind: 'plain', text: text.slice(cursor) });
  }
  return segments;
}

export default function ClauseScanner() {
  const [sourceId, setSourceId] = useState(DEFAULT_CONTRACT_ID);
  const [pasted, setPasted] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | scanning | done | error
  const [stage, setStage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [elapsed, setElapsed] = useState(null);
  const [selected, setSelected] = useState(null);
  const [scannedText, setScannedText] = useState(null);

  const workerRef = useRef(null);
  const requestRef = useRef(0);
  const readyRef = useRef(false);
  const startedRef = useRef(0);
  const clausesRef = useRef([]);

  const activeContract = DEMO_CONTRACTS.find((item) => item.id === sourceId);
  const text = sourceId === PASTE_ID ? pasted : activeContract?.text || '';

  const clauses = useMemo(() => splitClauses(text), [text]);
  const scanned = scannedText === text;

  const scoredClauses = useMemo(
    () => clauses.map((clause, index) => ({ ...clause, scores: scanned ? results[index] : null })),
    [clauses, results, scanned]
  );

  const summary = useMemo(() => summarize(scoredClauses), [scoredClauses]);
  const segments = useMemo(() => buildSegments(text, clauses), [text, clauses]);

  // Reset the read-out whenever the document changes.
  useEffect(() => {
    setSelected(null);
    if (scannedText !== null && scannedText !== text) {
      setResults([]);
      setElapsed(null);
      if (status === 'done') setStatus('idle');
    }
  }, [text, scannedText, status]);

  useEffect(() => () => workerRef.current?.terminate(), []);

  const ensureWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;

    const worker = new Worker('/demo/legalsan-worker.js');

    worker.onmessage = (event) => {
      const message = event.data;

      if (message.type === 'progress') {
        setStage(message.stage);
        setProgress(message.total ? message.loaded / message.total : 0);
        return;
      }

      if (message.type === 'ready') {
        readyRef.current = true;
        setStage(null);
        setStatus((current) => (current === 'loading' ? 'scanning' : current));
        return;
      }

      if (message.type === 'clause') {
        if (message.requestId !== requestRef.current) return;
        setResults((previous) => {
          const next = previous.slice();
          next[message.index] = message.scores;
          return next;
        });
        return;
      }

      if (message.type === 'done') {
        if (message.requestId !== requestRef.current) return;
        setElapsed(Math.round(performance.now() - startedRef.current));
        setStatus('done');
        setScannedText(clausesRef.current.text);
        return;
      }

      if (message.type === 'error') {
        setError(message.message);
        setStatus('error');
      }
    };

    worker.onerror = () => {
      setError(
        'The demo could not start. It needs a browser with WebAssembly support and access to the CDN that hosts the runtime.'
      );
      setStatus('error');
    };

    workerRef.current = worker;
    worker.postMessage({ type: 'init' });
    return worker;
  }, []);

  const scan = useCallback(() => {
    if (!clauses.length) return;

    const worker = ensureWorker();
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    clausesRef.current = { text };

    setError(null);
    setResults([]);
    setElapsed(null);
    setSelected(null);
    setScannedText(null);
    setStatus(readyRef.current ? 'scanning' : 'loading');
    startedRef.current = performance.now();

    worker.postMessage({
      type: 'classify',
      requestId,
      clauses: clauses.map((clause) => clause.text),
    });
  }, [clauses, ensureWorker, text]);

  const busy = status === 'loading' || status === 'scanning';
  const progressPercent = Math.round(progress * 100);

  return (
    <div className="scanner">
      <div className="scanner-bar">
        <div className="scanner-tabs" role="tablist" aria-label="Choose a document">
          {DEMO_CONTRACTS.map((contract) => (
            <button
              key={contract.id}
              type="button"
              role="tab"
              aria-selected={sourceId === contract.id}
              className={`scanner-tab ${sourceId === contract.id ? 'is-active' : ''}`}
              onClick={() => setSourceId(contract.id)}
            >
              <span className="scanner-tab-name">{contract.name}</span>
              <span className="scanner-tab-kind">{contract.kind}</span>
            </button>
          ))}
          <button
            type="button"
            role="tab"
            aria-selected={sourceId === PASTE_ID}
            className={`scanner-tab ${sourceId === PASTE_ID ? 'is-active' : ''}`}
            onClick={() => setSourceId(PASTE_ID)}
          >
            <span className="scanner-tab-name">Your own text</span>
            <span className="scanner-tab-kind">Paste anything</span>
          </button>
        </div>

        <button
          type="button"
          className="scanner-run"
          onClick={scan}
          disabled={busy || !clauses.length}
        >
          {busy ? 'Scanning…' : scanned ? 'Scan again' : 'Scan this document'}
          {!busy && (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M3 7h8M7.5 3.5 11 7l-3.5 3.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          )}
        </button>
      </div>

      <p className="scanner-caption">
        {sourceId === PASTE_ID
          ? 'Paste any terms of service. The text stays in this tab — it is never uploaded.'
          : activeContract?.blurb}
        {clauses.length > 0 && (
          <span className="scanner-caption-meta">
            {clauses.length} clause{clauses.length === 1 ? '' : 's'} detected
          </span>
        )}
      </p>

      {busy && (
        <div className="scanner-loading" role="status">
          <div className="scanner-loading-head">
            <span>{stage ? STAGE_LABEL[stage] : 'Reading the clauses'}</span>
            {stage === 'model' && progressPercent > 0 && <span>{progressPercent}%</span>}
          </div>
          <div className="scanner-loading-track">
            <div
              className={`scanner-loading-fill ${
                stage === 'model' ? '' : 'scanner-loading-fill-indeterminate'
              }`}
              style={stage === 'model' ? { width: `${progressPercent}%` } : undefined}
            />
          </div>
          <p className="scanner-loading-note">
            The model is cached by your browser, so this only happens on the first scan.
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="scanner-error" role="alert">
          <strong>The scan could not run.</strong>
          <span>{error}</span>
        </div>
      )}

      <div className="scanner-body">
        <div className="scanner-doc">
          {sourceId === PASTE_ID && !scanned ? (
            <textarea
              className="scanner-input"
              value={pasted}
              onChange={(event) => setPasted(event.target.value)}
              placeholder={'Paste the terms of service you want to check…\n\nAny length works. The text never leaves your browser.'}
              spellCheck={false}
            />
          ) : (
            <article className={`scanner-paper ${scanned ? 'is-scanned' : ''}`}>
              {segments.map((segment, index) => {
                if (segment.kind === 'plain') {
                  return <span key={index}>{segment.text}</span>;
                }
                const scores = results[segment.index];
                const verdict = scores ? verdictFor(scores) : null;
                const top = scores
                  ? scores.reduce(
                      (best, score, i) => (score > best.score ? { score, i } : best),
                      { score: -1, i: 0 }
                    )
                  : null;
                const category = top && verdict !== 'clear' ? CATEGORY_BY_INDEX[top.i] : null;

                return (
                  <mark
                    key={index}
                    className={`clause ${verdict ? `clause-${verdict}` : ''} ${
                      selected === segment.index ? 'is-selected' : ''
                    }`}
                    data-clause={segment.index}
                    onClick={() => scores && setSelected(segment.index)}
                  >
                    {segment.text}
                    {category && (
                      <span className={`clause-tag clause-tag-${verdict}`}>
                        {category.short} {formatPercent(top.score)}
                      </span>
                    )}
                  </mark>
                );
              })}
            </article>
          )}
          {sourceId === PASTE_ID && scanned && (
            <button type="button" className="scanner-edit" onClick={() => setScannedText(null)}>
              Edit the text
            </button>
          )}
        </div>

        <aside className="scanner-panel">
          {!scanned && status !== 'error' && (
            <div className="scanner-empty">
              <h4>What the model looks for</h4>
              <p>
                Eight categories of clause that consumer-law research flags as unfair. Run
                the scan and every match is highlighted in place.
              </p>
              <ul className="scanner-legend">
                {CATEGORIES.map((category) => (
                  <li key={category.id}>
                    <span className={`legend-dot legend-${category.severity}`} />
                    {category.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {scanned && (
            <>
              <div className="scanner-score">
                <div className={`score-ring score-${summary.level}`}>
                  <span className="score-value">{summary.concern}</span>
                  <span className="score-unit">/100</span>
                </div>
                <div className="score-meta">
                  <strong>{summary.level} concern</strong>
                  <span>
                    {summary.flagged.length} of {summary.total} clauses flagged
                  </span>
                  {elapsed !== null && (
                    <span className="score-timing">
                      {summary.total} clauses in {elapsed} ms, on this device
                    </span>
                  )}
                </div>
              </div>

              {summary.categories.length > 0 && (
                <div className="scanner-chips">
                  {summary.categories.map((entry) => (
                    <span key={entry.category.id} className={`chip chip-${entry.category.severity}`}>
                      {entry.category.name}
                      <b>{entry.count}</b>
                    </span>
                  ))}
                </div>
              )}

              <div className="scanner-findings">
                {summary.flagged.length === 0 ? (
                  <p className="scanner-none">
                    No clause crossed the {formatPercent(FLAG_THRESHOLD)} threshold in any of the
                    eight categories. That is unusual — and a good sign.
                  </p>
                ) : (
                  summary.flagged.map((clause) => {
                    const index = clauses.findIndex((item) => item.start === clause.start);
                    return (
                      <button
                        type="button"
                        key={clause.start}
                        className={`finding ${selected === index ? 'is-selected' : ''}`}
                        onClick={() => {
                          setSelected(index);
                          document
                            .querySelector(`[data-clause="${index}"]`)
                            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                      >
                        <span className="finding-head">
                          {clause.findings.map((finding) => (
                            <span
                              key={finding.category.id}
                              className={`finding-label finding-${finding.category.severity}`}
                            >
                              {finding.category.name}
                              <b>{formatPercent(finding.score)}</b>
                            </span>
                          ))}
                        </span>
                        <span className="finding-text">
                          {clause.text.length > 190
                            ? `${clause.text.slice(0, 190).trimEnd()}…`
                            : clause.text}
                        </span>
                        <span className="finding-why">{clause.findings[0].category.summary}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}

          <p className="scanner-disclaimer">
            A research prototype, not legal advice. The model reports patterns, not verdicts.
          </p>
        </aside>
      </div>
    </div>
  );
}
