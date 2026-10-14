import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'
import { sendListingApprovedEmail } from '@/lib/email'
import { getUserPlan, listingExpiry } from '@/lib/plans'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }
  try {
    const { id } = await params
    const existing = await prisma.listing.findFirst({ where: { id, deletedAt: null }, select: { userId: true } })
    if (!existing) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }
    const { limits } = await getUserPlan(existing.userId)
    const listing = await prisma.listing.update({
      where: { id },
      data: { status: 'active', rejectionReason: null, expiresAt: listingExpiry(limits) },
      include: { user: { select: { email: true, name: true } } },
    })
    await prisma.notification.create({
      data: {
        userId: listing.userId,
        type: 'listing_approved',
        content: { text: `Votre annonce "${listing.title}" est en ligne`, listingId: id },
      },
    })

    // Email de notification
    try {
      await sendListingApprovedEmail(
        listing.user.email,
        listing.user.name,
        listing.title,
        id
      )
    } catch (e) {
      console.error('[EMAIL] Approved email failed:', e)
    }

    return NextResponse.json({ listing })
  } catch (error) {
    console.error('[APPROVE LISTING]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}