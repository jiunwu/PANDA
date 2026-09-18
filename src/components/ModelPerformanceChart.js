// Encoder figures are restored from the earlier landing-page comparison.
// LLM figures are f1_macro from the LegalEvalHub unfair_tos leaderboard
// (https://www.legalevalhub.ai/task/unfair_tos). Protocols differ, so this is
// not a controlled head-to-head comparison.
// Label placement: lx/ly position the model name; the score sits one line below.
const ENCODERS = [
  { name: "LegalSAN", parameters: 23.5, score: 0.787, featured: true, lx: 140, ly: 178, anchor: "middle" },
  { name: "DistilBERT", parameters: 66, score: 0.793, lx: 219, ly: 236, anchor: "middle" },
  { name: "Legal-BERT", parameters: 110, score: 0.830, lx: 258, ly: 68, anchor: "middle" },
  { name: "RoBERTa-large", parameters: 355, score: 0.812, lx: 370, ly: 112, anchor: "start" },
];
const OPEN_LLMS = [
  { name: "Gemma 2 27B", parameters: 27000, score: 0.565, lx: 679, ly: 262, anchor: "middle" },
  { name: "Llama 3.1 70B", parameters: 70000, score: 0.581, lx: 752, ly: 142, anchor: "middle" },
  { name: "Llama 3.1 405B", parameters: 405000, score: 0.577, lx: 886, ly: 262, anchor: "middle" },
];
const CLOSED_LLMS = [
  { name: "GPT-4o mini", score: 0.454, x: 1075, lx: 1075, ly: 218, anchor: "middle" },
  { name: "Claude 3.5 Haiku", score: 0.446, x: 1200, lx: 1200, ly: 218, anchor: "middle" },
  { name: "GPT-4.1 nano", score: 0.374, x: 1135, lx: 1135, ly: 318, anchor: "middle" },
];
const LEFT = 75;
const RIGHT = 955;
const TOP = 45;
const BOTTOM = 425;
const DECADES = 5; // 10 M to 1 T
const ZONE_LEFT = 1005;
const ZONE_RIGHT = 1265;
const xFor = (millions) => LEFT + Math.log10(millions / 10) / DECADES * (RIGHT - LEFT);
const yFor = (score) => BOTTOM - score * (BOTTOM - TOP);
const formatSize = (millions) => (millions >= 1000 ? `${millions / 1000} B` : `${millions} M`);
const formatTick = (millions) => (millions >= 1e6 ? "1 T" : formatSize(millions));

function Point({ model, x, className, suffix = "" }) {
  const y = yFor(model.score);
  const size = model.featured ? 18 : 12;
  const labelAbove = model.ly < y;
  // Leader runs from the point edge to the nearest edge of the two-line label block.
  const leaderEnd = labelAbove ? model.ly + 26 : model.ly - 18;
  const showLeader = model.anchor === "middle" && Math.abs(leaderEnd - y) > size;
  return (
    <g className={className}>
      {showLeader && (
        <line x1={x} x2={x} y1={y + (labelAbove ? -size / 2 : size / 2)} y2={leaderEnd} className="lp-plot-leader" />
      )}
      <rect x={x - size / 2} y={y - size / 2} width={size} height={size} className="lp-plot-point" />
      <text x={model.lx} y={model.ly} textAnchor={model.anchor} className="lp-plot-label">{model.name}</text>
      <text x={model.lx} y={model.ly + 20} textAnchor={model.anchor} className="lp-plot-score">{model.score.toFixed(3)}{suffix}</text>
    </g>
  );
}

export default function ModelPerformanceChart() {
  return (
    <figure className="lp-performance-figure" aria-labelledby="performance-chart-title">
      <figcaption className="lp-model-caption">
        <div>
          <span className="lp-kicker">Performance & scale</span>
          <h3 id="performance-chart-title">A small model. A strong signal.</h3>
        </div>
        <p>Macro-F1 · logarithmic parameter scale</p>
      </figcaption>
      <p className="lp-chart-swipe">Swipe horizontally to explore the full chart.</p>
      <div className="lp-performance-scroll" tabIndex={0} role="region" aria-label="Model performance comparison, horizontally scrollable on small screens">
        <svg className="lp-performance-svg" viewBox="0 0 1280 495" role="img" aria-labelledby="performance-svg-title performance-svg-description">
          <title id="performance-svg-title">Macro-F1 versus model parameter count</title>
          <desc id="performance-svg-description">
            {[...ENCODERS, ...OPEN_LLMS].map((m) => `${m.name}: ${formatSize(m.parameters)} parameters, ${m.score.toFixed(3)} macro-F1.`).join(" ")}{" "}
            Shown separately because parameter counts are undisclosed: {CLOSED_LLMS.map((m) => `${m.name} ${m.score.toFixed(3)}`).join(", ")}.
            LLM scores are from the LegalEvalHub unfair_tos leaderboard; encoder scores are historical figures. Evaluation protocols differ, so this is not a controlled head-to-head comparison.
          </desc>
          <text x="0" y="18" className="lp-plot-axis-title">MACRO-F1</text>
          <rect x={LEFT} y={TOP} width={xFor(23.5) - LEFT + 10} height={BOTTOM - TOP} className="lp-plot-local-zone" />
          <rect x={ZONE_LEFT} y={TOP} width={ZONE_RIGHT - ZONE_LEFT} height={BOTTOM - TOP} className="lp-plot-unknown-zone" />
          <text x={(ZONE_LEFT + ZONE_RIGHT) / 2} y="72" textAnchor="middle" className="lp-plot-axis-title">SIZE UNDISCLOSED</text>
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((tick) => (
            <g key={tick}>
              <line x1={LEFT} x2={RIGHT} y1={yFor(tick)} y2={yFor(tick)} className="lp-plot-grid" />
              <text x={LEFT - 15} y={yFor(tick) + 5} textAnchor="end" className="lp-plot-tick">{tick.toFixed(2)}</text>
            </g>
          ))}
          <path d={`M${LEFT} ${TOP}V${BOTTOM}H${RIGHT}`} className="lp-plot-axis" />
          {[10, 100, 1e3, 1e4, 1e5, 1e6].map((tick) => (
            <g key={tick}>
              <line x1={xFor(tick)} x2={xFor(tick)} y1={BOTTOM} y2={BOTTOM + 6} className="lp-plot-axis" />
              <text x={xFor(tick)} y={BOTTOM + 27} textAnchor="middle" className="lp-plot-tick">{formatTick(tick)}</text>
            </g>
          ))}
          <text x={(LEFT + RIGHT) / 2} y="483" textAnchor="middle" className="lp-plot-axis-title">PARAMETERS · LOG SCALE</text>
          {ENCODERS.map((model) => (
            <Point
              key={model.name}
              model={model}
              x={xFor(model.parameters)}
              className={model.featured ? "lp-plot-model is-featured" : "lp-plot-model"}
              suffix={model.featured ? " · on-device" : ""}
            />
          ))}
          {OPEN_LLMS.map((model) => (
            <Point key={model.name} model={model} x={xFor(model.parameters)} className="lp-plot-model lp-plot-llm" />
          ))}
          {CLOSED_LLMS.map((model) => (
            <Point key={model.name} model={model} x={model.x} className="lp-plot-model lp-plot-llm" />
          ))}
          <text x={(ZONE_LEFT + ZONE_RIGHT) / 2} y="452" textAnchor="middle" className="lp-plot-tick">Not positioned on the size axis</text>
        </svg>
      </div>
      <p className="lp-footnote">
        LLM scores are f1_macro from the{" "}
        <a href="https://www.legalevalhub.ai/task/unfair_tos" target="_blank" rel="noopener noreferrer">LegalEvalHub unfair_tos leaderboard</a>;
        encoder scores are historical figures from our earlier comparison. Evaluation protocols differ, so this is not a controlled
        head-to-head benchmark, and these macro-F1 scores are distinct from the LegalBench headline metrics above. Models with
        undisclosed parameter counts are shown separately. Full methodology will accompany the preprint.
      </p>
    </figure>
  );
}
