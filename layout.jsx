import './globals.css';

export const metadata = {
  title: 'Bexalink — Shorten links, get paid per view',
  description: 'Shorten your links and earn per verified view, worldwide.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
