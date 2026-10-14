import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'
import { sendMessageNotificationEmail } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  try {
    const { id: serviceId } = await params
    const { message } = await req.json()
    if (typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'MISSING_MESSAGE' }, { status: 400 })
    }
    const service = await prisma.service.findFirst({
      where: { id: serviceId, isVisible: true },
      select: { userId: true, name: true },
    })
    if (!service) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }
    if (service.userId === user.sub) {
      return NextResponse.json({ error: 'CANNOT_MESSAGE_SELF', message: 'Vous ne pouvez pas vous contacter vous-meme' }, { status: 400 })
    }
    const newMessage = await prisma.message.create({
      data: {
        senderId: user.sub,
        receiverId: service.userId,
        serviceId,
        message: message.trim(),
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
    try {
      const [receiver, sender] = await Promise.all([
        prisma.user.findUnique({ where: { id: service.userId }, select: { email: true, name: true } }),
        prisma.user.findUnique({ where: { id: user.sub }, select: { name: true } }),
      ])
      if (receiver && sender) {
        await sendMessageNotificationEmail(receiver.email, receiver.name, sender.name, service.name)
      }
    } catch (e) {
      console.error('[EMAIL] Service contact notification failed:', e)
    }
    return NextResponse.json({ message: newMessage }, { status: 201 })
  } catch (error) {
    console.error('[SERVICE CONTACT]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
