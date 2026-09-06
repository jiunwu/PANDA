'use client';

import { useCallback, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './page.module.css';

const COLAB_URL = 'https://colab.research.google.com/drive/1v5qTo-eFbUHkveAfTBizQ2RLTk3hEzeT?usp=sharing';
const asText = value => typeof value === 'string' ? value : Array.isArray(value) ? value.filter(v => typeof v === 'string').join('') : '';

function Output({ output }) {
  if (!output || typeof output !== 'object') return null;
  const data = output.data || {};
  if (output.output_type === 'stream') return <pre>{asText(output.text)}</pre>;
  if (output.output_type === 'error') return <pre>{asText(output.ename)}: {asText(output.evalue)}</pre>;
  if (data['image/png'] || data['image/jpeg']) {
    const mime = data['image/png'] ? 'image/png' : 'image/jpeg';
    // Notebook images are embedded data, not remote resources.
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={styles.image} src={`data:${mime};base64,${asText(data[mime]).replace(/\s/g, '')}`} alt="Saved notebook plot" />;
  }
  if (data['text/html']) return (
    <iframe
      className={styles.richOutput}
      title="Saved notebook output"
      sandbox=""
      referrerPolicy="no-referrer"
      srcDoc={`<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'none'; base-uri 'none'"><style>body{font:14px system-ui;margin:12px;color:#222}table{border-collapse:collapse}td,th{padding:6px;border:1px solid #ddd}img{max-width:100%}</style>${asText(data['text/html'])}`}
    />
  );
  if (data['text/markdown']) return <ReactMarkdown>{asText(data['text/markdown'])}</ReactMarkdown>;
  if (data['application/vnd.jupyter.widget-view+json'] || data['application/vnd.google.colaboratory.intrinsic+json']) {
    return <p>Interactive output — <a href={COLAB_URL} target="_blank" rel="noopener noreferrer">view in Colab</a>.</p>;
  }
  if (data['text/plain']) return <pre>{asText(data['text/plain'])}</pre>;
  return <p>This output is available in Colab.</p>;
}

export default function NotebookPage() {
  const [notebook, setNotebook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/notebook', { cache: 'no-store', signal });
      const body = await response.json();
      if (!response.ok) throw new Error(response.status === 401 ? 'Please log in to view the notebook.' : body.error || 'Unable to load notebook.');
      setNotebook(body);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return (
    <>
      <header className="page-header">
        <h1>{asText(notebook?.metadata?.colab?.name) || 'Colab Notebook'}</h1>
        <p>Read the notebook’s saved cells and outputs. Save changes in Colab, then refresh here.</p>
        <div className={styles.actions}>
          <button className="btn btn-secondary" disabled={loading} onClick={() => load()}>{loading ? 'Loading…' : 'Refresh notebook'}</button>
          <a className="btn btn-primary" href={COLAB_URL} target="_blank" rel="noopener noreferrer">Open in Colab ↗</a>
        </div>
      </header>
      <main className={styles.notebook} aria-busy={loading}>
        {error && <p role="alert">{error}{notebook && ' Showing the previously loaded version.'}</p>}
        {loading && <p role="status">Loading saved notebook…</p>}
        {notebook?.cells.length === 0 && <p>This notebook has no cells yet.</p>}
        {notebook?.cells.map((cell, index) => (
          <section key={index} className={styles.cell} aria-label={`Cell ${index + 1}: ${cell.cell_type}`}>
            {cell.cell_type === 'markdown' ? <ReactMarkdown>{asText(cell.source)}</ReactMarkdown> : (
              <>
                <div className={styles.label}>{cell.cell_type === 'code' ? `In [${cell.execution_count ?? ' '}]:` : 'Raw cell'}</div>
                <pre className={styles.source}><code>{asText(cell.source)}</code></pre>
              </>
            )}
            {cell.outputs?.length > 0 && <div className={styles.outputs}>{cell.outputs.map((output, i) => <Output key={i} output={output} />)}</div>}
          </section>
        ))}
      </main>
    </>
  );
}
