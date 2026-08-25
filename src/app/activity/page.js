'use client';
import { useState, useEffect } from 'react';

const typeLabels = {
  milestone: 'Milestone',
  progress: 'Progress',
  note: 'Note',
  system: 'System',
  notification: 'Notification',
};

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelative(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityPage() {
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const cacheBuster = Date.now();
        const res = await fetch(`/api/activity?t=${cacheBuster}`, { cache: 'no-store' });
        const data = await res.json();
        setActivityLog(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch activity log:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, []);

  return (
    <>
      <header className="page-header" id="activity-hero">
        <h1>Activity Log</h1>
        <p>
          Chronological feed of all agent and human actions across the project.
        </p>
      </header>

      <section className="section" id="activity-feed">
        <div className="section-head">
          <h2 className="section-title">All Activity</h2>
          <span className="section-meta">{activityLog.length} entries</span>
        </div>

        <table className="table" id="activity-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Source</th>
              <th>Action</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}>Loading activity...</td>
              </tr>
            ) : activityLog.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}>No activity found.</td>
              </tr>
            ) : (
              activityLog.map((entry, i) => (
                <tr key={i}>
                  <td className="activity-time">
                    <span className="activity-relative">{formatRelative(entry.timestamp)}</span>
                    <span className="activity-absolute">{formatTime(entry.timestamp)}</span>
                  </td>
                  <td>
                    <span className="source-tag">{entry.source}</span>
                  </td>
                  <td>{entry.action}</td>
                  <td>
                    <span className={`type-tag type-${entry.type}`}>
                      {typeLabels[entry.type] || entry.type}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
