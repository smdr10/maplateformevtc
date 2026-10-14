import Stripe from 'stripe'
import { prisma } from './prisma'
import { PRO_PRICING } from './plans'

// Client cree a la demande : le build ne doit pas exiger STRIPE_SECRET_KEY
let stripeClient: Stripe | null = null
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY manquant')
  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY)
  return stripeClient
}

export function isBillingConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_PRO_MONTH && process.env.STRIPE_PRICE_PRO_YEAR)
}

export type Interval = 'month' | 'year'

export function priceIdFor(interval: Interval): string {
  const id = interval === 'month' ? process.env.STRIPE_PRICE_PRO_MONTH : process.env.STRIPE_PRICE_PRO_YEAR
  if (!id) throw new Error(`Prix Stripe manquant pour ${interval}`)
  return id
}

function intervalForPrice(priceId: string | undefined): Interval {
  return priceId === process.env.STRIPE_PRICE_PRO_YEAR ? 'year' : 'month'
}

export function appUrl(path = ''): string {
  return `${(process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')}${path}`
}

// Le mois offert n'est accorde qu'au premier abonnement mensuel
export function trialDaysFor(interval: Interval, hadSubscriptionBefore: boolean): number | undefined {
  const days = PRO_PRICING[interval].trialDays
  return days > 0 && !hadSubscriptionBefore ? days : undefined
}

type LocalStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'

function mapStatus(sub: Stripe.Subscription): LocalStatus {
  switch (sub.status) {
    case 'trialing': return 'trialing'
    case 'active': return sub.cancel_at_period_end ? 'canceled' : 'active'
    case 'past_due': return 'past_due'
    case 'canceled': return 'expired'
    case 'unpaid':
    case 'incomplete_expired': return 'expired'
    default: return 'past_due' // incomplete, paused : pas encore payant
  }
}

// Recopie l'etat d'un abonnement Stripe dans notre base (appele par le webhook)
export async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const userId = sub.metadata?.userId
  if (!userId) {
    console.error('[STRIPE] Abonnement sans userId en metadata', sub.id)
    return
  }
  const item = sub.items.data[0]
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const status = mapStatus(sub)
  const data = {
    tier: 'pro' as const,
    interval: intervalForPrice(item?.price.id),
    status,
    trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
  }
  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  })
}
