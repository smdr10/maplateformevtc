'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ListingCard, CardSkeleton, CardListing, FUEL_LABELS } from '../components/ui'

const EMPTY_FILTERS = {
  q: '', type: '', rentDuration: '', brand: '', minPrice: '', maxPrice: '', fuel: '', city: '', vtcOnly: '', sort: 'recent',
}
type Filters = typeof EMPTY_FILTERS

const TYPES = [
  { v: '', d: '', l: 'Tout' },
  { v: 'sale', d: '', l: 'Vente' },
  { v: 'rent', d: 'week', l: 'Location semaine' },
  { v: 'rent', d: '', l: 'Toute location' },
  { v: '', d: 'loa', l: 'LOA' },
]

function pageTitle(f: Filters): string {
  if (f.rentDuration === 'loa') return 'Véhicules en LOA'
  if (f.type === 'rent' && f.rentDuration === 'week') return 'Location à la semaine'
  if (f.type === 'rent') return 'Véhicules à louer'
  if (f.type === 'sale') return 'Véhicules à vendre'
  return 'Toutes les annonces'
}

function AnnoncesList() {
  const searchParams = useSearchParams()
  const [listings, setListings] = useState<CardListing[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>(() => {
    const f = { ...EMPTY_FILTERS }
    for (const k of Object.keys(f) as (keyof Filters)[]) f[k] = searchParams.get(k) || f[k]
    return f
  })

  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    params.set('page', page.toString())
    fetch(`/api/listings?${params}`)
      .then(r => r.json())
      .then(data => {
        setListings(data.listings || [])
        setTotal(data.total || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filters, page])

  const update = (patch: Partial<Filters>) => {
    setLoading(true)
    setFilters(prev => ({ ...prev, ...patch }))
    setPage(1)
  }

  const activeType = TYPES.findIndex(t => t.v === filters.type && t.d === filters.rentDuration)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-3xl sm:text-4xl">{pageTitle(filters)}</h1>
          <p className="mt-1 text-sm font-semibold text-ink-mute">{loading ? 'Recherche…' : `${total} véhicule${total > 1 ? 's' : ''} disponible${total > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(s => !s)} className="btn btn-line lg:hidden">Filtres</button>
          <select value={filters.sort} onChange={e => update({ sort: e.target.value })} aria-label="Trier" className="field !w-auto">
            <option value="recent">Plus récents</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="mileage_asc">Kilométrage croissant</option>
          </select>
        </div>
      </div>

      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {TYPES.map((t, i) => (
          <button key={t.l} onClick={() => update({ type: t.v, rentDuration: t.d })}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold transition ${activeType === i ? 'border-brand bg-brand text-white shadow-[var(--shadow-brand)]' : 'border-rule bg-white hover:border-brand hover:text-brand'}`}>
            {t.l}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        <aside className={`${showFilters ? 'block' : 'hidden'} w-full flex-shrink-0 lg:block lg:w-60`}>
          <div className="panel sticky top-24 space-y-5 p-5">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-mute">Recherche</span>
              <input value={filters.q} onChange={e => update({ q: e.target.value })} placeholder="Model Y, Prius…" className="field mt-1.5" />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-mute">Ville</span>
              <input value={filters.city} onChange={e => update({ city: e.target.value })} placeholder="Marseille, Lyon…" className="field mt-1.5" />
            </label>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-mute">Prix (€)</span>
              <div className="mt-1.5 flex gap-2">
                <input type="number" min="0" value={filters.minPrice} onChange={e => update({ minPrice: e.target.value })} placeholder="Min" aria-label="Prix minimum" className="field" />
                <input type="number" min="0" value={filters.maxPrice} onChange={e => update({ maxPrice: e.target.value })} placeholder="Max" aria-label="Prix maximum" className="field" />
              </div>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink-mute">Énergie</span>
              <div className="mt-1.5 grid grid-cols-2 gap-1">
                {Object.entries(FUEL_LABELS).map(([v, l]) => (
                  <button key={v} onClick={() => update({ fuel: filters.fuel === v ? '' : v })}
                    className={`rounded-xl border px-2 py-2 text-sm font-semibold transition ${filters.fuel === v ? 'border-brand bg-brand-soft text-brand' : 'border-rule bg-white hover:border-ink-mute'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={filters.vtcOnly === 'true'} onChange={() => update({ vtcOnly: filters.vtcOnly === 'true' ? '' : 'true' })} className="h-4 w-4 accent-[#FF5500]" />
              Conforme VTC uniquement
            </label>
            <button onClick={() => update({ ...EMPTY_FILTERS })} className="btn btn-line w-full">Réinitialiser</button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-[28px] bg-brand-soft p-8">
              <p className="display text-2xl">Aucun véhicule pour ces critères</p>
              <p className="mt-2 text-ink-soft">Élargissez la recherche, ou publiez le premier véhicule de ce type.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => update({ ...EMPTY_FILTERS })} className="btn btn-line">Voir toutes les annonces</button>
                <Link href="/annonces/new" className="btn btn-brand">Publier une annonce</Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}

          {total > 12 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button onClick={() => { setLoading(true); setPage(p => Math.max(1, p - 1)) }} disabled={page === 1} className="btn btn-line disabled:opacity-40">← Précédent</button>
              <span className="text-sm font-bold text-ink-soft">Page {page} / {Math.ceil(total / 12)}</span>
              <button onClick={() => { setLoading(true); setPage(p => p + 1) }} disabled={page >= Math.ceil(total / 12)} className="btn btn-line disabled:opacity-40">Suivant →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Remonte la liste a chaque changement d'adresse (liens Acheter / Louer / LOA du menu)
function AnnoncesRoute() {
  const searchParams = useSearchParams()
  return <AnnoncesList key={searchParams.toString()} />
}

export default function AnnoncesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-ink-mute">Chargement…</div>}>
      <AnnoncesRoute />
    </Suspense>
  )
}
