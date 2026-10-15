'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { BatteryCharging, CalendarClock, CarFront, KeyRound, Leaf, Users } from 'lucide-react'
import { ListingCard, CardSkeleton, SectionHead, CardListing } from './components/ui'
import Hero from './components/home/Hero'
import HowItWorks from './components/home/HowItWorks'
import ServicesBento from './components/home/ServicesBento'
import PlansSection from './components/home/PlansSection'

interface Review {
  id: string
  rating: number
  comment: string
  user: { name: string }
}

const QUICK = [
  { href: '/annonces?type=rent&rentDuration=week', label: 'Location semaine', icon: CalendarClock },
  { href: '/annonces?fuel=electric', label: 'Électriques', icon: BatteryCharging },
  { href: '/annonces?fuel=hybrid', label: 'Hybrides', icon: Leaf },
  { href: '/annonces?rentDuration=loa', label: 'LOA', icon: KeyRound },
  { href: '/annonces?type=sale', label: 'À vendre', icon: CarFront },
  { href: '/annonces?q=van', label: 'Vans 7 places', icon: Users },
]

export default function HomePage() {
  const [listings, setListings] = useState<CardListing[]>([])
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/listings?sort=recent&page=1').then(r => r.json()),
      fetch('/api/platform-reviews').then(r => r.json()),
    ]).then(([listingsData, reviewsData]) => {
      setListings((listingsData.listings || []).slice(0, 8))
      setReviews((reviewsData.reviews || []).slice(0, 3))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <Hero />

      {/* Acces rapides */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
          {QUICK.map((q, i) => (
            <motion.div key={q.href} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Link href={q.href} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-rule bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:text-brand">
                <q.icon className="h-4 w-4 text-brand" /> {q.label}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Derniers vehicules */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <SectionHead eyebrow="À la une" title="Derniers véhicules publiés" href="/annonces" cta="Toutes les annonces" />
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-[28px] bg-brand-soft p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="display text-2xl">Soyez le premier à publier</p>
              <p className="mt-1 text-ink-soft">Les premières annonces profitent de toute la visibilité.</p>
            </div>
            <Link href="/annonces/new" className="btn btn-brand">Publier un véhicule</Link>
          </div>
        ) : (
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {listings.map((l, i) => (
              <motion.div key={l.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: (i % 4) * 0.07, duration: 0.5 }} className="min-w-[78%] snap-start sm:min-w-0">
                <ListingCard listing={l} />
              </motion.div>
            ))}
          </div>
        )}
        <Link href="/annonces" className="btn btn-line mt-4 w-full sm:hidden">Toutes les annonces</Link>
      </section>

      <HowItWorks />
      <ServicesBento />
      <PlansSection />

      {/* Avis (uniquement de vrais avis publies) */}
      {reviews.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16">
          <SectionHead eyebrow="Avis" title="Ils l’utilisent au quotidien" href="/avis" cta="Tous les avis" />
          <div className="grid gap-5 md:grid-cols-3">
            {reviews.map(r => (
              <figure key={r.id} className="panel p-6">
                <p className="text-lg tracking-widest text-brand" aria-label={`${r.rating} sur 5`}>
                  {'★'.repeat(r.rating)}<span className="text-rule">{'★'.repeat(5 - r.rating)}</span>
                </p>
                <blockquote className="mt-3 text-ink-soft">« {r.comment} »</blockquote>
                <figcaption className="mt-4 flex items-center gap-2 text-sm font-bold">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs text-white">{r.user.name.charAt(0)}</span>
                  {r.user.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
