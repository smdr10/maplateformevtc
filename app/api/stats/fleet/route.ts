import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'
import { getUserPlan } from '@/lib/plans'
import { normalizeCity } from '@/lib/tracking'

const DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

// Statistiques avancees du pack Flotte : par vehicule, tendance journaliere, demande par ville, prix du marche
export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  try {
    const { tier, limits } = await getUserPlan(user.sub)
    if (!limits.advancedStats && user.role !== 'admin') {
      return NextResponse.json({ error: 'PLAN_REQUIRED', message: 'Statistiques détaillées réservées au pack Flotte', tier }, { status: 403 })
    }
    const since = new Date(Date.now() - DAYS * DAY_MS)

    const listings = await prisma.listing.findMany({
      where: { userId: user.sub, deletedAt: null, status: { in: ['active', 'pending', 'rented', 'sold'] } },
      select: {
        id: true, title: true, brand: true, model: true, status: true, price: true,
        listingType: true, rentDuration: true, locationCity: true, availableFrom: true,
        dailyStats: { where: { day: { gte: since } }, select: { day: true, views: true, contacts: true, favorites: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Prix du marche : mediane des annonces actives comparables (meme modele, meme type de prix)
    const market = await Promise.all(listings.map(l => prisma.listing.findMany({
      where: {
        status: 'active', deletedAt: null, id: { not: l.id },
        brand: { equals: l.brand, mode: 'insensitive' },
        model: { equals: l.model, mode: 'insensitive' },
        listingType: l.listingType,
        ...(l.listingType === 'rent' && { rentDuration: l.rentDuration }),
      },
      select: { price: true },
      take: 200,
    })))

    const vehicles = listings.map((l, i) => {
      const views = l.dailyStats.reduce((s, d) => s + d.views, 0)
      const contacts = l.dailyStats.reduce((s, d) => s + d.contacts, 0)
      const favorites = l.dailyStats.reduce((s, d) => s + d.favorites, 0)
      const comparables = market[i].map(m => Number(m.price))
      return {
        id: l.id, title: l.title, status: l.status, city: l.locationCity, price: Number(l.price),
        listingType: l.listingType, rentDuration: l.rentDuration, availableFrom: l.availableFrom,
        views, contacts, favorites,
        contactRate: views > 0 ? Math.round((contacts / views) * 1000) / 10 : null,
        marketMedian: median(comparables),
        marketCount: comparables.length,
      }
    })

    // Tendance journaliere sur 30 jours, tous vehicules confondus
    const byDay = new Map<string, { views: number; contacts: number }>()
    for (let d = 0; d < DAYS; d++) {
      const key = new Date(since.getTime() + (d + 1) * DAY_MS).toISOString().slice(0, 10)
      byDay.set(key, { views: 0, contacts: 0 })
    }
    for (const l of listings) for (const s of l.dailyStats) {
      const key = s.day.toISOString().slice(0, 10)
      const cur = byDay.get(key)
      if (cur) { cur.views += s.views; cur.contacts += s.contacts }
    }

    // Barometre de la demande : villes des vehicules du compte + ville demandee
    const requested = normalizeCity(req.nextUrl.searchParams.get('city'))
    const cities = [...new Set([requested, ...listings.map(l => normalizeCity(l.locationCity))].filter((c): c is string => !!c))].slice(0, 5)
    const demand = await Promise.all(cities.map(async city => {
      const [searches, weekRentals, electric, supply, topQueries] = await Promise.all([
        prisma.searchEvent.count({ where: { city, createdAt: { gte: since } } }),
        prisma.searchEvent.count({ where: { city, createdAt: { gte: since }, rentDuration: 'week' } }),
        prisma.searchEvent.count({ where: { city, createdAt: { gte: since }, fuelType: 'electric' } }),
        prisma.listing.count({ where: { status: 'active', deletedAt: null, locationCity: { contains: city, mode: 'insensitive' } } }),
        prisma.searchEvent.groupBy({
          by: ['query'],
          where: { city, createdAt: { gte: since }, query: { not: null } },
          _count: { _all: true },
          orderBy: { _count: { query: 'desc' } },
          take: 5,
        }),
      ])
      return {
        city, searches, weekRentals, electric, supply,
        searchesPerListing: supply > 0 ? Math.round((searches / supply) * 10) / 10 : null,
        topQueries: topQueries.map(q => ({ query: q.query, count: q._count._all })),
      }
    }))

    return NextResponse.json({
      periodDays: DAYS,
      vehicles,
      trend: [...byDay.entries()].map(([day, v]) => ({ day, ...v })),
      demand,
    })
  } catch (error) {
    console.error('[FLEET STATS]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
