import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'
import { sendCertificationDecisionEmail } from '@/lib/email'

const CERTIFICATION_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000

// Decision humaine finale : l'analyse automatique n'est qu'un avis
export async function POST(req: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
  const admin = getAuthUser(req)
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }
  try {
    const { companyId } = await params
    const { decision, comment } = await req.json()
    if (decision !== 'approved' && decision !== 'rejected') {
      return NextResponse.json({ error: 'INVALID_DECISION' }, { status: 400 })
    }
    const reason = typeof comment === 'string' ? comment.trim().slice(0, 1000) : ''
    if (decision === 'rejected' && !reason) {
      return NextResponse.json({ error: 'MISSING_REASON', message: 'Indiquez le motif du refus' }, { status: 400 })
    }
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { user: { select: { id: true, email: true, name: true } } },
    })
    if (!company) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (company.verificationStatus !== 'pending') {
      return NextResponse.json({ error: 'NOT_PENDING', message: "Ce dossier n'est pas en attente de decision" }, { status: 409 })
    }

    const now = new Date()
    const approved = decision === 'approved'
    const latestReview = await prisma.verificationReview.findFirst({
      where: { companyId, adminDecision: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })
    const decisionData = { adminDecision: decision, adminId: admin.sub, adminComment: reason || null, decidedAt: now } as const

    await prisma.$transaction([
      prisma.company.update({
        where: { id: companyId },
        data: approved
          ? { verificationStatus: 'verified', verifiedAt: now, verificationExpiresAt: new Date(now.getTime() + CERTIFICATION_VALIDITY_MS), rejectionReason: null }
          : { verificationStatus: 'rejected', rejectionReason: reason },
      }),
      prisma.verificationDocument.updateMany({
        where: { companyId, purgedAt: null },
        data: { status: approved ? 'accepted' : 'rejected' },
      }),
      latestReview
        ? prisma.verificationReview.update({ where: { id: latestReview.id }, data: decisionData })
        : prisma.verificationReview.create({ data: { companyId, ...decisionData } }),
      prisma.notification.create({
        data: {
          userId: company.user.id,
          type: approved ? 'certification_approved' : 'certification_rejected',
          content: approved
            ? { text: `${company.legalName} est maintenant certifiee` }
            : { text: 'Votre demande de certification a ete refusee', reason },
        },
      }),
    ])

    try {
      await sendCertificationDecisionEmail(company.user.email, company.user.name, company.legalName, approved, reason)
    } catch (e) {
      console.error('[EMAIL] Certification decision failed:', e)
    }
    return NextResponse.json({ message: approved ? 'Societe certifiee' : 'Certification refusee' })
  } catch (error) {
    console.error('[ADMIN VERIFICATION DECISION]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
