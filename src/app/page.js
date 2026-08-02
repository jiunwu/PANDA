import Link from 'next/link';
import { getProjectData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function PublicPage() {
  const data = await getProjectData();
  const { project, team } = data;

  return (
    <>
      {/* Public Header */}
      <header className="public-hero" id="public-hero">
        <h1 className="public-title">PANDA</h1>
        <p className="public-tagline">{project.tagline}</p>
      </header>

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
