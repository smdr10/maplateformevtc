import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'pending'

    const listings = await prisma.listing.findMany({
      where: { status: status as any, deletedAt: null },
      // Pack Pro en premier (validation sous 12 h), puis les plus anciennes
      orderBy: [{ priorityReview: 'desc' }, { createdAt: 'asc' }],
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        images: { orderBy: { position: 'asc' }, take: 1 },
      },
    })

    return NextResponse.json({ listings })
  } catch (error) {
    console.error('[ADMIN LISTINGS]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}