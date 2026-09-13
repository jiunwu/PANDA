import LandingArrow from "@/components/LandingArrow";

const SECTIONS = [
  { id: "how", label: "Technology" },
  { id: "performance", label: "Research" },
  { id: "team", label: "About" },
];

export default function LandingNav() {
  return (
    <header className="lp-nav">
      <div className="lp-nav-inner">
        <a href="#top" className="lp-wordmark" aria-label="PANDA, back to top">
          PANDA
          <span className="lp-brand-square" aria-hidden="true" />
        </a>
        <nav className="lp-nav-links" aria-label="Sections">
          {SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.label}
            </a>
          ))}
        </nav>
        <a href="#demo" className="lp-nav-cta">
          Try PANDA <LandingArrow />
        </a>
      </div>
    </header>
  );
}
