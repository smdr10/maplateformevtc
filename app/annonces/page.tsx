'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

interface Listing {
  id: string
  title: string
  brand: string
  model: string
  year: number
  mileage: number
  price: number
  listingType: string
  locationCity: string
  vtcCompliant: boolean
  rentDuration: string | null
  fuelType: string
  images: { imageUrl: string }[]
}

function AnnoncesList() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    fuel: searchParams.get('fuel') || '',
    city: searchParams.get('city') || '',
    vtcOnly: searchParams.get('vtcOnly') || '',
    rentDuration: searchParams.get('rentDuration') || '',
    sort: searchParams.get('sort') || 'recent',
  })

  useEffect(() => {
    setLoading(true)
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

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const fuelLabels: Record<string, string> = { electric: 'Electrique', hybrid: 'Hybride', diesel: 'Diesel', gasoline: 'Essence' }

  const inputStyle = { backgroundColor: '#FFFFFF', borderColor: '#E8E8E8', color: '#1A1A1A' }
  const inputClass = "w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-orange-400 transition-all"

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 min-h-screen" style={{ backgroundColor: '#F8F8F8' }}>
      <div className="flex gap-6">

        {/* FILTRES */}
        <div className="hidden lg:block w-56 flex-shrink-0">
          <div className="rounded-2xl p-4 sticky top-24" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
            <h2 className="font-bold text-sm mb-4" style={{ color: '#1A1A1A' }}>Filtres</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: '#888' }}>TYPE</label>
                {[{ v: '', l: 'Tous' }, { v: 'sale', l: 'Vente' }, { v: 'rent', l: 'Location / LOA' }].map(opt => (
                  <label key={opt.v} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="radio" name="type" value={opt.v} checked={filters.type === opt.v} onChange={() => updateFilter('type', opt.v)} style={{ accentColor: '#FF5500' }} />
                    <span className="text-sm" style={{ color: '#333' }}>{opt.l}</span>
                  </label>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: '12px' }}>
                <label className="text-xs font-medium mb-2 block" style={{ color: '#888' }}>MARQUE</label>
                <input type="text" value={filters.brand} onChange={e => updateFilter('brand', e.target.value)} placeholder="Ex: Tesla, BMW..." className={inputClass} style={inputStyle} />
              </div>

              <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: '12px' }}>
                <label className="text-xs font-medium mb-2 block" style={{ color: '#888' }}>PRIX (EUR)</label>
                <div className="flex gap-2">
                  <input type="number" value={filters.minPrice} onChange={e => updateFilter('minPrice', e.target.value)} placeholder="Min" className={inputClass} style={inputStyle} />
                  <input type="number" value={filters.maxPrice} onChange={e => updateFilter('maxPrice', e.target.value)} placeholder="Max" className={inputClass} style={inputStyle} />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: '12px' }}>
                <label className="text-xs font-medium mb-2 block" style={{ color: '#888' }}>ENERGIE</label>
                {['electric', 'hybrid', 'diesel', 'gasoline'].map(f => (
                  <label key={f} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="checkbox" checked={filters.fuel === f} onChange={() => updateFilter('fuel', filters.fuel === f ? '' : f)} style={{ accentColor: '#FF5500' }} />
                    <span className="text-sm" style={{ color: '#333' }}>{fuelLabels[f]}</span>
                  </label>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: '12px' }}>
                <label className="text-xs font-medium mb-2 block" style={{ color: '#888' }}>VILLE</label>
                <input type="text" value={filters.city} onChange={e => updateFilter('city', e.target.value)} placeholder="Paris, Lyon..." className={inputClass} style={inputStyle} />
              </div>

              <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: '12px' }}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filters.vtcOnly === 'true'} onChange={() => updateFilter('vtcOnly', filters.vtcOnly === 'true' ? '' : 'true')} style={{ accentColor: '#FF5500' }} />
                  <span className="text-sm font-medium" style={{ color: '#333' }}>VTC certifie uniquement</span>
                </label>
              </div>

              <button onClick={() => setFilters({ type: '', brand: '', minPrice: '', maxPrice: '', fuel: '', city: '', vtcOnly: '', rentDuration: '', sort: 'recent' })}
                className="w-full py-2 rounded-xl text-sm transition-all hover:border-orange-300" style={{ border: '1px solid #E8E8E8', color: '#888', backgroundColor: '#F8F8F8' }}>
                Reinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* LISTE */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: '#888' }}>
              <span className="font-bold" style={{ color: '#1A1A1A' }}>{total}</span> annonce{total > 1 ? 's' : ''}
            </p>
            <select value={filters.sort} onChange={e => updateFilter('sort', e.target.value)} className="text-sm px-3 py-2 rounded-xl border focus:outline-none" style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E8E8', color: '#1A1A1A' }}>
              <option value="recent">Plus recents</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix decroissant</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden animate-pulse" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
                  <div className="h-36" style={{ backgroundColor: '#F0F0F0' }} />
                  <div className="p-3 space-y-2">
                    <div className="h-3 rounded w-3/4" style={{ backgroundColor: '#E8E8E8' }} />
                    <div className="h-3 rounded w-1/2" style={{ backgroundColor: '#E8E8E8' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
              <p className="text-gray-400 mb-2">Aucune annonce trouvee</p>
              <Link href="/annonces/new" className="text-sm font-medium" style={{ color: '#FF5500' }}>Publiez la premiere annonce</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {listings.map(listing => (
                <Link key={listing.id} href={`/annonces/${listing.id}`} className="rounded-xl overflow-hidden transition-all group hover:shadow-md" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
                  <div className="h-36 relative overflow-hidden" style={{ backgroundColor: '#F0F0F0' }}>
                    {listing.images[0] ? (
                      <img src={listing.images[0].imageUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: '#CCC' }}>
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-1">
                      {listing.vtcCompliant && <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: '#22C55E' }}>VTC</span>}
                      <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: listing.listingType === 'sale' ? '#3B82F6' : listing.rentDuration === 'loa' ? '#8B5CF6' : '#FF5500' }}>
                        {listing.listingType === 'sale' ? 'Vente' : listing.rentDuration === 'loa' ? 'LOA' : 'Location'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm truncate" style={{ color: '#1A1A1A' }}>{listing.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#888' }}>{listing.year} · {listing.mileage.toLocaleString()} km · {listing.locationCity}</p>
                    <p className="font-bold mt-2" style={{ color: '#FF5500' }}>
                      {parseFloat(listing.price.toString()).toLocaleString()} EUR
                      {listing.listingType === 'rent' && <span className="text-xs font-normal" style={{ color: '#AAA' }}> /mois</span>}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {total > 12 && (
            <div className="flex justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-4 py-2 rounded-xl text-sm disabled:opacity-50 transition-all" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8', color: '#333' }}>← Precedent</button>
              <span className="px-4 py-2 text-sm" style={{ color: '#888' }}>Page {page}</span>
              <button onClick={() => setPage(p => p+1)} disabled={listings.length < 12} className="px-4 py-2 rounded-xl text-sm disabled:opacity-50 transition-all" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8', color: '#333' }}>Suivant →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AnnoncesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F8F8', color: '#888' }}>Chargement...</div>}>
      <AnnoncesList />
    </Suspense>
  )
}
