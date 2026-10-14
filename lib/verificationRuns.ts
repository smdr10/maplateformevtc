import { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { analyzeCompany, ProActivity, DocumentType, LegalForm } from './verification'

// Lance l'analyse automatique d'un dossier et l'enregistre comme nouvelle revue (sans decision)
export async function runCompanyAnalysis(companyId: string) {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    include: {
      user: { select: { name: true } },
      documents: { where: { purgedAt: null }, select: { type: true } },
    },
  })
  const result = await analyzeCompany({
    ownerName: company.user.name,
    legalName: company.legalName,
    siret: company.siret,
    legalForm: company.legalForm as LegalForm | null,
    activities: company.activities as ProActivity[],
    documentTypes: company.documents.map(d => d.type as DocumentType),
  })
  return prisma.verificationReview.create({
    data: {
      companyId,
      aiVerdict: result.verdict,
      aiScore: result.score,
      aiModel: result.model,
      aiAnalyzedAt: new Date(),
      aiReport: { checks: result.checks, registry: result.registry } as unknown as Prisma.InputJsonValue,
    },
  })
}
