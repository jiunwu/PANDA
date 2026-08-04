'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SprintsPage() {
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard-data')
      .then((res) => res.json())
      .then((data) => {
        setSprints(data.sprints || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <header className="page-header" id="sprints-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Agile Sprints</h1>
            <p>Complete breakdown of all project sprints and individual tasks.</p>
          </div>
          <Link href="/dashboard" className="btn btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <section className="section" id="sprints-content">
        {loading ? (
          <div style={{ color: 'var(--text-tertiary)', padding: '24px 0' }}>Loading sprints data...</div>
        ) : !sprints || sprints.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', padding: '24px 0' }}>No sprints recorded yet. External agents will sync sprints via API.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {sprints.map((sprint, i) => (
              <div
                key={sprint.id || i}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '24px',
                  background: 'var(--white)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600 }}>{sprint.id}: {sprint.name || 'Active Sprint'}</h2>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {sprint.startDate} {sprint.endDate ? `to ${sprint.endDate}` : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="source-tag">{sprint.status || 'Active'}</span>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{sprint.progress || 0}% Progress</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress-bar" style={{ height: '6px', marginBottom: '20px' }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${sprint.progress || 0}%`,
                      background: sprint.progress === 100 ? 'var(--green)' : 'var(--text-primary)',
                    }}
                  />
                </div>

                {/* Tasks List */}
                <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.06em', marginBottom: '12px' }}>
                  Tasks ({sprint.tasks ? sprint.tasks.length : 0})
                </h3>

                <div className="list-stack">
                  {!sprint.tasks || sprint.tasks.length === 0 ? (
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No tasks in this sprint.</div>
                  ) : (
                    sprint.tasks.map((task, tidx) => (
                      <div className="list-item" key={task.id || tidx}>
                        <div className="item-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>{task.id || `#${tidx + 1}`}</span>
                          <span>{task.title}</span>
                        </div>
                        <div className="item-meta">
                          <span className={`type-tag ${task.status === 'done' ? 'type-milestone' : task.status === 'active' || task.status === 'in_progress' ? 'type-notification' : 'type-system'}`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
