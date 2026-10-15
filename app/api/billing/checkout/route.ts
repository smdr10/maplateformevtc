import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'
import { tierFromSubscription, isPaidTier, PaidTier } from '@/lib/plans'
import { getStripe, isBillingConfigured, priceIdFor, trialDaysFor, appUrl, syncSubscription, Interval } from '@/lib/stripe'

// Souscription a un pack payant (Pro ou Flotte) via la page de paiement Stripe,
// ou changement de pack pour un abonne existant (prorata calcule par Stripe).
export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  try {
    const body = await req.json()
    const tier: PaidTier = isPaidTier(body.tier) ? body.tier : 'pro'
    const interval: Interval = body.interval === 'year' ? 'year' : 'month'
    if (!isBillingConfigured(tier)) {
      return NextResponse.json({ error: 'BILLING_DISABLED', message: 'Le paiement en ligne de ce pack ouvre bientôt' }, { status: 503 })
    }
    const account = await prisma.user.findUnique({
      where: { id: user.sub },
      select: { email: true, subscription: true },
    })
    if (!account) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    const current = tierFromSubscription(account.subscription)
    const stripe = getStripe()

    // Deja abonne : on change le prix de l'abonnement existant
    if (current !== 'standard' && account.subscription?.stripeSubscriptionId) {
      if (current === tier && account.subscription.interval === interval) {
        return NextResponse.json({ error: 'ALREADY_SUBSCRIBED', message: `Vous êtes déjà abonné au pack ${tier === 'pro' ? 'Pro' : 'Flotte'}.` }, { status: 409 })
      }
      const sub = await stripe.subscriptions.retrieve(account.subscription.stripeSubscriptionId)
      const updated = await stripe.subscriptions.update(sub.id, {
        items: [{ id: sub.items.data[0].id, price: priceIdFor(tier, interval) }],
        proration_behavior: 'create_prorations',
        cancel_at_period_end: false,
        metadata: { ...sub.metadata, userId: user.sub },
      })
      await syncSubscription(updated)
      return NextResponse.json({ updated: true, tier })
    }

    const trialDays = trialDaysFor(tier, interval, !!account.subscription)
    const taxRate = process.env.STRIPE_TAX_RATE_ID
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceIdFor(tier, interval), quantity: 1 }],
      ...(account.subscription?.stripeCustomerId
        ? { customer: account.subscription.stripeCustomerId }
        : { customer_email: account.email }),
      client_reference_id: user.sub,
      subscription_data: {
        metadata: { userId: user.sub },
        ...(trialDays && { trial_period_days: trialDays }),
        ...(taxRate && { default_tax_rates: [taxRate] }),
      },
      // Les pros peuvent saisir leur numero de TVA pour leurs factures
      tax_id_collection: { enabled: true },
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      locale: 'fr',
      success_url: appUrl('/abonnement?success=1'),
      cancel_url: appUrl('/abonnement?canceled=1'),
    })
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[BILLING CHECKOUT]', error)
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'Impossible de démarrer le paiement' }, { status: 500 })
  }
}
