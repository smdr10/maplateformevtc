import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, normalizeEmail, makeAccessCookieOptions, makeRefreshCookieOptions, ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth'
import { signAccessToken, createRefreshToken } from '@/lib/jwt'
import { rateLimit, resetRateLimit, getClientIp } from '@/lib/rateLimit'
import { cookies } from 'next/headers'

const MAX_ATTEMPTS_PER_ACCOUNT = 5
const MAX_ATTEMPTS_PER_IP = 20
const WINDOW_MS = 15 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return NextResponse.json({ error: 'MISSING_FIELDS', message: 'Email et mot de passe requis' }, { status: 400 })
    }
    const normalizedEmail = normalizeEmail(email)
    const ipKey = `login:ip:${getClientIp(req.headers)}`
    const accountKey = `login:account:${normalizedEmail}`
    const ipLimit = rateLimit(ipKey, MAX_ATTEMPTS_PER_IP, WINDOW_MS)
    const accountLimit = rateLimit(accountKey, MAX_ATTEMPTS_PER_ACCOUNT, WINDOW_MS)
    if (!ipLimit.allowed || !accountLimit.allowed) {
      const retryAfter = Math.max(ipLimit.retryAfterSec, accountLimit.retryAfterSec)
      return NextResponse.json(
        { error: 'TOO_MANY_ATTEMPTS', message: `Trop de tentatives. Reessayez dans ${Math.ceil(retryAfter / 60)} min.` },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }
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
    resetRateLimit(accountKey)
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
