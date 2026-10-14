// Limiteur de debit en memoire (fenetre fixe).
// Limite : la memoire n'est pas partagee entre instances serverless — a remplacer
// par un store partage (Redis/Upstash) si le trafic augmente.

const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number, windowMs: number): {
  allowed: boolean
  retryAfterSec: number
} {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSec: 0 }
  }

  bucket.count += 1
  if (bucket.count > limit) {
    return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  return { allowed: true, retryAfterSec: 0 }
}

export function resetRateLimit(key: string) {
  buckets.delete(key)
}

export function getClientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0].trim()
    || headers.get('x-real-ip')
    || 'unknown'
}
