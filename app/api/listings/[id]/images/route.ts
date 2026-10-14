import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

const MAX_IMAGES = 10

// N'accepte que les images hebergees sur notre compte Cloudinary
function isAllowedImageUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false
  try {
    const parsed = new URL(url)
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    return parsed.protocol === 'https:'
      && parsed.hostname === 'res.cloudinary.com'
      && (!cloudName || parsed.pathname.startsWith(`/${cloudName}/`))
  } catch {
    return false
  }
}

async function findOwnedListing(id: string, userId: string, role: string) {
  return prisma.listing.findFirst({
    where: { id, deletedAt: null, ...(role !== 'admin' && { userId }) },
    select: { id: true },
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  try {
    const { id } = await params
    const listing = await findOwnedListing(id, user.sub, user.role)
    if (!listing) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }
    const body = await req.json()
    const { images } = body
    if (!Array.isArray(images) || images.length < 3) {
      return NextResponse.json(
        { error: 'MIN_PHOTOS', message: 'Minimum 3 photos requises' },
        { status: 400 }
      )
    }
    if (images.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: 'TOO_MANY_PHOTOS', message: `Maximum ${MAX_IMAGES} photos` },
        { status: 400 }
      )
    }
    if (!images.every((img: { url?: unknown }) => isAllowedImageUrl(img?.url))) {
      return NextResponse.json(
        { error: 'INVALID_IMAGE_URL', message: 'URL de photo invalide' },
        { status: 400 }
      )
    }
    await prisma.$transaction([
      prisma.listingImage.deleteMany({ where: { listingId: id } }),
      prisma.listingImage.createMany({
        data: images.map((img: { url: string }, index: number) => ({
          listingId: id,
          imageUrl: img.url,
          position: index,
        })),
      }),
    ])
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
    const listing = await findOwnedListing(id, user.sub, user.role)
    if (!listing) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }
    const { imageId } = await req.json()
    const image = await prisma.listingImage.findFirst({
      where: { id: imageId, listingId: id },
      select: { id: true },
    })
    if (!image) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }
    const count = await prisma.listingImage.count({
      where: { listingId: id },
    })
    if (count <= 3) {
      return NextResponse.json(
        { error: 'MIN_PHOTOS', message: 'Impossible : minimum 3 photos requises' },
        { status: 422 }
      )
    }
    await prisma.listingImage.delete({ where: { id: image.id } })
    const remaining = await prisma.listingImage.findMany({
      where: { listingId: id },
      orderBy: { position: 'asc' },
    })
    await prisma.$transaction(
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
