'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  companyName: string | null
}

interface Stats {
  totalViews: number
  totalFavorites: number
  totalContacts: number
  byStatus: Record<string, number>
}

interface Listing {
  id: string
  title: string
  brand: string
  model: string
  price: number
  listingType: string
  status: string
  locationCity: string
  images: { imageUrl: string }[]
  _count: { favorites: number; messages: number }
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:  { label: 'Active',     color: 'bg-green-500/20 text-green-400 border border-green-500/20' },
  pending: { label: 'En attente', color: 'bg-orange-500/20 text-orange-400 border border-orange-500/20' },
  sold:    { label: 'Vendu',      color: 'bg-gray-500/20 text-gray-400 border border-gray-500/20' },
  rented:  { label: 'Loue',       color: 'bg-gray-500/20 text-gray-400 border border-gray-500/20' },
  rejected:{ label: 'Refuse',     color: 'bg-red-500/20 text-red-400 border border-red-500/20' },
  expired: { label: 'Expire',     color: 'bg-gray-500/20 text-gray-400 border border-gray-500/20' },
}

export default function ProfilPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', companyName: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' })
      if (!meRes.ok) { router.push('/login?redirect=/profil'); return }
      const meData = await meRes.json()
      setUser(meData.user)
      setEditForm({ name: meData.user.name, phone: meData.user.phone || '', companyName: meData.user.companyName || '' })
      const [statsRes, listingsRes] = await Promise.all([
        fetch('/api/profile/stats', { credentials: 'include' }),
        fetch('/api/profile/listings', { credentials: 'include' }),
      ])
      setStats(await statsRes.json())
      const listingsData = await listingsRes.json()
      setListings(listingsData.listings || [])
      setLoading(false)
    }
    load()
  }, [router])

  const filteredListings = listings.filter(l => {
    if (activeTab === 'all') return true
    if (activeTab === 'active') return l.status === 'active'
    if (activeTab === 'pending') return l.status === 'pending'
    if (activeTab === 'archived') return ['sold','rented','expired','rejected'].includes(l.status)
    return true
  })

  const markAsSoldOrRented = async (id: string, listingType: string) => {
    const status = listingType === 'sale' ? 'sold' : 'rented'
    const res = await fetch(`/api/listings/${id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ status }),
    })
    if (res.ok) setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l))
  }

  const deleteListing = async (id: string) => {
    if (!confirm('Supprimer cette annonce ?')) return
    const res = await fetch(`/api/listings/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) setListings(prev => prev.filter(l => l.id !== id))
  }

  const saveProfile = async () => {
    setSaving(true)
    const res = await fetch('/api/profile/update', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify(editForm),
    })
    if (res.ok) { const data = await res.json(); setUser(data.user); setEditing(false) }
    setSaving(false)
  }

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-500">Chargement...</div>
  if (!user) return null

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 min-h-screen">

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-xl flex-shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-lg font-bold text-white">{user.name}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/20 font-medium">
              {user.role === 'pro' ? 'Pro' : user.role === 'admin' ? 'Admin' : 'Chauffeur VTC'}
            </span>
          </div>
          <p className="text-sm text-gray-500">{user.email}</p>
          {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}

          {!editing ? (
            <button onClick={() => setEditing(true)} className="mt-3 text-sm text-orange-500 hover:text-orange-400 font-medium transition-colors">
              Modifier mes informations
            </button>
          ) : (
            <div className="mt-4 space-y-3 max-w-sm">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nom</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Telephone</label>
                <input type="tel" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all" />
              </div>
              {user.role === 'pro' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nom entreprise</label>
                  <input type="text" value={editForm.companyName} onChange={e => setEditForm(p => ({ ...p, companyName: e.target.value }))} className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500/50 transition-all" />
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="px-4 py-1.5 text-sm bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:bg-gray-800 transition-all">Annuler</button>
                <button onClick={saveProfile} disabled={saving} className="px-4 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-all">
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { value: stats.totalViews, label: 'Vues totales' },
            { value: stats.totalContacts, label: 'Contacts recus' },
            { value: (stats.byStatus.active || 0) + (stats.byStatus.pending || 0), label: 'Annonces actives' },
            { value: stats.totalFavorites, label: 'Favoris recus' },
          ].map((stat, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="flex gap-1 mb-4 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit">
          {[
            ['all', `Toutes (${listings.length})`],
            ['active', `Actives (${listings.filter(l => l.status === 'active').length})`],
            ['pending', `En attente (${listings.filter(l => l.status === 'pending').length})`],
            ['archived', `Archivees (${listings.filter(l => ['sold','rented','expired','rejected'].includes(l.status)).length})`],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${activeTab === key ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {filteredListings.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-2xl border border-gray-800">
            <p className="text-gray-500">Aucune annonce dans cette categorie</p>
            <Link href="/annonces/new" className="text-orange-500 text-sm font-medium hover:underline mt-2 inline-block">
              Publier une annonce
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredListings.map(listing => {
              const statusInfo = STATUS_LABELS[listing.status] || STATUS_LABELS.pending
              return (
                <div key={listing.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-4 items-center hover:border-gray-800 transition-all">
                  <div className="w-16 h-12 rounded-lg bg-gray-900 overflow-hidden flex-shrink-0">
                    {listing.images[0] ? (
                      <img src={listing.images[0].imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">N/A</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{listing.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{parseFloat(listing.price.toString()).toLocaleString()} EUR · {listing.locationCity} · {listing._count.favorites} favoris · {listing._count.messages} messages</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link href={`/annonces/${listing.id}`} className="text-xs px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all">Voir</Link>
                    {listing.status === 'active' && (
                      <button onClick={() => markAsSoldOrRented(listing.id, listing.listingType)} className="text-xs px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all">
                        {listing.listingType === 'sale' ? 'Vendu' : 'Loue'}
                      </button>
                    )}
                    <button onClick={() => deleteListing(listing.id)} className="text-xs px-3 py-1.5 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/10 transition-all">Supprimer</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}