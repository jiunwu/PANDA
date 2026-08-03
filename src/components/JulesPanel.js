'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Helpers ──

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function sessionStatusLabel(session) {
  const state = session.state || session.status || '';
  const s = state.toLowerCase();
  if (s.includes('completed') || s.includes('done')) return 'completed';
  if (s.includes('plan') && s.includes('review')) return 'plan-ready';
  if (s.includes('working') || s.includes('running') || s.includes('executing')) return 'working';
  if (s.includes('fail') || s.includes('error')) return 'failed';
  if (s.includes('created') || s.includes('queued')) return 'queued';
  return s || 'unknown';
}

function statusColor(status) {
  switch (status) {
    case 'completed': return '#4ade80';
    case 'working': return '#facc15';
    case 'plan-ready': return '#60a5fa';
    case 'failed': return '#f87171';
    case 'queued': return '#a78bfa';
    default: return '#666';
  }
}

// ── Main Component ──

export default function JulesPanel() {
  // State
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [activities, setActivities] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [branch, setBranch] = useState('main');
  const [autoCreatePR, setAutoCreatePR] = useState(true);
  const [requirePlanApproval, setRequirePlanApproval] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('dispatch'); // dispatch | sessions | detail
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [approvingPlan, setApprovingPlan] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const activityEndRef = useRef(null);

  // Fetch sources on mount
  useEffect(() => {
    async function fetchSources() {
      try {
        const res = await fetch('/api/jules');
        if (res.ok) {
          const data = await res.json();
          const srcs = data.sources || [];
          setSources(srcs);
          if (srcs.length > 0) {
            setSelectedSource(srcs[0].name);
          }
        }
      } catch {
        // Silently fail - sources list will be empty
      } finally {
        setLoading(false);
      }
    }
    fetchSources();
  }, []);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/jules/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Fetch session detail
  async function fetchSessionDetail(sessionId) {
    try {
      const res = await fetch(`/api/jules/sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data.session);
        setActivities(data.activities || []);
      }
    } catch {
      setError('Failed to load session details');
    }
  }

  // Scroll activities to bottom
  useEffect(() => {
    if (activityEndRef.current) {
      activityEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activities]);

  // Dispatch a task
  async function handleDispatch(e) {
    e.preventDefault();
    if (!prompt.trim() || !selectedSource) return;

    setDispatching(true);
    setError('');

    try {
      const res = await fetch('/api/jules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          source: selectedSource,
          startingBranch: branch,
          requirePlanApproval,
          automationMode: autoCreatePR ? 'AUTO_CREATE_PR' : 'NONE',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create session');
      }

      const session = await res.json();
      setPrompt('');
      setShowOptions(false);
      await fetchSessions();

      // Switch to session detail view
      if (session.name) {
        const sessionId = session.name.split('/').pop();
        await fetchSessionDetail(sessionId);
        setView('detail');
      } else {
        setView('sessions');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDispatching(false);
    }
  }

  // Send a follow-up message
  async function handleSendMessage(e) {
    e.preventDefault();
    if (!message.trim() || !activeSession) return;

    setSendingMessage(true);
    const sessionId = activeSession.name?.split('/').pop();

    try {
      await fetch(`/api/jules/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sendMessage', message: message.trim() }),
      });
      setMessage('');
      // Refresh activities
      await fetchSessionDetail(sessionId);
    } catch {
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  }

  // Approve plan
  async function handleApprovePlan() {
    if (!activeSession) return;

    setApprovingPlan(true);
    const sessionId = activeSession.name?.split('/').pop();

    try {
      await fetch(`/api/jules/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approvePlan' }),
      });
      // Refresh
      await fetchSessionDetail(sessionId);
    } catch {
      setError('Failed to approve plan');
    } finally {
      setApprovingPlan(false);
    }
  }

  // Open session detail
  function openSession(session) {
    const sessionId = session.name?.split('/').pop();
    if (sessionId) {
      fetchSessionDetail(sessionId);
      setView('detail');
    }
  }

  // Extract repo display name from source name
  function repoDisplayName(sourceName) {
    if (!sourceName) return '';
    // sources/github-org-repo -> org/repo
    const parts = sourceName.replace('sources/', '').replace('github-', '');
    return parts.replace(/-/, '/');
  }

  // ── Loading State ──

  if (loading) {
    return (
      <div className="jules-panel">
        <div className="jules-header">
          <span className="jules-logo">◆</span>
          <span className="jules-title">Jules</span>
        </div>
        <div className="jules-body jules-loading">
          <span>Connecting to Jules…</span>
        </div>
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="jules-panel">
      {/* Header */}
      <div className="jules-header">
        <div className="jules-header-left">
          <span className="jules-logo">◆</span>
          <span className="jules-title">Jules</span>
          <span className="jules-badge">{sources.length} repos</span>
        </div>
        <div className="jules-tabs">
          <button
            className={`jules-tab ${view === 'dispatch' ? 'jules-tab-active' : ''}`}
            onClick={() => setView('dispatch')}
          >
            Dispatch
          </button>
          <button
            className={`jules-tab ${view === 'sessions' ? 'jules-tab-active' : ''}`}
            onClick={() => { setView('sessions'); fetchSessions(); }}
          >
            Sessions
          </button>
          {activeSession && (
            <button
              className={`jules-tab ${view === 'detail' ? 'jules-tab-active' : ''}`}
              onClick={() => setView('detail')}
            >
              Detail
            </button>
          )}
        </div>
      </div>

      {/* Error bar */}
      {error && (
        <div className="jules-error">
          <span>{error}</span>
          <button onClick={() => setError('')} className="jules-error-dismiss">×</button>
        </div>
      )}

      {/* ── Dispatch View ── */}
      {view === 'dispatch' && (
        <div className="jules-body">
          <form onSubmit={handleDispatch} className="jules-dispatch">
            {/* Source selector */}
            <div className="jules-field">
              <label className="jules-label">Repository</label>
              <select
                className="jules-select"
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
              >
                {sources.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.displayName || repoDisplayName(s.name)}
                  </option>
                ))}
              </select>
            </div>

            {/* Prompt */}
            <div className="jules-field">
              <label className="jules-label">Task</label>
              <textarea
                className="jules-textarea"
                placeholder="Describe the coding task for Jules…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
              />
            </div>

            {/* Options toggle */}
            <button
              type="button"
              className="jules-options-toggle"
              onClick={() => setShowOptions(!showOptions)}
            >
              {showOptions ? '▾' : '▸'} Options
            </button>

            {showOptions && (
              <div className="jules-options">
                <div className="jules-field">
                  <label className="jules-label">Branch</label>
                  <input
                    className="jules-input"
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="main"
                  />
                </div>
                <div className="jules-checkbox-row">
                  <label className="jules-checkbox-label">
                    <input
                      type="checkbox"
                      checked={autoCreatePR}
                      onChange={(e) => setAutoCreatePR(e.target.checked)}
                    />
                    <span>Auto-create PR</span>
                  </label>
                  <label className="jules-checkbox-label">
                    <input
                      type="checkbox"
                      checked={requirePlanApproval}
                      onChange={(e) => setRequirePlanApproval(e.target.checked)}
                    />
                    <span>Require plan approval</span>
                  </label>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="jules-submit"
              disabled={dispatching || !prompt.trim() || !selectedSource}
            >
              {dispatching ? 'Dispatching…' : '▶ Dispatch to Jules'}
            </button>
          </form>
        </div>
      )}

      {/* ── Sessions View ── */}
      {view === 'sessions' && (
        <div className="jules-body">
          {sessions.length === 0 ? (
            <div className="jules-empty">
              <span>No sessions yet</span>
              <button className="jules-link" onClick={() => setView('dispatch')}>
                Dispatch your first task →
              </button>
            </div>
          ) : (
            <div className="jules-sessions-list">
              {sessions.map((session, i) => {
                const status = sessionStatusLabel(session);
                return (
                  <button
                    key={session.name || i}
                    className="jules-session-card"
                    onClick={() => openSession(session)}
                  >
                    <div className="jules-session-top">
                      <span
                        className="jules-session-status-dot"
                        style={{ background: statusColor(status) }}
                      />
                      <span className="jules-session-title">
                        {session.title || session.prompt?.slice(0, 60) || 'Untitled session'}
                      </span>
                    </div>
                    <div className="jules-session-meta">
                      <span className="jules-session-status-text" style={{ color: statusColor(status) }}>
                        {status}
                      </span>
                      <span className="jules-session-time">
                        {timeAgo(session.createTime)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Detail View ── */}
      {view === 'detail' && activeSession && (
        <div className="jules-body jules-detail">
          {/* Session header */}
          <div className="jules-detail-header">
            <button className="jules-back" onClick={() => setView('sessions')}>
              ← Sessions
            </button>
            <span
              className="jules-detail-status"
              style={{ color: statusColor(sessionStatusLabel(activeSession)) }}
            >
              {sessionStatusLabel(activeSession)}
            </span>
          </div>

          <div className="jules-detail-title">
            {activeSession.title || activeSession.prompt?.slice(0, 80) || 'Session'}
          </div>

          {/* Activities feed */}
          <div className="jules-activities">
            {activities.length === 0 ? (
              <div className="jules-activity-empty">Waiting for Jules to start…</div>
            ) : (
              activities.map((activity, i) => (
                <div className="jules-activity" key={activity.name || i}>
                  <div className="jules-activity-type">
                    {activity.activityType === 'PLAN_GENERATION' ? '📋' :
                     activity.activityType === 'CODE_GENERATION' ? '💻' :
                     activity.activityType === 'MESSAGE' ? '💬' :
                     activity.activityType === 'PROGRESS' ? '⚙️' : '•'}
                  </div>
                  <div className="jules-activity-content">
                    <div className="jules-activity-text">
                      {activity.content || activity.message || activity.summary || JSON.stringify(activity)}
                    </div>
                    {activity.createTime && (
                      <div className="jules-activity-time">{timeAgo(activity.createTime)}</div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={activityEndRef} />
          </div>

          {/* Plan approval button (if plan is ready) */}
          {sessionStatusLabel(activeSession) === 'plan-ready' && (
            <button
              className="jules-approve"
              onClick={handleApprovePlan}
              disabled={approvingPlan}
            >
              {approvingPlan ? 'Approving…' : '✓ Approve Plan'}
            </button>
          )}

          {/* Message input */}
          <form onSubmit={handleSendMessage} className="jules-message-form">
            <span className="jules-prompt-char">›</span>
            <input
              type="text"
              className="jules-message-input"
              placeholder="Send a follow-up message…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sendingMessage}
            />
            <button
              type="submit"
              className="jules-message-send"
              disabled={sendingMessage || !message.trim()}
            >
              {sendingMessage ? '…' : '↵'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
