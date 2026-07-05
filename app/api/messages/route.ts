import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { listingId, message } = await req.json()

    if (!listingId || !message?.trim()) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 })
    }

    const listing = await prisma.listing.findFirst({
      where: { id: listingId, deletedAt: null },
      select: { userId: true },
    })

    if (!listing) {
      return NextResponse.json({ error: 'LISTING_NOT_FOUND' }, { status: 404 })
    }

    if (listing.userId === user.sub) {
      return NextResponse.json({ error: 'CANNOT_MESSAGE_SELF', message: 'Vous ne pouvez pas vous contacter vous-meme' }, { status: 400 })
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId: user.sub,
        receiverId: listing.userId,
        listingId,
        message: message.trim(),
      },
    })

    await prisma.notification.create({
      data: {
        userId: listing.userId,
        type: 'new_message',
        content: {
          text: 'Vous avez recu un nouveau message',
          listingId,
          senderId: user.sub,
        },
      },
    })

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
      },
    })

    const conversationsMap = new Map()

    for (const msg of messages) {
      const otherUser = msg.senderId === user.sub ? msg.receiver : msg.sender
      const key = `${msg.listingId}:${otherUser.id}`

      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, {
          listingId: msg.listingId,
          listingTitle: msg.listing.title,
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