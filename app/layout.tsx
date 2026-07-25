import type { Metadata } from 'next'
import './globals.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

export const metadata: Metadata = {
  title: 'MaPlateformeVTC — La communaute des professionnels VTC',
  description: 'Achetez, vendez ou louez votre vehicule VTC en toute confiance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body style={{ backgroundColor: '#F8F8F8', minHeight: '100vh' }}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}