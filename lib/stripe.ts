import Stripe from 'stripe'
import { prisma } from './prisma'
import { PAID_PRICING, PaidTier } from './plans'

// Client cree a la demande : le build ne doit pas exiger STRIPE_SECRET_KEY
let stripeClient: Stripe | null = null
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY manquant')
  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY)
  return stripeClient
}

const PRICE_ENV: Record<PaidTier, Record<'month' | 'year', string>> = {
  pro: { month: 'STRIPE_PRICE_PRO_MONTH', year: 'STRIPE_PRICE_PRO_YEAR' },
  flotte: { month: 'STRIPE_PRICE_FLOTTE_MONTH', year: 'STRIPE_PRICE_FLOTTE_YEAR' },
}

export function isBillingConfigured(tier: PaidTier = 'pro'): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env[PRICE_ENV[tier].month] && process.env[PRICE_ENV[tier].year])
}

export type Interval = 'month' | 'year'

export function priceIdFor(tier: PaidTier, interval: Interval): string {
  const id = process.env[PRICE_ENV[tier][interval]]
  if (!id) throw new Error(`Prix Stripe manquant pour ${tier}/${interval}`)
  return id
}

// Retrouve le pack et la periodicite a partir d'un identifiant de prix Stripe
function planForPrice(priceId: string | undefined): { tier: PaidTier; interval: Interval } {
  for (const tier of Object.keys(PRICE_ENV) as PaidTier[]) {
    for (const interval of ['month', 'year'] as Interval[]) {
      if (priceId && process.env[PRICE_ENV[tier][interval]] === priceId) return { tier, interval }
    }
  }
  return { tier: 'pro', interval: 'month' }
}

export function appUrl(path = ''): string {
  return `${(process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')}${path}`
}

// Le mois offert n'est accorde qu'au premier abonnement mensuel
export function trialDaysFor(tier: PaidTier, interval: Interval, hadSubscriptionBefore: boolean): number | undefined {
  const days = PAID_PRICING[tier][interval].trialDays
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
  const plan = planForPrice(item?.price.id)
  const data = {
    tier: plan.tier,
    interval: plan.interval,
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
