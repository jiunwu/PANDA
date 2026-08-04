'use client';

import { useState, useEffect } from 'react';

export default function DebugPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resetting, setResetting] = useState(false);

  async function fetchDebug() {
    setLoading(true);
    try {
      const res = await fetch('/api/debug');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDebug();
  }, []);

  async function handleResetDB() {
    if (!confirm('Are you sure you want to reset the database to the clean project.json state? All current notes and dynamic data will be lost.')) return;
    setResetting(true);
    try {
      const res = await fetch('/api/debug', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        alert(json.message);
        fetchDebug();
      } else {
        alert('Error: ' + json.error);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return (
      <div className="page-header">
        <h1 className="page-title">Database Debug</h1>
        <p style={{ marginTop: 24 }}>Loading debug information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-header">
        <h1 className="page-title">Database Debug</h1>
        <div style={{ marginTop: 24, padding: 16, background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 4 }}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header-row">
        <div className="page-header">
          <h1 className="page-title">Database Debug</h1>
          <p className="page-subtitle">Verify environment variables, database connection, and raw data.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignSelf: 'flex-start' }}>
          <button 
            onClick={handleResetDB} 
            disabled={resetting}
            style={{ padding: '8px 16px', background: 'var(--red-bg)', color: 'var(--red)', border: 'none', borderRadius: '4px', cursor: resetting ? 'not-allowed' : 'pointer' }}
          >
            {resetting ? 'Resetting...' : 'Reset DB'}
          </button>
          <button 
            onClick={fetchDebug} 
            style={{ padding: '8px 16px', background: 'var(--text-primary)', color: 'var(--white)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Refresh Data
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 32 }}>
        
        {/* Environment Variables */}
        <div className="bento-card">
          <div className="bento-header">
            <h2 className="bento-title">Environment Variables</h2>
          </div>
          <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, fontFamily: 'monospace', fontSize: 13 }}>
            {Object.entries(data?.environment || {}).map(([k, v]) => (
              <div key={k} style={{ marginBottom: 8, display: 'flex' }}>
                <span style={{ fontWeight: 'bold', width: 200, flexShrink: 0 }}>{k}:</span>
                <span style={{ color: v === 'NOT SET' ? 'var(--red)' : 'var(--green)' }}>{v}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 12 }}>
            If TURSO_DATABASE_URL is &quot;NOT SET&quot;, Vercel is falling back to the local static project.json and your data will wipe on every deploy.
          </p>
        </div>

        {/* Database Connection */}
        <div className="bento-card">
          <div className="bento-header">
            <h2 className="bento-title">Turso Database Status</h2>
          </div>
          <div style={{ 
            display: 'inline-block',
            padding: '6px 12px', 
            borderRadius: 4, 
            background: data?.connection === 'success' ? 'var(--green-bg)' : 'var(--red-bg)', 
            color: data?.connection === 'success' ? 'var(--green)' : 'var(--red)',
            fontWeight: 'bold',
            fontSize: 14
          }}>
            {data?.connection?.toUpperCase() || 'UNKNOWN'}
          </div>
          
          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>Available Tables:</h3>
            {data?.tables?.length > 0 ? (
              <div style={{ display: 'flex', gap: 8 }}>
                {data.tables.map(t => (
                  <span key={t} style={{ background: 'var(--accent-light)', padding: '4px 8px', borderRadius: 4, fontSize: 13, fontFamily: 'monospace' }}>
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No tables found or connection failed.</p>
            )}
          </div>
        </div>

        {/* Raw Data Dumps */}
        <div className="bento-card">
          <div className="bento-header">
            <h2 className="bento-title">Raw Data Dumps</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Passkeys Table</h3>
              <div style={{ background: '#111', color: '#0f0', padding: 16, borderRadius: 4, fontFamily: 'monospace', fontSize: 12, overflowX: 'auto', maxHeight: 300, overflowY: 'auto' }}>
                <pre>{JSON.stringify(data?.passkeys, null, 2)}</pre>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>KV Store (Project Data)</h3>
              <div style={{ background: '#111', color: '#0f0', padding: 16, borderRadius: 4, fontFamily: 'monospace', fontSize: 12, overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
                <pre>{JSON.stringify(data?.kv_store, null, 2)}</pre>
              </div>
            </div>
            
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Challenges</h3>
              <div style={{ background: '#111', color: '#0f0', padding: 16, borderRadius: 4, fontFamily: 'monospace', fontSize: 12, overflowX: 'auto', maxHeight: 200, overflowY: 'auto' }}>
                <pre>{JSON.stringify(data?.challenges, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
