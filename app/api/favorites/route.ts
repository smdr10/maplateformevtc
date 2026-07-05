import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.sub },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          include: {
            images: { orderBy: { position: 'asc' }, take: 1 },
            user: { select: { id: true, name: true } },
          },
        },
      },
    })

    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('[GET FAVORITES]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}