'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  transmission: string
  listingType: string
  locationCity: string
  vtcCompliant: boolean
  rentDuration: string | null
  description: string
  seats: number
  color: string | null
  status: string
  createdAt: string
  images: { id: string; imageUrl: string; position: number }[]
  user: { id: string; name: string; role: string; companyName: string | null; phone: string | null; createdAt: string }
  _count: { favorites: number; messages: number }
}

export default function AnnonceDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImage, setCurrentImage] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageSent, setMessageSent] = useState(false)

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then(r => r.json())
      .then(data => {
        setListing(data.listing)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    fetch(`/api/favorites/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setIsFavorite(data.favorited))
      .catch(() => {})
  }, [id])

  const toggleFavorite = async () => {
    setFavLoading(true)
    const res = await fetch(`/api/favorites/${id}`, {
      method: 'POST',
      credentials: 'include',
    })
    if (res.ok) {
      const data = await res.json()
      setIsFavorite(data.favorited)
    } else {
      router.push(`/login?redirect=/annonces/${id}`)
    }
    setFavLoading(false)
  }

  const sendMessage = async () => {
    if (!message.trim()) return
    setSendingMessage(true)
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ listingId: id, message }),
    })
    if (res.ok) {
      setMessageSent(true)
      setMessage('')
    } else {
      router.push(`/login?redirect=/annonces/${id}`)
    }
    setSendingMessage(false)
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-80 bg-gray-200 rounded-2xl mb-6" />
        <div className="h-8 bg-gray-200 rounded w-2/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg">Annonce introuvable</p>
        <Link href="/annonces" className="text-orange-500 text-sm mt-2 inline-block hover:underline">
          Retour aux annonces
        </Link>
      </div>
    )
  }

  const fuelLabels: Record<string, string> = {
    electric: 'Electrique', hybrid: 'Hybride', diesel: 'Diesel', gasoline: 'Essence'
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/annonces" className="text-sm text-gray-500 hover:text-orange-500 mb-4 inline-flex items-center gap-1">
        ← Retour aux annonces
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">

        <div className="lg:col-span-2 space-y-6">

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="relative h-72 bg-gray-100">
              {listing.images.length > 0 ? (
                <img src={listing.images[currentImage]?.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              )}
            </div>
            {listing.images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {listing.images.map((img, i) => (
                  <button key={img.id} onClick={() => setCurrentImage(i)}
                    className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${currentImage === i ? 'border-orange-500' : 'border-transparent'}`}>
                    <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex gap-2 mb-3">
              {listing.vtcCompliant && <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">VTC certifie</span>}
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${listing.listingType === 'sale' ? 'bg-blue-100 text-blue-700' : listing.rentDuration === 'loa' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                {listing.listingType === 'sale' ? 'Vente' : listing.rentDuration === 'loa' ? 'LOA' : 'Location'}
              </span>
              {listing.user.role === 'pro' && <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">Pro</span>}
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">{listing.title}</h1>
            <p className="text-gray-500 text-sm mb-4">{listing.locationCity} · Publie le {new Date(listing.createdAt).toLocaleDateString('fr-FR')}</p>
            <p className="text-3xl font-bold text-gray-900">
              {parseFloat(listing.price.toString()).toLocaleString()} €
              {listing.listingType === 'rent' && <span className="text-lg font-normal text-gray-500"> /{listing.rentDuration === 'week' ? 'semaine' : listing.rentDuration === 'year' ? 'an' : listing.rentDuration === 'loa' ? 'mois (LOA)' : 'mois'}</span>}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Informations vehicule</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Marque', listing.brand],
                ['Modele', listing.model],
                ['Annee', listing.year.toString()],
                ['Kilometrage', `${listing.mileage.toLocaleString()} km`],
                ['Energie', fuelLabels[listing.fuelType]],
                ['Transmission', listing.transmission === 'automatic' ? 'Automatique' : 'Manuelle'],
                ['Couleur', listing.color || 'Non precise'],
                ['Places', listing.seats.toString()],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold">
                {listing.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{listing.user.companyName || listing.user.name}</p>
                <p className="text-xs text-gray-500">Membre depuis {new Date(listing.user.createdAt).getFullYear()}</p>
              </div>
            </div>

            {listing.user.phone && (
              <a href={`tel:${listing.user.phone}`} className="flex items-center justify-center gap-2 w-full py-2.5 border border-orange-500 text-orange-500 rounded-xl text-sm font-medium hover:bg-orange-50 transition-colors mb-3">
                Appeler
              </a>
            )}

            {messageSent ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 text-center">
                Message envoye ! Le vendeur vous repondra bientot.
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Bonjour, je suis interesse par votre annonce..."
                  rows={4}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={sendingMessage || !message.trim()}
                  className="w-full bg-orange-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  {sendingMessage ? 'Envoi...' : 'Contacter le vendeur'}
                </button>
              </div>
            )}

            <button
              onClick={toggleFavorite}
              disabled={favLoading}
              className={`mt-3 w-full py-2 rounded-xl text-sm font-medium border transition-colors ${isFavorite ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {favLoading ? '...' : isFavorite ? '♥ Retire des favoris' : '♡ Ajouter aux favoris'}
            </button>

            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">{listing._count.favorites} favori(s) · {listing._count.messages} message(s)</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}