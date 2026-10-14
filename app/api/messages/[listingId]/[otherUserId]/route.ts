import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'
import { subjectWhere, MessageSubject } from '@/lib/messaging'

// GET /api/messages/{subjectId}/{otherUserId}[?type=service]
// subjectId est l'id de l'annonce (par defaut) ou du service (type=service).
// L'envoi de messages passe par POST /api/messages.
export async function GET(req: NextRequest, { params }: { params: Promise<{ listingId: string; otherUserId: string }> }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  try {
    const { listingId: subjectId, otherUserId } = await params
    const subject: MessageSubject = req.nextUrl.searchParams.get('type') === 'service'
      ? { type: 'service', id: subjectId }
      : { type: 'listing', id: subjectId }
    const messages = await prisma.message.findMany({
      where: {
        ...subjectWhere(subject),
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
        ...subjectWhere(subject),
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
