'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, BadgeCheck, CalendarClock, CarFront, Check, ChevronLeft, ChevronRight, Flag, Fuel, Gauge, Heart, MapPin, Palette, Route, Settings2, ShieldCheck, Users, Wallet, X } from 'lucide-react'
import { PricePlate, KindTag, FUEL_LABELS } from '../../components/ui'

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
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-8">
        <div className="mb-6 aspect-[16/9] rounded-[28px] bg-rule/70" />
        <div className="mb-3 h-9 w-2/3 rounded-full bg-rule/70" />
        <div className="h-6 w-1/3 rounded-full bg-rule/70" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <CarFront className="mx-auto h-14 w-14 text-brand/40" strokeWidth={1.4} />
        <p className="display mt-4 text-3xl">Annonce introuvable</p>
        <p className="mt-2 text-ink-soft">Elle a peut-être été vendue ou retirée.</p>
        <Link href="/annonces" className="btn btn-brand mt-6">Voir les annonces</Link>
      </div>
    )
  }

  const images = listing.images
  const hasImages = images.length > 0
  const certified = listing.user.company?.verificationStatus === 'verified'
  const isRental = listing.listingType === 'rent' && listing.rentDuration !== 'loa'
  const sellerName = listing.user.companyName || listing.user.name
  const prev = () => setCurrentImage(i => (i - 1 + images.length) % images.length)
  const next = () => setCurrentImage(i => (i + 1) % images.length)

  const specs = [
    { icon: CalendarClock, label: 'Année', value: listing.year.toString() },
    { icon: Gauge, label: 'Kilométrage', value: `${listing.mileage.toLocaleString('fr-FR')} km` },
    { icon: Fuel, label: 'Énergie', value: FUEL_LABELS[listing.fuelType] ?? listing.fuelType },
    { icon: Settings2, label: 'Boîte', value: listing.transmission === 'automatic' ? 'Automatique' : 'Manuelle' },
    { icon: Users, label: 'Places', value: listing.seats.toString() },
    { icon: Palette, label: 'Couleur', value: listing.color || 'Non précisée' },
  ]

  const rentalTerms = [
    { icon: Wallet, label: 'Caution', value: listing.depositAmount != null ? `${Number(listing.depositAmount).toLocaleString('fr-FR')} €` : 'À demander' },
    { icon: Route, label: 'Km inclus / semaine', value: listing.includedKmPerWeek != null ? `${listing.includedKmPerWeek.toLocaleString('fr-FR')} km` : 'À demander' },
    { icon: ShieldCheck, label: 'Assurance', value: listing.insuranceIncluded == null ? 'À demander' : listing.insuranceIncluded ? 'Incluse' : 'Non incluse' },
    { icon: CalendarClock, label: 'Durée minimale', value: listing.minRentalWeeks ? `${listing.minRentalWeeks} semaine(s)` : 'Sans minimum' },
  ]
  const availableLater = !!listing.availableFrom && new Date(listing.availableFrom) > new Date()
  const quickQuestions = isRental
    ? ['Est-il disponible ?', 'Puis-je le voir cette semaine ?', 'Quelles sont les conditions ?']
    : ['Est-il toujours disponible ?', 'Le prix est-il négociable ?', 'Puis-je le voir ?']

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* MODAL SIGNALEMENT */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 px-4 pb-4 backdrop-blur-sm sm:items-center">
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[var(--shadow-lift)]">
              {reportSent ? (
                <div className="py-6 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-go text-white"><Check className="h-7 w-7" strokeWidth={3} /></span>
                  <p className="mt-4 text-lg font-extrabold">Signalement envoyé</p>
                  <p className="mt-1 text-sm text-ink-soft">Notre équipe va examiner cette annonce.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-extrabold">Signaler cette annonce</h3>
                    <button onClick={() => setShowReportModal(false)} aria-label="Fermer" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-paper"><X className="h-5 w-5" /></button>
                  </div>
                  <div className="mb-4 space-y-2">
                    {[
                      'Annonce frauduleuse ou arnaque',
                      'Prix abusif ou trompeur',
                      'Photos ne correspondant pas au véhicule',
                      'Informations incorrectes ou mensongères',
                      'Véhicule déjà vendu',
                      'Contenu inapproprié',
                      'Autre raison',
                    ].map(reason => (
                      <button key={reason} onClick={() => setReportReason(reason)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${reportReason === reason ? 'border-brand bg-brand-soft text-brand' : 'border-rule hover:border-ink-mute'}`}>
                        {reason}
                      </button>
                    ))}
                  </div>
                  {reportError && <p className="mb-3 text-sm text-stop">{reportError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => setShowReportModal(false)} className="btn btn-line flex-1">Annuler</button>
                    <button onClick={submitReport} disabled={reportLoading || !reportReason} className="btn btn-brand flex-1 disabled:opacity-50">
                      {reportLoading ? 'Envoi…' : 'Signaler'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Link href="/annonces" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-white">
        <ArrowLeft className="h-4 w-4" /> Retour aux annonces
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* COLONNE GAUCHE */}
        <div className="min-w-0 space-y-6">
          {/* GALERIE */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="overflow-hidden rounded-[28px] bg-white shadow-[var(--shadow-soft)]">
            <div className="relative aspect-[16/10] bg-gradient-to-br from-brand-soft to-paper">
              <AnimatePresence mode="wait">
                {hasImages ? (
                  <motion.img key={currentImage} src={images[currentImage]?.imageUrl} alt={listing.title}
                    initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                    className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-brand/35"><CarFront className="h-24 w-24" strokeWidth={1.2} /></div>
                )}
              </AnimatePresence>
              <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
                <KindTag listingType={listing.listingType} rentDuration={listing.rentDuration} />
                {listing.vtcCompliant && <span className="chip bg-go text-white shadow-sm"><BadgeCheck className="h-3.5 w-3.5" /> Conforme VTC</span>}
              </div>
              <button onClick={toggleFavorite} disabled={favLoading} aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-sm transition active:scale-90">
                <motion.span key={String(isFavorite)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-brand text-brand' : 'text-ink'}`} />
                </motion.span>
              </button>
              {images.length > 1 && (
                <>
                  <button onClick={prev} aria-label="Photo précédente" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm"><ChevronLeft className="h-5 w-5" /></button>
                  <button onClick={next} aria-label="Photo suivante" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm"><ChevronRight className="h-5 w-5" /></button>
                  <span className="absolute bottom-4 right-4 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-bold text-white">{currentImage + 1} / {images.length}</span>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setCurrentImage(i)}
                    className={`h-14 w-20 flex-shrink-0 overflow-hidden rounded-xl ring-2 transition ${currentImage === i ? 'ring-brand' : 'ring-transparent opacity-70 hover:opacity-100'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* TITRE & PRIX */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5 }}>
            <h1 className="display text-3xl sm:text-4xl">{listing.title}</h1>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-ink-mute">
              <MapPin className="h-4 w-4" /> {listing.locationCity} · publiée le {new Date(listing.createdAt).toLocaleDateString('fr-FR')}
            </p>
            <div className="mt-4"><PricePlate price={listing.price} listingType={listing.listingType} rentDuration={listing.rentDuration} size="lg" /></div>
          </motion.div>

          {/* CARACTERISTIQUES */}
          <section>
            <h2 className="mb-3 text-xl font-extrabold tracking-tight">Caractéristiques</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {specs.map((sp, i) => (
                <motion.div key={sp.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)]">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"><sp.icon className="h-5 w-5" /></span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-ink-mute">{sp.label}</span>
                    <span className="block truncate font-bold">{sp.value}</span>
                  </span>
                </motion.div>
              ))}
            </div>
          </section>

          {/* CONDITIONS DE LOCATION */}
          {isRental && (
            <section className="rounded-[28px] bg-gradient-to-br from-brand to-[#FF8A3D] p-6 text-white">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-extrabold tracking-tight">Conditions de location</h2>
                <span className="chip bg-white/20 text-white">{availableLater ? `Disponible le ${new Date(listing.availableFrom as string).toLocaleDateString('fr-FR')}` : 'Disponible maintenant'}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {rentalTerms.map(t => (
                  <div key={t.label} className="rounded-2xl bg-white/15 p-3 backdrop-blur">
                    <t.icon className="h-5 w-5 text-white/85" />
                    <p className="mt-2 text-xs text-white/80">{t.label}</p>
                    <p className="font-bold">{t.value}</p>
                  </div>
                ))}
              </div>
              {listing.driverRequirements && <p className="mt-4 text-sm text-white/90"><span className="font-bold">Conditions : </span>{listing.driverRequirements}</p>}
            </section>
          )}

          {/* DESCRIPTION */}
          <section className="rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)]">
            <h2 className="mb-3 text-xl font-extrabold tracking-tight">Description</h2>
            <p className="whitespace-pre-wrap leading-relaxed text-ink-soft">{listing.description}</p>
          </section>

          <button onClick={() => setShowReportModal(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-mute hover:text-stop">
            <Flag className="h-3.5 w-3.5" /> Signaler cette annonce
          </button>
        </div>

        {/* COLONNE DROITE : vendeur et contact */}
        <aside>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.5 }}
            className="sticky top-24 rounded-[28px] bg-white p-6 shadow-[var(--shadow-lift)]">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-lg font-bold text-white">
                {sellerName.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-extrabold">{sellerName}</p>
                <p className="text-xs text-ink-mute">Membre depuis {new Date(listing.user.createdAt).getFullYear()}</p>
              </div>
            </div>
            {certified && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-go-soft px-3 py-1 text-xs font-bold text-go"><ShieldCheck className="h-3.5 w-3.5" /> Pro certifié · SIRET vérifié</p>
            )}

            <div className="mt-5">
              <AnimatePresence mode="wait">
                {messageSent ? (
                  <motion.div key="sent" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl bg-go-soft p-4 text-center text-sm font-semibold text-go">
                    <Check className="mx-auto mb-1 h-6 w-6" strokeWidth={3} />
                    Message envoyé. {sellerName} vous répondra dans votre messagerie.
                  </motion.div>
                ) : (
                  <motion.div key="form" exit={{ opacity: 0 }} className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {quickQuestions.map(q => (
                        <button key={q} type="button" onClick={() => setMessage(m => (m ? `${m} ${q}` : `Bonjour, ${q.charAt(0).toLowerCase()}${q.slice(1)}`))}
                          className="rounded-full border border-rule px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-brand hover:text-brand">
                          {q}
                        </button>
                      ))}
                    </div>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                      placeholder="Bonjour, je suis intéressé par votre véhicule…" className="field resize-none" />
                    <button onClick={sendMessage} disabled={sendingMessage || !message.trim()} className="btn btn-brand w-full disabled:opacity-50">
                      {sendingMessage ? 'Envoi…' : isRental ? 'Contacter le loueur' : 'Contacter le vendeur'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="mt-4 border-t border-rule pt-4 text-center text-xs text-ink-mute">
              {listing._count.favorites} favori(s) · {listing._count.messages} message(s) · aucune commission prélevée
            </p>
          </motion.div>
        </aside>
      </div>
    </div>
  )
}
