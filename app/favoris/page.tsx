'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Listing {
  id: string
  title: string
  brand: string
  model: string
  year: number
  price: number
  listingType: string
  rentDuration: string | null
  locationCity: string
  images?: { imageUrl: string }[]
}

export default function FavorisPage() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.user) { router.push('/login?redirect=/favoris'); return }
        return fetch('/api/favorites', { credentials: 'include' })
      })
      .then(r => r?.json())
      .then(data => { setFavorites(data?.favorites || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [router])

  const removeFavorite = async (id: string) => {
    await fetch(`/api/favorites/${id}`, { method: 'POST', credentials: 'include' })
    setFavorites(prev => prev.filter(f => f.id !== id))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3F1EA' }}>
      <div style={{ color: '#6B7789' }}>Chargement...</div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 min-h-screen" style={{ backgroundColor: '#F3F1EA' }}>
      <h1 className="text-xl font-bold mb-5" style={{ color: '#0B1F3A' }}>Mes favoris</h1>

      {favorites.length === 0 ? (
        <div className="text-center py-16 rounded-[4px]" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D5C9' }}>
          <p className="text-gray-400 mb-2">Aucun favori pour le moment</p>
          <Link href="/annonces" className="text-sm font-medium" style={{ color: '#0B1F3A' }}>Parcourir les annonces</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {favorites.map(listing => (
            <div key={listing.id} className="rounded-[3px] overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D5C9' }}>
              <Link href={`/annonces/${listing.id}`}>
                <div className="h-36 relative overflow-hidden" style={{ backgroundColor: '#E6E2D6' }}>
                  {listing.images?.[0] ? (
                    <img src={listing.images?.[0].imageUrl} alt={listing.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: '#B8B2A3' }}>
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                  )}
                  <span className="absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: listing.listingType === 'sale' ? '#1D4ED8' : listing.rentDuration === 'loa' ? '#8B5CF6' : '#0B1F3A' }}>
                    {listing.listingType === 'sale' ? 'Vente' : listing.rentDuration === 'loa' ? 'LOA' : 'Location'}
                  </span>
                </div>
              </Link>
              <div className="p-3">
                <p className="font-semibold text-sm truncate" style={{ color: '#0B1F3A' }}>{listing.title}</p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7789' }}>{listing.year} · {listing.locationCity}</p>
                <div className="flex items-center justify-between mt-2">
                 <p className="font-bold text-sm" style={{ color: '#0B1F3A' }}>{listing.price ? parseFloat(listing.price.toString()).toLocaleString() : 0} EUR</p>
                  <button onClick={() => removeFavorite(listing.id)} className="text-xs px-2 py-1 rounded-lg transition-all" style={{ backgroundColor: '#FFF0F0', color: '#B42318' }}>
                    Retirer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
