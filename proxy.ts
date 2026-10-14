import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

// Protection CSRF : les requetes API qui modifient des donnees doivent venir du site lui-meme.
export function proxy(req: NextRequest) {
  if (SAFE_METHODS.has(req.method)) return NextResponse.next()

  const origin = req.headers.get('origin')
  if (!origin) return NextResponse.next() // clients non-navigateur : pas de cookie tiers envoye automatiquement

  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  let originHost: string | null = null
  try {
    originHost = new URL(origin).host
  } catch {}

  if (!host || originHost !== host) {
    return NextResponse.json(
      { error: 'FORBIDDEN_ORIGIN', message: 'Origine de la requete non autorisee' },
      { status: 403 }
    )
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
