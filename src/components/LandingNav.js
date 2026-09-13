'use client';

import { useEffect, useState } from 'react';

const SECTIONS = [
  { id: 'demo', label: 'Live demo' },
  { id: 'performance', label: 'Performance' },
  { id: 'how', label: 'How it works' },
  { id: 'categories', label: 'What it finds' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'team', label: 'Team' },
];

export default function LandingNav() {
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`lp-nav ${lifted ? 'is-lifted' : ''}`}>
      <div className="lp-nav-inner">
        <a href="#top" className="lp-wordmark" aria-label="PANDA, back to top">
          PANDA
        </a>
        <nav className="lp-nav-links" aria-label="Sections">
          {SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.label}
            </a>
          ))}
        </nav>
        <a href="#demo" className="lp-nav-cta">
          Try it
        </a>
      </div>
    </header>
  );
}
