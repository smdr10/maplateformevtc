import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

const STATUSES = ['pending', 'verified', 'rejected', 'expired', 'unverified']

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }
  try {
    const status = req.nextUrl.searchParams.get('status') || 'pending'
    if (!STATUSES.includes(status)) return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 })
    const companies = await prisma.company.findMany({
      where: { verificationStatus: status as 'pending' },
      orderBy: { updatedAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { aiVerdict: true, aiScore: true, aiAnalyzedAt: true },
        },
        _count: { select: { documents: { where: { purgedAt: null } } } },
      },
    })
    return NextResponse.json({ companies })
  } catch (error) {
    console.error('[ADMIN VERIFICATIONS]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
