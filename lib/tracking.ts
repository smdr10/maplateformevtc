import { prisma } from './prisma'

type Metric = 'views' | 'contacts' | 'favorites'

function today(): Date {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

// Incremente un compteur journalier d'annonce. Ne fait jamais echouer la requete appelante.
export async function trackListing(listingId: string, metric: Metric): Promise<void> {
  try {
    const day = today()
    await prisma.listingDailyStat.upsert({
      where: { listingId_day: { listingId, day } },
      create: { listingId, day, [metric]: 1 },
      update: { [metric]: { increment: 1 } },
    })
  } catch (e) {
    console.error('[TRACK LISTING]', metric, e)
  }
}

export function normalizeCity(city: string | null | undefined): string | null {
  const c = city?.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
  return c ? c.slice(0, 100) : null
}

// Recherche anonyme (aucune donnee personnelle) pour le barometre de la demande
export async function trackSearch(input: {
  city: string | null
  listingType: string | null
  rentDuration: string | null
  fuelType: string | null
  query: string | null
  resultsCount: number
}): Promise<void> {
  try {
    await prisma.searchEvent.create({
      data: {
        city: normalizeCity(input.city),
        listingType: input.listingType as 'sale' | 'rent' | null,
        rentDuration: input.rentDuration as 'week' | 'month' | 'year' | 'loa' | null,
        fuelType: input.fuelType as 'electric' | 'hybrid' | 'diesel' | 'gasoline' | null,
        query: input.query ? input.query.toLowerCase().slice(0, 100) : null,
        resultsCount: input.resultsCount,
      },
    })
  } catch (e) {
    console.error('[TRACK SEARCH]', e)
  }
}
