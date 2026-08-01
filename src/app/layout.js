import './globals.css';

export const metadata = {
  title: 'PANDA – EXIST Gründungsstipendium Planner',
  description: 'Internal planning & management tool for EXIST Gründungsstipendium Vorhaben – Jiun & Nina',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>
        <div className="bg-mesh" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
