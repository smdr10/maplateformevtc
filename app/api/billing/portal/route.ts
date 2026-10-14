import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'
import { getStripe, isBillingConfigured, appUrl } from '@/lib/stripe'

// Portail client Stripe : resiliation, moyen de paiement, factures
export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  if (!isBillingConfigured()) {
    return NextResponse.json({ error: 'BILLING_DISABLED' }, { status: 503 })
  }
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.sub },
      select: { stripeCustomerId: true },
    })
    if (!subscription?.stripeCustomerId) {
      return NextResponse.json({ error: 'NO_SUBSCRIPTION', message: 'Aucun abonnement' }, { status: 404 })
    }
    const session = await getStripe().billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: appUrl('/abonnement'),
      locale: 'fr',
    })
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[BILLING PORTAL]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
