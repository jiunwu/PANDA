import Link from 'next/link';
import './landing.css';
import projectData from '@/data/project.json';
import ClauseScanner from '@/components/ClauseScanner';
import LandingNav from '@/components/LandingNav';
import Reveal from '@/components/Reveal';
import { CATEGORIES, MODEL_INFO } from '@/lib/legalsan';

export const metadata = {
  title: 'PANDA — read the fine print before you agree',
  description:
    'PANDA reads terms of service the way a lawyer would and flags the clauses written against you. A 24 MB model that runs entirely in your browser — nothing you paste ever leaves your device.',
};

const HERO_STATS = [
  { value: `${MODEL_INFO.sizeMB} MB`, label: 'Model on your device' },
  { value: MODEL_INFO.categories, label: 'Unfair clause categories' },
  { value: '0', label: 'Bytes of your text uploaded' },
  { value: '<1 s', label: 'To read a full contract' },
];

const PILLARS = [
  {
    kicker: 'Local',
    title: 'It never phones home.',
    body: 'The whole model — all eight classifiers, all 24 megabytes of it — is downloaded once and runs inside your browser tab. The contract you paste is processed on your own CPU. There is no API call to intercept, no upload to leak, no account to create.',
    proof: 'No server sees your text',
  },
  {
    kicker: 'Neurosymbolic',
    title: 'It reasons, not just matches.',
    body: 'A transformer encoder reads each clause in context, and a symbolic layer maps what it finds onto a taxonomy grounded in consumer-law research. That is why "we may end this at any time for any reason" is caught even when the wording is new — keyword blocklists only ever catch yesterday’s tricks.',
    proof: 'Patterns, not blocklists',
  },
  {
    kicker: 'Instant',
    title: 'It keeps up with you.',
    body: 'Each clause is classified in milliseconds, so an entire terms-of-service document resolves before you have finished scrolling it. That speed is what makes the browser extension possible: PANDA can read the fine print at the moment you are asked to accept it.',
    proof: 'Milliseconds per clause',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Split',
    body: 'The document is segmented into clauses. Headings and numbering are set aside so each obligation is judged on its own.',
  },
  {
    n: '02',
    title: 'Read',
    body: 'Every clause passes through the encoder, which scores it against eight categories at once — a clause can be several kinds of unfair.',
  },
  {
    n: '03',
    title: 'Show',
    body: 'Anything above the confidence threshold is highlighted in place, labelled with the category and its probability, and explained in plain language.',
  },
];

export default function LandingPage() {
  const { project, team, mentors, funding } = projectData;

  return (
    <div className="lp" id="top">
      <LandingNav />

      <main>
        {/* ── Hero ── */}
        <section className="lp-hero">
          <div className="lp-hero-glow" aria-hidden="true" />
          <div className="lp-hero-inner">
            <p className="lp-eyebrow">PANDA · on-device legal AI</p>
            <h1 className="lp-hero-title">
              Nobody reads
              <br />
              the fine print.
              <span className="lp-hero-accent">Now something does.</span>
            </h1>
            <p className="lp-hero-sub">
              PANDA reads terms of service the way a lawyer would — clause by clause — and
              highlights the ones written against you. The model is {MODEL_INFO.sizeMB} MB and runs
              inside your browser. Nothing you paste ever leaves your device.
            </p>
            <div className="lp-hero-actions">
              <a href="#demo" className="lp-btn lp-btn-primary">
                Try it in your browser
              </a>
              <a href="#how" className="lp-btn lp-btn-ghost">
                See how it works
              </a>
            </div>

            <div className="lp-hero-demo" aria-hidden="true">
              <div className="lp-fake-doc">
                <span className="lp-fake-line lp-fake-heading" />
                <span className="lp-fake-line" />
                <span className="lp-fake-line lp-fake-short" />
                <span className="lp-fake-clause lp-fake-flag-1">
                  We may terminate your account at any time, for any reason, without notice.
                  <em>Unilateral termination · 99%</em>
                </span>
                <span className="lp-fake-line" />
                <span className="lp-fake-clause lp-fake-flag-2">
                  You waive any right to a trial by jury or to join a class action.
                  <em>Arbitration · 91%</em>
                </span>
                <span className="lp-fake-line lp-fake-short" />
                <span className="lp-fake-clause lp-fake-flag-3">
                  Continued use after we change these terms means you accept them.
                  <em>Unilateral change · 97%</em>
                </span>
                <span className="lp-fake-line" />
                <span className="lp-fake-line lp-fake-short" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="lp-stats" aria-label="Key figures">
          <div className="lp-shell">
            <div className="lp-stat-row">
              {HERO_STATS.map((stat, index) => (
                <Reveal className="lp-stat" key={stat.label} delay={index * 70}>
                  <span className="lp-stat-value">{stat.value}</span>
                  <span className="lp-stat-label">{stat.label}</span>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── The demo ── */}
        <section className="lp-section lp-demo" id="demo">
          <div className="lp-shell">
            <Reveal className="lp-section-head">
              <p className="lp-kicker">The live demo</p>
              <h2 className="lp-h2">
                Don&apos;t take our word for it.
                <span>Run the model yourself.</span>
              </h2>
              <p className="lp-lead">
                Pick one of the sample contracts — or paste your own — and press scan. The{' '}
                {MODEL_INFO.sizeMB} MB model downloads once, then reads every clause locally and
                highlights what it finds. Watch your network tab while it runs: your text
                never leaves the page.
              </p>
            </Reveal>
            <Reveal className="lp-demo-frame" delay={80}>
              <ClauseScanner />
            </Reveal>
          </div>
        </section>

        {/* ── Pillars ── */}
        <section className="lp-section lp-dark" id="privacy">
          <div className="lp-shell">
            {PILLARS.map((pillar, index) => (
              <Reveal className="lp-pillar" key={pillar.title} delay={index * 60}>
                <p className="lp-pillar-kicker">{pillar.kicker}</p>
                <div className="lp-pillar-main">
                  <h3 className="lp-pillar-title">{pillar.title}</h3>
                  <p className="lp-pillar-body">{pillar.body}</p>
                  <span className="lp-pillar-proof">{pillar.proof}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="lp-section" id="how">
          <div className="lp-shell">
            <Reveal className="lp-section-head">
              <p className="lp-kicker">How it works</p>
              <h2 className="lp-h2">
                Three steps.
                <span>No cloud in any of them.</span>
              </h2>
            </Reveal>
            <div className="lp-steps">
              {STEPS.map((step, index) => (
                <Reveal className="lp-step" key={step.n} delay={index * 80}>
                  <span className="lp-step-n">{step.n}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </Reveal>
              ))}
            </div>
            <Reveal className="lp-spec" delay={140}>
              <dl>
                <div>
                  <dt>Architecture</dt>
                  <dd>
                    {MODEL_INFO.layers}-layer transformer encoder, {MODEL_INFO.hiddenSize} hidden
                    units, mean-pooled multi-label head
                  </dd>
                </div>
                <div>
                  <dt>Weights</dt>
                  <dd>
                    {MODEL_INFO.quantization} quantised, {MODEL_INFO.sizeMB} MB, served as a static
                    file
                  </dd>
                </div>
                <div>
                  <dt>Context</dt>
                  <dd>{MODEL_INFO.maxTokens} tokens per clause, WordPiece tokenizer in the browser</dd>
                </div>
                <div>
                  <dt>Runtime</dt>
                  <dd>WebAssembly in a Web Worker — the page stays responsive while it reads</dd>
                </div>
              </dl>
            </Reveal>
          </div>
        </section>

        {/* ── Categories ── */}
        <section className="lp-section lp-tint" id="categories">
          <div className="lp-shell">
            <Reveal className="lp-section-head">
              <p className="lp-kicker">What it finds</p>
              <h2 className="lp-h2">
                Eight ways a contract
                <span>can be written against you.</span>
              </h2>
              <p className="lp-lead">
                The categories come from consumer-law research on unfair terms in online
                contracts. Each clause is scored against all eight at once, because one sentence
                often does several of these things at the same time.
              </p>
            </Reveal>
            <div className="lp-cat-grid">
              {CATEGORIES.map((category, index) => (
                <Reveal className="lp-cat" key={category.id} delay={(index % 4) * 60}>
                  <div className="lp-cat-top">
                    <span className={`lp-cat-dot lp-sev-${category.severity}`} />
                    <h3>{category.name}</h3>
                  </div>
                  <p>{category.summary}</p>
                  <p className="lp-cat-watch">
                    <strong>Watch for</strong> {category.watchFor}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Vision / extension ── */}
        <section className="lp-section lp-dark lp-vision">
          <div className="lp-shell">
            <Reveal>
              <p className="lp-kicker">Where this goes</p>
              <h2 className="lp-h2 lp-h2-wide">
                The contract is only the beginning.
              </h2>
              <p className="lp-lead">{project.oneLiner}</p>
              <p className="lp-lead lp-lead-dim">{project.problem}</p>
            </Reveal>
          </div>
        </section>

        {/* ── Team & funding ── */}
        <section className="lp-section" id="team">
          <div className="lp-shell">
            <Reveal className="lp-section-head">
              <p className="lp-kicker">Who is building it</p>
              <h2 className="lp-h2">
                A small team
                <span>with a specific obsession.</span>
              </h2>
            </Reveal>
            <div className="lp-people">
              {team.map((person, index) => (
                <Reveal className="lp-person" key={person.name} delay={index * 70}>
                  <span className="lp-person-initial">{person.name.charAt(0)}</span>
                  <div>
                    <strong>{person.name}</strong>
                    <span>{person.role}</span>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal className="lp-funding" delay={120}>
              <div>
                <p className="lp-kicker">Backing &amp; research</p>
                <p>
                  PANDA is being developed as an {funding.program} project — the German Federal
                  Ministry for Economic Affairs and Climate Action&apos;s programme for
                  technology-based startups from universities.
                </p>
                {mentors?.length > 0 && (
                  <p className="lp-mentors">
                    Academic mentors:{' '}
                    {mentors.map((mentor) => `${mentor.name} (${mentor.affiliation})`).join(' · ')}
                  </p>
                )}
              </div>
              <a
                className="lp-btn lp-btn-ghost"
                href="https://www.exist.de"
                target="_blank"
                rel="noopener noreferrer"
              >
                About EXIST
              </a>
            </Reveal>
          </div>
        </section>

        {/* ── Closing CTA ── */}
        <section className="lp-closing">
          <div className="lp-shell">
            <Reveal>
              <h2 className="lp-closing-title">
                Read the fine print
                <span>before you agree to it.</span>
              </h2>
              <a href="#demo" className="lp-btn lp-btn-primary lp-btn-lg">
                Scan a contract now
              </a>
              <p className="lp-closing-note">
                Free, public, and running on your own machine. A research prototype — not legal
                advice.
              </p>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── Footer, with team access at the very bottom ── */}
      <footer className="lp-footer">
        <div className="lp-shell">
          <div className="lp-footer-main">
            <div className="lp-footer-brand">
              <span className="lp-wordmark">PANDA</span>
              <p>{project.tagline}</p>
            </div>
            <nav className="lp-footer-links" aria-label="Footer">
              <a href="#demo">Live demo</a>
              <a href="#how">How it works</a>
              <a href="#categories">What it finds</a>
              <a href="https://www.exist.de" target="_blank" rel="noopener noreferrer">
                EXIST
              </a>
            </nav>
          </div>

          <div className="lp-footer-bottom">
            <span>
              © {new Date().getFullYear()} PANDA · A research prototype, not legal advice
            </span>
            <Link href="/login" className="lp-team-login">
              Team login
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path
                  d="M2.5 6h6M6 3.5 8.5 6 6 8.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
