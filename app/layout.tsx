import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import MobileTabBar from './components/MobileTabBar'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MaPlateformeVTC — Véhicules et services pour chauffeurs VTC',
  description: 'Achetez, louez à la semaine ou en LOA votre véhicule VTC, et trouvez garages, assureurs et formations entre professionnels.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <body className="min-h-screen bg-paper text-ink">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <MobileTabBar />
      </body>
    </html>
  )
}
