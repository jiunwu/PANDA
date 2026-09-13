'use client';

import { usePathname } from 'next/navigation';
import Nav from '@/components/Nav';

/**
 * The internal tool lives inside a fixed-width container with the app nav.
 * The public landing page is full-bleed and brings its own navigation.
 */
const FULL_BLEED_PATHS = ['/'];

export default function AppShell({ children }) {
  const pathname = usePathname();

  if (FULL_BLEED_PATHS.includes(pathname)) {
    return children;
  }

  return (
    <div className="container">
      <Nav />
      {children}
    </div>
  );
}
