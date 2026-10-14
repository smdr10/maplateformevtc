'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email: string
  phone: string | null
  companyName: string | null
  role: string
}

interface Listing {
  id: string
  title: string
  brand: string
  model: string
  year: number
  price: number
  status: string
  listingType: string
  rentDuration: string | null
  locationCity: string
  createdAt: string
  images: { imageUrl: string }[]
}

interface Stats {
  totalViews: number
  totalContacts: number
  totalFavorites: number
  totalListings: number
}

export default function ProfilPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', companyName: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me', { credentials: 'include' }).then(r => r.ok ? r.json() : null),
      fetch('/api/profile/listings', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/profile/stats', { credentials: 'include' }).then(r => r.json()),
    ]).then(([meData, listingsData, statsData]) => {
      if (!meData?.user) { router.push('/login?redirect=/profil'); return }
      setUser(meData.user)
      setEditForm({ name: meData.user.name, phone: meData.user.phone || '', companyName: meData.user.companyName || '' })
      setListings(listingsData.listings || [])
      setStats(statsData)
      setLoading(false)
    }).catch(() => router.push('/login'))
  }, [router])

  const saveProfile = async () => {
    setSaving(true)
    const res = await fetch('/api/profile/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      const data = await res.json()
      setUser(data.user)
      setEditing(false)
    }
    setSaving(false)
  }

  const deleteListing = async (id: string) => {
    if (!confirm('Supprimer cette annonce ?')) return
    await fetch(`/api/listings/${id}`, { method: 'DELETE', credentials: 'include' })
    setListings(prev => prev.filter(l => l.id !== id))
  }

  const filteredListings = activeTab === 'all' ? listings
    : activeTab === 'active' ? listings.filter(l => l.status === 'active')
    : activeTab === 'pending' ? listings.filter(l => l.status === 'pending')
    : listings.filter(l => ['sold', 'rented', 'rejected', 'expired'].includes(l.status))

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F8F8' }}>
      <div style={{ color: '#888' }}>Chargement...</div>
    </div>
  )

  const inputStyle = { backgroundColor: '#F8F8F8', borderColor: '#E8E8E8', color: '#1A1A1A' }
  const inputClass = "w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-orange-400 transition-all"

  const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    active: { bg: '#F0FFF4', color: '#22C55E', label: 'Active' },
    pending: { bg: '#FFFBEB', color: '#F59E0B', label: 'En attente' },
    sold: { bg: '#EFF6FF', color: '#3B82F6', label: 'Vendue' },
    rented: { bg: '#EFF6FF', color: '#3B82F6', label: 'Louee' },
    rejected: { bg: '#FFF0F0', color: '#EF4444', label: 'Rejetee' },
    expired: { bg: '#F8F8F8', color: '#888', label: 'Expiree' },
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 min-h-screen" style={{ backgroundColor: '#F8F8F8' }}>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* PROFIL */}
        <div className="space-y-4">
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: '#FF5500' }}>
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold" style={{ color: '#1A1A1A' }}>{user?.name}</p>
                <p className="text-sm" style={{ color: '#888' }}>{user?.email}</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#FFF5F0', color: '#FF5500' }}>
                  {user?.role === 'admin' ? 'Administrateur' : user?.role === 'pro' ? 'Professionnel' : 'Particulier'}
                </span>
              </div>
            </div>
            <a href="/profil/certification" className="flex items-center justify-between mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: '#F0FFF4', border: '1px solid #BBF7D0', color: '#15803D' }}>
              <span>🛡️ {user?.role === 'pro' ? 'Certification de ma societe' : 'Vous etes professionnel ? Faites certifier votre societe'}</span>
              <span>→</span>
            </a>

            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#888' }}>Nom</label>
                  <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#888' }}>Telephone</label>
                  <input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: '#888' }}>Entreprise</label>
                  <input value={editForm.companyName} onChange={e => setEditForm(p => ({ ...p, companyName: e.target.value }))} className={inputClass} style={inputStyle} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-xl text-sm transition-all" style={{ backgroundColor: '#F8F8F8', border: '1px solid #E8E8E8', color: '#888' }}>Annuler</button>
                  <button onClick={saveProfile} disabled={saving} className="flex-1 py-2 rounded-xl text-sm text-white font-medium disabled:opacity-50 transition-all" style={{ backgroundColor: '#FF5500' }}>
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="w-full py-2 rounded-xl text-sm transition-all hover:border-orange-300" style={{ backgroundColor: '#F8F8F8', border: '1px solid #E8E8E8', color: '#555' }}>
                Modifier mon profil
              </button>
            )}
          </div>

          {stats && (
            <div className="rounded-2xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
              <p className="font-bold text-sm mb-3" style={{ color: '#1A1A1A' }}>Mes statistiques</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Annonces', value: stats.totalListings },
                  { label: 'Vues', value: stats.totalViews },
                  { label: 'Contacts', value: stats.totalContacts },
                  { label: 'Favoris', value: stats.totalFavorites },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 rounded-xl" style={{ backgroundColor: '#F8F8F8' }}>
                    <p className="text-xl font-black" style={{ color: '#FF5500' }}>{s.value}</p>
                    <p className="text-xs" style={{ color: '#888' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl p-5 space-y-2" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
            <p className="font-bold text-sm mb-3" style={{ color: '#1A1A1A' }}>Navigation rapide</p>
            {[
              { href: '/messages', label: 'Mes messages' },
              { href: '/favoris', label: 'Mes favoris' },
              { href: '/annonces/new', label: 'Publier une annonce' },
              { href: '/avis', label: 'Laisser un avis' },
            ].map(item => (
              <Link key={item.href} href={item.href} className="flex items-center justify-between p-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors" style={{ color: '#333' }}>
                {item.label}
                <span style={{ color: '#CCC' }}>→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* MES ANNONCES */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
            <div className="p-5" style={{ borderBottom: '1px solid #F0F0F0' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold" style={{ color: '#1A1A1A' }}>Mes annonces</h2>
                <Link href="/annonces/new" className="text-sm font-medium text-white px-3 py-1.5 rounded-xl" style={{ backgroundColor: '#FF5500' }}>+ Nouvelle</Link>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { v: 'all', l: 'Toutes' },
                  { v: 'active', l: 'Actives' },
                  { v: 'pending', l: 'En attente' },
                  { v: 'archived', l: 'Archivees' },
                ].map(tab => (
                  <button key={tab.v} onClick={() => setActiveTab(tab.v)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={{ backgroundColor: activeTab === tab.v ? '#FF5500' : '#F8F8F8', color: activeTab === tab.v ? '#FFFFFF' : '#888', border: activeTab === tab.v ? 'none' : '1px solid #E8E8E8' }}>
                    {tab.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y" style={{ borderColor: '#F0F0F0' }}>
              {filteredListings.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm" style={{ color: '#888' }}>Aucune annonce</p>
                  <Link href="/annonces/new" className="text-sm font-medium mt-2 inline-block" style={{ color: '#FF5500' }}>Publier ma premiere annonce</Link>
                </div>
              ) : filteredListings.map(listing => (
                <div key={listing.id} className="p-4 flex gap-3 hover:bg-gray-50 transition-colors">
                  <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: '#F0F0F0' }}>
                    {listing.images[0] ? (
                      <img src={listing.images[0].imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: '#CCC' }}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: '#1A1A1A' }}>{listing.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#888' }}>{listing.year} · {listing.locationCity}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: statusColors[listing.status]?.bg, color: statusColors[listing.status]?.color }}>
                        {statusColors[listing.status]?.label}
                      </span>
                      <span className="font-bold text-sm" style={{ color: '#FF5500' }}>{parseFloat(listing.price.toString()).toLocaleString()} EUR</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link href={`/annonces/${listing.id}`} className="text-xs px-2 py-1 rounded-lg text-center transition-all" style={{ backgroundColor: '#F8F8F8', border: '1px solid #E8E8E8', color: '#555' }}>Voir</Link>
                    <button onClick={() => deleteListing(listing.id)} className="text-xs px-2 py-1 rounded-lg transition-all" style={{ backgroundColor: '#FFF0F0', color: '#EF4444' }}>Suppr.</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
