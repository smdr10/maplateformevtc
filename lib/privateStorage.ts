import { v2 as cloudinary } from 'cloudinary'

// Stockage des documents de certification sur Cloudinary en mode "authenticated" :
// aucune URL publique, lecture uniquement via un lien signe a duree limitee.

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const FOLDER = 'vtc-marketplace-private/verification'
const SIGNED_URL_TTL_SEC = 10 * 60

export const ALLOWED_DOCUMENT_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024

export async function uploadPrivateDocument(file: File, companyId: string): Promise<{ storageKey: string }> {
  const buffer = Buffer.from(await file.arrayBuffer())
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `${FOLDER}/${companyId}`,
        type: 'authenticated',
        resource_type: 'image', // Cloudinary traite aussi les PDF comme "image"
        use_filename: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) return reject(error)
        // On conserve le format pour pouvoir generer le lien de telechargement
        resolve({ storageKey: `${result.public_id}.${result.format}` })
      }
    ).end(buffer)
  })
}

function splitKey(storageKey: string): { publicId: string; format: string } {
  const dot = storageKey.lastIndexOf('.')
  return { publicId: storageKey.slice(0, dot), format: storageKey.slice(dot + 1) }
}

// Lien de consultation valable quelques minutes (admin uniquement)
export function signedDocumentUrl(storageKey: string): string {
  const { publicId, format } = splitKey(storageKey)
  return cloudinary.utils.private_download_url(publicId, format, {
    type: 'authenticated',
    resource_type: 'image',
    expires_at: Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SEC,
  })
}

export async function deletePrivateDocument(storageKey: string): Promise<void> {
  const { publicId } = splitKey(storageKey)
  await cloudinary.uploader.destroy(publicId, { type: 'authenticated', resource_type: 'image', invalidate: true })
}
