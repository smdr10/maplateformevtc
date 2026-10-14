import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'
import { getOwnCompany, EDITABLE_STATUSES } from '@/lib/companyAccess'
import { runCompanyAnalysis } from '@/lib/verificationRuns'
import { missingDocuments, ProActivity, DocumentType } from '@/lib/verification'

// Envoie le dossier en verification : analyse automatique puis file d'attente admin
export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  try {
    const company = await getOwnCompany(user.sub)
    if (!company) return NextResponse.json({ error: 'NO_COMPANY', message: "Renseignez d'abord votre societe" }, { status: 400 })
    if (!EDITABLE_STATUSES.includes(company.verificationStatus)) {
      return NextResponse.json({ error: 'ALREADY_SUBMITTED', message: 'Dossier deja envoye' }, { status: 409 })
    }
    if (!company.siret || company.activities.length === 0 || !company.legalForm) {
      return NextResponse.json(
        { error: 'INCOMPLETE', message: 'Renseignez le SIRET, la forme juridique et au moins une activite' },
        { status: 400 }
      )
    }
    const documents = await prisma.verificationDocument.findMany({
      where: { companyId: company.id, purgedAt: null },
      select: { type: true },
    })
    const missing = missingDocuments(company.activities as ProActivity[], documents.map(d => d.type as DocumentType))
    if (missing.length > 0) {
      return NextResponse.json({ error: 'MISSING_DOCUMENTS', message: `Documents manquants : ${missing.join(', ')}`, missing }, { status: 400 })
    }
    await prisma.company.update({
      where: { id: company.id },
      data: { verificationStatus: 'pending', rejectionReason: null },
    })
    // L'analyse ne bloque pas l'envoi : en cas d'echec, l'admin pourra la relancer
    try {
      await runCompanyAnalysis(company.id)
    } catch (e) {
      console.error('[COMPANY ANALYSIS]', e)
    }
    return NextResponse.json({ message: 'Dossier envoye. Nous revenons vers vous rapidement.' })
  } catch (error) {
    console.error('[SUBMIT COMPANY]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
