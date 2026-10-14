import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'
import { getUserPlan, countCountedListings, listingExpiry } from '@/lib/plans'

// Remet en ligne une annonce expiree (deja validee, contenu inchange) pour une nouvelle periode
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  try {
    const { id } = await params
    const listing = await prisma.listing.findFirst({
      where: { id, userId: user.sub, deletedAt: null, status: 'expired' },
      select: { id: true },
    })
    if (!listing) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Annonce expiree introuvable' }, { status: 404 })
    }
    const { tier, limits } = await getUserPlan(user.sub)
    if (await countCountedListings(user.sub) >= limits.maxActiveListings) {
      return NextResponse.json(
        {
          error: 'LISTING_LIMIT_REACHED',
          message: `Votre pack ${limits.label} permet ${limits.maxActiveListings} annonces actives.`,
          tier,
          upgradeAvailable: tier === 'standard',
        },
        { status: 403 }
      )
    }
    const updated = await prisma.listing.update({
      where: { id },
      data: { status: 'active', expiresAt: listingExpiry(limits) },
    })
    return NextResponse.json({ listing: updated })
  } catch (error) {
    console.error('[REACTIVATE LISTING]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
