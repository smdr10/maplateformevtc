import type { Metadata } from 'next'
import { Barlow, Barlow_Condensed } from 'next/font/google'
import './globals.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-barlow',
  display: 'swap',
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-barlow-condensed',
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
    <html lang="fr" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="min-h-screen bg-paper text-ink">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
