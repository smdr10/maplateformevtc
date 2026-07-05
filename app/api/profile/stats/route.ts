import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const [listingsByStatus, viewsAgg, totalFavorites, totalContacts] = await Promise.all([
      prisma.listing.groupBy({
        by: ['status'],
        where: { userId: user.sub, deletedAt: null },
        _count: true,
      }),
      prisma.listing.aggregate({
        where: { userId: user.sub, deletedAt: null },
        _sum: { viewsCount: true },
      }),
      prisma.favorite.count({
        where: { listing: { userId: user.sub } },
      }),
      prisma.message.count({
        where: { listing: { userId: user.sub }, receiverId: user.sub },
      }),
    ])

    const byStatus: Record<string, number> = {}
    listingsByStatus.forEach(l => { byStatus[l.status] = l._count })

    return NextResponse.json({
      totalViews: viewsAgg._sum.viewsCount ?? 0,
      totalFavorites,
      totalContacts,
      byStatus,
    })
  } catch (error) {
    console.error('[PROFILE STATS]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}