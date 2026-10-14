import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { purgeExpiredTokens } from '@/lib/jwt'

// A appeler une fois par jour par un cron (Netlify scheduled function, cron-job.org...)
// avec l'en-tete Authorization: Bearer <CRON_SECRET>
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  try {
    const expired = await prisma.listing.updateMany({
      where: { status: 'active', deletedAt: null, expiresAt: { lt: new Date() } },
      data: { status: 'expired' },
    })
    const purgedTokens = await purgeExpiredTokens()
    return NextResponse.json({ expiredListings: expired.count, purgedTokens })
  } catch (error) {
    console.error('[CRON EXPIRE LISTINGS]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
