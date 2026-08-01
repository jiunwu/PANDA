import Link from 'next/link';
import data from '@/data/project.json';

const { project, team } = data;

export default function PublicPage() {
  return (
    <>
      {/* Public Header */}
      <header className="public-hero" id="public-hero">
        <h1 className="public-title">PANDA</h1>
        <p className="public-tagline">{project.tagline}</p>
      </header>

      {/* What is PANDA */}
      <section className="section" id="about">
        <div className="section-head">
          <h2 className="section-title">About</h2>
        </div>
        <p className="summary-lead">{project.oneLiner}</p>
        <div className="summary-grid" style={{ marginTop: 32 }}>
          <div className="summary-col">
            <h3>Problem</h3>
            <p>{project.problem}</p>
          </div>
          <div className="summary-col">
            <h3>Solution</h3>
            <p>{project.solution}</p>
          </div>
          <div className="summary-col">
            <h3>Approach</h3>
            <p>{project.approach}</p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="team-section" id="public-team">
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

      {/* Funding Context */}
      <section className="section" id="funding">
        <div className="section-head">
          <h2 className="section-title">Funding</h2>
        </div>
        <p className="summary-lead" style={{ maxWidth: 560 }}>
          PANDA is being developed as part of an EXIST Gründungsstipendium
          application — a program by the German Federal Ministry for Economic
          Affairs and Climate Action supporting innovative technology-based
          startup projects from universities.
        </p>
        <div style={{ marginTop: 16 }}>
          <a
            href="https://www.exist.de"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            Learn more about EXIST
          </a>
        </div>
      </section>

      {/* Team Login */}
      <section className="section" id="team-access" style={{ borderBottom: 'none' }}>
        <div className="public-access">
          <div>
            <h3 className="public-access-title">Team access</h3>
            <p className="public-access-desc">
              Project dashboard, integrations, and activity log.
            </p>
          </div>
          <Link href="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" id="footer">
        <span>PANDA</span>
        <span>
          <a href="https://www.exist.de" target="_blank" rel="noopener noreferrer">exist.de</a>
        </span>
      </footer>
    </>
  );
}
