import { NextRequest, NextResponse } from 'next/server'
import { rotateRefreshToken } from '@/lib/jwt'
import { ACCESS_COOKIE, REFRESH_COOKIE, makeAccessCookieOptions, makeRefreshCookieOptions } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(_req: NextRequest) {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value
  if (!refreshToken) {
    return NextResponse.json({ error: 'NO_REFRESH_TOKEN', message: 'Session expiree' }, { status: 401 })
  }
  const result = await rotateRefreshToken(refreshToken)
  if (!result) {
    cookieStore.delete(ACCESS_COOKIE)
    cookieStore.delete(REFRESH_COOKIE)
    return NextResponse.json({ error: 'INVALID_REFRESH_TOKEN', message: 'Session invalide' }, { status: 401 })
  }
  cookieStore.set(ACCESS_COOKIE, result.accessToken, makeAccessCookieOptions())
  cookieStore.set(REFRESH_COOKIE, result.refreshToken, makeRefreshCookieOptions())
  return NextResponse.json({ message: 'Token renouvele' })
}