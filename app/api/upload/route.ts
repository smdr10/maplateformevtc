import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/middleware/requireAuth'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'NO_FILES', message: 'Aucun fichier recu' }, { status: 400 })
    }

    if (files.length > 10) {
      return NextResponse.json({ error: 'TOO_MANY_FILES', message: 'Maximum 10 photos' }, { status: 400 })
    }

    const uploadPromises = files.map(async (file, index) => {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      return new Promise<{ url: string; publicId: string; position: number }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'vtc-marketplace',
            transformation: [
              { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
              {
                overlay: 'sm-drivers-logo_i4y0hn',
                width: 120,
                opacity: 40,
                gravity: 'south_east',
                x: 15,
                y: 15,
              },
              { flags: 'layer_apply' },
            ],
          },
          (error, result) => {
            if (error || !result) return reject(error)
            resolve({
              url:      result.secure_url,
              publicId: result.public_id,
              position: index,
            })
          }
        ).end(buffer)
      })
    })

    const uploaded = await Promise.all(uploadPromises)

    return NextResponse.json({ images: uploaded }, { status: 201 })
  } catch (error) {
    console.error('[UPLOAD]', error)
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'Erreur upload' }, { status: 500 })
  }
}