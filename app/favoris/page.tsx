'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Favorite {
  id: string
  createdAt: string
  listing: {
    id: string
    title: string
    brand: string
    model: string
    year: number
    mileage: number
    price: number
    listingType: string
    rentDuration: string | null
    locationCity: string
    status: string
    vtcCompliant: boolean
    images: { imageUrl: string }[]
    user: { id: string; name: string }
  }
}

export default function FavorisPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' })
      if (!meRes.ok) { router.push('/login?redirect=/favoris'); return }
      const res = await fetch('/api/favorites', { credentials: 'include' })
      const data = await res.json()
      setFavorites(data.favorites || [])
      setLoading(false)
    }
    load()
  }, [router])

  const removeFavorite = async (listingId: string) => {
    await fetch(`/api/favorites/${listingId}`, { method: 'POST', credentials: 'include' })
    setFavorites(prev => prev.filter(f => f.listing.id !== listingId))
  }

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-500">Chargement...</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Mes favoris</h1>
          <p className="text-sm text-gray-500 mt-1">{favorites.length} annonce(s) sauvegardee(s)</p>
        </div>
        <Link href="/annonces" className="text-sm text-orange-500 hover:text-orange-400 font-medium transition-colors">
          Voir les annonces →
        </Link>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-2xl">
          <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="text-gray-400 font-medium">Aucun favori pour le moment</p>
          <p className="text-sm text-gray-600 mt-1">Ajoutez des annonces en favori pour les retrouver ici</p>
          <Link href="/annonces" className="inline-block mt-4 bg-orange-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-orange-600 transition-all hover:scale-105">
            Parcourir les annonces
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map(fav => (
            <div key={fav.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all group relative">
              <button
                onClick={() => removeFavorite(fav.listing.id)}
                className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-gray-900 backdrop-blur-sm flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-black/70 transition-all"
              >
                ♥
              </button>
              <Link href={`/annonces/${fav.listing.id}`}>
                <div className="h-40 bg-gray-900 relative overflow-hidden">
                  {fav.listing.images[0] ? (
                    <img src={fav.listing.images[0].imageUrl} alt={fav.listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {fav.listing.vtcCompliant && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/20 font-medium backdrop-blur-sm">VTC</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium backdrop-blur-sm border ${fav.listing.listingType === 'sale' ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' : fav.listing.rentDuration === 'loa' ? 'bg-purple-500/20 text-purple-400 border-purple-500/20' : 'bg-orange-500/20 text-orange-400 border-orange-500/20'}`}>
                      {fav.listing.listingType === 'sale' ? 'Vente' : fav.listing.rentDuration === 'loa' ? 'LOA' : 'Location'}
                    </span>
                    {fav.listing.status !== 'active' && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/20 font-medium backdrop-blur-sm">Indisponible</span>}
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-white text-sm truncate group-hover:text-orange-400 transition-colors">{fav.listing.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{fav.listing.year} · {fav.listing.mileage.toLocaleString()} km · {fav.listing.locationCity}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="font-bold text-orange-400">
                      {parseFloat(fav.listing.price.toString()).toLocaleString()} EUR
                      {fav.listing.listingType === 'rent' && <span className="text-xs font-normal text-gray-500"> /mois</span>}
                    </p>
                    <p className="text-xs text-gray-600">par {fav.listing.user.name}</p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}