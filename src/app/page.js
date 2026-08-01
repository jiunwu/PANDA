'use client';

import { useState, useEffect } from 'react';
import data from '@/data/project.json';
import integrationsData from '@/data/integrations.json';

const { project, team, funding, milestones, workPackages, budget, notes } = data;
const { activityLog } = integrationsData;

function statusLabel(s) {
  if (s === 'done') return 'Erledigt';
  if (s === 'active') return 'Aktuell';
  return 'Geplant';
}

function formatAmount(n) {
  return n.toLocaleString('de-DE');
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

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const overallProgress = Math.round(
    workPackages.reduce((s, w) => s + w.progress, 0) / workPackages.length
  );

  const deadline = new Date(funding.deadline);
  const daysLeft = Math.max(0, Math.ceil((deadline - new Date()) / 86400000));

  const budgetColors = ['#111', '#666', '#aaa', '#ddd'];
  const recentActivity = activityLog.slice(0, 4);

  return (
    <>
      {/* Header */}
      <header className="page-header" id="hero">
        <h1>Vorhaben-Planung</h1>
        <p>
          Fortschritt, Meilensteine und nächste Schritte für den EXIST-Antrag —
          übersichtlich an einem Ort.
        </p>
      </header>

      {/* Project Summary */}
      <section className="summary-section" id="summary">
        <div className="section-head">
          <h2 className="section-title">Projekt</h2>
        </div>
        <p className="summary-lead">{project.oneLiner}</p>
        <div className="summary-grid">
          <div className="summary-col">
            <h3>Problem</h3>
            <p>{project.problem}</p>
          </div>
          <div className="summary-col">
            <h3>Lösung</h3>
            <p>{project.solution}</p>
          </div>
          <div className="summary-col">
            <h3>Ansatz</h3>
            <p>{project.approach}</p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="team-section" id="team">
        <div className="section-head">
          <h2 className="section-title">Team</h2>
        </div>
        <div className="team-grid">
          {team.map((t) => (
            <div className="team-member" key={t.name}>
              <div className="team-initial">{t.name.charAt(0)}</div>
              <div className="team-info">
                <h3>{t.name}</h3>
                <div className="team-role">{t.role}</div>
                <div className="team-bio">{t.bio}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <div className="stats" id="stats">
        <div className="stat">
          <div className="stat-value">{overallProgress}%</div>
          <div className="stat-label">Fortschritt</div>
        </div>
        <div className="stat">
          <div className="stat-value">{daysLeft}</div>
          <div className="stat-label">Tage bis Deadline</div>
        </div>
        <div className="stat">
          <div className="stat-value">{formatAmount(funding.volume)}</div>
          <div className="stat-label">Fördervolumen EUR</div>
        </div>
        <div className="stat">
          <div className="stat-value">{funding.duration}</div>
          <div className="stat-label">{funding.durationUnit} Laufzeit</div>
        </div>
      </div>

      {/* Milestones + Work Packages */}
      <section className="section" id="milestones-and-packages">
        <div className="two-col">
          <div>
            <div className="section-head">
              <h2 className="section-title">Meilensteine</h2>
              <span className="section-meta">{milestones.length} gesamt</span>
            </div>
            <div className="timeline">
              {milestones.map((m, i) => (
                <div className="timeline-item" key={i}>
                  <div className={`timeline-dot ${m.status}`} />
                  <div className="timeline-body">
                    <span className={`timeline-title ${m.status}`}>{m.title}</span>
                    <span className="timeline-date">{m.date}</span>
                    <span className={`timeline-status ${m.status}`}>{statusLabel(m.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="section-head">
              <h2 className="section-title">Arbeitspakete</h2>
              <span className="section-meta">{workPackages.length} Pakete</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Paket</th>
                  <th>Verantwortlich</th>
                  <th>Stand</th>
                </tr>
              </thead>
              <tbody>
                {workPackages.map((wp, i) => (
                  <tr key={i}>
                    <td>
                      {wp.id} — {wp.name}
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: mounted ? `${wp.progress}%` : '0%' }} />
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{wp.owner}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{wp.progress}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Budget + Recent Activity */}
      <section className="section" id="budget-and-activity">
        <div className="two-col">
          <div>
            <div className="section-head">
              <h2 className="section-title">Budget</h2>
              <span className="section-meta">{formatAmount(funding.volume)} EUR gesamt</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Betrag EUR</th>
                </tr>
              </thead>
              <tbody>
                {budget.map((b, i) => (
                  <tr key={i}>
                    <td>{b.label}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{formatAmount(b.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="budget-bar">
              {budget.map((b, i) => (
                <div
                  key={i}
                  className="budget-segment"
                  style={{
                    width: mounted ? `${b.pct}%` : '0%',
                    background: budgetColors[i] || '#ccc',
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="section-head">
              <h2 className="section-title">Recent Activity</h2>
              <a href="/activity" className="section-meta" style={{ textDecoration: 'none', color: 'var(--text-tertiary)' }}>
                View all →
              </a>
            </div>
            <div className="activity-list">
              {recentActivity.map((entry, i) => (
                <div className="activity-item" key={i}>
                  <span className="activity-author">{entry.source.split(' ')[0]}</span>
                  <div className="activity-content">
                    <div className="activity-text">{entry.action}</div>
                    <div className="activity-date">{formatRelative(entry.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" id="footer">
        <span>PANDA — Internal Tool</span>
        <span>
          <a href="https://www.exist.de" target="_blank" rel="noopener noreferrer">exist.de</a>
        </span>
      </footer>
    </>
  );
}
