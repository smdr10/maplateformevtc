import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ listingId: string; otherUserId: string }> }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { listingId, otherUserId } = await params

    const messages = await prisma.message.findMany({
      where: {
        listingId,
        OR: [
          { senderId: user.sub, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: user.sub },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true } },
      },
    })

    await prisma.message.updateMany({
      where: {
        listingId,
        senderId: otherUserId,
        receiverId: user.sub,
        readStatus: false,
      },
      data: { readStatus: true },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('[GET CONVERSATION]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ listingId: string; otherUserId: string }> }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  try {
    const { listingId, otherUserId } = await params
    const { message } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'MISSING_MESSAGE' }, { status: 400 })
    }

    const newMessage = await prisma.message.create({
      data: {
        senderId: user.sub,
        receiverId: otherUserId,
        listingId,
        message: message.trim(),
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
    })

    await prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'new_message',
        content: { text: 'Nouveau message', listingId, senderId: user.sub },
      },
    })

    return NextResponse.json({ message: newMessage }, { status: 201 })
  } catch (error) {
    console.error('[REPLY MESSAGE]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}