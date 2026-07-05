import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const listings = await prisma.listing.findMany({
      where: {
        userId: user.sub,
        deletedAt: null,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { position: 'asc' }, take: 1 },
        _count: { select: { favorites: true, messages: true } },
      },
    })

    return NextResponse.json({ listings })
  } catch (error) {
    console.error('[MY LISTINGS]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}