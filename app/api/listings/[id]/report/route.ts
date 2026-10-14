import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { id: listingId } = await params
    const { reason } = await req.json()

    if (typeof reason !== 'string' || !reason.trim()) {
      return NextResponse.json({ error: 'MISSING_REASON', message: 'Veuillez indiquer un motif' }, { status: 400 })
    }

    const listing = await prisma.listing.findFirst({
      where: { id: listingId, deletedAt: null },
      select: { id: true, userId: true },
    })

    if (!listing) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    if (listing.userId === user.sub) {
      return NextResponse.json({ error: 'CANNOT_REPORT_OWN', message: 'Vous ne pouvez pas signaler votre propre annonce' }, { status: 400 })
    }

    // Verifie si deja signale par cet utilisateur
    const existing = await prisma.report.findFirst({
      where: { listingId, userId: user.sub },
    })

    if (existing) {
      return NextResponse.json({ error: 'ALREADY_REPORTED', message: 'Vous avez deja signale cette annonce' }, { status: 409 })
    }

    const report = await prisma.report.create({
      data: {
        listingId,
        userId: user.sub,
        reason: reason.trim().slice(0, 100),
      },
    })

    return NextResponse.json({ report, message: 'Signalement envoye avec succes' }, { status: 201 })
  } catch (error) {
    console.error('[REPORT LISTING]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}