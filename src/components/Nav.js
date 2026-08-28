'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

const primaryLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/sprints', label: 'Sprints' },
  { href: '/topics', label: 'Topics' },
  { href: '/calendar', label: 'Calendar' },
];

const moreLinks = [
  { href: '/milestones', label: 'Milestones' },
  { href: '/work-packages', label: 'Work Packages' },
  { href: '/finance', label: 'Finance' },
  { href: '/data-room', label: 'Data Room' },
  { href: '/notes', label: 'Notes' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/activity', label: 'Activity' },
  { href: '/debug', label: 'Debug' },
];

const allLinks = [...primaryLinks, ...moreLinks];

// Pages where nav should NOT show (public + login)
const hiddenPaths = ['/', '/login', '/setup'];

export default function Nav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const moreRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  if (hiddenPaths.includes(pathname)) {
    return (
      <nav className="nav" id="main-nav">
        <div className="nav-left">
          <Link href="/" className="nav-title">PANDA</Link>
        </div>
        <div className="nav-right">
          <Link href="/login" className="nav-link">Team Login</Link>
        </div>
      </nav>
    );
  }

  const isMoreActive = moreLinks.some(l => pathname === l.href);

  const today = new Date().toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <nav className="nav" id="main-nav">
      <div className="nav-left">
        <Link href="/dashboard" className="nav-title">PANDA</Link>
        <span className="nav-sep">/</span>

        {/* Desktop: primary links + More dropdown */}
        <div className="nav-links nav-desktop-links">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${pathname === link.href ? 'nav-link-active' : ''}`}
            >
              {link.label}
            </Link>
          ))}

          {/* More dropdown */}
          <div className="nav-dropdown-wrapper" ref={moreRef}>
            <button
              className={`nav-link nav-more-btn ${isMoreActive ? 'nav-link-active' : ''}`}
              onClick={() => setMoreOpen(prev => !prev)}
              aria-expanded={moreOpen}
              aria-haspopup="true"
            >
              More
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: '4px', transform: moreOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 200ms ease' }}>
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {moreOpen && (
              <div className="nav-dropdown">
                {moreLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`nav-dropdown-item ${pathname === link.href ? 'nav-dropdown-item-active' : ''}`}
                    onClick={() => setMoreOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="nav-right">
        <div className="nav-team nav-desktop-only">
          <span className="team-tag">Jiun</span>
          <span className="team-tag">Nina</span>
        </div>
        <span className="nav-desktop-only">{today}</span>

        {/* Mobile hamburger */}
        <button
          className="nav-hamburger"
          onClick={() => setMobileOpen(prev => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          <span className={`hamburger-line ${mobileOpen ? 'hamburger-open' : ''}`}></span>
          <span className={`hamburger-line ${mobileOpen ? 'hamburger-open' : ''}`}></span>
          <span className={`hamburger-line ${mobileOpen ? 'hamburger-open' : ''}`}></span>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="nav-mobile-overlay" onClick={() => setMobileOpen(false)}>
          <div className="nav-mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="nav-mobile-header">
              <span className="nav-title">PANDA</span>
              <button className="nav-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                ×
              </button>
            </div>
            <div className="nav-mobile-links">
              {allLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-mobile-link ${pathname === link.href ? 'nav-mobile-link-active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="nav-mobile-footer">
              <div className="nav-team">
                <span className="team-tag">Jiun</span>
                <span className="team-tag">Nina</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{today}</span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
