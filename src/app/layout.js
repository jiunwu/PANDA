import './globals.css';
import Nav from '@/components/Nav';

export const metadata = {
  title: 'PANDA – EXIST Gründungsstipendium Planner',
  description:
    'Internal agentic tool for planning & managing the EXIST Gründungsstipendium Vorhaben — Jiun & Nina',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <div className="container">
          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}
