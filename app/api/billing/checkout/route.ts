import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'
import { tierFromSubscription } from '@/lib/plans'
import { getStripe, isBillingConfigured, priceIdFor, trialDaysFor, appUrl, Interval } from '@/lib/stripe'

// Cree une session de paiement Stripe (page hebergee) pour le pack Pro
export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  if (!isBillingConfigured()) {
    return NextResponse.json({ error: 'BILLING_DISABLED', message: 'Le paiement en ligne ouvre bientot' }, { status: 503 })
  }
  try {
    const { interval } = await req.json()
    if (interval !== 'month' && interval !== 'year') {
      return NextResponse.json({ error: 'INVALID_INTERVAL' }, { status: 400 })
    }
    const account = await prisma.user.findUnique({
      where: { id: user.sub },
      select: { email: true, subscription: true },
    })
    if (!account) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    // Deja Pro (y compris resilie mais encore dans la periode payee) : tout se gere depuis le portail client
    if (tierFromSubscription(account.subscription) === 'pro') {
      return NextResponse.json({ error: 'ALREADY_PRO', message: 'Vous etes deja abonne au pack Pro. Gerez votre abonnement depuis votre espace.' }, { status: 409 })
    }

    const trialDays = trialDaysFor(interval as Interval, !!account.subscription)
    const taxRate = process.env.STRIPE_TAX_RATE_ID
    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceIdFor(interval as Interval), quantity: 1 }],
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
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'Impossible de demarrer le paiement' }, { status: 500 })
  }
}
