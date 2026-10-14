import { prisma } from './prisma'

// Une conversation porte soit sur une annonce, soit sur une fiche service.
export type MessageSubject =
  | { type: 'listing'; id: string }
  | { type: 'service'; id: string }

export function subjectWhere(subject: MessageSubject) {
  return subject.type === 'listing' ? { listingId: subject.id } : { serviceId: subject.id }
}

// Proprietaire et titre du sujet, ou null s'il n'existe pas / n'est plus disponible
export async function getSubjectInfo(subject: MessageSubject): Promise<{ ownerId: string; title: string } | null> {
  if (subject.type === 'listing') {
    const listing = await prisma.listing.findFirst({
      where: { id: subject.id, deletedAt: null },
      select: { userId: true, title: true },
    })
    return listing && { ownerId: listing.userId, title: listing.title }
  }
  const service = await prisma.service.findUnique({
    where: { id: subject.id },
    select: { userId: true, name: true },
  })
  return service && { ownerId: service.userId, title: service.name }
}

// Determine le destinataire autorise pour un message envoye par senderId.
// - Un visiteur ecrit toujours au proprietaire du sujet.
// - Le proprietaire ne peut repondre qu'a quelqu'un qui l'a deja contacte sur ce sujet.
export async function resolveReceiver(
  subject: MessageSubject,
  ownerId: string,
  senderId: string,
  requestedReceiverId?: string | null
): Promise<{ receiverId: string } | { error: string; message: string; status: number }> {
  if (senderId !== ownerId) {
    return { receiverId: ownerId }
  }
  if (!requestedReceiverId || requestedReceiverId === senderId) {
    return { error: 'CANNOT_MESSAGE_SELF', message: 'Vous ne pouvez pas vous contacter vous-meme', status: 400 }
  }
  const previous = await prisma.message.findFirst({
    where: { ...subjectWhere(subject), senderId: requestedReceiverId, receiverId: ownerId },
    select: { id: true },
  })
  if (!previous) {
    return { error: 'NO_CONVERSATION', message: 'Aucune conversation avec cet utilisateur', status: 403 }
  }
  return { receiverId: requestedReceiverId }
}
