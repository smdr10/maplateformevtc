import { NextRequest, NextResponse } from 'next/server'
import { trackListing } from '@/lib/tracking'
import { rentalTerms } from '@/lib/rentalTerms'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

const PUBLIC_STATUSES = ['active', 'sold', 'rented']

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const listing = await prisma.listing.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: {
            id: true, name: true, role: true, companyName: true, phone: true, createdAt: true,
            company: { select: { verificationStatus: true } },
          },
        },
        images: { orderBy: { position: 'asc' } },
        _count: { select: { favorites: true, messages: true } },
      },
    })

    // Les annonces non publiees (en attente, refusees, expirees) ne sont visibles que du proprietaire et de l'admin
    const viewer = getAuthUser(req)
    const isOwnerOrAdmin = !!viewer && !!listing && (viewer.sub === listing.userId || viewer.role === 'admin')
    if (!listing || (!PUBLIC_STATUSES.includes(listing.status) && !isOwnerOrAdmin)) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Annonce introuvable' }, { status: 404 })
    }

    if (listing.status === 'active' && viewer?.sub !== listing.userId) {
      await prisma.listing.update({
        where: { id },
        data: { viewsCount: { increment: 1 } },
      })
      await trackListing(id, 'views')
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
    const data: Record<string, unknown> = {}
    if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim().slice(0, 200)
    if (typeof body.description === 'string' && body.description.trim()) data.description = body.description.trim()
    if (typeof body.locationCity === 'string' && body.locationCity.trim()) data.locationCity = body.locationCity.trim().slice(0, 100)
    if (body.price !== undefined) {
      const price = parseFloat(body.price)
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ error: 'INVALID_PRICE', message: 'Prix invalide' }, { status: 400 })
      }
      data.price = price
    }
    if (body.mileage !== undefined) {
      const mileage = parseInt(body.mileage)
      if (!Number.isFinite(mileage) || mileage < 0) {
        return NextResponse.json({ error: 'INVALID_MILEAGE', message: 'Kilometrage invalide' }, { status: 400 })
      }
      data.mileage = mileage
    }

    // Toute modification d'une annonce publiee ou refusee repasse par la moderation
    if (Object.keys(data).length > 0 && ['active', 'rejected'].includes(listing.status)) {
      data.status = 'pending'
      data.rejectionReason = null
    }

    // Conditions de location et disponibilite : mises a jour sans nouvelle moderation
    if (listing.listingType === 'rent') {
      const terms = rentalTerms(body)
      for (const [k, v] of Object.entries(terms)) if (body[k] !== undefined) data[k] = v
    }

    const updated = await prisma.listing.update({
      where: { id },
      data,
    })

    return NextResponse.json({ listing: updated, pendingReview: data.status === 'pending' })
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
