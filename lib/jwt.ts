// src/lib/jwt.ts
// Utilitaires JWT — access token (15min) + refresh token (30j)

import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import crypto from 'crypto'

// ============================================================
// TYPES
// ============================================================

export interface JwtPayload {
  sub: string        // user id
  email: string
  role: string
  iat?: number
  exp?: number
}

// ============================================================
// ACCESS TOKEN — 15 minutes, stateless
// ============================================================

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m',
  })
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload
}

// ============================================================
// REFRESH TOKEN — 30 jours, stocké en DB
// ============================================================

export async function createRefreshToken(userId: string): Promise<string> {
  // Token aléatoire — pas un JWT (plus simple à révoquer)
  const token = crypto.randomBytes(64).toString('hex')
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30j

  await prisma.refreshToken.create({
    data: { userId, token, expiresAt },
  })

  return token
}

export async function rotateRefreshToken(oldToken: string): Promise<{
  accessToken: string
  refreshToken: string
} | null> {
  // Chercher l'ancien token en DB
  const stored = await prisma.refreshToken.findUnique({
    where: { token: oldToken },
    include: { user: true },
  })

  // Invalide ou expiré
  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } })
    return null
  }

  // Rotation : supprimer l'ancien, créer un nouveau
  await prisma.refreshToken.delete({ where: { id: stored.id } })
  const newRefreshToken = await createRefreshToken(stored.userId)

  const accessToken = signAccessToken({
    sub: stored.user.id,
    email: stored.user.email,
    role: stored.user.role,
  })

  return { accessToken, refreshToken: newRefreshToken }
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token } })
}

// Purger les tokens expirés (à lancer dans un cron)
export async function purgeExpiredTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
  return result.count
}
