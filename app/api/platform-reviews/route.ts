import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

export async function GET() {
  try {
    const reviews = await prisma.platformReview.findMany({
      where: { isVisible: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    })

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r) => sum + r.rating, 0) / reviews.length
      : 0

    return NextResponse.json({ reviews, avgRating: Math.round(avgRating * 10) / 10, total: reviews.length })
  } catch (error) {
    console.error('[GET PLATFORM REVIEWS]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { rating, comment } = await req.json()

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'INVALID_RATING', message: 'Note entre 1 et 5 requise' }, { status: 400 })
    }

    if (!comment?.trim() || comment.trim().length < 10) {
      return NextResponse.json({ error: 'INVALID_COMMENT', message: 'Commentaire de 10 caracteres minimum' }, { status: 400 })
    }

    const existing = await prisma.platformReview.findFirst({
      where: { userId: user.sub },
    })

    if (existing) {
      const updated = await prisma.platformReview.update({
        where: { id: existing.id },
        data: { rating, comment: comment.trim() },
        include: { user: { select: { id: true, name: true, role: true } } },
      })
      return NextResponse.json({ review: updated, updated: true })
    }

    const review = await prisma.platformReview.create({
      data: { userId: user.sub, rating, comment: comment.trim() },
      include: { user: { select: { id: true, name: true, role: true } } },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('[POST PLATFORM REVIEW]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}