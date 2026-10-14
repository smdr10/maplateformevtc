import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'
import { getOwnCompany, EDITABLE_STATUSES } from '@/lib/companyAccess'
import { uploadPrivateDocument, ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_SIZE } from '@/lib/privateStorage'
import { DOCUMENT_LABELS, DocumentType } from '@/lib/verification'

const DOCUMENT_TYPES = Object.keys(DOCUMENT_LABELS) as DocumentType[]
const MAX_DOCUMENTS = 15

// Envoi d'un justificatif (multipart : type + file)
export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  try {
    const company = await getOwnCompany(user.sub)
    if (!company) {
      return NextResponse.json({ error: 'NO_COMPANY', message: "Renseignez d'abord votre societe" }, { status: 400 })
    }
    if (!EDITABLE_STATUSES.includes(company.verificationStatus)) {
      return NextResponse.json({ error: 'DOSSIER_LOCKED', message: 'Votre dossier est en cours de verification ou deja certifie' }, { status: 409 })
    }
    const formData = await req.formData()
    const type = formData.get('type')
    const file = formData.get('file')
    if (typeof type !== 'string' || !DOCUMENT_TYPES.includes(type as DocumentType)) {
      return NextResponse.json({ error: 'INVALID_TYPE', message: 'Type de document invalide' }, { status: 400 })
    }
    if (!(file instanceof File) || !ALLOWED_DOCUMENT_TYPES[file.type]) {
      return NextResponse.json({ error: 'INVALID_FILE_TYPE', message: 'Formats acceptes : PDF, JPG, PNG, WEBP' }, { status: 400 })
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      return NextResponse.json({ error: 'FILE_TOO_LARGE', message: 'Le fichier doit faire moins de 10 Mo' }, { status: 400 })
    }
    const count = await prisma.verificationDocument.count({ where: { companyId: company.id, purgedAt: null } })
    if (count >= MAX_DOCUMENTS) {
      return NextResponse.json({ error: 'TOO_MANY_DOCUMENTS', message: `Maximum ${MAX_DOCUMENTS} documents` }, { status: 400 })
    }
    const { storageKey } = await uploadPrivateDocument(file, company.id)
    const document = await prisma.verificationDocument.create({
      data: {
        companyId: company.id,
        type: type as DocumentType,
        storageKey,
        fileName: file.name.slice(0, 255),
        mimeType: file.type,
      },
      select: { id: true, type: true, fileName: true, status: true, uploadedAt: true },
    })
    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    console.error('[UPLOAD VERIFICATION DOCUMENT]', error)
    return NextResponse.json({ error: 'SERVER_ERROR', message: "Erreur lors de l'envoi" }, { status: 500 })
  }
}
