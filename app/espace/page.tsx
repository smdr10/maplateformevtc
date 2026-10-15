'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import FleetStats from './FleetStats'
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
    tier: 'standard' | 'pro' | 'flotte'
    limits: { label: string; maxActiveListings: number; maxPhotos: number; listingDurationDays: number; autoRenew: boolean; advancedStats: boolean }
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
  sold: { label: 'Vendu', bg: '#F1F1F3', color: '#4B5160' },
  rented: { label: 'Loué', bg: '#F1F1F3', color: '#4B5160' },
  rejected: { label: 'Refusée', bg: '#FFF0F0', color: '#DC2626' },
  expired: { label: 'Expirée', bg: '#FFF1E8', color: '#16181D' },
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

const card = { backgroundColor: '#FFFFFF', border: '1px solid #ECECEF' }
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
    return <div className="min-h-screen flex items-center justify-center" style={{ color: '#8A8F9A' }}>Chargement...</div>
  }

  const { profile, user, plan, kpis } = data
  const isPro = plan.tier !== 'standard'
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
        { label: 'Contacts reçus', value: kpis.contactsReceived, hint: 'personnes vous ont ecrit' },
        { label: 'Messages non lus', value: kpis.unreadMessages, hint: 'a traiter', highlight: kpis.unreadMessages > 0 },
        { label: 'Annonces', value: kpis.activeListings, hint: 'en ligne' },
      ]
    : [
        { label: 'Annonces actives', value: `${kpis.countedListings}/${kpis.maxListings}`, hint: `pack ${plan.limits.label}`, highlight: atLimit },
        { label: 'Vues', value: kpis.totalViews, hint: 'sur toutes vos annonces' },
        { label: 'Contacts reçus', value: kpis.contactsReceived, hint: 'acheteurs interesses' },
        { label: 'Mis en favori', value: kpis.favoritesReceived, hint: 'par des membres' },
      ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
      {/* EN-TETE */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-sm" style={{ color: '#8A8F9A' }}>{PROFILE_TITLE[profile]}</p>
          <h1 className="text-2xl font-bold" style={{ color: '#16181D' }}>Bonjour {user.name.split(' ')[0]} 👋</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: isPro ? '#FF5500' : '#F1F1F3', color: isPro ? '#FFFFFF' : '#4B5160' }}>
              Pack {plan.limits.label}{plan.subscription?.status === 'trialing' ? ` · offert jusqu'au ${date(plan.subscription.trialEndsAt)}` : ''}
            </span>
            {user.company && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: certified ? '#F0FFF4' : '#F7F7F8', color: certified ? '#15803D' : '#8A8F9A' }}>
                {certified ? '🛡️ Pro certifié' : 'Non certifié'} · {user.company.tradeName ?? user.company.legalName}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.isAdmin && (
            <Link href="/admin" className="px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#FF5500' }}>Administration</Link>
          )}
          {profile === 'provider' ? (
            <Link href="/services/new" className="px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#FF5500' }}>+ Nouvelle fiche service</Link>
          ) : (
            <Link href="/annonces/new" className="px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: atLimit ? '#C4C7CE' : '#FF5500', pointerEvents: atLimit ? 'none' : 'auto' }}>
              + Nouvelle annonce
            </Link>
          )}
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: '#FFF0F0', color: '#DC2626' }}>{error}</div>}

      {/* A FAIRE */}
      {data.todo.length > 0 && (
        <div className="rounded-[20px] p-5 mb-6" style={card}>
          <h2 className="font-bold mb-3" style={{ color: '#16181D' }}>À faire</h2>
          <div className="space-y-2">
            {data.todo.map(t => (
              <div key={t.id} className="flex items-center justify-between gap-3 p-3 rounded-xl"
                style={{ backgroundColor: t.level === 'urgent' ? '#FFF1E8' : '#F7F7F8' }}>
                <p className="text-sm" style={{ color: '#16181D' }}>{t.level === 'urgent' ? '🔴' : '🔵'} {t.text}</p>
                <Link href={t.href} className="text-xs font-bold flex-shrink-0" style={{ color: '#16181D' }}>{t.cta} →</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INDICATEURS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {kpiCards.map(k => (
          <div key={k.label} className="rounded-[20px] p-4" style={{ ...card, borderColor: k.highlight ? '#FFD0B0' : '#ECECEF' }}>
            <p className="text-xs" style={{ color: '#8A8F9A' }}>{k.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: k.highlight ? '#16181D' : '#16181D' }}>{k.value}</p>
            <p className="text-xs mt-0.5" style={{ color: '#8A8F9A' }}>{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* STATISTIQUES AVANCEES (pack Flotte) */}
          {plan.limits.advancedStats ? (
            <FleetStats />
          ) : (profile === 'fleet' || profile === 'seller') && (
            <div className="panel flex flex-wrap items-center justify-between gap-4 bg-signal-soft p-5">
              <div>
                <p className="display text-2xl">Statistiques détaillées et baromètre de la demande</p>
                <p className="mt-1 text-sm text-ink-soft">Vues et contacts par véhicule et par jour, prix comparé au marché, recherches des chauffeurs dans votre ville.</p>
              </div>
              <Link href="/abonnement" className="btn btn-ink">Découvrir le pack Flotte</Link>
            </div>
          )}

          {/* FLOTTE : capacite */}
          {profile === 'fleet' && (
            <div className="rounded-[20px] p-5" style={card}>
              <div className="flex justify-between items-center">
                <h2 className="font-bold" style={{ color: '#16181D' }}>Capacite de publication</h2>
                <span className="text-sm" style={{ color: '#8A8F9A' }}>{kpis.countedListings} / {kpis.maxListings} annonces</span>
              </div>
              <div className="h-2 rounded-full mt-3" style={{ backgroundColor: '#F1F1F3' }}>
                <div className="h-2 rounded-full" style={{ width: `${Math.min(100, (kpis.countedListings / kpis.maxListings) * 100)}%`, backgroundColor: atLimit ? '#B42318' : '#FF5500' }} />
              </div>
              <p className="text-xs mt-3" style={{ color: '#8A8F9A' }}>
                Import de plusieurs vehicules par fichier CSV et pack Flotte au-dela de {plan.limits.maxActiveListings} annonces : bientot disponibles.
              </p>
            </div>
          )}

          {/* PRESTATAIRE : fiches services */}
          {showServices && (
            <div className="rounded-[20px] p-5" style={card}>
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-bold" style={{ color: '#16181D' }}>Mes fiches services</h2>
                <Link href="/services/new" className="text-sm font-bold" style={{ color: '#16181D' }}>+ Ajouter</Link>
              </div>
              {data.services.length === 0 ? (
                <p className="text-sm" style={{ color: '#8A8F9A' }}>Aucune fiche. Creez-en une pour apparaitre dans l&apos;annuaire des prestataires.</p>
              ) : data.services.map(s => (
                <Link key={s.id} href={`/services/${s.id}`} className="flex items-center justify-between gap-3 py-3" style={{ borderTop: '1px solid #F1F1F3' }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#16181D' }}>{s.name}</p>
                    <p className="text-xs" style={{ color: '#8A8F9A' }}>{CATEGORY_LABELS[s.category] ?? s.category} · {s.city}{!s.isVisible ? ' · masquee par la moderation' : ''}</p>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: '#4B5160' }}>{s._count.messages} message(s)</span>
                </Link>
              ))}
            </div>
          )}

          {/* ANNONCES */}
          {showListings && (
            <div id="annonces" className="rounded-[20px] p-5" style={card}>
              <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                <h2 className="font-bold" style={{ color: '#16181D' }}>Mes annonces</h2>
                <div className="flex gap-1">
                  {([['all', 'Toutes'], ['online', 'En ligne'], ['todo', 'A traiter']] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setFilter(v)} className="px-3 py-1 rounded-lg text-xs font-medium"
                      style={{ backgroundColor: filter === v ? '#FF5500' : '#F7F7F8', color: filter === v ? '#FFFFFF' : '#8A8F9A' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {listings.length === 0 ? (
                <p className="text-sm py-4" style={{ color: '#8A8F9A' }}>Aucune annonce ici.</p>
              ) : listings.map(l => {
                const st = STATUS_UI[l.status]
                return (
                  <div key={l.id} className="flex gap-3 py-3" style={{ borderTop: '1px solid #F1F1F3' }}>
                    <div className="w-20 h-16 rounded-xl flex-shrink-0 bg-cover bg-center" style={{ backgroundColor: '#F1F1F3', backgroundImage: l.image ? `url(${l.image})` : undefined }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/annonces/${l.id}`} className="text-sm font-medium truncate" style={{ color: '#16181D' }}>{l.title}</Link>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: '#8A8F9A' }}>
                        {euros(l.price)} · {l.viewsCount} vues · {l._count.favorites} favoris · {l._count.messages} messages
                        {l.status === 'active' && l.expiresAt ? ` · ${plan.limits.autoRenew ? 'renouvelee le' : 'expire le'} ${date(l.expiresAt)}` : ''}
                      </p>
                      {l.status === 'rejected' && l.rejectionReason && (
                        <p className="text-xs mt-1" style={{ color: '#DC2626' }}>Motif : {l.rejectionReason}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-xs font-medium">
                        {l.status === 'expired' && (
                          <button disabled={busyId === l.id} onClick={() => reactivate(l.id)} style={{ color: '#16181D' }}>Réactiver</button>
                        )}
                        {l.status === 'active' && (
                          <button disabled={busyId === l.id} onClick={() => markDone(l)} style={{ color: '#4B5160' }}>
                            Marquer comme {l.listingType === 'rent' ? 'loue' : 'vendu'}
                          </button>
                        )}
                        <button disabled={busyId === l.id} onClick={() => remove(l.id)} style={{ color: '#B42318' }}>Supprimer</button>
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
            <div className="rounded-[20px] p-5" style={{ backgroundColor: '#FFF1E8', border: '1px solid #FFD0B0' }}>
              <p className="font-bold" style={{ color: '#16181D' }}>
                {atLimit ? `Limite de ${kpis.maxListings} annonces atteinte` : 'Vendez plus vite avec le Pro'}
              </p>
              <ul className="text-sm mt-2 space-y-1" style={{ color: '#4B5160' }}>
                <li>✓ 20 annonces et 7 photos par annonce</li>
                <li>✓ Renouvellement automatique</li>
                <li>✓ Validation prioritaire sous 12 h</li>
              </ul>
              <Link href="/abonnement" className="block text-center mt-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#FF5500' }}>
                Essayer Pro · 1er mois offert
              </Link>
            </div>
          )}

          <div className="rounded-[20px] p-5" style={card}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold" style={{ color: '#16181D' }}>Derniers messages</h2>
              <Link href="/messages" className="text-xs font-bold" style={{ color: '#16181D' }}>Tout voir</Link>
            </div>
            {data.conversations.length === 0 ? (
              <p className="text-sm" style={{ color: '#8A8F9A' }}>Aucun message pour le moment.</p>
            ) : data.conversations.map((c, i) => (
              <Link key={i} href="/messages" className="block py-2.5" style={{ borderTop: i ? '1px solid #F1F1F3' : 'none' }}>
                <div className="flex justify-between gap-2">
                  <p className="text-sm font-medium truncate" style={{ color: '#16181D' }}>{c.unread ? '● ' : ''}{c.from}</p>
                  <span className="text-xs flex-shrink-0" style={{ color: '#8A8F9A' }}>{date(c.at)}</span>
                </div>
                <p className="text-xs truncate" style={{ color: '#8A8F9A' }}>{c.subject}</p>
                <p className="text-xs truncate" style={{ color: '#8A8F9A' }}>{c.preview}</p>
              </Link>
            ))}
          </div>

          <div className="rounded-[20px] p-5" style={card}>
            <h2 className="font-bold mb-2" style={{ color: '#16181D' }}>Mon compte</h2>
            {[
              { href: '/profil', label: 'Mes informations' },
              { href: '/abonnement', label: 'Abonnement et factures' },
              ...(user.accountType === 'professional' ? [{ href: '/profil/certification', label: 'Certification de la société' }] : []),
              { href: '/favoris', label: `Mes favoris (${kpis.favoritesSaved})` },
            ].map(item => (
              <Link key={item.href} href={item.href} className="flex justify-between py-2 text-sm" style={{ color: '#16181D' }}>
                {item.label}<span style={{ color: '#C4C7CE' }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
