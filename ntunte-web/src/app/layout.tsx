import './globals.css';

export const metadata = {
  title: 'Ntunte Marketplace',
  description: 'Achetez, vendez et enchérissez au Burundi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  );
}