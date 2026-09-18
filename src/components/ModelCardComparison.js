import Arrow from "./LandingArrow";

// Source: the supplied model card. These FP32 experiments are separate from
// the landing page's historical LegalBench and exported INT8 evaluations.
const MODELS = [
  { name: "Contracts-BERT", role: "Teacher · fine-tuned", mb: 435.6, f1: 0.8115 },
  { name: "Distilled student", role: "B_attn_6L · best learning rate", mb: 94.1, f1: 0.7691 },
];

export default function ModelCardComparison() {
  return (
    <section className="lp-distillation" id="model-card" aria-labelledby="model-card-title">
      <div className="lp-model-caption">
        <div>
          <span className="lp-kicker">Inside the model / Distillation</span>
          <h3 id="model-card-title">436 MB to 94 MB.</h3>
        </div>
        <p>78.4% smaller FP32 weights</p>
      </div>
      <p className="lp-distillation-intro">
        A smaller model learns from Contracts-BERT, then fine-tunes for eight
        clause categories. The best reported student reaches 0.7691 macro-F1
        versus the teacher’s 0.8115: a reduction of 0.0424.
      </p>
      <div className="lp-distillation-charts">
        {[
          { key: "mb", title: "Weight size", scale: "FP32 · 0–436 MB", max: 435.6 },
          { key: "f1", title: "Classification performance", scale: "Macro-F1 · 0–1", max: 1 },
        ].map((metric) => (
          <figure className="lp-distillation-chart" key={metric.key}>
            <figcaption><strong>{metric.title}</strong><span>{metric.scale}</span></figcaption>
            <ol>
              {MODELS.map((model, index) => (
                <li key={model.name} className={index === 1 ? "is-student" : undefined}>
                  <div className="lp-distillation-label">
                    <span>{model.name}<small>{model.role}</small></span>
                    <strong>{metric.key === "mb" ? `${model.mb} MB` : model.f1.toFixed(4)}</strong>
                  </div>
                  <div className="lp-distillation-track" aria-hidden="true">
                    <span style={{ width: `${model[metric.key] / metric.max * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          </figure>
        ))}
      </div>
      <p className="lp-footnote">
        Source: supplied training model card. Macro-F1 averages eight category
        F1 scores; it is not accuracy. Each chart starts at zero. FP32 weight
        sizes are separate from the INT8 browser download and runtime memory.
      </p>
      <div className="lp-model-card-download">
        <div>
          <span className="lp-kicker">The experiment behind the numbers</span>
          <p>A model card records the model’s origin, training setup and evaluation results. Download the experiment record to inspect the details.</p>
        </div>
        <a className="lp-text-link" href="/papers/model_card.json" download="model_card.json">
          Download model card (JSON) <Arrow />
        </a>
      </div>
    </section>
  );
}
