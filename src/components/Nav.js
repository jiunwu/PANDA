'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/sprints', label: 'Sprints' },
  { href: '/milestones', label: 'Milestones' },
  { href: '/work-packages', label: 'Work Packages' },
  { href: '/notes', label: 'Notes' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/activity', label: 'Activity' },
  { href: '/debug', label: 'Debug' },
];

// Pages where nav should NOT show (public + login)
const hiddenPaths = ['/', '/login', '/setup'];

export default function Nav() {
  const pathname = usePathname();

  if (hiddenPaths.includes(pathname)) {
    // Minimal public nav
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
        <div className="nav-links">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${pathname === link.href ? 'nav-link-active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="nav-right">
        <div className="nav-team">
          <span className="team-tag">Jiun</span>
          <span className="team-tag">Nina</span>
        </div>
        <span>{today}</span>
      </div>
    </nav>
  );
}
