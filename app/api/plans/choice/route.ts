import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

const CHOICES = ['standard', 'pro_month', 'pro_year'] as const
type Choice = typeof CHOICES[number]

// Enregistre le choix fait sur l'affiche des packs apres l'inscription.
// Le paiement du pack Pro sera branche sur Stripe : en attendant, le choix Pro est memorise
// pour prevenir l'utilisateur a l'ouverture du paiement.
export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  try {
    const { choice } = await req.json()
    if (!CHOICES.includes(choice)) {
      return NextResponse.json({ error: 'INVALID_CHOICE' }, { status: 400 })
    }
    await prisma.user.update({
      where: { id: user.sub },
      data: { planChoiceAt: new Date() },
    })
    const paymentAvailable = false
    return NextResponse.json({ choice: choice as Choice, paymentAvailable })
  } catch (error) {
    console.error('[PLAN CHOICE]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
