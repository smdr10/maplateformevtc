import { prisma } from './prisma'

export type PlanTier = 'standard' | 'pro' | 'flotte'
export type PaidTier = Exclude<PlanTier, 'standard'>
export const PAID_TIERS: PaidTier[] = ['pro', 'flotte']

export function isPaidTier(tier: string): tier is PaidTier {
  return (PAID_TIERS as string[]).includes(tier)
}

export interface PlanLimits {
  label: string
  maxActiveListings: number   // annonces en ligne ou en attente de validation
  minPhotos: number
  maxPhotos: number
  listingDurationDays: number
  autoRenew: boolean          // Pro : renouvellement automatique a l'expiration
  reviewSlaHours: number      // delai de validation annonce
  priorityReview: boolean
  advancedStats: boolean      // Flotte : statistiques par vehicule et par jour
  demandBarometer: boolean    // Flotte : barometre de la demande par ville
}

// Nombre minimum de photos par annonce, commun aux deux packs
export const MIN_PHOTOS = 3

export const PLANS: Record<PlanTier, PlanLimits> = {
  standard: {
    label: 'Standard',
    maxActiveListings: 3,
    minPhotos: MIN_PHOTOS,
    maxPhotos: 3,
    listingDurationDays: 30,
    autoRenew: false,
    reviewSlaHours: 48,
    priorityReview: false,
    advancedStats: false,
    demandBarometer: false,
  },
  pro: {
    label: 'Pro',
    maxActiveListings: 20,
    minPhotos: MIN_PHOTOS,
    maxPhotos: 7,
    listingDurationDays: 60,
    autoRenew: true,
    reviewSlaHours: 12,
    priorityReview: true,
    advancedStats: false,
    demandBarometer: false,
  },
  flotte: {
    label: 'Flotte',
    maxActiveListings: 50,
    minPhotos: MIN_PHOTOS,
    maxPhotos: 12,
    listingDurationDays: 60,
    autoRenew: true,
    reviewSlaHours: 12,
    priorityReview: true,
    advancedStats: true,
    demandBarometer: true,
  },
}

// Tarifs TTC en centimes. L'annuel inclut 2 mois offerts par rapport au mensuel ;
// le premier mois est offert sur le mensuel (premier abonnement uniquement).
export const PAID_PRICING: Record<PaidTier, { month: { amountCents: number; trialDays: number }; year: { amountCents: number; trialDays: number } }> = {
  pro: {
    month: { amountCents: 499, trialDays: 30 },
    year: { amountCents: 4990, trialDays: 0 },
  },
  flotte: {
    month: { amountCents: 1299, trialDays: 30 },
    year: { amountCents: 12990, trialDays: 0 },
  },
}
export const PRO_PRICING = PAID_PRICING.pro

// Statuts qui comptent dans la limite d'annonces
export const COUNTED_LISTING_STATUSES = ['pending', 'active'] as const

const PRO_STATUSES = ['trialing', 'active', 'past_due']

export function tierFromSubscription(
  sub: { tier: string; status: string; currentPeriodEnd: Date | null } | null
): PlanTier {
  if (!sub || !isPaidTier(sub.tier)) return 'standard'
  if (PRO_STATUSES.includes(sub.status)) return sub.tier
  // Resilie : le pack reste actif jusqu'a la fin de la periode payee
  if (sub.status === 'canceled' && sub.currentPeriodEnd && sub.currentPeriodEnd > new Date()) return sub.tier
  return 'standard'
}

export async function getUserPlan(userId: string): Promise<{ tier: PlanTier; limits: PlanLimits }> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { tier: true, status: true, currentPeriodEnd: true },
  })
  const tier = tierFromSubscription(sub)
  return { tier, limits: PLANS[tier] }
}

export function listingExpiry(limits: PlanLimits, from = new Date()): Date {
  return new Date(from.getTime() + limits.listingDurationDays * 24 * 60 * 60 * 1000)
}

export async function countCountedListings(userId: string, excludeListingId?: string): Promise<number> {
  return prisma.listing.count({
    where: {
      userId,
      deletedAt: null,
      status: { in: [...COUNTED_LISTING_STATUSES] },
      ...(excludeListingId && { id: { not: excludeListingId } }),
    },
  })
}

// Avantages affiches sur l'affiche des packs et la page abonnement
export const PLAN_FEATURES: Record<PlanTier, string[]> = {
  standard: [
    `${PLANS.standard.maxActiveListings} annonces actives`,
    `${PLANS.standard.maxPhotos} photos par annonce`,
    `Annonce en ligne ${PLANS.standard.listingDurationDays} jours, réactivable en 1 clic`,
    `Validation sous ${PLANS.standard.reviewSlaHours} h`,
    'Messagerie illimitée',
    '1 alerte de recherche',
    'Nombre de vues de vos annonces',
  ],
  pro: [
    `${PLANS.pro.maxActiveListings} annonces actives`,
    `${PLANS.pro.maxPhotos} photos par annonce`,
    `Annonce en ligne ${PLANS.pro.listingDurationDays} jours, renouvelée automatiquement`,
    `Validation prioritaire sous ${PLANS.pro.reviewSlaHours} h`,
    'Statistiques détaillées (vues, contacts, prix du marché)',
    'Remontée en tête de liste chaque semaine',
    'Page vitrine avec logo et avis',
    'Alertes de recherche illimitées et instantanees',
    'Sans publicité, support prioritaire',
  ],
  flotte: [
    `${PLANS.flotte.maxActiveListings} véhicules en ligne`,
    `${PLANS.flotte.maxPhotos} photos par véhicule`,
    'Statistiques par véhicule et par jour (vues, contacts, favoris)',
    'Baromètre de la demande par ville (recherches des chauffeurs)',
    'Location à la semaine : caution, km inclus, disponibilité',
    'Renouvellement automatique et validation prioritaire sous 12 h',
    'Page vitrine flotte et mise en avant locale',
    'Tous les avantages du pack Pro',
  ],
}
