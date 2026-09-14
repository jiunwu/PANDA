// Historical figures restored from the earlier landing-page comparison.
// These are not the LegalBench headline metrics and not a shared-protocol rerun.
const MODELS = [
  { name: "LegalSAN", parameters: 23.5, score: 0.787, featured: true, labelY: 184 },
  { name: "DistilBERT", parameters: 66, score: 0.793, labelY: 222 },
  { name: "Legal-BERT", parameters: 110, score: 0.830, labelY: 82 },
  { name: "RoBERTa-large", parameters: 355, score: 0.812, labelY: 105 },
];
const LEFT = 75;
const RIGHT = 755;
const TOP = 45;
const BOTTOM = 425;
const xFor = (millions) => LEFT + Math.log10(millions / 10) / 2 * (RIGHT - LEFT);
const yFor = (score) => BOTTOM - score * (BOTTOM - TOP);

export default function ModelPerformanceChart() {
  return (
    <figure className="lp-performance-figure" aria-labelledby="performance-chart-title">
      <figcaption className="lp-model-caption">
        <div>
          <span className="lp-kicker">Performance & scale</span>
          <h3 id="performance-chart-title">A small model. A strong signal.</h3>
        </div>
        <p>Reported macro-F1 · logarithmic parameter scale</p>
      </figcaption>
      <p className="lp-chart-swipe">Swipe horizontally to explore the full chart.</p>
      <div className="lp-performance-scroll" tabIndex={0} role="region" aria-label="Model performance comparison, horizontally scrollable on small screens">
        <svg className="lp-performance-svg" viewBox="0 0 1080 495" role="img" aria-labelledby="performance-svg-title performance-svg-description">
          <title id="performance-svg-title">Reported macro-F1 versus model parameter count</title>
          <desc id="performance-svg-description">LegalSAN: 23.5 million parameters, 0.787 macro-F1. DistilBERT: 66 million, 0.793. Legal-BERT: 110 million, 0.830. RoBERTa-large: 355 million, 0.812. GPT-3.5 Turbo zero-shot: 0.222, shown separately because its parameter count is undisclosed. These historical figures use different evaluation protocols, not a controlled head-to-head comparison.</desc>
          <text x="0" y="18" className="lp-plot-axis-title">MACRO-F1</text>
          <rect x={LEFT} y={TOP} width={xFor(23.5) - LEFT + 10} height={BOTTOM - TOP} className="lp-plot-local-zone" />
          <rect x="805" y={TOP} width="260" height={BOTTOM - TOP} className="lp-plot-unknown-zone" />
          <text x="935" y="72" textAnchor="middle" className="lp-plot-axis-title">SIZE UNDISCLOSED</text>
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((tick) => (
            <g key={tick}>
              <line x1={LEFT} x2={RIGHT} y1={yFor(tick)} y2={yFor(tick)} className="lp-plot-grid" />
              <text x={LEFT - 15} y={yFor(tick) + 5} textAnchor="end" className="lp-plot-tick">{tick.toFixed(2)}</text>
            </g>
          ))}
          <path d={`M${LEFT} ${TOP}V${BOTTOM}H${RIGHT}`} className="lp-plot-axis" />
          {[10, 100, 1000].map((tick) => (
            <g key={tick}>
              <line x1={xFor(tick)} x2={xFor(tick)} y1={BOTTOM} y2={BOTTOM + 6} className="lp-plot-axis" />
              <text x={xFor(tick)} y={BOTTOM + 27} textAnchor="middle" className="lp-plot-tick">{tick === 1000 ? "1 B" : `${tick} M`}</text>
            </g>
          ))}
          <text x={(LEFT + RIGHT) / 2} y="483" textAnchor="middle" className="lp-plot-axis-title">PARAMETERS · LOG SCALE</text>
          {MODELS.map((model) => {
            const x = xFor(model.parameters);
            const y = yFor(model.score);
            const size = model.featured ? 18 : 12;
            const below = model.labelY > y;
            return (
              <g key={model.name} className={model.featured ? "lp-plot-model is-featured" : "lp-plot-model"}>
                <line x1={x} x2={x} y1={y + (below ? size / 2 : -size / 2)} y2={model.labelY + (below ? -18 : 8)} className="lp-plot-leader" />
                <rect x={x - size / 2} y={y - size / 2} width={size} height={size} className="lp-plot-point" />
                <text x={x} y={model.labelY} textAnchor="middle" className="lp-plot-label">{model.name} · {model.parameters} M</text>
                <text x={x} y={model.labelY + (below ? 20 : -20)} textAnchor="middle" className="lp-plot-score">{model.score.toFixed(3)}{model.featured ? " · on-device" : ""}</text>
              </g>
            );
          })}
          <g className="lp-plot-gpt">
            <line x1="805" x2="1065" y1={yFor(0.222)} y2={yFor(0.222)} className="lp-plot-grid" />
            <text x="935" y={yFor(0.222) - 54} textAnchor="middle" className="lp-plot-label">GPT-3.5 Turbo</text>
            <text x="935" y={yFor(0.222) - 32} textAnchor="middle" className="lp-plot-score">Zero-shot · 0.222</text>
            <rect x="927" y={yFor(0.222) - 8} width="16" height="16" className="lp-plot-point" />
            <text x="935" y="452" textAnchor="middle" className="lp-plot-tick">Not positioned on the size axis</text>
          </g>
        </svg>
      </div>
      <p className="lp-footnote">Historical figures from the earlier comparison; evaluation protocols differ, so this is not a controlled head-to-head benchmark. These macro-F1 scores are distinct from the LegalBench headline metrics above. GPT-3.5 Turbo is shown separately because its parameter count is not disclosed. The preprint documents LegalSAN’s 0.787 eight-label macro-F1 on UNFAIR-ToS; it does not validate the other historical comparison scores.</p>
    </figure>
  );
}
