import { prisma } from './prisma'

// Statuts dans lesquels le dossier (identite de la societe + documents) peut etre modifie
export const EDITABLE_STATUSES = ['unverified', 'rejected', 'expired']

export async function getOwnCompany(userId: string) {
  return prisma.company.findUnique({ where: { userId } })
}
