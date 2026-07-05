import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { id: listingId } = await params

    const existing = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: user.sub, listingId } },
    })

    if (existing) {
      await prisma.favorite.delete({
        where: { userId_listingId: { userId: user.sub, listingId } },
      })
      return NextResponse.json({ favorited: false })
    } else {
      await prisma.favorite.create({
        data: { userId: user.sub, listingId },
      })

      const listing = await prisma.listing.findFirst({
        where: { id: listingId },
        select: { userId: true, title: true },
      })

      if (listing && listing.userId !== user.sub) {
        await prisma.notification.create({
          data: {
            userId: listing.userId,
            type: 'new_favorite',
            content: { text: `Quelqu'un a ajoute votre annonce en favori`, listingId },
          },
        })
      }

      return NextResponse.json({ favorited: true })
    }
  } catch (error) {
    console.error('[TOGGLE FAVORITE]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ favorited: false })

  try {
    const { id: listingId } = await params

    const existing = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: user.sub, listingId } },
    })

    return NextResponse.json({ favorited: !!existing })
  } catch (error) {
    return NextResponse.json({ favorited: false })
  }
}