import integrationsData from '@/data/integrations.json';

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
  const { activityLog } = integrationsData;

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
            {activityLog.map((entry, i) => (
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
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
