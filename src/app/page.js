'use client';

import { useState, useEffect } from 'react';

// ── Data ──
const milestones = [
  { title: 'Ideenpapier eingereicht', date: 'Abgeschlossen', status: 'done' },
  { title: 'Gründungsberatung TUM', date: 'Abgeschlossen', status: 'done' },
  { title: 'Businessplan & Finanzplan', date: 'In Arbeit – Fällig Aug 2026', status: 'active' },
  { title: 'EXIST Antrag einreichen', date: 'Sep 2026', status: 'upcoming' },
  { title: 'Förderbescheid erwartet', date: 'Nov 2026', status: 'upcoming' },
  { title: 'Projektstart', date: 'Jan 2027', status: 'upcoming' },
];

const workPackages = [
  { name: 'AP1 – Marktanalyse & Validierung', progress: 75, owner: 'Nina', color: 'emerald' },
  { name: 'AP2 – Prototyp-Entwicklung', progress: 40, owner: 'Jiun', color: 'violet' },
  { name: 'AP3 – Businessplan erstellen', progress: 55, owner: 'Jiun & Nina', color: 'amber' },
  { name: 'AP4 – Team & Gründungskonzept', progress: 30, owner: 'Nina', color: 'sky' },
  { name: 'AP5 – Pitchdeck & Kommunikation', progress: 20, owner: 'Jiun', color: 'rose' },
];

const budgetItems = [
  { label: 'Personal (Stipendien)', amount: '82.800 €', color: 'var(--accent-violet)', pct: 55 },
  { label: 'Sachmittel', amount: '30.000 €', color: 'var(--accent-emerald)', pct: 20 },
  { label: 'Coaching', amount: '15.000 €', color: 'var(--accent-amber)', pct: 10 },
  { label: 'Reise & Sonstiges', amount: '22.200 €', color: 'var(--accent-sky)', pct: 15 },
];

const notes = [
  { text: 'Mentor-Gespräch am 08.08. mit Prof. Müller — Feedback zum MVP einholen', author: 'Jiun', color: 'var(--accent-violet)' },
  { text: 'Letter of Intent von Pilotpartner steht noch aus — Reminder senden', author: 'Nina', color: 'var(--accent-emerald)' },
  { text: 'IHK Gründerworkshop am 15.08. — beide angemeldet', author: 'Nina', color: 'var(--accent-amber)' },
  { text: 'Tech-Stack-Entscheidung dokumentieren für Antrag Anhang', author: 'Jiun', color: 'var(--accent-sky)' },
];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const today = new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate overall progress
  const overallProgress = Math.round(
    workPackages.reduce((sum, wp) => sum + wp.progress, 0) / workPackages.length
  );

  // Days until EXIST deadline (Sep 30 2026)
  const deadline = new Date('2026-09-30');
  const daysLeft = Math.max(0, Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="app-container">
      {/* ── Nav ── */}
      <nav className="nav" id="main-nav">
        <div className="nav-brand">
          <div className="nav-logo">P</div>
          <div className="nav-title">
            PANDA<span>planner</span>
          </div>
        </div>
        <div className="nav-team">
          <div className="avatar avatar-jiun" title="Jiun">J</div>
          <div className="avatar avatar-nina" title="Nina">N</div>
          <span className="nav-date">{today}</span>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero" id="hero">
        <div className="hero-badge">
          <span className="dot" />
          EXIST Gründungsstipendium 2026
        </div>
        <h1>
          Euer <span className="gradient-text">Vorhaben</span>,<br />
          ein Dashboard.
        </h1>
        <p>
          Planung, Fortschritt und nächste Schritte für den EXIST-Antrag — alles auf einen Blick für Jiun & Nina.
        </p>
      </section>

      {/* ── Stats ── */}
      <div className="stats-row" id="stats">
        <div className="stat-card">
          <div className="stat-value text-violet">{overallProgress}%</div>
          <div className="stat-label">Gesamtfortschritt</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-emerald">{daysLeft}</div>
          <div className="stat-label">Tage bis Deadline</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-amber">150.000 €</div>
          <div className="stat-label">Fördervolumen</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-sky">12</div>
          <div className="stat-label">Monate Laufzeit</div>
        </div>
      </div>

      {/* ── Main Grid: Milestones + Work Packages ── */}
      <div className="main-grid" id="main-content">
        {/* Milestones */}
        <div className="card" id="milestones-card">
          <div className="section-header">
            <h2 className="section-title">Meilensteine</h2>
            <span className="section-action">Alle anzeigen →</span>
          </div>
          <div className="milestone-list">
            {milestones.map((m, i) => (
              <div className="milestone-item" key={i}>
                <div className={`milestone-indicator ${m.status}`} />
                <div className="milestone-content">
                  <div className="milestone-title">{m.title}</div>
                  <div className="milestone-date">{m.date}</div>
                </div>
                <span className={`milestone-tag tag-${m.status}`}>
                  {m.status === 'done' ? '✓ Erledigt' : m.status === 'active' ? '● Aktiv' : '○ Geplant'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Work Packages */}
        <div className="card" id="workpackages-card">
          <div className="section-header">
            <h2 className="section-title">Arbeitspakete</h2>
            <span className="section-action">Details →</span>
          </div>
          <div className="wp-list">
            {workPackages.map((wp, i) => (
              <div className="wp-item" key={i}>
                <div className="wp-header">
                  <span className="wp-name">{wp.name}</span>
                  <span className="wp-owner">{wp.owner}</span>
                </div>
                <div className="wp-progress-bar">
                  <div
                    className={`wp-progress-fill ${wp.color}`}
                    style={{ width: mounted ? `${wp.progress}%` : '0%' }}
                  />
                </div>
                <div className="wp-meta">
                  <span>{wp.progress}%</span>
                  <span>{wp.owner}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Grid: Budget + Notes ── */}
      <div className="bottom-grid" id="bottom-content">
        {/* Budget */}
        <div className="card" id="budget-card">
          <div className="section-header">
            <h2 className="section-title">Budget-Übersicht</h2>
            <span className="section-action">Finanzplan →</span>
          </div>
          <div className="budget-items">
            {budgetItems.map((item, i) => (
              <div className="budget-row" key={i}>
                <div className="budget-label">
                  <span className="budget-dot" style={{ background: item.color }} />
                  {item.label}
                </div>
                <span className="budget-amount">{item.amount}</span>
              </div>
            ))}
          </div>
          <div className="budget-total-bar">
            {budgetItems.map((item, i) => (
              <div
                key={i}
                className="budget-segment"
                style={{
                  width: mounted ? `${item.pct}%` : '0%',
                  background: item.color,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="card" id="notes-card">
          <div className="section-header">
            <h2 className="section-title">Notizen & Aufgaben</h2>
            <span className="section-action">+ Neue Notiz</span>
          </div>
          <div className="notes-list">
            {notes.map((note, i) => (
              <div className="note-item" key={i} style={{ borderLeftColor: note.color }}>
                {note.text}
                <div className="note-author">— {note.author}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="footer" id="footer">
        PANDA · Internal Tool · Built for Jiun & Nina · <a href="https://www.exist.de" target="_blank" rel="noopener noreferrer">EXIST Programm</a>
      </footer>
    </div>
  );
}
