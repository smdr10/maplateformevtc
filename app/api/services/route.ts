import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const city = searchParams.get('city')

    const services = await prisma.service.findMany({
      where: {
        isVisible: true,
        ...(category && { category: category as any }),
        ...(city && { city: { contains: city, mode: 'insensitive' } }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ services })
  } catch (error) {
    console.error('[GET SERVICES]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const body = await req.json()
    const { name, category, description, city, phone, email, website } = body

    if (!name || !category || !description || !city) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'Nom, categorie, description et ville sont requis' },
        { status: 400 }
      )
    }

    const service = await prisma.service.create({
      data: {
        userId: user.sub,
        name,
        category,
        description,
        city,
        phone: phone || null,
        email: email || null,
        website: website || null,
      },
    })

    return NextResponse.json({ service }, { status: 201 })
  } catch (error) {
    console.error('[CREATE SERVICE]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}