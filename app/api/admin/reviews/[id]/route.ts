import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  try {
    const { id } = await params
    const { isVisible } = await req.json()

    const review = await prisma.platformReview.update({
      where: { id },
      data: { isVisible },
    })

    return NextResponse.json({ review })
  } catch (error) {
    console.error('[ADMIN UPDATE REVIEW]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  try {
    const { id } = await params
    await prisma.platformReview.delete({ where: { id } })
    return NextResponse.json({ message: 'Avis supprime' })
  } catch (error) {
    console.error('[ADMIN DELETE REVIEW]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}