import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'
import { signedDocumentUrl } from '@/lib/privateStorage'

// Dossier complet pour l'admin : fiche, documents (liens signes valables 10 min), historique des analyses
export async function GET(req: NextRequest, { params }: { params: Promise<{ companyId: string }> }) {
  const user = getAuthUser(req)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }
  try {
    const { companyId } = await params
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
        documents: { orderBy: { uploadedAt: 'asc' } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: { admin: { select: { name: true } } },
        },
      },
    })
    if (!company) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    const documents = company.documents.map(({ storageKey, ...doc }) => ({
      ...doc,
      url: doc.purgedAt ? null : signedDocumentUrl(storageKey),
    }))
    return NextResponse.json({ company: { ...company, documents } })
  } catch (error) {
    console.error('[ADMIN VERIFICATION DETAIL]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
