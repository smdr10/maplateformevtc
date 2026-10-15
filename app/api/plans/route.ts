import { NextResponse } from 'next/server'
import { PLANS, PLAN_FEATURES, PAID_PRICING } from '@/lib/plans'
import { isBillingConfigured } from '@/lib/stripe'

export async function GET() {
  return NextResponse.json({
    plans: PLANS,
    features: PLAN_FEATURES,
    pricing: PAID_PRICING,
    billing: { pro: isBillingConfigured('pro'), flotte: isBillingConfigured('flotte') },
  })
}
