import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { id } = await params
    const { status } = await req.json()

    const validStatuses = ['sold', 'rented']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 })
    }

    const listing = await prisma.listing.findFirst({
      where: { id, userId: user.sub, status: 'active', deletedAt: null },
    })

    if (!listing) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ listing: updated })
  } catch (error) {
    console.error('[UPDATE STATUS]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}