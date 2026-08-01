'use client';

import { useState } from 'react';

export default function IntegrationCard({ integration }) {
  const [expanded, setExpanded] = useState(false);
  const [connected, setConnected] = useState(false);
  const [values, setValues] = useState(
    Object.fromEntries(integration.fields.map((f) => [f.key, '']))
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  function handleChange(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleTest() {
    setTesting(true);
    setTestResult(null);
    // Simulate test — in Phase 2, this calls the actual API
    setTimeout(() => {
      const allFilled = integration.fields
        .filter((f) => f.key !== 'keyword')
        .every((f) => values[f.key]?.trim());
      setTesting(false);
      if (allFilled) {
        setTestResult('success');
        setConnected(true);
      } else {
        setTestResult('error');
      }
    }, 1200);
  }

  function handleDisconnect() {
    setConnected(false);
    setTestResult(null);
    setValues(Object.fromEntries(integration.fields.map((f) => [f.key, ''])));
  }

  return (
    <div className={`integration-card ${connected ? 'integration-connected' : ''}`}>
      <div
        className="integration-header"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
      >
        <div className="integration-header-left">
          <h3 className="integration-name">{integration.name}</h3>
          <p className="integration-desc">{integration.description}</p>
        </div>
        <div className="integration-header-right">
          <span className={`integration-status ${connected ? 'status-connected' : 'status-inactive'}`}>
            <span className="status-indicator" />
            {connected ? 'Connected' : 'Not configured'}
          </span>
          <span className={`integration-chevron ${expanded ? 'chevron-open' : ''}`}>
            &#8250;
          </span>
        </div>
      </div>

      {expanded && (
        <div className="integration-body">
          <div className="integration-fields">
            {integration.fields.map((field) => (
              <div className="field-row" key={field.key}>
                <label className="field-label" htmlFor={`${integration.id}-${field.key}`}>
                  {field.label}
                </label>
                <input
                  id={`${integration.id}-${field.key}`}
                  className="field-input"
                  type={field.type === 'password' ? 'password' : 'text'}
                  placeholder={field.placeholder}
                  value={values[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  disabled={connected}
                />
              </div>
            ))}
          </div>

          {testResult === 'success' && (
            <div className="test-message test-success">Connection successful</div>
          )}
          {testResult === 'error' && (
            <div className="test-message test-error">Please fill in all required fields</div>
          )}

          <div className="integration-capabilities">
            <span className="capabilities-label">Capabilities</span>
            <div className="capabilities-list">
              {integration.capabilities.map((cap, i) => (
                <span className="capability-tag" key={i}>{cap}</span>
              ))}
            </div>
          </div>

          <div className="integration-actions">
            {!connected ? (
              <button
                className="btn btn-primary"
                onClick={handleTest}
                disabled={testing}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={handleDisconnect}>
                Disconnect
              </button>
            )}
            {integration.docsUrl && (
              <a
                href={integration.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
              >
                Documentation
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
