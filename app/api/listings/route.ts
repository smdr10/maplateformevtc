import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/middleware/requireAuth'
import { getUserPlan, countCountedListings } from '@/lib/plans'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const brand = searchParams.get('brand')
    const fuel = searchParams.get('fuel')
    const city = searchParams.get('city')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const maxMileage = searchParams.get('maxMileage')
    const vtcOnly = searchParams.get('vtcOnly') === 'true'
    const sort = searchParams.get('sort') || 'recent'
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = 12

    const where: any = {
      status: 'active',
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      ...(type && { listingType: type }),
      ...(brand && { brand }),
      ...(fuel && { fuelType: fuel }),
      ...(vtcOnly && { vtcCompliant: true }),
      ...(city && { locationCity: { contains: city, mode: 'insensitive' } }),
      ...((minPrice || maxPrice) && {
        price: {
          ...(minPrice && { gte: parseFloat(minPrice) }),
          ...(maxPrice && { lte: parseFloat(maxPrice) }),
        }
      }),
      ...(maxMileage && { mileage: { lte: parseInt(maxMileage) } }),
    }

    const orderBy: any =
      sort === 'price_asc' ? { price: 'asc' } :
      sort === 'price_desc' ? { price: 'desc' } :
      sort === 'mileage_asc' ? { mileage: 'asc' } :
      { createdAt: 'desc' }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy,
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          user: { select: { id: true, name: true, role: true, companyName: true } },
          images: { orderBy: { position: 'asc' }, take: 1 },
          _count: { select: { favorites: true } },
        },
      }),
      prisma.listing.count({ where }),
    ])

    return NextResponse.json({
      listings,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    })
  } catch (error) {
    console.error('[GET LISTINGS]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}

export const POST = requireAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()
    const {
      title, brand, model, year, mileage, fuelType, transmission,
      color, seats, vtcCompliant, listingType, price, rentDuration,
      description, locationCity,
    } = body

    if (!title || !brand || !model || !year || !mileage || !fuelType ||
        !transmission || !listingType || !price || !description || !locationCity) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'Tous les champs obligatoires doivent etre remplis' },
        { status: 400 }
      )
    }

    const { tier, limits } = await getUserPlan(user.sub)
    if (await countCountedListings(user.sub) >= limits.maxActiveListings) {
      return NextResponse.json(
        {
          error: 'LISTING_LIMIT_REACHED',
          message: `Votre pack ${limits.label} permet ${limits.maxActiveListings} annonces actives.`,
          tier,
          upgradeAvailable: tier === 'standard',
        },
        { status: 403 }
      )
    }

    const listing = await prisma.listing.create({
      data: {
        userId: user.sub,
        title,
        brand,
        model,
        year: parseInt(year),
        mileage: parseInt(mileage),
        fuelType,
        transmission,
        color: color || null,
        seats: parseInt(seats) || 5,
        vtcCompliant: vtcCompliant || false,
        listingType,
        price: parseFloat(price),
        rentDuration: rentDuration || null,
        description,
        locationCity,
        status: 'pending',
        // La duree de publication demarre a la validation par l'admin
        expiresAt: null,
        priorityReview: limits.priorityReview,
      },
    })

    return NextResponse.json({ listing }, { status: 201 })
  } catch (error) {
    console.error('[POST LISTING]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
})