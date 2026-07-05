import type { Metadata } from 'next'
import './globals.css'
import Navbar from './components/Navbar'

export const metadata: Metadata = {
  title: 'MaPlateformeVTC — La plateforme des professionnels VTC',
  description: 'Achetez, vendez ou louez votre vehicule VTC en toute confiance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="bg-gray-900 min-h-screen">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}