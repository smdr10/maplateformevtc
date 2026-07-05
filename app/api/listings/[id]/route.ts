import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const listing = await prisma.listing.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, role: true, companyName: true, phone: true, createdAt: true } },
        images: { orderBy: { position: 'asc' } },
        _count: { select: { favorites: true, messages: true } },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Annonce introuvable' }, { status: 404 })
    }

    if (listing.status === 'active') {
      await prisma.listing.update({
        where: { id },
        data: { viewsCount: { increment: 1 } },
      })
    }

    return NextResponse.json({ listing })
  } catch (error) {
    console.error('[GET LISTING]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.price && { price: parseFloat(body.price) }),
        ...(body.description && { description: body.description }),
        ...(body.locationCity && { locationCity: body.locationCity }),
        ...(body.mileage && { mileage: parseInt(body.mileage) }),
        ...(body.status && user.role === 'admin' && { status: body.status }),
        ...(body.rejectionReason && { rejectionReason: body.rejectionReason }),
      },
    })

    return NextResponse.json({ listing: updated })
  } catch (error) {
    console.error('[PATCH LISTING]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { id } = await params
    const listing = await prisma.listing.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(user.role !== 'admin' && { userId: user.sub }),
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    await prisma.listing.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ message: 'Annonce supprimee' })
  } catch (error) {
    console.error('[DELETE LISTING]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}