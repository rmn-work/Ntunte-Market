import './globals.css'

export const metadata = {
  title: 'Ntunte Market',
  description: 'Plateforme E-Commerce',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}