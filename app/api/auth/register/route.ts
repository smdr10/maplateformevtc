import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  hashPassword,
  validatePasswordStrength,
  isValidEmail,
  normalizeEmail,
  generateSecureToken,
  makeAccessCookieOptions,
  makeRefreshCookieOptions,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} from '@/lib/auth'
import { signAccessToken, createRefreshToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, phone, role } = body
    if (!name?.trim() || !email || !password) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'Nom, email et mot de passe requis' },
        { status: 400 }
      )
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'INVALID_EMAIL', message: 'Adresse email invalide' },
        { status: 400 }
      )
    }
    const { valid, message: pwMessage } = validatePasswordStrength(password)
    if (!valid) {
      return NextResponse.json(
        { error: 'WEAK_PASSWORD', message: pwMessage },
        { status: 400 }
      )
    }
    const normalizedEmail = normalizeEmail(email)
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'EMAIL_TAKEN', message: 'Cette adresse email est deja utilisee' },
        { status: 409 }
      )
    }
    const passwordHash = await hashPassword(password)
    const emailVerifyToken = generateSecureToken()
    const safeRole = role === 'pro' ? 'pro' : 'user'
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        phone: phone?.trim() || null,
        role: safeRole,
        emailVerifyToken,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    })
    const refreshToken = await createRefreshToken(user.id)
    const cookieStore = await cookies()
    cookieStore.set(ACCESS_COOKIE, accessToken, makeAccessCookieOptions())
    cookieStore.set(REFRESH_COOKIE, refreshToken, makeRefreshCookieOptions())

    // Email de bienvenue
    try {
      await sendWelcomeEmail(normalizedEmail, name.trim())
    } catch (e) {
      console.error('[EMAIL] Welcome email failed:', e)
    }

    return NextResponse.json(
      { message: 'Compte cree avec succes', user, emailVerified: false },
      { status: 201 }
    )
  } catch (error) {
    console.error('[REGISTER]', error)
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}