'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function MilestonesPage() {
  const { data, loading } = useDashboardData();
  const milestones = data?.milestones || [];
  const [filter, setFilter] = useState('all');

  const filteredMilestones = milestones.filter((m) => {
    if (filter === 'all') return true;
    return m.status?.toLowerCase() === filter.toLowerCase();
  });

  return (
    <>
      <header className="page-header" id="milestones-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Project Milestones</h1>
            <p>Full timeline tracking key achievements, current active goals, and upcoming target dates.</p>
          </div>
          <Link href="/dashboard" className="btn btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <section className="section" id="milestones-content">
        <div className="section-head" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'done', 'active', 'upcoming'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="btn"
                style={{
                  fontSize: '12px',
                  padding: '4px 12px',
                  textTransform: 'capitalize',
                  background: filter === f ? 'var(--text-primary)' : 'var(--white)',
                  color: filter === f ? 'var(--white)' : 'var(--text-secondary)',
                  borderColor: filter === f ? 'var(--text-primary)' : 'var(--border)',
                }}
              >
                {f} ({f === 'all' ? milestones.length : milestones.filter((m) => m.status?.toLowerCase() === f).length})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-tertiary)', padding: '24px 0' }}>Loading milestones...</div>
        ) : filteredMilestones.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', padding: '24px 0' }}>No milestones found for selected filter.</div>
        ) : (
          <div className="timeline" style={{ paddingLeft: 12 }}>
            {filteredMilestones.map((m, i) => {
              const statusClass =
                m.status?.toLowerCase() === 'done'
                  ? 'done'
                  : m.status?.toLowerCase() === 'upcoming'
                  ? 'upcoming'
                  : 'active';

              return (
                <div
                  className="timeline-item"
                  key={i}
                  style={{
                    padding: '16px 0',
                    borderBottom: '1px solid var(--border-light)',
                  }}
                >
                  <div className={`timeline-dot ${statusClass}`} style={{ marginTop: '7px' }} />
                  <div className="timeline-body">
                    <div>
                      <span className={`timeline-title ${statusClass}`} style={{ fontSize: '15px', fontWeight: 600 }}>
                        {m.title}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span className={`type-tag ${statusClass === 'done' ? 'type-milestone' : statusClass === 'active' ? 'type-notification' : 'type-system'}`}>
                        {m.status}
                      </span>
                      <span className="timeline-date" style={{ fontSize: '13px' }}>{m.date}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
