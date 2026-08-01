'use client';

import { useState, useEffect } from 'react';

const milestones = [
  { title: 'Ideenpapier eingereicht', date: 'Mai 2026', status: 'done' },
  { title: 'Gründungsberatung TUM', date: 'Jun 2026', status: 'done' },
  { title: 'Businessplan & Finanzplan', date: 'Aug 2026', status: 'active' },
  { title: 'EXIST Antrag einreichen', date: 'Sep 2026', status: 'upcoming' },
  { title: 'Förderbescheid erwartet', date: 'Nov 2026', status: 'upcoming' },
  { title: 'Projektstart', date: 'Jan 2027', status: 'upcoming' },
];

const workPackages = [
  { name: 'AP1 — Marktanalyse & Validierung', progress: 75, owner: 'Nina' },
  { name: 'AP2 — Prototyp-Entwicklung', progress: 40, owner: 'Jiun' },
  { name: 'AP3 — Businessplan erstellen', progress: 55, owner: 'Jiun & Nina' },
  { name: 'AP4 — Team & Gründungskonzept', progress: 30, owner: 'Nina' },
  { name: 'AP5 — Pitchdeck & Kommunikation', progress: 20, owner: 'Jiun' },
];

const budgetItems = [
  { label: 'Personal (Stipendien)', amount: '82.800', pct: 55, color: '#111' },
  { label: 'Sachmittel', amount: '30.000', pct: 20, color: '#666' },
  { label: 'Coaching', amount: '15.000', pct: 10, color: '#aaa' },
  { label: 'Reise & Sonstiges', amount: '22.200', pct: 15, color: '#ddd' },
];

const notes = [
  { text: 'Mentor-Gespräch am 08.08. mit Prof. Müller — Feedback zum MVP einholen', author: 'Jiun' },
  { text: 'Letter of Intent von Pilotpartner steht noch aus — Reminder senden', author: 'Nina' },
  { text: 'IHK Gründerworkshop am 15.08. — beide angemeldet', author: 'Nina' },
  { text: 'Tech-Stack-Entscheidung dokumentieren für Antrag Anhang', author: 'Jiun' },
];

function statusLabel(s) {
  if (s === 'done') return 'Erledigt';
  if (s === 'active') return 'In Arbeit';
  return 'Geplant';
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const today = new Date().toLocaleDateString('de-DE', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const overallProgress = Math.round(
    workPackages.reduce((s, w) => s + w.progress, 0) / workPackages.length
  );

  const deadline = new Date('2026-09-30');
  const daysLeft = Math.max(0, Math.ceil((deadline - new Date()) / 86400000));

  return (
    <div className="container">
      {/* Nav */}
      <nav className="nav" id="main-nav">
        <div className="nav-left">
          <span className="nav-title">PANDA</span>
          <span className="nav-sep">/</span>
          <span className="nav-subtitle">EXIST Gründungsstipendium</span>
        </div>
        <div className="nav-right">
          <div className="nav-team">
            <span className="team-tag">Jiun</span>
            <span className="team-tag">Nina</span>
          </div>
          <span>{today}</span>
        </div>
      </nav>

      {/* Header */}
      <header className="page-header" id="hero">
        <h1>Vorhaben-Planung</h1>
        <p>
          Fortschritt, Meilensteine und nächste Schritte für den EXIST-Antrag — übersichtlich an einem Ort.
        </p>
      </header>

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
          <div className="stat-value">150.000</div>
          <div className="stat-label">Fördervolumen EUR</div>
        </div>
        <div className="stat">
          <div className="stat-value">12</div>
          <div className="stat-label">Monate Laufzeit</div>
        </div>
      </div>

      {/* Milestones + Work Packages */}
      <section className="section" id="main-content">
        <div className="two-col">
          {/* Milestones */}
          <div>
            <div className="section-head">
              <h2 className="section-title">Meilensteine</h2>
              <span className="section-meta">6 gesamt</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Meilenstein</th>
                  <th>Zeitraum</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((m, i) => (
                  <tr key={i}>
                    <td>{m.title}</td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{m.date}</td>
                    <td>
                      <span className="status">
                        <span className={`status-dot ${m.status}`} />
                        {statusLabel(m.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Work Packages */}
          <div>
            <div className="section-head">
              <h2 className="section-title">Arbeitspakete</h2>
              <span className="section-meta">5 Pakete</span>
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
                      {wp.name}
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: mounted ? `${wp.progress}%` : '0%' }}
                        />
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

      {/* Budget + Notes */}
      <section className="section" id="bottom-content">
        <div className="two-col">
          {/* Budget */}
          <div>
            <div className="section-head">
              <h2 className="section-title">Budget</h2>
              <span className="section-meta">150.000 EUR gesamt</span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Betrag EUR</th>
                </tr>
              </thead>
              <tbody>
                {budgetItems.map((b, i) => (
                  <tr key={i}>
                    <td>{b.label}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{b.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="budget-bar">
              {budgetItems.map((b, i) => (
                <div
                  key={i}
                  className="budget-segment"
                  style={{
                    width: mounted ? `${b.pct}%` : '0%',
                    background: b.color,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="section-head">
              <h2 className="section-title">Notizen</h2>
              <span className="section-meta">{notes.length} Einträge</span>
            </div>
            <div className="note-list">
              {notes.map((n, i) => (
                <div className="note" key={i}>
                  {n.text}
                  <div className="note-author">{n.author}</div>
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
          <a href="https://www.exist.de" target="_blank" rel="noopener noreferrer">
            exist.de
          </a>
        </span>
      </footer>
    </div>
  );
}
