import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, normalizeEmail, makeAccessCookieOptions, makeRefreshCookieOptions, ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth'
import { signAccessToken, createRefreshToken } from '@/lib/jwt'
import { cookies } from 'next/headers'

const loginAttempts = new Map()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[LOGIN DEBUG]', JSON.stringify(body))
    const { email, password } = body
    if (!email || !password) {
      return NextResponse.json({ error: 'MISSING_FIELDS', message: 'Email et mot de passe requis' }, { status: 400 })
    }
    const normalizedEmail = normalizeEmail(email)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, passwordHash: true, role: true, isSuspended: true, emailVerifiedAt: true },
    })
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'INVALID_CREDENTIALS', message: 'Email ou mot de passe incorrect' }, { status: 401 })
    }
    if (user.isSuspended) {
      return NextResponse.json({ error: 'ACCOUNT_SUSPENDED', message: 'Compte suspendu' }, { status: 403 })
    }
    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role })
    const refreshToken = await createRefreshToken(user.id)
    const cookieStore = await cookies()
    cookieStore.set(ACCESS_COOKIE, accessToken, makeAccessCookieOptions())
    cookieStore.set(REFRESH_COOKIE, refreshToken, makeRefreshCookieOptions())
    return NextResponse.json({ message: 'Connexion reussie', user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: !!user.emailVerifiedAt } })
  } catch (error) {
    console.error('[LOGIN]', error)
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'Erreur serveur' }, { status: 500 })
  }
}