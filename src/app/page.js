import Link from 'next/link';
import './landing.css';
import projectData from '@/data/project.json';
import ClauseScanner from '@/components/ClauseScanner';
import LandingNav from '@/components/LandingNav';
import Reveal from '@/components/Reveal';
import { CATEGORIES, CATEGORY_BY_INDEX, EVALUATION, MODEL_INFO } from '@/lib/legalsan';

export const metadata = {
  title: 'PANDA — read the fine print before you agree',
  description:
    'PANDA flags the clauses in a terms-of-service document that EU consumer law treats as unfair. A 23.5 M-parameter model that runs entirely in your browser — nothing you paste ever leaves your device.',
};

const HERO_STATS = [
  { value: `${MODEL_INFO.sizeMB} MB`, label: 'Model on your device' },
  { value: MODEL_INFO.categories, label: 'Unfair clause categories' },
  { value: '0', label: 'Bytes of your text uploaded' },
  { value: '<1 s', label: 'To read a full contract' },
];

// Parameter counts are public architecture facts and are exact. Accuracy is
// deliberately absent here: published figures come from each author's own
// evaluation protocol, and putting them in one column would imply a head-to-head
// run we have not done. Ours is measured and shown in full further down.
const SIZE_COMPARISON = [
  { name: 'LegalSAN', parameters: '23.5 M', download: '23 MB int8', browser: true, featured: true },
  { name: 'DistilBERT', parameters: '66 M', download: '~250 MB fp32', browser: false },
  { name: 'Legal-BERT', parameters: '110 M', download: '~420 MB fp32', browser: false },
  { name: 'RoBERTa-large', parameters: '355 M', download: '~1.4 GB fp32', browser: false },
];

const ALTERNATIVES = [
  {
    name: 'ToS;DR',
    what: 'Volunteers read and grade the terms of named services.',
    limit: 'Depth and trust come from human review — but only for services someone has already covered, and reviews lag behind updates.',
  },
  {
    name: 'Polisis',
    what: 'Academic deep-learning analysis of privacy policies.',
    limit: 'Targets privacy policies rather than contractual terms, and runs as a hosted service.',
  },
  {
    name: 'General-purpose LLMs',
    what: 'Paste a contract into a chat assistant and ask.',
    limit: 'The document goes to someone else\u2019s server, answers vary between runs, and there is no per-category score to audit.',
  },
  {
    name: 'PANDA',
    what: 'A fixed classifier scores every clause against eight categories, on your device.',
    limit: 'Narrow by design: eight categories, English, one probability per clause. It does not summarise or advise.',
    featured: true,
  },
];

const PILLARS = [
  {
    kicker: 'Local',
    title: 'It never phones home.',
    body: 'The whole model — all eight classifiers, all 24 megabytes of it — is downloaded once and runs inside your browser tab. The contract you paste is processed on your own CPU. There is no API call to intercept, no upload to leak, no account to create.',
    proof: 'No server sees your text',
  },
  {
    kicker: 'Specialised',
    title: 'It was trained for one job.',
    body: 'A transformer encoder fine-tuned on clauses that consumer-law researchers annotated as unfair. It generalises from wording it has seen to wording it has not, which is why "we may end this at any time for any reason" is caught when freshly phrased — a keyword blocklist only ever catches last year’s drafting. It is a classifier, not a reasoner: it returns eight probabilities per clause, and everything you see after that is ordinary software.',
    proof: 'Eight probabilities, no prose',
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
          <div className="lp-hero-orbit lp-hero-orbit-one" aria-hidden="true" />
          <div className="lp-hero-orbit lp-hero-orbit-two" aria-hidden="true" />
          <div className="lp-hero-inner">
            <p className="lp-eyebrow"><span />Introducing LegalSAN · private intelligence, on device</p>
            <h1 className="lp-hero-title">
              Nobody reads
              <br />
              the fine print.
              <span className="lp-hero-accent">Now something does.</span>
            </h1>
            <p className="lp-hero-sub">
              PANDA reads a contract clause by clause — the way a legal researcher annotates
              one — and highlights the terms EU consumer law treats as unfair. The model is{' '}
              {MODEL_INFO.sizeMB} MB and runs inside your browser. Nothing you paste ever leaves
              your device.
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
              <div className="lp-demo-halo" />
              <div className="lp-fake-doc">
                <div className="lp-fake-toolbar"><i /><i /><i /><b>Scanning locally</b></div>
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

        {/* ── Performance ── */}
        <section className="lp-section lp-performance" id="performance">
          <div className="lp-shell">
            <Reveal className="lp-performance-intro">
              <p className="lp-kicker">Measured, not asserted</p>
              <h2 className="lp-h2 lp-h2-wide">
                23.5 million parameters.
                <span>Here is exactly what they buy you.</span>
              </h2>
              <p className="lp-lead">
                LegalSAN is about a third the size of DistilBERT and roughly a fifth of
                Legal-BERT. That is the whole trade: a model this small fits in a browser tab,
                which is the only reason the demo above can run without uploading your contract.
                Legal-BERT reports the strongest published results on this task — it is also five
                times our size and ships to nobody&apos;s phone.
              </p>
            </Reveal>

            <Reveal className="lp-eval-card" delay={80}>
              <div className="lp-eval-head">
                <div>
                  <span>Our result</span>
                  <h3>{EVALUATION.split}</h3>
                </div>
                <div className="lp-eval-headline">
                  <div>
                    <strong>{EVALUATION.macroF1.toFixed(3)}</strong>
                    <span>macro-F1</span>
                  </div>
                  <div>
                    <strong>{EVALUATION.microF1.toFixed(3)}</strong>
                    <span>micro-F1</span>
                  </div>
                  <div>
                    <strong>{EVALUATION.clauses.toLocaleString('en')}</strong>
                    <span>test clauses</span>
                  </div>
                </div>
              </div>

              <div className="lp-eval-table-wrap">
                <table className="lp-eval-table">
                  <caption className="lp-sr-only">
                    Per-category precision, recall, F1 and support on the {EVALUATION.split}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Category</th>
                      <th scope="col">Precision</th>
                      <th scope="col">Recall</th>
                      <th scope="col">F1</th>
                      <th scope="col">Support</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EVALUATION.perLabel.map((row, index) => (
                      <tr key={row.id}>
                        <th scope="row">{CATEGORY_BY_INDEX[index].name}</th>
                        <td>{row.precision.toFixed(3)}</td>
                        <td>{row.recall.toFixed(3)}</td>
                        <td>{row.f1.toFixed(3)}</td>
                        <td className={row.support < 20 ? 'lp-eval-thin' : undefined}>
                          {row.support}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lp-eval-notes">
                <h4>How to check this</h4>
                <ul>
                  <li>
                    The official LexGLUE UNFAIR-ToS <strong>test</strong> split, unmodified, all{' '}
                    {EVALUATION.clauses.toLocaleString('en')} clauses.
                  </li>
                  <li>
                    Scored against the same <strong>int8 file the browser downloads</strong>, not a
                    larger unquantised checkpoint.
                  </li>
                  <li>
                    One sigmoid per category at threshold {EVALUATION.threshold}; macro-F1 is the
                    unweighted mean of the eight F1 scores above, with no &ldquo;fair&rdquo; class
                    scored. Figures published elsewhere often do score one, so this number is not
                    interchangeable with theirs.
                  </li>
                  <li>
                    Support is small for several categories — arbitration has{' '}
                    {EVALUATION.perLabel[7].support} positive examples in the whole split — so
                    treat those per-class scores as indicative.
                  </li>
                  <li>
                    <code>scripts/eval-unfair-tos.py</code> in our repository downloads the split
                    and reprints this table from scratch.
                  </li>
                </ul>
              </div>
            </Reveal>

            <Reveal className="lp-size-card" delay={140}>
              <h3>What actually fits in a browser</h3>
              <div className="lp-size-table-wrap">
                <table className="lp-size-table">
                  <thead>
                    <tr>
                      <th scope="col">Model</th>
                      <th scope="col">Parameters</th>
                      <th scope="col">Download</th>
                      <th scope="col">Runs on device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SIZE_COMPARISON.map((model) => (
                      <tr key={model.name} className={model.featured ? 'is-featured' : undefined}>
                        <th scope="row">{model.name}</th>
                        <td>{model.parameters}</td>
                        <td>{model.download}</td>
                        <td>
                          <span className={model.browser ? 'lp-yes' : 'lp-no'}>
                            {model.browser ? 'Yes' : 'Not practically'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="lp-size-note">
                Parameter counts are architecture facts and are exact. We deliberately do not put
                accuracy in this table: published figures for those models come from their own
                authors&apos; evaluation protocols, and lining them up in one column would imply a
                head-to-head run we have not done.
              </p>
            </Reveal>
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

        {/* ── Regulatory context ── */}
        <section className="lp-section lp-law" id="law">
          <div className="lp-shell">
            <Reveal className="lp-section-head">
              <p className="lp-kicker">Why these eight</p>
              <h2 className="lp-h2">
                The categories are not ours.
                <span>They come from EU law.</span>
              </h2>
              <p className="lp-lead">
                Council Directive 93/13/EEC on unfair terms in consumer contracts is the reason a
                clause can be unfair as a matter of law rather than as a matter of opinion. The
                eight categories PANDA scores follow the annotation scheme consumer-law
                researchers built on that directive — which is also why a scanner can be specific
                about what it found instead of vaguely warning you.
              </p>
            </Reveal>
            <div className="lp-law-grid">
              <Reveal className="lp-law-card">
                <h3>Directive 93/13/EEC</h3>
                <p>
                  Terms that create a significant imbalance to the consumer&apos;s detriment are
                  not binding on them. The categories on this page — one-sided termination,
                  liability caps, arbitration, imposed jurisdiction — are the recurring shapes
                  that imbalance takes in online contracts.
                </p>
              </Reveal>
              <Reveal className="lp-law-card" delay={70}>
                <h3>The EU AI Act</h3>
                <p>
                  A risk-based regime that asks what a system does, how it is documented and what
                  users are told. Ours is a narrow classifier with a published evaluation and a
                  human reading every result — and it is a consumer-information tool, not a legal
                  service. We treat that documentation burden as the baseline, not as a cost.
                </p>
              </Reveal>
              <Reveal className="lp-law-card" delay={140}>
                <h3>Data protection</h3>
                <p>
                  Running on the device is the strongest form of data minimisation there is: a
                  contract that is never transmitted cannot be logged, retained, subpoenaed or
                  breached. That is an architectural property you can verify in your own network
                  tab, not a policy promise.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Where it sits ── */}
        <section className="lp-section lp-tint" id="compare">
          <div className="lp-shell">
            <Reveal className="lp-section-head">
              <p className="lp-kicker">Where it sits</p>
              <h2 className="lp-h2">
                Other people have
                <span>worked on this too.</span>
              </h2>
              <p className="lp-lead">
                Reading contracts for consumers is not a new idea. What is new here is the
                combination: automatic, per-clause, category-level scoring that runs without
                sending the document anywhere.
              </p>
            </Reveal>
            <div className="lp-alt-grid">
              {ALTERNATIVES.map((item, index) => (
                <Reveal
                  className={`lp-alt ${item.featured ? 'is-featured' : ''}`}
                  key={item.name}
                  delay={(index % 4) * 60}
                >
                  <h3>{item.name}</h3>
                  <p>{item.what}</p>
                  <p className="lp-alt-limit">{item.limit}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Roadmap ── */}
        <section className="lp-section lp-dark lp-vision">
          <div className="lp-shell">
            <Reveal>
              <p className="lp-kicker">What is next</p>
              <h2 className="lp-h2 lp-h2-wide">
                Contracts first. Interfaces after — and only with the same evidence.
              </h2>
              <p className="lp-lead">
                Unfair terms and manipulative interface design are the same problem wearing
                different clothes: the cost of a decision is moved somewhere you will not look.
                Contracts are the tractable half — the text is fixed, the categories are settled
                in law, and the results on this page can be checked line by line.
              </p>
              <p className="lp-lead lp-lead-dim">
                Detecting dark patterns in live interfaces is the harder half and the reason this
                is a research project rather than a finished product. It needs its own annotated
                data, its own evaluation, and its own published numbers. We have not built it yet,
                and we would rather say so here than imply otherwise.
              </p>
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
                Free, public, and running on your own machine. A research prototype that
                classifies clauses — it does not give legal advice and is not a legal service.
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
              <a href="#performance">Results</a>
              <a href="#law">Why these eight</a>
              <a href="https://www.exist.de" target="_blank" rel="noopener noreferrer">
                EXIST
              </a>
            </nav>
          </div>

          <div className="lp-footer-bottom">
            <span>
              © {new Date().getFullYear()} PANDA · Clause classification, not legal advice
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
