'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Profile = 'individual' | 'seller' | 'fleet' | 'provider'

interface Listing {
  id: string
  title: string
  status: 'pending' | 'active' | 'sold' | 'rented' | 'rejected' | 'expired'
  price: number
  listingType: 'sale' | 'rent'
  expiresAt: string | null
  viewsCount: number
  rejectionReason: string | null
  image: string | null
  _count: { favorites: number; messages: number }
}
interface Dashboard {
  profile: Profile
  user: {
    name: string
    accountType: 'individual' | 'professional'
    isAdmin: boolean
    company: { legalName: string; tradeName: string | null; verificationStatus: string } | null
  }
  plan: {
    tier: 'standard' | 'pro'
    limits: { label: string; maxActiveListings: number; maxPhotos: number; listingDurationDays: number; autoRenew: boolean }
    subscription: { status: string; trialEndsAt: string | null; currentPeriodEnd: string | null } | null
  }
  kpis: {
    activeListings: number
    countedListings: number
    maxListings: number
    totalViews: number
    favoritesReceived: number
    contactsReceived: number
    unreadMessages: number
    favoritesSaved: number
  }
  todo: { id: string; level: 'urgent' | 'info'; text: string; href: string; cta: string }[]
  listings: Listing[]
  conversations: { from: string; subject: string; preview: string; at: string; unread: boolean }[]
  services: { id: string; name: string; category: string; city: string; isVisible: boolean; _count: { messages: number } }[]
}

const STATUS_UI: Record<Listing['status'], { label: string; bg: string; color: string }> = {
  pending: { label: 'En validation', bg: '#FFFBEB', color: '#B45309' },
  active: { label: 'En ligne', bg: '#F0FFF4', color: '#15803D' },
  sold: { label: 'Vendu', bg: '#F0F0F0', color: '#555' },
  rented: { label: 'Loue', bg: '#F0F0F0', color: '#555' },
  rejected: { label: 'Refusee', bg: '#FFF0F0', color: '#DC2626' },
  expired: { label: 'Expiree', bg: '#FFF5F0', color: '#FF5500' },
}

const PROFILE_TITLE: Record<Profile, string> = {
  individual: 'Mon espace',
  seller: 'Espace vendeur pro',
  fleet: 'Espace flotte',
  provider: 'Espace prestataire',
}

const CATEGORY_LABELS: Record<string, string> = {
  maintenance: 'Entretien', formation: 'Formation', insurance: 'Assurance', accessories: 'Accessoires',
}

const card = { backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }
const euros = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '')

export default function EspacePage() {
  const router = useRouter()
  const [data, setData] = useState<Dashboard | null>(null)
  const [filter, setFilter] = useState<'all' | 'online' | 'todo'>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchDashboard = useCallback(async (): Promise<Dashboard | null> => {
    const res = await fetch('/api/dashboard', { credentials: 'include' })
    if (res.status === 401) { router.push('/login?redirect=/espace'); return null }
    return res.json()
  }, [router])

  const reload = useCallback(() => {
    fetchDashboard().then(d => { if (d) setData(d) })
  }, [fetchDashboard])

  useEffect(() => {
    fetchDashboard().then(d => { if (d) setData(d) })
  }, [fetchDashboard])

  const act = async (id: string, url: string, init: RequestInit) => {
    setBusyId(id)
    setError('')
    const res = await fetch(url, { credentials: 'include', ...init })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.message || 'Action impossible')
    }
    setBusyId(null)
    reload()
  }

  const reactivate = (id: string) => act(id, `/api/listings/${id}/reactivate`, { method: 'POST' })
  const markDone = (l: Listing) => act(l.id, `/api/listings/${l.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: l.listingType === 'rent' ? 'rented' : 'sold' }),
  })
  const remove = (id: string) => {
    if (!confirm('Supprimer cette annonce ?')) return
    act(id, `/api/listings/${id}`, { method: 'DELETE' })
  }

  if (!data) {
    return <div className="min-h-screen flex items-center justify-center" style={{ color: '#888' }}>Chargement...</div>
  }

  const { profile, user, plan, kpis } = data
  const isPro = plan.tier === 'pro'
  const atLimit = kpis.countedListings >= kpis.maxListings
  const certified = user.company?.verificationStatus === 'verified'
  const showListings = profile !== 'provider' || data.listings.length > 0
  const showServices = profile === 'provider' || data.services.length > 0

  const listings = data.listings.filter(l =>
    filter === 'all' ? true
    : filter === 'online' ? l.status === 'active' || l.status === 'pending'
    : l.status === 'expired' || l.status === 'rejected')

  const kpiCards = profile === 'provider'
    ? [
        { label: 'Fiches services', value: data.services.length, hint: `${data.services.filter(s => s.isVisible).length} visible(s)` },
        { label: 'Contacts recus', value: kpis.contactsReceived, hint: 'personnes vous ont ecrit' },
        { label: 'Messages non lus', value: kpis.unreadMessages, hint: 'a traiter', highlight: kpis.unreadMessages > 0 },
        { label: 'Annonces', value: kpis.activeListings, hint: 'en ligne' },
      ]
    : [
        { label: 'Annonces actives', value: `${kpis.countedListings}/${kpis.maxListings}`, hint: `pack ${plan.limits.label}`, highlight: atLimit },
        { label: 'Vues', value: kpis.totalViews, hint: 'sur toutes vos annonces' },
        { label: 'Contacts recus', value: kpis.contactsReceived, hint: 'acheteurs interesses' },
        { label: 'Mis en favori', value: kpis.favoritesReceived, hint: 'par des membres' },
      ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
      {/* EN-TETE */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-sm" style={{ color: '#888' }}>{PROFILE_TITLE[profile]}</p>
          <h1 className="text-2xl font-black" style={{ color: '#1A1A1A' }}>Bonjour {user.name.split(' ')[0]} 👋</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: isPro ? '#FF5500' : '#F0F0F0', color: isPro ? '#FFFFFF' : '#555' }}>
              Pack {plan.limits.label}{plan.subscription?.status === 'trialing' ? ` · offert jusqu'au ${date(plan.subscription.trialEndsAt)}` : ''}
            </span>
            {user.company && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: certified ? '#F0FFF4' : '#F8F8F8', color: certified ? '#15803D' : '#888' }}>
                {certified ? '🛡️ Pro certifie' : 'Non certifie'} · {user.company.tradeName ?? user.company.legalName}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.isAdmin && (
            <Link href="/admin" className="px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#1A1A1A' }}>Administration</Link>
          )}
          {profile === 'provider' ? (
            <Link href="/services/new" className="px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#FF5500' }}>+ Nouvelle fiche service</Link>
          ) : (
            <Link href="/annonces/new" className="px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: atLimit ? '#CCC' : '#FF5500', pointerEvents: atLimit ? 'none' : 'auto' }}>
              + Nouvelle annonce
            </Link>
          )}
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: '#FFF0F0', color: '#DC2626' }}>{error}</div>}

      {/* A FAIRE */}
      {data.todo.length > 0 && (
        <div className="rounded-2xl p-5 mb-6" style={card}>
          <h2 className="font-bold mb-3" style={{ color: '#1A1A1A' }}>À faire</h2>
          <div className="space-y-2">
            {data.todo.map(t => (
              <div key={t.id} className="flex items-center justify-between gap-3 p-3 rounded-xl"
                style={{ backgroundColor: t.level === 'urgent' ? '#FFF5F0' : '#F8F8F8' }}>
                <p className="text-sm" style={{ color: '#333' }}>{t.level === 'urgent' ? '🔴' : '🔵'} {t.text}</p>
                <Link href={t.href} className="text-xs font-bold flex-shrink-0" style={{ color: '#FF5500' }}>{t.cta} →</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INDICATEURS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {kpiCards.map(k => (
          <div key={k.label} className="rounded-2xl p-4" style={{ ...card, borderColor: k.highlight ? '#FFD0B0' : '#E8E8E8' }}>
            <p className="text-xs" style={{ color: '#888' }}>{k.label}</p>
            <p className="text-2xl font-black mt-1" style={{ color: k.highlight ? '#FF5500' : '#1A1A1A' }}>{k.value}</p>
            <p className="text-xs mt-0.5" style={{ color: '#AAA' }}>{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* FLOTTE : capacite */}
          {profile === 'fleet' && (
            <div className="rounded-2xl p-5" style={card}>
              <div className="flex justify-between items-center">
                <h2 className="font-bold" style={{ color: '#1A1A1A' }}>Capacite de publication</h2>
                <span className="text-sm" style={{ color: '#888' }}>{kpis.countedListings} / {kpis.maxListings} annonces</span>
              </div>
              <div className="h-2 rounded-full mt-3" style={{ backgroundColor: '#F0F0F0' }}>
                <div className="h-2 rounded-full" style={{ width: `${Math.min(100, (kpis.countedListings / kpis.maxListings) * 100)}%`, backgroundColor: atLimit ? '#EF4444' : '#FF5500' }} />
              </div>
              <p className="text-xs mt-3" style={{ color: '#888' }}>
                Import de plusieurs vehicules par fichier CSV et pack Flotte au-dela de {plan.limits.maxActiveListings} annonces : bientot disponibles.
              </p>
            </div>
          )}

          {/* PRESTATAIRE : fiches services */}
          {showServices && (
            <div className="rounded-2xl p-5" style={card}>
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold" style={{ color: '#1A1A1A' }}>Mes fiches services</h2>
                <Link href="/services/new" className="text-sm font-bold" style={{ color: '#FF5500' }}>+ Ajouter</Link>
              </div>
              {data.services.length === 0 ? (
                <p className="text-sm" style={{ color: '#888' }}>Aucune fiche. Creez-en une pour apparaitre dans l&apos;annuaire des prestataires.</p>
              ) : data.services.map(s => (
                <Link key={s.id} href={`/services/${s.id}`} className="flex items-center justify-between gap-3 py-3" style={{ borderTop: '1px solid #F0F0F0' }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>{s.name}</p>
                    <p className="text-xs" style={{ color: '#888' }}>{CATEGORY_LABELS[s.category] ?? s.category} · {s.city}{!s.isVisible ? ' · masquee par la moderation' : ''}</p>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: '#555' }}>{s._count.messages} message(s)</span>
                </Link>
              ))}
            </div>
          )}

          {/* ANNONCES */}
          {showListings && (
            <div id="annonces" className="rounded-2xl p-5" style={card}>
              <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                <h2 className="font-bold" style={{ color: '#1A1A1A' }}>Mes annonces</h2>
                <div className="flex gap-1">
                  {([['all', 'Toutes'], ['online', 'En ligne'], ['todo', 'A traiter']] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setFilter(v)} className="px-3 py-1 rounded-lg text-xs font-medium"
                      style={{ backgroundColor: filter === v ? '#FF5500' : '#F8F8F8', color: filter === v ? '#FFFFFF' : '#888' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {listings.length === 0 ? (
                <p className="text-sm py-4" style={{ color: '#888' }}>Aucune annonce ici.</p>
              ) : listings.map(l => {
                const st = STATUS_UI[l.status]
                return (
                  <div key={l.id} className="flex gap-3 py-3" style={{ borderTop: '1px solid #F0F0F0' }}>
                    <div className="w-20 h-16 rounded-xl flex-shrink-0 bg-cover bg-center" style={{ backgroundColor: '#F0F0F0', backgroundImage: l.image ? `url(${l.image})` : undefined }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/annonces/${l.id}`} className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>{l.title}</Link>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: '#888' }}>
                        {euros(l.price)} · {l.viewsCount} vues · {l._count.favorites} favoris · {l._count.messages} messages
                        {l.status === 'active' && l.expiresAt ? ` · ${plan.limits.autoRenew ? 'renouvelee le' : 'expire le'} ${date(l.expiresAt)}` : ''}
                      </p>
                      {l.status === 'rejected' && l.rejectionReason && (
                        <p className="text-xs mt-1" style={{ color: '#DC2626' }}>Motif : {l.rejectionReason}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-xs font-medium">
                        {l.status === 'expired' && (
                          <button disabled={busyId === l.id} onClick={() => reactivate(l.id)} style={{ color: '#FF5500' }}>Reactiver</button>
                        )}
                        {l.status === 'active' && (
                          <button disabled={busyId === l.id} onClick={() => markDone(l)} style={{ color: '#555' }}>
                            Marquer comme {l.listingType === 'rent' ? 'loue' : 'vendu'}
                          </button>
                        )}
                        <button disabled={busyId === l.id} onClick={() => remove(l.id)} style={{ color: '#EF4444' }}>Supprimer</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* COLONNE DROITE */}
        <div className="space-y-6">
          {!isPro && (
            <div className="rounded-2xl p-5" style={{ backgroundColor: '#FFF5F0', border: '1px solid #FFD0B0' }}>
              <p className="font-bold" style={{ color: '#1A1A1A' }}>
                {atLimit ? `Limite de ${kpis.maxListings} annonces atteinte` : 'Vendez plus vite avec le Pro'}
              </p>
              <ul className="text-sm mt-2 space-y-1" style={{ color: '#555' }}>
                <li>✓ 20 annonces et 7 photos par annonce</li>
                <li>✓ Renouvellement automatique</li>
                <li>✓ Validation prioritaire sous 12 h</li>
              </ul>
              <Link href="/abonnement" className="block text-center mt-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#FF5500' }}>
                Essayer Pro · 1er mois offert
              </Link>
            </div>
          )}

          <div className="rounded-2xl p-5" style={card}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold" style={{ color: '#1A1A1A' }}>Derniers messages</h2>
              <Link href="/messages" className="text-xs font-bold" style={{ color: '#FF5500' }}>Tout voir</Link>
            </div>
            {data.conversations.length === 0 ? (
              <p className="text-sm" style={{ color: '#888' }}>Aucun message pour le moment.</p>
            ) : data.conversations.map((c, i) => (
              <Link key={i} href="/messages" className="block py-2.5" style={{ borderTop: i ? '1px solid #F0F0F0' : 'none' }}>
                <div className="flex justify-between gap-2">
                  <p className="text-sm font-medium truncate" style={{ color: '#1A1A1A' }}>{c.unread ? '● ' : ''}{c.from}</p>
                  <span className="text-xs flex-shrink-0" style={{ color: '#AAA' }}>{date(c.at)}</span>
                </div>
                <p className="text-xs truncate" style={{ color: '#888' }}>{c.subject}</p>
                <p className="text-xs truncate" style={{ color: '#AAA' }}>{c.preview}</p>
              </Link>
            ))}
          </div>

          <div className="rounded-2xl p-5" style={card}>
            <h2 className="font-bold mb-2" style={{ color: '#1A1A1A' }}>Mon compte</h2>
            {[
              { href: '/profil', label: 'Mes informations' },
              { href: '/abonnement', label: 'Abonnement et factures' },
              ...(user.accountType === 'professional' ? [{ href: '/profil/certification', label: 'Certification de la societe' }] : []),
              { href: '/favoris', label: `Mes favoris (${kpis.favoritesSaved})` },
            ].map(item => (
              <Link key={item.href} href={item.href} className="flex justify-between py-2 text-sm" style={{ color: '#333' }}>
                {item.label}<span style={{ color: '#CCC' }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
