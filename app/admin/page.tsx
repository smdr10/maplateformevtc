'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Stats {
  totalUsers: number
  totalListings: number
  pendingCount: number
  activeCount: number
  totalMessages: number
}

interface PendingListing {
  id: string
  title: string
  brand: string
  model: string
  price: number
  listingType: string
  createdAt: string
  user: { id: string; name: string; email: string; role: string }
  images: { imageUrl: string }[]
}

interface Service {
  id: string
  name: string
  category: string
  city: string
  isVisible: boolean
  createdAt: string
  user: { id: string; name: string; email: string }
}

interface Review {
  id: string
  rating: number
  comment: string
  isVisible: boolean
  createdAt: string
  user: { id: string; name: string; email: string; role: string }
}

const CATEGORY_LABELS: Record<string, string> = {
  maintenance: 'Entretien & Mecanique',
  formation: 'Formation VTC',
  insurance: 'Assurance VTC',
  accessories: 'Accessoires & Equipement',
}

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'listings' | 'services' | 'reviews'>('listings')
  const [stats, setStats] = useState<Stats | null>(null)
  const [pending, setPending] = useState<PendingListing[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    const load = async () => {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' })
      if (!meRes.ok) { router.push('/login?redirect=/admin'); return }
      const meData = await meRes.json()
      if (meData.user.role !== 'admin') { setForbidden(true); setLoading(false); return }

      const [statsRes, pendingRes, servicesRes, reviewsRes] = await Promise.all([
        fetch('/api/admin/stats', { credentials: 'include' }),
        fetch('/api/admin/listings?status=pending', { credentials: 'include' }),
        fetch('/api/admin/services', { credentials: 'include' }),
        fetch('/api/admin/reviews', { credentials: 'include' }),
      ])

      setStats(await statsRes.json())
      const pendingData = await pendingRes.json()
      setPending(pendingData.listings || [])
      const servicesData = await servicesRes.json()
      setServices(servicesData.services || [])
      const reviewsData = await reviewsRes.json()
      setReviews(reviewsData.reviews || [])
      setLoading(false)
    }
    load()
  }, [router])

  const approve = async (id: string) => {
    const res = await fetch(`/api/admin/listings/${id}/approve`, { method: 'PATCH', credentials: 'include' })
    if (res.ok) {
      setPending(prev => prev.filter(l => l.id !== id))
      if (stats) setStats({ ...stats, pendingCount: stats.pendingCount - 1, activeCount: stats.activeCount + 1 })
    }
  }

  const reject = async (id: string) => {
    const res = await fetch(`/api/admin/listings/${id}/reject`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ reason: rejectReason }),
    })
    if (res.ok) {
      setPending(prev => prev.filter(l => l.id !== id))
      if (stats) setStats({ ...stats, pendingCount: stats.pendingCount - 1 })
      setRejectingId(null)
      setRejectReason('')
    }
  }

  const toggleServiceVisibility = async (id: string, isVisible: boolean) => {
    const res = await fetch(`/api/admin/services/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ isVisible: !isVisible }),
    })
    if (res.ok) setServices(prev => prev.map(s => s.id === id ? { ...s, isVisible: !isVisible } : s))
  }

  const deleteService = async (id: string) => {
    if (!confirm('Supprimer ce service ?')) return
    const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) setServices(prev => prev.filter(s => s.id !== id))
  }

  const toggleReviewVisibility = async (id: string, isVisible: boolean) => {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ isVisible: !isVisible }),
    })
    if (res.ok) setReviews(prev => prev.map(r => r.id === id ? { ...r, isVisible: !isVisible } : r))
  }

  const deleteReview = async (id: string) => {
    if (!confirm('Supprimer cet avis ?')) return
    const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) setReviews(prev => prev.filter(r => r.id !== id))
  }

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-500">Chargement...</div>

  if (forbidden) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-red-400 font-medium">Acces refuse</p>
        <p className="text-sm text-gray-600 mt-1">Cette page est reservee aux administrateurs.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 min-h-screen">

      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
        <p className="text-sm text-gray-500">Vue generale et moderation de la plateforme</p>
      </div>

      {stats && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { value: stats.totalUsers, label: 'Utilisateurs', color: 'text-white', bg: 'bg-gray-900 border-gray-800' },
            { value: stats.totalListings, label: 'Annonces totales', color: 'text-white', bg: 'bg-gray-900 border-gray-800' },
            { value: stats.pendingCount, label: 'En attente', color: 'text-orange-400', bg: 'bg-orange-500/5 border-orange-500/20' },
            { value: stats.activeCount, label: 'Actives', color: 'text-green-400', bg: 'bg-gray-900 border-gray-800' },
            { value: reviews.length, label: 'Avis recus', color: 'text-white', bg: 'bg-gray-900 border-gray-800' },
          ].map((stat, i) => (
            <div key={i} className={`${stat.bg} border rounded-2xl p-4`}>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
        <button onClick={() => setActiveTab('listings')} className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${activeTab === 'listings' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'}`}>
          Annonces ({pending.length})
        </button>
        <button onClick={() => setActiveTab('services')} className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${activeTab === 'services' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'}`}>
          Services ({services.length})
        </button>
        <button onClick={() => setActiveTab('reviews')} className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${activeTab === 'reviews' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'}`}>
          Avis ({reviews.length})
        </button>
      </div>

      {activeTab === 'listings' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-bold text-white">File de moderation</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/20 font-medium">{pending.length} en attente</span>
          </div>

          {pending.length === 0 ? (
            <div className="text-center py-12 bg-gray-900 rounded-2xl border border-gray-800">
              <p className="text-gray-500">Aucune annonce en attente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map(listing => (
                <div key={listing.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all">
                  <div className="flex gap-4 items-start">
                    <div className="w-16 h-12 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                      {listing.images[0] ? (
                        <img src={listing.images[0].imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">N/A</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{listing.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {parseFloat(listing.price.toString()).toLocaleString()} EUR · {listing.listingType === 'sale' ? 'Vente' : 'Location'} · par {listing.user.name} ({listing.user.email})
                      </p>
                      <p className="text-xs text-gray-600">Soumis le {new Date(listing.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => approve(listing.id)} className="text-xs px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/30 font-medium transition-all">
                        Approuver
                      </button>
                      <button onClick={() => setRejectingId(rejectingId === listing.id ? null : listing.id)} className="text-xs px-3 py-1.5 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/10 font-medium transition-all">
                        Rejeter
                      </button>
                    </div>
                  </div>
                  {rejectingId === listing.id && (
                    <div className="mt-3 pt-3 border-t border-gray-800 flex gap-2">
                      <input type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Motif du rejet..." className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500/50 placeholder-gray-600 transition-all" />
                      <button onClick={() => reject(listing.id)} className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/20 text-sm rounded-lg hover:bg-red-500/30 transition-all">Confirmer</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'services' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">Gestion des services</h2>
            <Link href="/services" className="text-sm text-orange-500 hover:text-orange-400 transition-colors">Voir la page publique</Link>
          </div>
          {services.length === 0 ? (
            <div className="text-center py-12 bg-gray-900 rounded-2xl border border-gray-800">
              <p className="text-gray-500">Aucun service publie</p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map(service => (
                <div key={service.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4 hover:border-gray-700 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-white">{service.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${service.isVisible ? 'bg-green-500/20 text-green-400 border-green-500/20' : 'bg-gray-500/20 text-gray-400 border-gray-500/20'}`}>
                        {service.isVisible ? 'Visible' : 'Masque'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{CATEGORY_LABELS[service.category]} · {service.city} · par {service.user.name}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link href={`/services/${service.id}`} className="text-xs px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white transition-all">Voir</Link>
                    <button onClick={() => toggleServiceVisibility(service.id, service.isVisible)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all border ${service.isVisible ? 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700' : 'bg-green-500/20 border-green-500/20 text-green-400 hover:bg-green-500/30'}`}>
                      {service.isVisible ? 'Masquer' : 'Afficher'}
                    </button>
                    <button onClick={() => deleteService(service.id)} className="text-xs px-3 py-1.5 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/10 transition-all">Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">Gestion des avis</h2>
            <Link href="/avis" className="text-sm text-orange-500 hover:text-orange-400 transition-colors">Voir la page publique</Link>
          </div>
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-gray-900 rounded-2xl border border-gray-800">
              <p className="text-gray-500">Aucun avis pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-white">{review.user.name}</p>
                        <span className="text-xs text-gray-500">({review.user.email})</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <span key={s} className={`text-xs ${s <= review.rating ? 'text-orange-400' : 'text-gray-700'}`}>★</span>
                          ))}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${review.isVisible ? 'bg-green-500/20 text-green-400 border-green-500/20' : 'bg-gray-500/20 text-gray-400 border-gray-500/20'}`}>
                          {review.isVisible ? 'Visible' : 'Masque'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{review.comment}</p>
                      <p className="text-xs text-gray-600 mt-1">{new Date(review.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => toggleReviewVisibility(review.id, review.isVisible)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all border ${review.isVisible ? 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700' : 'bg-green-500/20 border-green-500/20 text-green-400 hover:bg-green-500/30'}`}>
                        {review.isVisible ? 'Masquer' : 'Afficher'}
                      </button>
                      <button onClick={() => deleteReview(review.id)} className="text-xs px-3 py-1.5 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/10 transition-all">
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}