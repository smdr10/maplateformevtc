import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'
export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }
  try {
    const reports = await prisma.report.findMany({
      where: { status: 'open' },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: { select: { id: true, title: true, status: true } },
        user: { select: { name: true, email: true } },
      },
    })
    // Le front attend le signaleur sous la cle "reporter"
    return NextResponse.json({
      reports: reports.map(({ user: reporter, ...report }) => ({ ...report, reporter })),
    })
  } catch (error) {
    console.error('[GET REPORTS]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
