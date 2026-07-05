import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  try {
    const [totalUsers, totalListings, pendingCount, activeCount, totalMessages] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count({ where: { deletedAt: null } }),
      prisma.listing.count({ where: { status: 'pending', deletedAt: null } }),
      prisma.listing.count({ where: { status: 'active', deletedAt: null } }),
      prisma.message.count(),
    ])

    return NextResponse.json({
      totalUsers,
      totalListings,
      pendingCount,
      activeCount,
      totalMessages,
    })
  } catch (error) {
    console.error('[ADMIN STATS]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}