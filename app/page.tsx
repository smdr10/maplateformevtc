'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ListingCard, CardSkeleton, SectionHead, CardListing } from './components/ui'

interface User {
  id: string
  name: string
  role: string
}

interface Review {
  id: string
  rating: number
  comment: string
  user: { name: string }
}

type SearchMode = 'sale' | 'week' | 'loa'

const MODES: { v: SearchMode; l: string }[] = [
  { v: 'sale', l: 'Acheter' },
  { v: 'week', l: 'Louer à la semaine' },
  { v: 'loa', l: 'LOA' },
]

const DIRECTIONS = [
  { href: '/annonces?type=sale', label: 'Acheter un véhicule', hint: 'Berlines, hybrides, électriques' },
  { href: '/annonces?type=rent&rentDuration=week', label: 'Louer à la semaine', hint: 'Prêt à rouler, assurance précisée' },
  { href: '/annonces?rentDuration=loa', label: 'Reprendre une LOA', hint: 'Contrats en cours ou neufs' },
  { href: '/services', label: 'Garages & services', hint: 'Entretien, assurance, formation' },
]

const STEPS = [
  { n: '01', title: 'Publiez', text: 'Votre véhicule en quelques minutes, avec photos, prix et conditions de location.' },
  { n: '02', title: 'On vérifie', text: 'Chaque annonce est relue par notre équipe avant d’être mise en ligne.' },
  { n: '03', title: 'Échangez', text: 'Les chauffeurs vous contactent directement. Aucune commission sur la vente ou la location.' },
]

const SERVICE_CATEGORIES = [
  { href: '/services?category=maintenance', label: 'Entretien', hint: 'Garages spécialisés VTC' },
  { href: '/services?category=insurance', label: 'Assurance', hint: 'Assureurs et courtiers' },
  { href: '/services?category=formation', label: 'Formation', hint: 'Carte professionnelle VTC' },
  { href: '/services?category=accessories', label: 'Équipement', hint: 'Terminaux, supports, caméras' },
]

export default function HomePage() {
  const [listings, setListings] = useState<CardListing[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [mode, setMode] = useState<SearchMode>('sale')
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/listings?sort=recent&page=1').then(r => r.json()),
      fetch('/api/auth/me', { credentials: 'include' }).then(r => (r.ok ? r.json() : null)),
      fetch('/api/platform-reviews').then(r => r.json()),
    ]).then(([listingsData, meData, reviewsData]) => {
      setListings((listingsData.listings || []).slice(0, 8))
      if (meData?.user) setUser(meData.user)
      setReviews((reviewsData.reviews || []).slice(0, 3))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (mode === 'sale') params.set('type', 'sale')
    if (mode === 'week') { params.set('type', 'rent'); params.set('rentDuration', 'week') }
    if (mode === 'loa') params.set('rentDuration', 'loa')
    if (query.trim()) params.set('q', query.trim())
    if (city.trim()) params.set('city', city.trim())
    window.location.href = `/annonces?${params}`
  }

  return (
    <div>
      {/* HERO */}
      <section className="border-b-[1.5px] border-ink">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-[1.25fr_1fr] lg:py-16">
          <div>
            <p className="eyebrow">{user ? `Bonjour ${user.name.split(' ')[0]}` : 'Le marché des chauffeurs VTC'}</p>
            <h1 className="display mt-3 text-5xl sm:text-6xl lg:text-7xl">
              Votre outil de travail.<br />
              <span className="bg-signal px-1 box-decoration-clone">Vendu ou loué</span> entre pros.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-soft">
              Véhicules VTC à vendre, à louer à la semaine ou en LOA, et les garages, assureurs et formateurs qui vont avec.
            </p>

            <form onSubmit={handleSearch} className="panel mt-8 p-3">
              <div className="mb-3 flex flex-wrap gap-1" role="tablist" aria-label="Type de recherche">
                {MODES.map(m => (
                  <button key={m.v} type="button" role="tab" aria-selected={mode === m.v} onClick={() => setMode(m.v)}
                    className={`rounded-[2px] px-3 py-1.5 font-display text-sm font-semibold uppercase tracking-wider ${mode === m.v ? 'bg-ink text-paper' : 'hover:bg-paper'}`}>
                    {m.l}
                  </button>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-[1.4fr_1fr_auto]">
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Marque ou modèle : Tesla Model Y…" aria-label="Marque ou modèle" className="field" />
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ville : Marseille…" aria-label="Ville" className="field" />
                <button type="submit" className="btn btn-signal">Rechercher</button>
              </div>
            </form>
          </div>

          {/* Panneau directionnel */}
          <nav aria-label="Accès rapides" className="flex flex-col gap-2 self-center">
            {DIRECTIONS.map(d => (
              <Link key={d.href} href={d.href}
                className="group flex items-center justify-between gap-4 rounded-[4px] border-[1.5px] border-ink bg-ink px-5 py-4 text-paper transition-colors hover:bg-plate">
                <span>
                  <span className="display block text-2xl">{d.label}</span>
                  <span className="text-sm text-paper/70">{d.hint}</span>
                </span>
                <span aria-hidden="true" className="font-display text-3xl transition-transform group-hover:translate-x-1">→</span>
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {/* ANNONCES RECENTES */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionHead title="Derniers véhicules" href="/annonces" cta="Toutes les annonces" />
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="panel-soft flex flex-col items-start gap-3 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="display text-2xl">Soyez le premier à publier</p>
              <p className="mt-1 text-ink-soft">Les premières annonces bénéficient de la meilleure visibilité.</p>
            </div>
            <Link href="/annonces/new" className="btn btn-ink">Publier un véhicule</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>

      {/* COMMENT CA MARCHE */}
      <section className="border-y-[1.5px] border-ink bg-card">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <SectionHead title="Comment ça marche" />
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map(s => (
              <li key={s.n} className="overflow-hidden rounded-[4px] border-[1.5px] border-ink">
                <div className="bg-signal px-4 py-2 font-display text-2xl font-bold">{s.n}</div>
                <div className="p-4">
                  <p className="display text-2xl">{s.title}</p>
                  <p className="mt-2 text-ink-soft">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionHead title="Garages & services" href="/services" cta="L'annuaire" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {SERVICE_CATEGORIES.map(c => (
            <Link key={c.href} href={c.href} className="panel p-4 transition-colors hover:bg-signal-soft">
              <p className="display text-2xl">{c.label}</p>
              <p className="mt-1 text-sm text-ink-soft">{c.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* PROFESSIONNELS */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <div className="grid overflow-hidden rounded-[4px] border-[1.5px] border-ink md:grid-cols-[1.2fr_1fr]">
          <div className="bg-ink p-8 text-paper">
            <p className="eyebrow !text-signal">Loueurs, flottes, garages, assureurs</p>
            <p className="display mt-3 text-4xl">Vous êtes professionnel ?</p>
            <p className="mt-3 max-w-md text-paper/75">
              Créez un compte pro gratuit, faites certifier votre société et publiez vos véhicules ou vos services auprès des chauffeurs.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/register" className="btn btn-signal">Créer un compte pro</Link>
              <Link href="/abonnement" className="btn border-paper text-paper hover:bg-paper hover:text-ink">Voir les packs</Link>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x-[1.5px] divide-ink bg-card">
            {[
              { name: 'Standard', price: '0 €', detail: '3 annonces' },
              { name: 'Pro', price: '4,99 €', detail: '20 annonces' },
              { name: 'Flotte', price: '12,99 €', detail: '50 véhicules + statistiques' },
            ].map(p => (
              <div key={p.name} className="flex flex-col justify-center p-4">
                <p className="font-display text-sm font-semibold uppercase tracking-wider text-plate">{p.name}</p>
                <p className="display mt-1 text-3xl">{p.price}</p>
                <p className="text-xs text-ink-mute">{p.price === '0 €' ? 'gratuit' : 'par mois TTC'}</p>
                <p className="mt-2 text-sm text-ink-soft">{p.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AVIS (uniquement de vrais avis publies) */}
      {reviews.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-4">
          <SectionHead title="Ils l'utilisent" href="/avis" cta="Tous les avis" />
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.map(r => (
              <figure key={r.id} className="panel-soft p-5">
                <p className="font-display text-lg tracking-widest text-signal" aria-label={`${r.rating} sur 5`}>
                  {'★'.repeat(r.rating)}<span className="text-rule">{'★'.repeat(5 - r.rating)}</span>
                </p>
                <blockquote className="mt-2 text-ink-soft">« {r.comment} »</blockquote>
                <figcaption className="mt-3 text-sm font-medium">{r.user.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
