'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import data from '@/data/project.json';

const { project, team, mentors, contact, funding, goals, dataRoom, milestones, workPackages, budget, sprints, github, agentsOverview, agentInteractions } = data;

function statusLabel(s) {
  if (s === 'done') return 'Erledigt';
  if (s === 'active') return 'Aktuell';
  if (s === 'upcoming') return 'Geplant';
  return s;
}

function formatAmount(n) {
  return n.toLocaleString('de-DE');
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  useEffect(() => { setMounted(true); }, []);

  const overallProgress = Math.round(
    workPackages.reduce((s, w) => s + w.progress, 0) / workPackages.length
  );

  const deadline = new Date(funding.projectEnd);
  const daysLeft = Math.max(0, Math.ceil((deadline - new Date()) / 86400000));

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <>
      {/* Header */}
      <header className="page-header" id="hero">
        <div className="page-header-row">
          <div>
            <h1>Dashboard</h1>
            <p>{project.tagline}</p>
          </div>
          <button className="btn btn-ghost" onClick={handleLogout} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
            Logout
          </button>
        </div>
      </header>

      {/* Stats Bar */}
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
          <div className="stat-value">{sprints[0].progress}%</div>
          <div className="stat-label">{sprints[0].id} Progress</div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="bento-grid">
        {/* LEFT COLUMN: Operations */}
        <div className="bento-col">
          <div className="bento-card">
            <div className="bento-header">
              <h2 className="bento-title">Agile Sprint</h2>
              <span className="section-meta">{sprints[0].id}</span>
            </div>
            <div className="list-stack">
              {sprints[0].tasks.map((task, i) => (
                <div className="list-item" key={i}>
                  <div className="item-title">{task.title}</div>
                  <div className="item-meta">
                    <span className={`item-tag ${task.status === 'done' ? 'active' : ''}`}>{task.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bento-card">
            <div className="bento-header">
              <h2 className="bento-title">GitHub Development</h2>
            </div>
            <div className="list-stack">
              {github.map((item, i) => (
                <div className="list-item" key={i}>
                  <div className="item-title">{item.title}</div>
                  <div className="item-meta">
                    <span className={`item-tag ${item.status === 'Merged' ? 'active' : ''}`}>{item.type}</span>
                    <span>{item.author} • {item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Core Project */}
        <div className="bento-col">
          <div className="bento-card">
            <div className="bento-header">
              <h2 className="bento-title">Goals</h2>
              <span className="section-meta">{goals.length} active</span>
            </div>
            <div className="timeline" style={{ paddingLeft: 8 }}>
              {goals.map((g, i) => (
                <div className="timeline-item" key={i}>
                  <div className={`timeline-dot ${g.status}`} />
                  <div className="timeline-body">
                    <span className={`timeline-title ${g.status}`}>{g.title}</span>
                    <span className="timeline-date">{g.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bento-card">
            <div className="bento-header">
              <h2 className="bento-title">Data Room</h2>
            </div>
            <div className="list-stack">
              {dataRoom.map((doc, i) => (
                <div className="list-item" key={i}>
                  <div className="item-title">{doc.title}</div>
                  <div className="item-meta">
                    <span className={`type-tag ${doc.status === 'Empty' ? 'type-system' : doc.status === 'Draft' ? 'type-note' : 'type-milestone'}`}>
                      {doc.status}
                    </span>
                    <span>Updated {doc.lastUpdated}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Agents */}
        <div className="bento-col">
          <div className="bento-card">
            <div className="bento-header">
              <h2 className="bento-title">AI Agents Overview</h2>
            </div>
            <div className="agent-grid">
              {agentsOverview.map((agent, i) => (
                <div className="agent-card" key={i}>
                  <div className="agent-header">
                    <span className="agent-name">{agent.name}</span>
                    <span className="agent-status" style={{
                      color: agent.status === 'Working' || agent.status === 'Active' ? 'var(--green)' : agent.status === 'Error' ? 'var(--red)' : 'var(--text-tertiary)',
                      borderColor: agent.status === 'Working' || agent.status === 'Active' ? 'var(--green)' : agent.status === 'Error' ? 'var(--red)' : 'var(--border)'
                    }}>
                      {agent.status}
                    </span>
                  </div>
                  <div className="agent-task">{agent.task}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bento-card" style={{ padding: 0, background: '#111', borderColor: '#111' }}>
            <div className="chat-console">
              {agentInteractions.map((msg, i) => (
                <div className="chat-msg" key={i}>
                  <span className={msg.role === 'agent' ? 'chat-agent' : 'chat-user'}>
                    {msg.role === 'agent' ? msg.agent : 'You'} <span style={{color:'#666', fontSize:10}}>[{msg.time}]</span>
                  </span>
                  <span className="chat-text">{msg.message}</span>
                </div>
              ))}
              <div className="chat-input-wrapper">
                <span style={{color: '#60a5fa'}}>&gt;</span>
                <input type="text" className="chat-input" placeholder="Dispatch task to agents..." />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team & Stakeholders */}
      <section className="team-section" id="team" style={{ borderTop: '1px solid var(--border)', paddingTop: 40, marginTop: 24 }}>
        <div className="section-head">
          <h2 className="section-title">Team & Stakeholders</h2>
        </div>
        <div className="team-grid">
          {team.map((t) => (
            <div className="team-member" key={t.name}>
              <div className="team-initial">{t.name.charAt(0)}</div>
              <div className="team-info">
                <h3>{t.name}</h3>
                <div className="team-role">{t.role}</div>
              </div>
            </div>
          ))}
          {mentors.map((m) => (
            <div className="team-member" key={m.name}>
              <div className="team-initial" style={{ background: 'var(--border-light)' }}>{m.name.charAt(0)}</div>
              <div className="team-info">
                <h3>{m.name}</h3>
                <div className="team-role">Mentor — {m.affiliation}</div>
              </div>
            </div>
          ))}
          <div className="team-member">
            <div className="team-initial" style={{ background: 'var(--border-light)' }}>{contact.name.charAt(0)}</div>
            <div className="team-info">
              <h3>{contact.name}</h3>
              <div className="team-role">{contact.role}</div>
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
