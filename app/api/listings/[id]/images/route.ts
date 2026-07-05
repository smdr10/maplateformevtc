import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { id } = await params
    const listing = await prisma.listing.findFirst({
      where: { id, userId: user.sub, deletedAt: null },
    })

    if (!listing) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const body = await req.json()
    const { images } = body

    if (!images || images.length < 3) {
      return NextResponse.json(
        { error: 'MIN_PHOTOS', message: 'Minimum 3 photos requises' },
        { status: 400 }
      )
    }

    await prisma.listingImage.deleteMany({ where: { listingId: id } })

    await prisma.listingImage.createMany({
      data: images.map((img: { url: string; position: number }) => ({
        listingId: id,
        imageUrl: img.url,
        position: img.position,
      })),
    })

    return NextResponse.json({ message: 'Images sauvegardees', count: images.length })
  } catch (error) {
    console.error('[SAVE IMAGES]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { id } = await params
    const { imageId } = await req.json()

    const count = await prisma.listingImage.count({
      where: { listingId: id },
    })

    if (count <= 3) {
      return NextResponse.json(
        { error: 'MIN_PHOTOS', message: 'Impossible : minimum 3 photos requises' },
        { status: 422 }
      )
    }

    await prisma.listingImage.delete({ where: { id: imageId } })

    const remaining = await prisma.listingImage.findMany({
      where: { listingId: id },
      orderBy: { position: 'asc' },
    })

    await Promise.all(
      remaining.map((img: { id: string }, index: number) =>
        prisma.listingImage.update({
          where: { id: img.id },
          data: { position: index },
        })
      )
    )

    return NextResponse.json({ message: 'Image supprimee' })
  } catch (error) {
    console.error('[DELETE IMAGE]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}