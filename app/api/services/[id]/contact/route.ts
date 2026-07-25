import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { id: serviceId } = await params
    const { message } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'MISSING_MESSAGE' }, { status: 400 })
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { userId: true, name: true },
    })

    if (!service) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    if (service.userId === user.sub) {
      return NextResponse.json({ error: 'CANNOT_MESSAGE_SELF' }, { status: 400 })
    }

    // On trouve une annonce existante du prestataire pour utiliser comme support de messagerie
    // Sinon on cree un enregistrement temporaire
    let listingId: string | null = null

    const existingListing = await prisma.listing.findFirst({
      where: { userId: service.userId, deletedAt: null },
      select: { id: true },
    })

    if (existingListing) {
      listingId = existingListing.id
    } else {
      // Cree une annonce fantome pour supporter la messagerie
      const ghost = await prisma.listing.create({
        data: {
          userId: service.userId,
          title: `[SERVICE] ${service.name}`,
          brand: 'Service',
          model: service.name,
          year: new Date().getFullYear(),
          mileage: 0,
          fuelType: 'electric',
          transmission: 'automatic',
          seats: 1,
          listingType: 'sale',
          price: 0,
          description: `Contact via service: ${service.name}`,
          locationCity: 'N/A',
          status: 'active',
        },
      })
      listingId = ghost.id
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId: user.sub,
        receiverId: service.userId,
        listingId: listingId!,
        message: `[SERVICE: ${service.name}]\n${message.trim()}`,
      },
    })

    await prisma.notification.create({
      data: {
        userId: service.userId,
        type: 'new_message',
        content: {
          text: `Nouveau message concernant votre service "${service.name}"`,
          serviceId,
          senderId: user.sub,
        },
      },
    })

    return NextResponse.json({ message: newMessage }, { status: 201 })
  } catch (error) {
    console.error('[SERVICE CONTACT]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}