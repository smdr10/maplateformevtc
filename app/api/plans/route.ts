import { NextResponse } from 'next/server'
import { PLANS, PLAN_FEATURES, PRO_PRICING } from '@/lib/plans'
import { isBillingConfigured } from '@/lib/stripe'

export async function GET() {
  return NextResponse.json({ plans: PLANS, features: PLAN_FEATURES, proPricing: PRO_PRICING, billingEnabled: isBillingConfigured() })
}
