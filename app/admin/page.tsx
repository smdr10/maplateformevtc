'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Listing {
  id: string
  title: string
  brand: string
  model: string
  year: number
  price: number
  status: string
  listingType: string
  locationCity: string
  createdAt: string
  user: { name: string; email: string }
  images?: { imageUrl: string }[]
}

interface Service {
  id: string
  name: string
  category: string
  city: string
  isVisible: boolean
  createdAt: string
  user: { name: string }
}

interface Review {
  id: string
  rating: number
  comment: string
  isVisible: boolean
  createdAt: string
  user: { name: string }
}

interface Report {
  id: string
  reason: string
  createdAt: string
  listing: { id: string; title: string; status: string }
  reporter: { name: string; email: string }
}

interface Stats {
  totalUsers: number
  totalListings: number
  pendingListings: number
  activeListings: number
  totalReviews: number
}

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('listings')
  const [listings, setListings] = useState<Listing[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.user || data.user.role !== 'admin') { router.push('/'); return }
        return Promise.all([
          fetch('/api/admin/listings', { credentials: 'include' }).then(r => r.json()),
          fetch('/api/admin/services', { credentials: 'include' }).then(r => r.json()),
          fetch('/api/admin/reviews', { credentials: 'include' }).then(r => r.json()),
          fetch('/api/admin/stats', { credentials: 'include' }).then(r => r.json()),
          fetch('/api/admin/reports', { credentials: 'include' }).then(r => r.json()),
        ])
      })
      .then(results => {
        if (!results) return
        const [listingsData, servicesData, reviewsData, statsData, reportsData] = results
        setListings(listingsData.listings || [])
        setServices(servicesData.services || [])
        setReviews(reviewsData.reviews || [])
        setStats(statsData)
        setReports(reportsData.reports || [])
        setLoading(false)
      })
      .catch(() => router.push('/'))
  }, [router])

  const approveListing = async (id: string) => {
    await fetch(`/api/admin/listings/${id}/approve`, { method: 'PATCH', credentials: 'include' })
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'active' } : l))
  }

  const rejectListing = async (id: string) => {
    await fetch(`/api/admin/listings/${id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason: rejectReason }),
    })
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: 'rejected' } : l))
    setRejectId(null)
    setRejectReason('')
  }

  const toggleService = async (id: string, isVisible: boolean) => {
    await fetch(`/api/admin/services/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isVisible: !isVisible }),
    })
    setServices(prev => prev.map(s => s.id === id ? { ...s, isVisible: !isVisible } : s))
  }

  const toggleReview = async (id: string, isVisible: boolean) => {
    await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isVisible: !isVisible }),
    })
    setReviews(prev => prev.map(r => r.id === id ? { ...r, isVisible: !isVisible } : r))
  }

  const deleteReview = async (id: string) => {
    if (!confirm('Supprimer cet avis ?')) return
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE', credentials: 'include' })
    setReviews(prev => prev.filter(r => r.id !== id))
  }

  const deleteReport = async (id: string) => {
    if (!confirm('Ignorer ce signalement ?')) return
    const res = await fetch(`/api/admin/reports/${id}`, { method: 'DELETE', credentials: 'include' })
    if (!res.ok) return
    setReports(prev => prev.filter(r => r.id !== id))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0A0F' }}>
      <div style={{ color: '#666' }}>Chargement...</div>
    </div>
  )

  const pendingListings = listings.filter(l => l.status === 'pending')

  const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: '#2A1F00', color: '#F59E0B', label: 'En attente' },
    active: { bg: '#001A0A', color: '#15803D', label: 'Active' },
    rejected: { bg: '#1A0000', color: '#B42318', label: 'Rejetee' },
    sold: { bg: '#001020', color: '#1D4ED8', label: 'Vendue' },
    rented: { bg: '#001020', color: '#1D4ED8', label: 'Louee' },
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#FF5500' }}>Dashboard Admin</h1>
            <p className="text-sm mt-1" style={{ color: '#666' }}>MaPlateformeVTC — Panneau de controle</p>
          </div>
          <a href="/admin/certifications" className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#FF5500' }}>
            🛡️ Certifications pros
          </a>
        </div>

        {/* STATS */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Utilisateurs', value: stats.totalUsers, icon: '👥' },
              { label: 'Annonces', value: stats.totalListings, icon: '🚗' },
              { label: 'En attente', value: stats.pendingListings, icon: '⏳', highlight: true },
              { label: 'Actives', value: stats.activeListings, icon: '✅' },
              { label: 'Signalements', value: reports.length, icon: '🚩', highlight: reports.length > 0 },
            ].map(s => (
              <div key={s.label} className="rounded-[20px] p-4 text-center" style={{ backgroundColor: s.highlight ? '#1A0800' : '#111118', border: `1px solid ${s.highlight ? '#3A1500' : '#1A1A2E'}` }}>
                <p className="text-xl mb-1">{s.icon}</p>
                <p className="text-2xl font-bold" style={{ color: s.highlight ? '#FF5500' : '#FFFFFF' }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: '#666' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ONGLETS */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { v: 'listings', l: `Annonces${pendingListings.length > 0 ? ` (${pendingListings.length})` : ''}` },
            { v: 'services', l: 'Services' },
            { v: 'reviews', l: 'Avis' },
            { v: 'reports', l: `Signalements${reports.length > 0 ? ` (${reports.length})` : ''}` },
          ].map(tab => (
            <button key={tab.v} onClick={() => setActiveTab(tab.v)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                backgroundColor: activeTab === tab.v ? '#FF5500' : '#111118',
                color: activeTab === tab.v ? '#FFFFFF' : '#666',
                border: activeTab === tab.v ? 'none' : '1px solid #1A1A2E'
              }}>
              {tab.l}
            </button>
          ))}
        </div>

        {/* ANNONCES */}
        {activeTab === 'listings' && (
          <div className="rounded-[20px] overflow-hidden" style={{ backgroundColor: '#111118', border: '1px solid #1A1A2E' }}>
            {listings.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: '#666' }}>Aucune annonce</p>
            ) : listings.map(listing => (
              <div key={listing.id} className="p-4 flex gap-3 transition-colors" style={{ borderBottom: '1px solid #1A1A2E' }}>
                <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: '#1A1A2E' }}>
                  {listing.images?.[0] ? (
                    <img src={listing.images[0].imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: '#0A0A0F' }}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-white">{listing.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#666' }}>{listing.user.name} · {listing.locationCity} · {new Date(listing.createdAt).toLocaleDateString('fr-FR')}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: statusColors[listing.status]?.bg, color: statusColors[listing.status]?.color }}>
                      {statusColors[listing.status]?.label}
                    </span>
                    <span className="font-bold text-sm" style={{ color: '#FF5500' }}>{parseFloat(listing.price?.toString() || '0').toLocaleString()} EUR</span>
                  </div>
                </div>
                {listing.status === 'pending' && (
                  <div className="flex flex-col gap-1">
                    <button onClick={() => approveListing(listing.id)} className="text-xs px-3 py-1.5 rounded-lg text-white font-medium" style={{ backgroundColor: '#15803D' }}>
                      Approuver
                    </button>
                    {rejectId === listing.id ? (
                      <div className="flex flex-col gap-1">
                        <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Motif..." className="text-xs px-2 py-1 rounded-lg focus:outline-none text-white" style={{ backgroundColor: '#1A1A2E', border: '1px solid #2A2A3E', width: '120px' }} />
                        <button onClick={() => rejectListing(listing.id)} className="text-xs px-3 py-1.5 rounded-lg text-white font-medium" style={{ backgroundColor: '#B42318' }}>Confirmer</button>
                        <button onClick={() => setRejectId(null)} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#1A1A2E', color: '#666' }}>Annuler</button>
                      </div>
                    ) : (
                      <button onClick={() => setRejectId(listing.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#1A0000', color: '#B42318' }}>
                        Rejeter
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* SERVICES */}
        {activeTab === 'services' && (
          <div className="rounded-[20px] overflow-hidden" style={{ backgroundColor: '#111118', border: '1px solid #1A1A2E' }}>
            {services.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: '#666' }}>Aucun service</p>
            ) : services.map(service => (
              <div key={service.id} className="p-4 flex items-center gap-3 transition-colors" style={{ borderBottom: '1px solid #1A1A2E' }}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-white">{service.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#666' }}>{service.user.name} · {service.city} · {new Date(service.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: service.isVisible ? '#001A0A' : '#1A1A2E', color: service.isVisible ? '#15803D' : '#666' }}>
                  {service.isVisible ? 'Visible' : 'Masque'}
                </span>
                <button onClick={() => toggleService(service.id, service.isVisible)} className="text-xs px-3 py-1.5 rounded-lg transition-all" style={{ backgroundColor: service.isVisible ? '#1A0000' : '#001A0A', color: service.isVisible ? '#B42318' : '#15803D' }}>
                  {service.isVisible ? 'Masquer' : 'Afficher'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* AVIS */}
        {activeTab === 'reviews' && (
          <div className="rounded-[20px] overflow-hidden" style={{ backgroundColor: '#111118', border: '1px solid #1A1A2E' }}>
            {reviews.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: '#666' }}>Aucun avis</p>
            ) : reviews.map(review => (
              <div key={review.id} className="p-4 flex gap-3 transition-colors" style={{ borderBottom: '1px solid #1A1A2E' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm text-white">{review.user.name}</p>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => <span key={s} className="text-xs" style={{ color: s <= review.rating ? '#FF5500' : '#0A0A0F' }}>★</span>)}
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: '#8A8F9A' }}>{review.comment}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => toggleReview(review.id, review.isVisible)} className="text-xs px-3 py-1.5 rounded-lg transition-all" style={{ backgroundColor: review.isVisible ? '#1A0000' : '#001A0A', color: review.isVisible ? '#B42318' : '#15803D' }}>
                    {review.isVisible ? 'Masquer' : 'Afficher'}
                  </button>
                  <button onClick={() => deleteReview(review.id)} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#1A1A2E', color: '#B42318' }}>
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SIGNALEMENTS */}
        {activeTab === 'reports' && (
          <div className="rounded-[20px] overflow-hidden" style={{ backgroundColor: '#111118', border: '1px solid #1A1A2E' }}>
            {reports.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: '#666' }}>Aucun signalement</p>
            ) : reports.map(report => (
              <div key={report.id} className="p-4 flex gap-3 transition-colors" style={{ borderBottom: '1px solid #1A1A2E' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#1A0800', color: '#FF5500', border: '1px solid #3A1500' }}>
                      🚩 Signalement
                    </span>
                    <p className="font-medium text-sm truncate text-white">{report.listing.title}</p>
                  </div>
                  <p className="text-xs mb-1" style={{ color: '#8A8F9A' }}>Motif : <strong style={{ color: '#FF5500' }}>{report.reason}</strong></p>
                  <p className="text-xs" style={{ color: '#666' }}>
                    Signale par {report.reporter.name} · {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <a href={`/annonces/${report.listing.id}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg text-center transition-all"
                    style={{ backgroundColor: '#1A1A2E', border: '1px solid #2A2A3E', color: '#8A8F9A' }}>
                    Voir
                  </a>
                  <button onClick={() => deleteReport(report.id)} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#1A0000', color: '#B42318' }}>
                    Ignorer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
