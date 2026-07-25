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
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportSent, setReportSent] = useState(false)
  const [reportError, setReportError] = useState('')

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

  const submitReport = async () => {
    if (!reportReason.trim()) return
    setReportLoading(true)
    setReportError('')
    const res = await fetch(`/api/listings/${id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason: reportReason }),
    })
    const data = await res.json()
    if (res.ok) {
      setReportSent(true)
      setTimeout(() => {
        setShowReportModal(false)
        setReportSent(false)
        setReportReason('')
      }, 2000)
    } else {
      if (res.status === 401) {
        router.push(`/login?redirect=/annonces/${id}`)
      } else {
        setReportError(data.message || 'Erreur lors du signalement')
      }
    }
    setReportLoading(false)
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse" style={{ backgroundColor: '#F8F8F8' }}>
        <div className="h-80 rounded-2xl mb-6" style={{ backgroundColor: '#E8E8E8' }} />
        <div className="h-8 rounded w-2/3 mb-4" style={{ backgroundColor: '#E8E8E8' }} />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center" style={{ backgroundColor: '#F8F8F8' }}>
        <p className="text-gray-400 text-lg">Annonce introuvable</p>
        <Link href="/annonces" className="text-sm mt-2 inline-block hover:underline" style={{ color: '#FF5500' }}>
          Retour aux annonces
        </Link>
      </div>
    )
  }

  const fuelLabels: Record<string, string> = {
    electric: 'Electrique', hybrid: 'Hybride', diesel: 'Diesel', gasoline: 'Essence'
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 min-h-screen" style={{ backgroundColor: '#F8F8F8' }}>

      {/* MODAL SIGNALEMENT */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
            {reportSent ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-bold" style={{ color: '#1A1A1A' }}>Signalement envoye !</p>
                <p className="text-sm mt-1" style={{ color: '#888' }}>Notre equipe va examiner cette annonce.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold" style={{ color: '#1A1A1A' }}>Signaler cette annonce</h3>
                  <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <p className="text-sm mb-4" style={{ color: '#888' }}>Pourquoi signalez-vous cette annonce ?</p>

                <div className="space-y-2 mb-4">
                  {[
                    'Annonce frauduleuse ou arnaque',
                    'Prix abusif ou trompeur',
                    'Photos ne correspondant pas au vehicule',
                    'Informations incorrectes ou mensongeres',
                    'Vehicule deja vendu',
                    'Contenu inapproprie',
                    'Autre raison',
                  ].map(reason => (
                    <button key={reason} onClick={() => setReportReason(reason)}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all"
                      style={{
                        backgroundColor: reportReason === reason ? '#FFF5F0' : '#F8F8F8',
                        border: `1px solid ${reportReason === reason ? '#FF5500' : '#E8E8E8'}`,
                        color: reportReason === reason ? '#FF5500' : '#333',
                      }}>
                      {reason}
                    </button>
                  ))}
                </div>

                {reportError && (
                  <p className="text-sm text-red-500 mb-3">{reportError}</p>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setShowReportModal(false)} className="flex-1 py-2.5 rounded-xl text-sm transition-all" style={{ backgroundColor: '#F8F8F8', border: '1px solid #E8E8E8', color: '#888' }}>
                    Annuler
                  </button>
                  <button onClick={submitReport} disabled={reportLoading || !reportReason} className="flex-1 py-2.5 rounded-xl text-sm text-white font-bold disabled:opacity-50 transition-all" style={{ backgroundColor: '#FF5500' }}>
                    {reportLoading ? 'Envoi...' : 'Signaler'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Link href="/annonces" className="text-sm mb-4 inline-flex items-center gap-1 hover:text-orange-500 transition-colors" style={{ color: '#888' }}>
        ← Retour aux annonces
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">

        {/* COLONNE GAUCHE */}
        <div className="lg:col-span-2 space-y-4">

          {/* GALERIE */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
            <div className="relative h-72" style={{ backgroundColor: '#F0F0F0' }}>
              {listing.images.length > 0 ? (
                <img src={listing.images[currentImage]?.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ color: '#CCC' }}>
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              )}
            </div>
            {listing.images.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto" style={{ backgroundColor: '#FAFAFA' }}>
                {listing.images.map((img, i) => (
                  <button key={img.id} onClick={() => setCurrentImage(i)}
                    className="flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors"
                    style={{ borderColor: currentImage === i ? '#FF5500' : '#E8E8E8' }}>
                    <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TITRE & PRIX */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
            <div className="flex gap-2 mb-3 flex-wrap">
              {listing.vtcCompliant && <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: '#F0FFF4', color: '#22C55E', border: '1px solid #BBF7D0' }}>VTC certifie</span>}
              <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: listing.listingType === 'sale' ? '#EFF6FF' : listing.rentDuration === 'loa' ? '#F5F3FF' : '#FFF5F0', color: listing.listingType === 'sale' ? '#3B82F6' : listing.rentDuration === 'loa' ? '#8B5CF6' : '#FF5500', border: `1px solid ${listing.listingType === 'sale' ? '#BFDBFE' : listing.rentDuration === 'loa' ? '#DDD6FE' : '#FFD0B0'}` }}>
                {listing.listingType === 'sale' ? 'Vente' : listing.rentDuration === 'loa' ? 'LOA' : 'Location'}
              </span>
            </div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#1A1A1A' }}>{listing.title}</h1>
            <p className="text-sm mb-4" style={{ color: '#888' }}>{listing.locationCity} · Publie le {new Date(listing.createdAt).toLocaleDateString('fr-FR')}</p>
            <p className="text-3xl font-black" style={{ color: '#FF5500' }}>
              {parseFloat(listing.price.toString()).toLocaleString()} EUR
              {listing.listingType === 'rent' && <span className="text-lg font-normal" style={{ color: '#888' }}> /{listing.rentDuration === 'week' ? 'semaine' : listing.rentDuration === 'year' ? 'an' : listing.rentDuration === 'loa' ? 'mois (LOA)' : 'mois'}</span>}
            </p>
          </div>

          {/* INFOS VEHICULE */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
            <h2 className="font-bold mb-4" style={{ color: '#1A1A1A' }}>Informations vehicule</h2>
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
                <div key={label}>
                  <span className="text-xs" style={{ color: '#AAA' }}>{label}</span>
                  <p className="text-sm font-medium mt-0.5" style={{ color: '#1A1A1A' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
            <h2 className="font-bold mb-3" style={{ color: '#1A1A1A' }}>Description</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#555' }}>{listing.description}</p>
          </div>

          {/* BOUTON SIGNALER */}
          <div className="text-center">
            <button onClick={() => setShowReportModal(true)} className="text-xs hover:underline transition-colors" style={{ color: '#CCC' }}>
              🚩 Signaler cette annonce
            </button>
          </div>
        </div>

        {/* COLONNE DROITE */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5 sticky top-24" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#FF5500' }}>
                {listing.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>{listing.user.companyName || listing.user.name}</p>
                <p className="text-xs" style={{ color: '#888' }}>Membre depuis {new Date(listing.user.createdAt).getFullYear()}</p>
              </div>
            </div>

            {messageSent ? (
              <div className="p-3 rounded-xl text-sm text-center" style={{ backgroundColor: '#F0FFF4', border: '1px solid #BBF7D0', color: '#22C55E' }}>
                Message envoye ! Le vendeur vous repondra bientot.
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Bonjour, je suis interesse par votre annonce..."
                  rows={4}
                  className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none transition-all resize-none"
                  style={{ backgroundColor: '#F8F8F8', border: '1px solid #E8E8E8', color: '#1A1A1A' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={sendingMessage || !message.trim()}
                  className="w-full text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all hover:opacity-90"
                  style={{ backgroundColor: '#FF5500' }}
                >
                  {sendingMessage ? 'Envoi...' : 'Contacter le vendeur'}
                </button>
              </div>
            )}

            <button
              onClick={toggleFavorite}
              disabled={favLoading}
              className="mt-3 w-full py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: isFavorite ? '#FFF0F0' : '#F8F8F8',
                border: `1px solid ${isFavorite ? '#FFD0D0' : '#E8E8E8'}`,
                color: isFavorite ? '#EF4444' : '#555',
              }}
            >
              {favLoading ? '...' : isFavorite ? '♥ Retire des favoris' : '♡ Ajouter aux favoris'}
            </button>

            <div className="mt-4 pt-4 text-center" style={{ borderTop: '1px solid #F0F0F0' }}>
              <p className="text-xs" style={{ color: '#AAA' }}>{listing._count.favorites} favori(s) · {listing._count.messages} message(s)</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
