'use client'

import { useEffect, useState } from 'react'

interface Vehicle {
  id: string
  title: string
  status: string
  city: string
  price: number
  listingType: string
  rentDuration: string | null
  availableFrom: string | null
  views: number
  contacts: number
  favorites: number
  contactRate: number | null
  marketMedian: number | null
  marketCount: number
}
interface Demand {
  city: string
  searches: number
  weekRentals: number
  electric: number
  supply: number
  searchesPerListing: number | null
  topQueries: { query: string; count: number }[]
}
interface Stats {
  periodDays: number
  vehicles: Vehicle[]
  trend: { day: string; views: number; contacts: number }[]
  demand: Demand[]
}

const euros = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'

function priceGap(v: Vehicle): { label: string; tone: string } | null {
  if (v.marketMedian == null || v.marketCount < 2) return null
  const gap = Math.round(((v.price - v.marketMedian) / v.marketMedian) * 100)
  if (Math.abs(gap) <= 5) return { label: 'Dans le marché', tone: 'text-go' }
  return gap > 0 ? { label: `+${gap} % vs marché`, tone: 'text-stop' } : { label: `${gap} % vs marché`, tone: 'text-plate' }
}

// Statistiques avancees du pack Flotte
export default function FleetStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  const [city, setCity] = useState('')

  const fetchStats = (c?: string) =>
    fetch(`/api/stats/fleet${c ? `?city=${encodeURIComponent(c)}` : ''}`, { credentials: 'include' })
      .then(async r => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.message || 'Statistiques indisponibles')
        return json as Stats
      })

  useEffect(() => {
    fetchStats().then(setStats).catch(e => setError(e.message))
  }, [])

  if (error) return <div className="panel-soft p-5 text-sm text-stop">{error}</div>
  if (!stats) return <div className="panel-soft p-5 text-sm text-ink-mute">Chargement des statistiques…</div>

  const max = Math.max(1, ...stats.trend.map(t => t.views))
  const totals = stats.vehicles.reduce((a, v) => ({ views: a.views + v.views, contacts: a.contacts + v.contacts }), { views: 0, contacts: 0 })

  return (
    <div className="space-y-6">
      {/* Tendance */}
      <section className="panel p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="display text-2xl">Activité sur {stats.periodDays} jours</h2>
          <p className="text-sm text-ink-soft">
            <strong className="text-ink">{totals.views}</strong> vues · <strong className="text-ink">{totals.contacts}</strong> contacts
          </p>
        </div>
        <div className="mt-4 flex h-28 items-end gap-[3px]" role="img" aria-label={`Vues par jour sur ${stats.periodDays} jours`}>
          {stats.trend.map(t => (
            <div key={t.day} className="group relative flex-1">
              <div className="w-full rounded-t-md bg-brand" style={{ height: `${Math.max(2, (t.views / max) * 100)}%` }} />
              {t.contacts > 0 && <div className="absolute inset-x-0 bottom-0 h-1 bg-ink" />}
              <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-1.5 py-0.5 text-[11px] text-white group-hover:block">
                {new Date(t.day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · {t.views} vues · {t.contacts} contacts
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-mute">Barres : vues par jour. Trait jaune : jour avec au moins un contact.</p>
      </section>

      {/* Par vehicule */}
      <section className="panel overflow-hidden">
        <h2 className="px-5 pb-1 pt-5 text-xl font-extrabold tracking-tight">Performance par véhicule</h2>
        {stats.vehicles.length === 0 ? (
          <p className="p-5 text-sm text-ink-mute">Publiez vos véhicules pour suivre leurs performances.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-rule text-left font-display text-xs text-ink-mute">
                  <th className="px-5 py-2 font-semibold">Véhicule</th>
                  <th className="px-3 py-2 text-right font-semibold">Vues</th>
                  <th className="px-3 py-2 text-right font-semibold">Contacts</th>
                  <th className="px-3 py-2 text-right font-semibold">Taux</th>
                  <th className="px-3 py-2 text-right font-semibold">Favoris</th>
                  <th className="px-5 py-2 text-right font-semibold">Prix / marché</th>
                </tr>
              </thead>
              <tbody>
                {stats.vehicles.map(v => {
                  const gap = priceGap(v)
                  const rented = v.availableFrom && new Date(v.availableFrom) > new Date()
                  return (
                    <tr key={v.id} className="border-b border-rule last:border-0">
                      <td className="px-5 py-3">
                        <p className="font-medium">{v.title}</p>
                        <p className="text-xs text-ink-mute">{v.city}{rented ? ` · loué jusqu’au ${new Date(v.availableFrom!).toLocaleDateString('fr-FR')}` : ''}</p>
                      </td>
                      <td className="px-3 py-3 text-right text-base font-bold">{v.views}</td>
                      <td className="px-3 py-3 text-right text-base font-bold">{v.contacts}</td>
                      <td className="px-3 py-3 text-right">{v.contactRate != null ? `${v.contactRate} %` : '—'}</td>
                      <td className="px-3 py-3 text-right">{v.favorites}</td>
                      <td className="px-5 py-3 text-right">
                        <p>{euros(v.price)}</p>
                        {gap ? <p className={`text-xs font-semibold ${gap.tone}`}>{gap.label}</p>
                          : <p className="text-xs text-ink-mute">Pas assez d’annonces comparables</p>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Barometre */}
      <section className="panel p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="display text-2xl">Baromètre de la demande</h2>
            <p className="text-sm text-ink-soft">Recherches des chauffeurs sur {stats.periodDays} jours, comparées aux annonces en ligne.</p>
          </div>
          <form onSubmit={e => { e.preventDefault(); fetchStats(city).then(setStats).catch(err => setError(err.message)) }} className="flex gap-2">
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="Autre ville…" aria-label="Ville à analyser" className="field !w-40" />
            <button type="submit" className="btn btn-ink !py-2">Voir</button>
          </form>
        </div>
        {stats.demand.length === 0 ? (
          <p className="mt-4 text-sm text-ink-mute">Indiquez une ville pour voir la demande.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {stats.demand.map(d => (
              <div key={d.city} className="rounded-xl border border-rule p-4">
                <p className="display text-2xl capitalize">{d.city}</p>
                <dl className="mt-3 grid grid-cols-3 gap-2">
                  <div><dt className="text-xs text-ink-mute">Recherches</dt><dd className="text-2xl font-extrabold">{d.searches}</dd></div>
                  <div><dt className="text-xs text-ink-mute">Location semaine</dt><dd className="text-2xl font-extrabold">{d.weekRentals}</dd></div>
                  <div><dt className="text-xs text-ink-mute">Annonces en ligne</dt><dd className="text-2xl font-extrabold">{d.supply}</dd></div>
                </dl>
                <p className="mt-2 text-sm text-ink-soft">
                  {d.searchesPerListing != null ? `${d.searchesPerListing} recherche(s) par annonce en ligne` : 'Aucune annonce en ligne : la demande n’est pas servie'}
                  {d.electric > 0 ? ` · ${d.electric} recherche(s) de véhicule électrique` : ''}
                </p>
                {d.topQueries.length > 0 && (
                  <p className="mt-1 text-xs text-ink-mute">Recherché : {d.topQueries.map(q => `${q.query} (${q.count})`).join(', ')}</p>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-ink-mute">Données anonymes, collectées depuis la mise en place du baromètre : elles s’enrichissent avec le temps.</p>
      </section>
    </div>
  )
}
