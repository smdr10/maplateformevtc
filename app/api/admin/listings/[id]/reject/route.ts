import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'
import { sendListingRejectedEmail } from '@/lib/email'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }
  try {
    const { id } = await params
    const { reason } = await req.json()
    const listing = await prisma.listing.update({
      where: { id },
      data: { status: 'rejected', rejectionReason: reason || 'Non conforme aux criteres de la plateforme' },
      include: { user: { select: { email: true, name: true } } },
    })
    await prisma.notification.create({
      data: {
        userId: listing.userId,
        type: 'listing_rejected',
        content: { text: `Votre annonce "${listing.title}" a ete refusee`, listingId: id, reason },
      },
    })

    // Email de notification
    try {
      await sendListingRejectedEmail(
        listing.user.email,
        listing.user.name,
        listing.title,
        reason || 'Non conforme aux criteres de la plateforme'
      )
    } catch (e) {
      console.error('[EMAIL] Rejected email failed:', e)
    }

    return NextResponse.json({ listing })
  } catch (error) {
    console.error('[REJECT LISTING]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}