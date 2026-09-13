import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata = {
  title: 'PANDA – EXIST Gründungsstipendium Planner',
  description:
    'Internal agentic tool for planning & managing the EXIST Gründungsstipendium Vorhaben — Jiun & Nina',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
