import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { purgeExpiredTokens } from '@/lib/jwt'
import { getUserPlan, listingExpiry } from '@/lib/plans'
import { deletePrivateDocument } from '@/lib/privateStorage'

const DAY_MS = 24 * 60 * 60 * 1000
const REMINDER_DAYS = 3
const DOCUMENT_RETENTION_DAYS = 30

// A appeler une fois par jour par un cron (Netlify scheduled function, cron-job.org...)
// avec l'en-tete Authorization: Bearer <CRON_SECRET>
// - Pack Pro : annonce arrivee a echeance renouvelee automatiquement
// - Pack Standard : annonce passee en "expired", l'utilisateur la reactive lui-meme
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  try {
    const now = new Date()
    const planCache = new Map<string, Awaited<ReturnType<typeof getUserPlan>>>()
    const planOf = async (userId: string) => {
      if (!planCache.has(userId)) planCache.set(userId, await getUserPlan(userId))
      return planCache.get(userId)!
    }

    const due = await prisma.listing.findMany({
      where: { status: 'active', deletedAt: null, expiresAt: { lt: now } },
      select: { id: true, userId: true, title: true },
    })
    let renewed = 0
    let expired = 0
    for (const listing of due) {
      const { limits } = await planOf(listing.userId)
      if (limits.autoRenew) {
        await prisma.listing.update({ where: { id: listing.id }, data: { expiresAt: listingExpiry(limits, now) } })
        renewed++
      } else {
        await prisma.$transaction([
          prisma.listing.update({ where: { id: listing.id }, data: { status: 'expired' } }),
          prisma.notification.create({
            data: {
              userId: listing.userId,
              type: 'listing_expiring',
              content: { text: `Votre annonce "${listing.title}" a expire. Reactivez-la depuis votre espace.`, listingId: listing.id, expired: true },
            },
          }),
        ])
        expired++
      }
    }

    // Rappel aux utilisateurs Standard dont l'annonce expire dans REMINDER_DAYS jours
    const soon = await prisma.listing.findMany({
      where: {
        status: 'active',
        deletedAt: null,
        expiresAt: { gte: new Date(now.getTime() + (REMINDER_DAYS - 1) * DAY_MS), lt: new Date(now.getTime() + REMINDER_DAYS * DAY_MS) },
      },
      select: { id: true, userId: true, title: true },
    })
    let reminded = 0
    for (const listing of soon) {
      if ((await planOf(listing.userId)).limits.autoRenew) continue
      await prisma.notification.create({
        data: {
          userId: listing.userId,
          type: 'listing_expiring',
          content: { text: `Votre annonce "${listing.title}" expire dans ${REMINDER_DAYS} jours.`, listingId: listing.id },
        },
      })
      reminded++
    }

    // Certifications arrivees a echeance : nouveau dossier a envoyer
    const expiredCertifications = await prisma.company.updateMany({
      where: { verificationStatus: 'verified', verificationExpiresAt: { lt: now } },
      data: { verificationStatus: 'expired' },
    })

    // RGPD : suppression des justificatifs DOCUMENT_RETENTION_DAYS jours apres la decision
    const toPurge = await prisma.verificationDocument.findMany({
      where: {
        purgedAt: null,
        company: {
          verificationStatus: { in: ['verified', 'rejected', 'expired'] },
          updatedAt: { lt: new Date(now.getTime() - DOCUMENT_RETENTION_DAYS * DAY_MS) },
        },
      },
      select: { id: true, storageKey: true },
      take: 200,
    })
    let purgedDocuments = 0
    for (const doc of toPurge) {
      try {
        await deletePrivateDocument(doc.storageKey)
        await prisma.verificationDocument.update({ where: { id: doc.id }, data: { purgedAt: now } })
        purgedDocuments++
      } catch (e) {
        console.error('[CRON PURGE DOCUMENT]', doc.id, e)
      }
    }

    const purgedTokens = await purgeExpiredTokens()
    return NextResponse.json({
      renewed, expired, reminded, purgedTokens,
      expiredCertifications: expiredCertifications.count, purgedDocuments,
    })
  } catch (error) {
    console.error('[CRON EXPIRE LISTINGS]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
