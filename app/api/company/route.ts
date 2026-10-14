import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/middleware/requireAuth'
import { EDITABLE_STATUSES } from '@/lib/companyAccess'
import { normalizeSiret, isValidSiret } from '@/lib/companyRegistry'
import {
  requiredDocuments, ACTIVITY_LABELS, LEGAL_FORM_LABELS, DOCUMENT_LABELS, REGISTRATION_DOCUMENTS,
  ProActivity, LegalForm,
} from '@/lib/verification'

const ACTIVITIES = Object.keys(ACTIVITY_LABELS) as ProActivity[]
const LEGAL_FORMS = Object.keys(LEGAL_FORM_LABELS) as LegalForm[]

const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  try {
    const company = await prisma.company.findUnique({
      where: { userId: user.sub },
      include: {
        documents: {
          where: { purgedAt: null },
          orderBy: { uploadedAt: 'desc' },
          select: { id: true, type: true, fileName: true, status: true, uploadedAt: true },
        },
      },
    })
    return NextResponse.json({
      company,
      requiredDocuments: requiredDocuments((company?.activities ?? []) as ProActivity[]),
      registrationDocuments: REGISTRATION_DOCUMENTS,
      labels: { activities: ACTIVITY_LABELS, legalForms: LEGAL_FORM_LABELS, documents: DOCUMENT_LABELS },
    })
  } catch (error) {
    console.error('[GET COMPANY]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}

// Cree ou met a jour la fiche societe du compte connecte
export async function PATCH(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  try {
    const body = await req.json()
    const existing = await prisma.company.findUnique({ where: { userId: user.sub } })
    const identityLocked = !!existing && !EDITABLE_STATUSES.includes(existing.verificationStatus)

    // Champs de vitrine : modifiables a tout moment
    const data: Record<string, unknown> = {}
    if (body.tradeName !== undefined) data.tradeName = str(body.tradeName, 150)
    if (body.phone !== undefined) data.phone = str(body.phone, 20)
    if (body.website !== undefined) data.website = str(body.website, 255)
    if (body.description !== undefined) data.description = str(body.description, 2000)

    // Champs d'identite : verrouilles pendant la verification et une fois certifie
    const identityFields = ['legalName', 'siret', 'legalForm', 'activities', 'address', 'postalCode', 'city']
    if (identityLocked && identityFields.some(f => body[f] !== undefined)) {
      return NextResponse.json(
        { error: 'IDENTITY_LOCKED', message: 'Ces informations ne sont plus modifiables pendant ou apres la certification. Contactez le support.' },
        { status: 409 }
      )
    }
    if (body.legalName !== undefined) {
      const legalName = str(body.legalName, 150)
      if (!legalName) return NextResponse.json({ error: 'INVALID_NAME', message: 'Nom de la societe requis' }, { status: 400 })
      data.legalName = legalName
    }
    if (body.siret !== undefined) {
      const siret = typeof body.siret === 'string' ? normalizeSiret(body.siret) : ''
      if (siret && !isValidSiret(siret)) {
        return NextResponse.json({ error: 'INVALID_SIRET', message: 'Numero SIRET invalide (14 chiffres)' }, { status: 400 })
      }
      data.siret = siret || null
    }
    if (body.legalForm !== undefined) {
      if (body.legalForm !== null && !LEGAL_FORMS.includes(body.legalForm)) {
        return NextResponse.json({ error: 'INVALID_LEGAL_FORM' }, { status: 400 })
      }
      data.legalForm = body.legalForm
    }
    if (body.activities !== undefined) {
      if (!Array.isArray(body.activities) || body.activities.some((a: unknown) => !ACTIVITIES.includes(a as ProActivity))) {
        return NextResponse.json({ error: 'INVALID_ACTIVITIES' }, { status: 400 })
      }
      data.activities = [...new Set(body.activities)]
    }
    if (body.address !== undefined) data.address = str(body.address, 255)
    if (body.postalCode !== undefined) data.postalCode = str(body.postalCode, 10)
    if (body.city !== undefined) data.city = str(body.city, 100)

    let company
    if (existing) {
      company = await prisma.company.update({ where: { id: existing.id }, data })
    } else {
      if (!data.legalName) return NextResponse.json({ error: 'INVALID_NAME', message: 'Nom de la societe requis' }, { status: 400 })
      company = await prisma.company.create({ data: { ...data, legalName: data.legalName as string, userId: user.sub } })
    }
    // Garde le type de compte et l'ancien champ companyName synchronises
    await prisma.user.update({
      where: { id: user.sub },
      data: {
        accountType: 'professional',
        ...(user.role !== 'admin' && { role: 'pro' }),
        companyName: company.tradeName ?? company.legalName,
      },
    })
    return NextResponse.json({ company })
  } catch (error) {
    console.error('[UPDATE COMPANY]', error)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
