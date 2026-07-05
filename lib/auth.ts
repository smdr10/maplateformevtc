// src/lib/auth.ts
// Utilitaires d'authentification : hash bcrypt, validation, emails

import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const BCRYPT_ROUNDS = 10

// ============================================================
// MOT DE PASSE
// ============================================================

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export function validatePasswordStrength(password: string): {
  valid: boolean
  message?: string
} {
  if (password.length < 8)
    return { valid: false, message: 'Le mot de passe doit contenir au moins 8 caractères' }
  if (!/[A-Z]/.test(password))
    return { valid: false, message: 'Le mot de passe doit contenir au moins une majuscule' }
  if (!/[0-9]/.test(password))
    return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre' }
  return { valid: true }
}

// ============================================================
// TOKENS (vérification email + reset password)
// ============================================================

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// ============================================================
// COOKIES — helpers pour Set-Cookie
// ============================================================

export const REFRESH_COOKIE = 'vtc_refresh'
export const ACCESS_COOKIE  = 'vtc_access'

export function makeRefreshCookieOptions() {
  return {
    httpOnly: true,             // inaccessible au JS — protège du XSS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 jours en secondes
  }
}

export function makeAccessCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 15 * 60,            // 15 minutes en secondes
  }
}

// ============================================================
// VALIDATION EMAIL
// ============================================================

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}
