import Link from "next/link";
import "./landing.css";
import projectData from "@/data/project.json";
import ClauseScanner from "@/components/ClauseScanner";
import LandingNav from "@/components/LandingNav";
import Arrow from "@/components/LandingArrow";
import ModelPerformanceChart from "@/components/ModelPerformanceChart";
import { CATEGORIES, MODEL_INFO } from "@/lib/legalsan";

export const metadata = {
  title: "PANDA — Clarity before you agree.",
  description:
    "PANDA is building AI for consumer protection: private contract analysis with LegalSAN today, with dark pattern detection and agentic help for cancellations and legal issues on the roadmap.",
};

// Headline metrics below come from the prior LegalBench evaluation, a different
// protocol from the UNFAIR-ToS results reported in the working paper.
// Defaults to the working paper served from /public; override with the published paper URL.
const PREPRINT_URL =
  process.env.NEXT_PUBLIC_PANDA_PREPRINT_URL || "/papers/legalsan-working-paper.pdf";

const MODEL_COMPARISON = [
  { name: "LegalSAN", parameters: 23.5, featured: true },
  { name: "DistilBERT", parameters: 66 },
  { name: "Legal-BERT", parameters: 110 },
  { name: "RoBERTa-large", parameters: 355 },
];

function ModelComparison() {
  return (
    <figure className="lp-model-comparison" aria-labelledby="model-comparison-title">
      <figcaption className="lp-model-caption">
        <div>
          <span className="lp-kicker">Model comparison</span>
          <h3 id="model-comparison-title">Small by design.</h3>
        </div>
        <p>Model size · millions of parameters</p>
      </figcaption>
      <ol className="lp-model-bars">
        {MODEL_COMPARISON.map((model) => (
          <li className={model.featured ? "is-featured" : undefined} key={model.name}>
            <div className="lp-model-name">
              <strong>{model.name}</strong>
              <span>{model.featured ? "Our model" : (model.parameters / 23.5).toFixed(1) + "× the parameters"}</span>
            </div>
            <div className="lp-model-track" aria-hidden="true">
              <span style={{ width: (model.parameters / 355) * 100 + "%" }} />
            </div>
            <span className="lp-model-value">{model.parameters}<small> M</small></span>
          </li>
        ))}
      </ol>
      <div className="lp-model-summary">
        <p><strong>{MODEL_INFO.sizeMB} MB</strong><span>LegalSAN download · INT8</span></p>
        <p>Focused on the fine print. Compact enough to run on your device.</p>
      </div>
      <p className="lp-footnote">Bars use a shared linear scale and compare parameter counts, not accuracy or download size. Detailed performance comparisons belong in the working paper.</p>
    </figure>
  );
}

function SectionHeading({ number, label, title, children }) {
  return (
    <div className="lp-section-head">
      <p className="lp-kicker">
        <span>{number}</span>
        {label}
      </p>
      <div>
        <h2>{title}</h2>
        {children && <p className="lp-lead">{children}</p>}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { team, mentors, funding } = projectData;
  return (
    <div className="lp" id="top">
      <a className="lp-skip" href="#main">
        Skip to content
      </a>
      <LandingNav />
      <main id="main">
        <section className="lp-hero lp-shell" aria-labelledby="hero-title">
          <div className="lp-hero-meta">
            <span>Private AI for consumer protection</span>
            <span>Bamberg, Germany · Research in practice</span>
          </div>
          <h1 id="hero-title">
            Clarity before
            <br />
            you{" "}
            <span className="lp-agree">
              agree<span className="lp-period">.</span>
            </span>
          </h1>
          <div className="lp-hero-bottom">
            <p className="lp-index">PANDA / LegalSAN</p>
            <div className="lp-hero-copy">
              <p>
                Understand your rights. Spot manipulation. Take action.
                PANDA is building an AI assistant for consumer protection,
                from the terms you accept to the problems you need to resolve.
              </p>
              <p className="lp-hero-foundation">
                It starts with LegalSAN: our compact, private AI model that
                flags potentially unfair contract clauses on your own device.
                Next on our roadmap: dark pattern detection and agentic help
                with cancellations and everyday legal issues.
              </p>
              <div className="lp-actions">
                <a className="lp-btn" href="#demo">
                  Try LegalSAN live <Arrow />
                </a>
                <a className="lp-text-link" href="#roadmap">
                  Explore the roadmap <Arrow />
                </a>
              </div>
            </div>
          </div>
          <figure className="lp-specimen">
            <figcaption>
              <span className="lp-kicker">01 / Reading between the lines</span>
              <span>Illustrative clause · not a live result</span>
            </figcaption>
            <div className="lp-specimen-body">
              <blockquote>
                “We may terminate your account{" "}
                <mark>at any time, for any reason, without notice.</mark>”
              </blockquote>
              <div className="lp-annotation">
                <span className="lp-annotation-label">
                  Potential concern / 01
                </span>
                <h2>Unilateral termination</h2>
                <p>
                  The provider reserves the right to end your access without
                  explaining why or warning you first.
                </p>
                <a className="lp-text-link" href="#demo">
                  See what PANDA finds <Arrow />
                </a>
              </div>
            </div>
          </figure>
        </section>

        <section className="lp-facts lp-shell" aria-label="Model facts">
          <div>
            <strong>
              {MODEL_INFO.sizeMB}
              <small> MB</small>
            </strong>
            <span>On-device model</span>
          </div>
          <div>
            <strong>08</strong>
            <span>Clause categories</span>
          </div>
          <div>
            <strong>
              0<small> uploads</small>
            </strong>
            <span>LegalSAN scans stay on your device</span>
          </div>
          <div className="lp-facts-backing">
            <span className="lp-kicker">Supported by</span>
            <strong>EXIST</strong>
            <span>University of Bamberg</span>
          </div>
        </section>

        <section className="lp-section lp-shell" id="demo">
          <SectionHeading
            number="01"
            label="Live demonstration"
            title="Read it. Then decide."
          >
            Choose a sample contract or paste your own text. The model downloads
            on your first scan and processes the clauses inside this browser.
          </SectionHeading>
          <div className="lp-demo-frame">
            <ClauseScanner />
          </div>
          <p className="lp-footnote">
            Research prototype. Flags are signals for closer reading, not legal
            conclusions.
          </p>
        </section>

        <section className="lp-technology" id="how">
          <div className="lp-section lp-shell">
            <SectionHeading
              number="02"
              label="The technology"
              title="Small enough to stay yours."
            >
              LegalSAN brings a focused language model to the browser. Local
              processing makes privacy a property of the product.
            </SectionHeading>
            <div className="lp-tech-grid">
              <div className="lp-tech-statement">
                <span className="lp-kicker">The local advantage</span>
                <p>
                  Your text.
                  <br />
                  Your device.
                  <br />
                  <span>Your decision.</span>
                </p>
                <a className="lp-text-link" href="#performance">
                  Explore the research <Arrow />
                </a>
              </div>
              <div className="lp-process">
                <div>
                  <span>01</span>
                  <h3>Separate the clauses</h3>
                  <p>
                    The document is divided into individual clauses for
                    analysis.
                  </p>
                </div>
                <div>
                  <span>02</span>
                  <h3>Recognise the patterns</h3>
                  <p>
                    A transformer encoder scores each clause against eight
                    categories of potentially unfair terms.
                  </p>
                </div>
                <div>
                  <span>03</span>
                  <h3>Make the concern visible</h3>
                  <p>
                    Flagged passages are highlighted in context, with a category
                    and an explanation.
                  </p>
                </div>
              </div>
            </div>
            <dl className="lp-specs">
              <div>
                <dt>Architecture</dt>
                <dd>{MODEL_INFO.layers}-layer transformer</dd>
              </div>
              <div>
                <dt>Weights</dt>
                <dd>
                  {MODEL_INFO.quantization} · {MODEL_INFO.sizeMB} MB
                </dd>
              </div>
              <div>
                <dt>Context</dt>
                <dd>{MODEL_INFO.maxTokens} tokens per clause</dd>
              </div>
              <div>
                <dt>Execution</dt>
                <dd>WebAssembly · Web Worker</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="lp-section lp-shell" id="performance">
          <SectionHeading
            number="03"
            label="Research & performance"
            title="Focused intelligence. Measurable results."
          >
            A compact model trained for the fine print. LegalSAN brings
            specialised contract analysis to the browser, with the research
            behind it documented in our working paper.
          </SectionHeading>
          <div className="lp-results" aria-label="LegalSAN research highlights">
            <div className="lp-result">
              <strong>
                95.88<span>%</span>
              </strong>
              <h3>Overall accuracy</h3>
              <p>Nine-category classification, including Other.</p>
            </div>
            <div className="lp-result">
              <strong>
                88.46<span>%</span>
              </strong>
              <h3>Binary macro-F1</h3>
              <p>Fair versus potentially unfair clauses.</p>
            </div>
            <div className="lp-paper-link">
              <span className="lp-kicker">The research behind PANDA</span>
              <p>
                Full methodology and evaluation in “LegalSAN: Compact Local
                Inference for Unfair-Clause Classification” (working paper,
                September 2026).
              </p>
              <a
                className="lp-text-link"
                href={PREPRINT_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the working paper <Arrow direction="external" />
              </a>
            </div>
          </div>
          <p className="lp-footnote">
            LegalBench unfair_tos · INT8 · threshold 0.40. Overall accuracy
            includes the majority Other category; the two figures measure
            different aspects of performance.
          </p>
          <ModelComparison />
          <ModelPerformanceChart />
        </section>

        <section className="lp-section lp-shell lp-categories" id="categories">
          <SectionHeading
            number="04"
            label="What it recognises"
            title="The details that deserve a second look."
          />
          <div className="lp-category-list">
            {CATEGORIES.map((category, index) => (
              <details key={category.id}>
                <summary>
                  <span className="lp-category-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{category.name}</h3>
                  <span className="lp-expand" aria-hidden="true" />
                </summary>
                <div className="lp-category-detail">
                  <p>{category.summary}</p>
                  <p>
                    <strong>Watch for</strong> {category.watchFor}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="lp-roadmap" id="roadmap" aria-labelledby="roadmap-title">
          <div className="lp-section lp-shell">
            <div className="lp-section-head">
              <p className="lp-kicker"><span>05</span> The PANDA roadmap</p>
              <div>
                <h2 id="roadmap-title">From understanding to action.</h2>
                <p className="lp-lead">
                  Consumer protection reaches beyond the fine print. LegalSAN
                  is our foundation for an assistant that helps you recognise
                  unfair terms, detect manipulative design and act on your rights.
                </p>
              </div>
            </div>
            <ol className="lp-roadmap-grid" aria-label="Product development phases">
              <li className="lp-roadmap-step is-current">
                <div className="lp-roadmap-meta">
                  <span className="lp-kicker">01 / Understand</span>
                  <span className="lp-roadmap-status">Live prototype</span>
                </div>
                <h3>Clarity in the contract.</h3>
                <p>
                  LegalSAN highlights potentially unfair clauses across eight
                  categories. A compact model, running locally in your browser,
                  puts the fine print in context.
                </p>
                <p className="lp-roadmap-example">
                  <strong>Today</strong> Scan terms before signing up for a service.
                </p>
                <a className="lp-text-link" href="#demo">
                  Try the working model <Arrow />
                </a>
              </li>
              <li className="lp-roadmap-step">
                <div className="lp-roadmap-meta">
                  <span className="lp-kicker">02 / Detect</span>
                  <span className="lp-roadmap-status">Next · Planned</span>
                </div>
                <h3>See through dark patterns.</h3>
                <p>
                  Bring protection into the browsing flow. We plan to detect
                  interfaces that pressure, mislead or obstruct you, and explain
                  how their design shapes your choices.
                </p>
                <p className="lp-roadmap-example">
                  <strong>What we’re working toward</strong> Flag misleading
                  consent prompts, hidden subscription terms and cancellation
                  obstacles.
                </p>
              </li>
              <li className="lp-roadmap-step">
                <div className="lp-roadmap-meta">
                  <span className="lp-kicker">03 / Act</span>
                  <span className="lp-roadmap-status">Future · Planned</span>
                </div>
                <h3>Help that follows through.</h3>
                <p>
                  An agentic service to help handle contract cancellations and
                  everyday legal issues: prepare requests, submit them with your
                  approval and track the follow-up.
                </p>
                <p className="lp-roadmap-example">
                  <strong>What we’re working toward</strong> Cancel an unwanted
                  subscription, dispute a charge or organise evidence for a
                  complaint, with a path to qualified legal support when needed.
                </p>
              </li>
            </ol>
            <p className="lp-roadmap-note">
              Available today: the LegalSAN clause scanner. Dark pattern
              detection and agentic services are planned capabilities; launch
              dates are not yet announced.
            </p>
          </div>
        </section>

        <section className="lp-section lp-shell" id="team">
          <SectionHeading
            number="06"
            label="People & backing"
            title="From research to everyday use."
          >
            PANDA is being developed at the University of Bamberg with support
            from the {funding.program}.
          </SectionHeading>
          <div className="lp-team-grid">
            {team.map((person, index) => (
              <div className="lp-person" key={person.name}>
                <span className="lp-kicker">
                  {String(index + 1).padStart(2, "0")} / Founding team
                </span>
                <h3>{person.name}</h3>
                <p>{person.role}</p>
              </div>
            ))}
            <div className="lp-backing">
              <span className="lp-kicker">Academic mentorship</span>
              {mentors?.map((mentor) => (
                <p key={mentor.name}>
                  <strong>{mentor.name}</strong>
                  <span>{mentor.affiliation}</span>
                </p>
              ))}
              <a
                className="lp-text-link"
                href="https://www.exist.de"
                target="_blank"
                rel="noopener noreferrer"
              >
                About EXIST <Arrow direction="external" />
              </a>
            </div>
          </div>
        </section>

        <section className="lp-closing lp-shell">
          <p className="lp-kicker">Make an informed choice</p>
          <div>
            <h2>
              Start with
              <br />
              the fine print.
            </h2>
            <a className="lp-btn" href="#demo">
              Scan a contract <Arrow />
            </a>
          </div>
        </section>
      </main>
      <footer className="lp-footer lp-shell">
        <div className="lp-footer-top">
          <a className="lp-wordmark" href="#top">
            PANDA
            <span className="lp-brand-square" aria-hidden="true" />
          </a>
          <p>
            Private intelligence.
            <br />
            In the consumer’s interest.
          </p>
          <a className="lp-text-link" href="#top">
            Back to top <Arrow direction="up" />
          </a>
        </div>
        <div className="lp-footer-bottom">
          <span>
            © {new Date().getFullYear()} PANDA · Research prototype, not legal
            advice.
          </span>
          <Link className="lp-text-link" href="/login">
            Team login <Arrow />
          </Link>
        </div>
      </footer>
    </div>
  );
}
