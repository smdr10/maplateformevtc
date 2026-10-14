import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'
import { getOwnCompany, EDITABLE_STATUSES } from '@/lib/companyAccess'
import { deletePrivateDocument } from '@/lib/privateStorage'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  try {
    const { id } = await params
    const company = await getOwnCompany(user.sub)
    if (!company) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (!EDITABLE_STATUSES.includes(company.verificationStatus)) {
      return NextResponse.json({ error: 'DOSSIER_LOCKED', message: 'Votre dossier est en cours de verification ou deja certifie' }, { status: 409 })
    }
    const document = await prisma.verificationDocument.findFirst({
      where: { id, companyId: company.id, purgedAt: null },
    })
    if (!document) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    await deletePrivateDocument(document.storageKey)
    await prisma.verificationDocument.delete({ where: { id: document.id } })
    return NextResponse.json({ message: 'Document supprime' })
  } catch (error) {
    console.error('[DELETE VERIFICATION DOCUMENT]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
