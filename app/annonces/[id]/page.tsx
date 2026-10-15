'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PricePlate, KindTag } from '../../components/ui'

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
  depositAmount: string | number | null
  includedKmPerWeek: number | null
  insuranceIncluded: boolean | null
  minRentalWeeks: number | null
  driverRequirements: string | null
  availableFrom: string | null
  status: string
  createdAt: string
  images: { id: string; imageUrl: string; position: number }[]
  user: { id: string; name: string; role: string; companyName: string | null; phone: string | null; createdAt: string; company: { verificationStatus: string } | null }
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
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse" style={{ backgroundColor: '#F7F7F8' }}>
        <div className="h-80 rounded-[20px] mb-6" style={{ backgroundColor: '#ECECEF' }} />
        <div className="h-8 rounded w-2/3 mb-4" style={{ backgroundColor: '#ECECEF' }} />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center" style={{ backgroundColor: '#F7F7F8' }}>
        <p className="text-gray-400 text-lg">Annonce introuvable</p>
        <Link href="/annonces" className="text-sm mt-2 inline-block hover:underline" style={{ color: '#16181D' }}>
          Retour aux annonces
        </Link>
      </div>
    )
  }

  const fuelLabels: Record<string, string> = {
    electric: 'Électrique', hybrid: 'Hybride', diesel: 'Diesel', gasoline: 'Essence'
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 min-h-screen" style={{ backgroundColor: '#F7F7F8' }}>

      {/* MODAL SIGNALEMENT */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-md rounded-[20px] p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECECEF' }}>
            {reportSent ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-bold" style={{ color: '#16181D' }}>Signalement envoyé !</p>
                <p className="text-sm mt-1" style={{ color: '#8A8F9A' }}>Notre equipe va examiner cette annonce.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold" style={{ color: '#16181D' }}>Signaler cette annonce</h3>
                  <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <p className="text-sm mb-4" style={{ color: '#8A8F9A' }}>Pourquoi signalez-vous cette annonce ?</p>

                <div className="space-y-2 mb-4">
                  {[
                    'Annonce frauduleuse ou arnaque',
                    'Prix abusif ou trompeur',
                    'Photos ne correspondant pas au véhicule',
                    'Informations incorrectes ou mensongeres',
                    'Véhicule déjà vendu',
                    'Contenu inapproprie',
                    'Autre raison',
                  ].map(reason => (
                    <button key={reason} onClick={() => setReportReason(reason)}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all"
                      style={{
                        backgroundColor: reportReason === reason ? '#FFF1E8' : '#F7F7F8',
                        border: `1px solid ${reportReason === reason ? '#16181D' : '#ECECEF'}`,
                        color: reportReason === reason ? '#16181D' : '#16181D',
                      }}>
                      {reason}
                    </button>
                  ))}
                </div>

                {reportError && (
                  <p className="text-sm text-red-500 mb-3">{reportError}</p>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setShowReportModal(false)} className="flex-1 py-2.5 rounded-xl text-sm transition-all" style={{ backgroundColor: '#F7F7F8', border: '1px solid #ECECEF', color: '#8A8F9A' }}>
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

      <Link href="/annonces" className="text-sm mb-4 inline-flex items-center gap-1 hover:underline transition-colors" style={{ color: '#8A8F9A' }}>
        ← Retour aux annonces
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">

        {/* COLONNE GAUCHE */}
        <div className="lg:col-span-2 space-y-4">

          {/* GALERIE */}
          <div className="rounded-[20px] overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECECEF' }}>
            <div className="relative h-72" style={{ backgroundColor: '#F1F1F3' }}>
              {listing.images.length > 0 ? (
                <img src={listing.images[currentImage]?.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ color: '#C4C7CE' }}>
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
                    style={{ borderColor: currentImage === i ? '#FF5500' : '#ECECEF' }}>
                    <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TITRE & PRIX */}
          <div className="panel p-6">
            <div className="mb-3 flex flex-wrap gap-1.5">
              <KindTag listingType={listing.listingType} rentDuration={listing.rentDuration} />
              {listing.vtcCompliant && <span className="chip bg-go text-white">Conforme VTC</span>}
            </div>
            <h1 className="display text-4xl sm:text-5xl">{listing.title}</h1>
            <p className="mt-2 text-sm text-ink-mute">{listing.locationCity} · publiée le {new Date(listing.createdAt).toLocaleDateString('fr-FR')}</p>
            <div className="mt-5">
              <PricePlate price={listing.price} listingType={listing.listingType} rentDuration={listing.rentDuration} size="lg" />
            </div>
          </div>

          {/* FICHE TECHNIQUE */}
          <div className="panel overflow-hidden">
            <h2 className="px-6 pb-1 pt-5 text-xl font-extrabold tracking-tight">Fiche technique</h2>
            <dl className="grid grid-cols-2 gap-1 p-2 sm:grid-cols-4">
              {[
                ['Marque', listing.brand],
                ['Modèle', listing.model],
                ['Année', listing.year.toString()],
                ['Kilométrage', `${listing.mileage.toLocaleString('fr-FR')} km`],
                ['Énergie', fuelLabels[listing.fuelType]],
                ['Boîte', listing.transmission === 'automatic' ? 'Automatique' : 'Manuelle'],
                ['Couleur', listing.color || 'Non précisée'],
                ['Places', listing.seats.toString()],
              ].map(([label, value]) => (
                <div key={label} className="px-5 py-3">
                  <dt className="text-xs font-semibold text-ink-mute">{label}</dt>
                  <dd className="mt-1 text-lg font-bold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* CONDITIONS DE LOCATION */}
          {listing.listingType === 'rent' && listing.rentDuration !== 'loa' && (
            <div className="panel overflow-hidden">
              <h2 className="px-6 pb-1 pt-5 text-xl font-extrabold tracking-tight">Conditions de location</h2>
              <dl className="grid grid-cols-2 gap-1 p-2 sm:grid-cols-4">
                {[
                  ['Caution', listing.depositAmount != null ? `${Number(listing.depositAmount).toLocaleString('fr-FR')} €` : 'À demander'],
                  ['Km inclus / sem.', listing.includedKmPerWeek != null ? `${listing.includedKmPerWeek.toLocaleString('fr-FR')} km` : 'À demander'],
                  ['Assurance', listing.insuranceIncluded == null ? 'À demander' : listing.insuranceIncluded ? 'Incluse' : 'Non incluse'],
                  ['Durée minimale', listing.minRentalWeeks ? `${listing.minRentalWeeks} sem.` : 'Sans minimum'],
                ].map(([label, value]) => (
                  <div key={label} className="px-5 py-3">
                    <dt className="text-xs font-semibold text-ink-mute">{label}</dt>
                    <dd className="mt-1 text-lg font-bold">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="space-y-1 px-6 py-4 text-sm">
                <p>
                  <span className="font-semibold">Disponibilité : </span>
                  {listing.availableFrom && new Date(listing.availableFrom) > new Date()
                    ? `à partir du ${new Date(listing.availableFrom).toLocaleDateString('fr-FR')}`
                    : 'disponible maintenant'}
                </p>
                {listing.driverRequirements && <p><span className="font-semibold">Conditions : </span>{listing.driverRequirements}</p>}
              </div>
            </div>
          )}

          {/* DESCRIPTION */}
          <div className="panel-soft p-6">
            <h2 className="display mb-3 text-2xl">Description</h2>
            <p className="whitespace-pre-wrap leading-relaxed text-ink-soft">{listing.description}</p>
          </div>

          {/* BOUTON SIGNALER */}
          <div className="text-center">
            <button onClick={() => setShowReportModal(true)} className="text-xs hover:underline transition-colors" style={{ color: '#C4C7CE' }}>
              Signaler cette annonce
            </button>
          </div>
        </div>

        {/* COLONNE DROITE */}
        <div className="space-y-4">
          <div className="rounded-[20px] p-5 sticky top-24" style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECECEF' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: '#FF5500' }}>
                {listing.user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#16181D' }}>{listing.user.companyName || listing.user.name}</p>
                {listing.user.company?.verificationStatus === 'verified' && (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5" style={{ backgroundColor: '#F0FFF4', color: '#15803D' }}>🛡️ Pro certifié</span>
                )}
                <p className="text-xs" style={{ color: '#8A8F9A' }}>Membre depuis {new Date(listing.user.createdAt).getFullYear()}</p>
              </div>
            </div>

            {messageSent ? (
              <div className="p-3 rounded-xl text-sm text-center" style={{ backgroundColor: '#F0FFF4', border: '1px solid #BBF7D0', color: '#15803D' }}>
                Message envoyé ! Le vendeur vous repondra bientot.
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Bonjour, je suis interesse par votre annonce..."
                  rows={4}
                  className="w-full text-sm rounded-xl px-3 py-2.5 focus:outline-none transition-all resize-none"
                  style={{ backgroundColor: '#F7F7F8', border: '1px solid #ECECEF', color: '#16181D' }}
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
                backgroundColor: isFavorite ? '#FFF0F0' : '#F7F7F8',
                border: `1px solid ${isFavorite ? '#FFD0D0' : '#ECECEF'}`,
                color: isFavorite ? '#B42318' : '#4B5160',
              }}
            >
              {favLoading ? '...' : isFavorite ? '♥ Retire des favoris' : '♡ Ajouter aux favoris'}
            </button>

            <div className="mt-4 pt-4 text-center" style={{ borderTop: '1px solid #F1F1F3' }}>
              <p className="text-xs" style={{ color: '#8A8F9A' }}>{listing._count.favorites} favori(s) · {listing._count.messages} message(s)</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
