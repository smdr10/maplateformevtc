import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe, syncSubscription } from '@/lib/stripe'

// Evenements Stripe -> etat des abonnements en base.
// Declarer cette URL dans Stripe (Developpeurs > Webhooks) avec les evenements :
// checkout.session.completed, customer.subscription.created/updated/deleted, invoice.payment_failed
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = req.headers.get('stripe-signature')
  if (!secret || !signature) {
    return NextResponse.json({ error: 'MISSING_SIGNATURE' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const payload = await req.text()
    event = getStripe().webhooks.constructEvent(payload, signature, secret)
  } catch (error) {
    console.error('[STRIPE WEBHOOK] Signature invalide', error)
    return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 400 })
  }

  try {
    const stripe = getStripe()
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.mode === 'subscription' && session.subscription) {
          const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
          await syncSubscription(await stripe.subscriptions.retrieve(subId))
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object)
        break
      case 'invoice.payment_failed': {
        const sub = event.data.object.parent?.subscription_details?.subscription
        if (sub) {
          await syncSubscription(await stripe.subscriptions.retrieve(typeof sub === 'string' ? sub : sub.id))
        }
        break
      }
    }
    return NextResponse.json({ received: true })
  } catch (error) {
    // 500 => Stripe renverra l'evenement plus tard
    console.error('[STRIPE WEBHOOK]', event.type, error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
