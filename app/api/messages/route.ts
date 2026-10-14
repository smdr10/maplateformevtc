import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'
import { sendMessageNotificationEmail } from '@/lib/email'
import { getSubjectInfo, resolveReceiver, MessageSubject } from '@/lib/messaging'

export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  try {
    const { listingId, serviceId, receiverId, message } = await req.json()
    if ((!listingId && !serviceId) || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 })
    }
    const subject: MessageSubject = listingId
      ? { type: 'listing', id: listingId }
      : { type: 'service', id: serviceId }
    const info = await getSubjectInfo(subject)
    if (!info) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Annonce ou service introuvable' }, { status: 404 })
    }
    const target = await resolveReceiver(subject, info.ownerId, user.sub, receiverId)
    if ('error' in target) {
      return NextResponse.json({ error: target.error, message: target.message }, { status: target.status })
    }
    const newMessage = await prisma.message.create({
      data: {
        senderId: user.sub,
        receiverId: target.receiverId,
        listingId: subject.type === 'listing' ? subject.id : null,
        serviceId: subject.type === 'service' ? subject.id : null,
        message: message.trim(),
      },
    })
    await prisma.notification.create({
      data: {
        userId: target.receiverId,
        type: 'new_message',
        content: {
          text: subject.type === 'listing'
            ? 'Vous avez recu un nouveau message'
            : `Nouveau message concernant votre service "${info.title}"`,
          ...(subject.type === 'listing' ? { listingId: subject.id } : { serviceId: subject.id }),
          senderId: user.sub,
        },
      },
    })
    try {
      const [receiver, sender] = await Promise.all([
        prisma.user.findUnique({ where: { id: target.receiverId }, select: { email: true, name: true } }),
        prisma.user.findUnique({ where: { id: user.sub }, select: { name: true } }),
      ])
      if (receiver && sender) {
        await sendMessageNotificationEmail(receiver.email, receiver.name, sender.name, info.title)
      }
    } catch (e) {
      console.error('[EMAIL] Message notification failed:', e)
    }
    return NextResponse.json({ message: newMessage }, { status: 201 })
  } catch (error) {
    console.error('[SEND MESSAGE]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: user.sub }, { receiverId: user.sub }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
        listing: { select: { id: true, title: true } },
        service: { select: { id: true, name: true } },
      },
    })
    const conversationsMap = new Map()
    for (const msg of messages) {
      const otherUser = msg.senderId === user.sub ? msg.receiver : msg.sender
      const subjectKey = msg.listingId ? `l:${msg.listingId}` : `s:${msg.serviceId}`
      const key = `${subjectKey}:${otherUser.id}`
      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, {
          listingId: msg.listingId,
          serviceId: msg.serviceId,
          listingTitle: msg.listing?.title ?? (msg.service ? `[Service] ${msg.service.name}` : ''),
          otherUserId: otherUser.id,
          otherUserName: otherUser.name,
          lastMessage: msg.message,
          lastMessageAt: msg.createdAt,
          unreadCount: 0,
        })
      }
      const conv = conversationsMap.get(key)
      if (msg.receiverId === user.sub && !msg.readStatus) {
        conv.unreadCount += 1
      }
    }
    const conversations = Array.from(conversationsMap.values())
    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('[GET CONVERSATIONS]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
