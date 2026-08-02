import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const BCRYPT_ROUNDS = 10

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
    return { valid: false, message: 'Le mot de passe doit contenir au moins 8 caracteres' }
  if (!/[A-Z]/.test(password))
    return { valid: false, message: 'Le mot de passe doit contenir au moins une majuscule' }
  if (!/[0-9]/.test(password))
    return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre' }
  return { valid: true }
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export const REFRESH_COOKIE = 'vtc_refresh'
export const ACCESS_COOKIE  = 'vtc_access'

const isProduction = process.env.NODE_ENV === 'production'

export function makeRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  }
}

export function makeAccessCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' as const : 'lax' as const,
    path: '/',
    maxAge: 15 * 60,
  }
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}