import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/middleware/requireAuth'

export const GET = requireAuth(async (_req: NextRequest, jwtUser) => {
  const user = await prisma.user.findUnique({
    where: { id: jwtUser.sub },
    select: { id: true, name: true, email: true, phone: true, role: true, companyName: true, emailVerifiedAt: true, ratingAvg: true, ratingCount: true, createdAt: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'NOT_FOUND', message: 'Utilisateur introuvable' }, { status: 404 })
  }
  return NextResponse.json({ user })
})