import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'
import { getUserPlan, COUNTED_LISTING_STATUSES } from '@/lib/plans'
import { ProActivity } from '@/lib/verification'

const DAY_MS = 24 * 60 * 60 * 1000

// Activites qui publient surtout des annonces de vehicules / des fiches services
const SELLER_ACTIVITIES: ProActivity[] = ['driver_independent', 'fleet', 'dealer', 'lessor_loa']
const PROVIDER_ACTIVITIES: ProActivity[] = ['garage', 'insurer', 'trainer', 'accountant', 'lawyer', 'equipment_supplier']

export type DashboardProfile = 'individual' | 'seller' | 'fleet' | 'provider'

interface TodoItem {
  id: string
  level: 'urgent' | 'info'
  text: string
  href: string
  cta: string
}

// Donnees agregees du tableau de bord, adaptees au profil (particulier, vendeur pro, flotte, prestataire)
export async function GET(req: NextRequest) {
  const auth = getAuthUser(req)
  if (!auth) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  try {
    const userId = auth.sub
    const now = new Date()
    const soon = new Date(now.getTime() + 7 * DAY_MS)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, role: true, accountType: true,
        company: { select: { legalName: true, tradeName: true, activities: true, verificationStatus: true, rejectionReason: true, verificationExpiresAt: true } },
        subscription: { select: { status: true, interval: true, trialEndsAt: true, currentPeriodEnd: true } },
      },
    })
    if (!user) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    const { tier, limits } = await getUserPlan(userId)
    const activities = (user.company?.activities ?? []) as ProActivity[]

    const [listings, views, favoritesReceived, unreadMessages, recentMessages, services, favoritesSaved] = await Promise.all([
      prisma.listing.findMany({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, title: true, status: true, price: true, listingType: true, expiresAt: true,
          viewsCount: true, rejectionReason: true, createdAt: true,
          images: { orderBy: { position: 'asc' }, take: 1, select: { imageUrl: true } },
          _count: { select: { favorites: true, messages: true } },
        },
      }),
      prisma.listing.aggregate({ where: { userId, deletedAt: null }, _sum: { viewsCount: true } }),
      prisma.favorite.count({ where: { listing: { userId, deletedAt: null } } }),
      prisma.message.count({ where: { receiverId: userId, readStatus: false } }),
      prisma.message.findMany({
        where: { receiverId: userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          message: true, createdAt: true, readStatus: true, listingId: true, serviceId: true,
          sender: { select: { id: true, name: true } },
          listing: { select: { title: true } },
          service: { select: { name: true } },
        },
      }),
      prisma.service.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, category: true, city: true, isVisible: true, _count: { select: { messages: true } } },
      }),
      prisma.favorite.count({ where: { userId } }),
    ])

    // Contacts recus = personnes distinctes ayant ecrit (annonces + services)
    const contactsReceived = (await prisma.message.findMany({
      where: { receiverId: userId },
      distinct: ['senderId'],
      select: { senderId: true },
    })).length

    // Une conversation recente par interlocuteur et par sujet
    const seen = new Set<string>()
    const conversations = recentMessages.filter(m => {
      const key = `${m.listingId ?? 's:' + m.serviceId}:${m.sender.id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 5).map(m => ({
      from: m.sender.name,
      subject: m.listing?.title ?? (m.service ? `[Service] ${m.service.name}` : ''),
      preview: m.message.slice(0, 120),
      at: m.createdAt,
      unread: !m.readStatus,
    }))

    const counted = listings.filter(l => (COUNTED_LISTING_STATUSES as readonly string[]).includes(l.status)).length
    const expired = listings.filter(l => l.status === 'expired')
    const rejected = listings.filter(l => l.status === 'rejected')
    const expiringSoon = listings.filter(l => l.status === 'active' && l.expiresAt && l.expiresAt < soon)

    // Profil d'affichage
    let profile: DashboardProfile = 'individual'
    if (user.accountType === 'professional') {
      if (activities.includes('fleet')) profile = 'fleet'
      else if (activities.some(a => PROVIDER_ACTIVITIES.includes(a)) && !activities.some(a => SELLER_ACTIVITIES.includes(a))) profile = 'provider'
      else profile = 'seller'
    }

    // Actions a faire, les plus urgentes d'abord
    const todo: TodoItem[] = []
    if (user.subscription?.status === 'past_due') {
      todo.push({ id: 'payment', level: 'urgent', text: 'Le paiement de votre abonnement Pro a echoue.', href: '/abonnement', cta: 'Mettre a jour ma carte' })
    }
    if (unreadMessages > 0) {
      todo.push({ id: 'messages', level: 'urgent', text: `${unreadMessages} message(s) non lu(s).`, href: '/messages', cta: 'Repondre' })
    }
    if (rejected.length > 0) {
      todo.push({ id: 'rejected', level: 'urgent', text: `${rejected.length} annonce(s) refusee(s) a corriger.`, href: '#annonces', cta: 'Voir' })
    }
    if (expired.length > 0) {
      todo.push({ id: 'expired', level: 'urgent', text: `${expired.length} annonce(s) expiree(s) : reactivez-les pour les remettre en ligne.`, href: '#annonces', cta: 'Reactiver' })
    }
    if (expiringSoon.length > 0 && !limits.autoRenew) {
      todo.push({ id: 'expiring', level: 'info', text: `${expiringSoon.length} annonce(s) expire(nt) dans moins de 7 jours.`, href: '#annonces', cta: 'Voir' })
    }
    if (user.accountType === 'professional') {
      const status = user.company?.verificationStatus ?? 'unverified'
      if (status === 'unverified') todo.push({ id: 'certif', level: 'info', text: 'Faites certifier votre societe pour obtenir le badge « Pro certifie » (gratuit).', href: '/profil/certification', cta: 'Commencer' })
      if (status === 'rejected') todo.push({ id: 'certif', level: 'urgent', text: `Certification refusee : ${user.company?.rejectionReason ?? 'dossier a completer'}.`, href: '/profil/certification', cta: 'Corriger' })
      if (status === 'expired') todo.push({ id: 'certif', level: 'urgent', text: 'Votre certification a expire.', href: '/profil/certification', cta: 'Renouveler' })
    }
    if (profile === 'provider' && services.length === 0) {
      todo.push({ id: 'service', level: 'info', text: 'Creez votre fiche prestataire pour etre trouve par les chauffeurs.', href: '/services/new', cta: 'Creer ma fiche' })
    }
    if (listings.length === 0 && profile !== 'provider') {
      todo.push({ id: 'first', level: 'info', text: 'Publiez votre premiere annonce.', href: '/annonces/new', cta: 'Publier' })
    }

    return NextResponse.json({
      profile,
      user: {
        name: user.name,
        accountType: user.accountType,
        isAdmin: user.role === 'admin',
        company: user.company,
      },
      plan: { tier, limits, subscription: user.subscription },
      kpis: {
        activeListings: listings.filter(l => l.status === 'active').length,
        countedListings: counted,
        maxListings: limits.maxActiveListings,
        totalViews: views._sum.viewsCount ?? 0,
        favoritesReceived,
        contactsReceived,
        unreadMessages,
        favoritesSaved,
      },
      todo,
      listings: listings.map(l => ({ ...l, price: Number(l.price), image: l.images[0]?.imageUrl ?? null, images: undefined })),
      conversations,
      services,
    })
  } catch (error) {
    console.error('[DASHBOARD]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
