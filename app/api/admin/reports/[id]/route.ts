import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

// Classe un signalement (il reste en base pour l'historique)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }
  try {
    const { id } = await params
    await prisma.report.update({
      where: { id },
      data: { status: 'dismissed' },
    })
    return NextResponse.json({ message: 'Signalement classe' })
  } catch (error) {
    console.error('[ADMIN DISMISS REPORT]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
