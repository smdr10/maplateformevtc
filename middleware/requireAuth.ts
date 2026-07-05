// src/middleware/requireAuth.ts
// Middleware de vérification JWT pour les routes API Next.js

import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, JwtPayload } from '@/lib/jwt'
import { ACCESS_COOKIE } from '@/lib/auth'

// ============================================================
// TYPE — Request enrichie avec l'user
// ============================================================

export type AuthedRequest = NextRequest & { user: JwtPayload }

// ============================================================
// HELPER — extraire et vérifier le token
// ============================================================

export function getAuthUser(req: NextRequest): JwtPayload | null {
  try {
    // 1. Chercher dans le cookie httpOnly (prioritaire)
    const cookieToken = req.cookies.get(ACCESS_COOKIE)?.value
    if (cookieToken) return verifyAccessToken(cookieToken)

    // 2. Fallback : Authorization: Bearer <token>
    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      return verifyAccessToken(authHeader.slice(7))
    }

    return null
  } catch {
    return null
  }
}

// ============================================================
// requireAuth — à utiliser dans les Route Handlers
// ============================================================

export function requireAuth(
  handler: (req: NextRequest, user: JwtPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const user = getAuthUser(req)

    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Connexion requise' },
        { status: 401 }
      )
    }

    return handler(req, user)
  }
}

// ============================================================
// requireAdmin — routes admin uniquement
// ============================================================

export function requireAdmin(
  handler: (req: NextRequest, user: JwtPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const user = getAuthUser(req)

    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Connexion requise' },
        { status: 401 }
      )
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Accès admin requis' },
        { status: 403 }
      )
    }

    return handler(req, user)
  }
}

// ============================================================
// middleware.ts (racine du projet) — protéger les routes /app
// ============================================================
// Copier dans src/middleware.ts :
//
// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'
// import { getAuthUser } from '@/middleware/requireAuth'
//
// export function middleware(req: NextRequest) {
//   const { pathname } = req.nextUrl
//
//   // Routes protégées
//   const protectedPaths = ['/profil', '/annonces/new', '/messages', '/favoris']
//   const isProtected = protectedPaths.some(p => pathname.startsWith(p))
//
//   if (isProtected) {
//     const user = getAuthUser(req)
//     if (!user) {
//       const loginUrl = new URL('/login', req.url)
//       loginUrl.searchParams.set('redirect', pathname)
//       return NextResponse.redirect(loginUrl)
//     }
//   }
//
//   return NextResponse.next()
// }
//
// export const config = {
//   matcher: ['/profil/:path*', '/annonces/new', '/messages/:path*', '/favoris']
// }
