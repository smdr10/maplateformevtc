import { NextRequest, NextResponse } from 'next/server'
import { revokeRefreshToken } from '@/lib/jwt'
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(_req: NextRequest) {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value
  if (refreshToken) {
    await revokeRefreshToken(refreshToken).catch(() => {})
  }
  cookieStore.delete(ACCESS_COOKIE)
  cookieStore.delete(REFRESH_COOKIE)
  return NextResponse.json({ message: 'Deconnecte avec succes' })
}