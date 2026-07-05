'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Listing {
  id: string
  title: string
  brand: string
  model: string
  year: number
  mileage: number
  price: number
  fuelType: string
  listingType: string
  locationCity: string
  vtcCompliant: boolean
  rentDuration: string | null
  images: { imageUrl: string }[]
  user: { name: string; role: string }
  _count: { favorites: number }
}

const FUELS = [
  { value: 'electric', label: 'Electrique' },
  { value: 'hybrid', label: 'Hybride' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'gasoline', label: 'Essence' },
]

function getTypeLabel(listing: Listing) {
  if (listing.listingType === 'sale') return 'Vente'
  if (listing.rentDuration === 'loa') return 'LOA'
  return 'Location'
}

function getTypeBadgeClass(listing: Listing) {
  if (listing.listingType === 'sale') return 'bg-blue-500/20 text-blue-400 border-blue-500/20'
  if (listing.rentDuration === 'loa') return 'bg-purple-500/20 text-purple-400 border-purple-500/20'
  return 'bg-orange-500/20 text-orange-400 border-orange-500/20'
}

export default function AnnoncesPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    type: '', brand: '', fuel: '', city: '',
    minPrice: '', maxPrice: '', maxMileage: '',
    vtcOnly: false, sort: 'recent',
  })

  const updateFilter = (key: string, value: string | boolean) =>
    setFilters(prev => ({ ...prev, [key]: value }))

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.type) params.set('type', filters.type)
      if (filters.brand) params.set('brand', filters.brand)
      if (filters.fuel) params.set('fuel', filters.fuel)
      if (filters.city) params.set('city', filters.city)
      if (filters.minPrice) params.set('minPrice', filters.minPrice)
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
      if (filters.vtcOnly) params.set('vtcOnly', 'true')
      params.set('sort', filters.sort)
      params.set('page', page.toString())
      const res = await fetch(`/api/listings?${params}`)
      const data = await res.json()
      setListings(data.listings || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
      setLoading(false)
    }
    load()
  }, [filters, page])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      <div className="flex gap-6">

        <aside className="w-56 flex-shrink-0">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sticky top-20 space-y-5">

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type</p>
              <div className="space-y-1.5">
                {[['', 'Tous'], ['sale', 'Vente'], ['rent', 'Location / LOA']].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="type" checked={filters.type === val} onChange={() => updateFilter('type', val)} className="text-orange-500" />
                    <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Marque</p>
              <input
                type="text"
                placeholder="Ex: Tesla, BMW..."
                value={filters.brand}
                onChange={e => updateFilter('brand', e.target.value)}
                className="w-full text-sm bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-all"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Prix (EUR)</p>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={filters.minPrice} onChange={e => updateFilter('minPrice', e.target.value)} className="w-full text-sm bg-gray-900 border border-gray-800 rounded-lg px-2 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50" />
                <input type="number" placeholder="Max" value={filters.maxPrice} onChange={e => updateFilter('maxPrice', e.target.value)} className="w-full text-sm bg-gray-900 border border-gray-800 rounded-lg px-2 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50" />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Energie</p>
              <div className="space-y-1.5">
                {FUELS.map(f => (
                  <label key={f.value} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={filters.fuel === f.value} onChange={e => updateFilter('fuel', e.target.checked ? f.value : '')} className="text-orange-500 rounded" />
                    <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{f.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ville</p>
              <input type="text" placeholder="Paris, Lyon..." value={filters.city} onChange={e => updateFilter('city', e.target.value)} className="w-full text-sm bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-all" />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={filters.vtcOnly} onChange={e => updateFilter('vtcOnly', e.target.checked)} className="text-orange-500 rounded" />
                <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">VTC uniquement</span>
              </label>
            </div>

            <button onClick={() => setFilters({ type: '', brand: '', fuel: '', city: '', minPrice: '', maxPrice: '', maxMileage: '', vtcOnly: false, sort: 'recent' })} className="w-full text-xs text-red-400 hover:text-red-300 py-1 transition-colors">
              Reinitialiser les filtres
            </button>
          </div>
        </aside>

        <main className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-gray-500"><span className="font-semibold text-white">{total}</span> annonces</p>
            <select value={filters.sort} onChange={e => updateFilter('sort', e.target.value)} className="text-sm bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-orange-500/50 transition-all">
              <option value="recent" className="bg-gray-900">Plus recents</option>
              <option value="price_asc" className="bg-gray-900">Prix croissant</option>
              <option value="price_desc" className="bg-gray-900">Prix decroissant</option>
              <option value="mileage_asc" className="bg-gray-900">Km croissant</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-900 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-40 bg-gray-900" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-900 rounded w-3/4" />
                    <div className="h-3 bg-gray-900 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800">
              <p className="text-gray-500 text-lg mb-2">Aucune annonce trouvee</p>
              <p className="text-gray-600 text-sm">Modifiez vos filtres ou revenez plus tard</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map(listing => (
                <Link key={listing.id} href={`/annonces/${listing.id}`} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5 transition-all group">
                  <div className="h-40 bg-gray-900 relative overflow-hidden">
                    {listing.images[0] ? (
                      <img src={listing.images[0].imageUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l9 1z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-1">
                      {listing.vtcCompliant && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/20 font-medium backdrop-blur-sm">VTC</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium backdrop-blur-sm border ${getTypeBadgeClass(listing)}`}>
                        {getTypeLabel(listing)}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-white text-sm truncate group-hover:text-orange-400 transition-colors">{listing.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{listing.year} · {listing.mileage.toLocaleString()} km · {listing.locationCity}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-bold text-orange-400">
                        {parseFloat(listing.price.toString()).toLocaleString()} EUR
                        {listing.listingType === 'rent' && <span className="text-xs font-normal text-gray-500"> /mois</span>}
                      </p>
                      <span className="text-xs text-gray-600">{listing._count.favorites} ♥</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm bg-gray-900 border border-gray-800 text-gray-400 rounded-lg disabled:opacity-40 hover:bg-gray-800 transition-all">
                Precedent
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1.5 text-sm rounded-lg transition-all ${page === i + 1 ? 'bg-orange-500 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:bg-gray-800'}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm bg-gray-900 border border-gray-800 text-gray-400 rounded-lg disabled:opacity-40 hover:bg-gray-800 transition-all">
                Suivant
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}