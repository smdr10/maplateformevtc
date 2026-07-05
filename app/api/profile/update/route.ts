import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

export async function PATCH(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const body = await req.json()
    const { name, phone, companyName } = body

    const updated = await prisma.user.update({
      where: { id: user.sub },
      data: {
        ...(name && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(companyName !== undefined && { companyName: companyName?.trim() || null }),
      },
      select: {
        id: true, name: true, email: true, phone: true, role: true, companyName: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('[UPDATE PROFILE]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}