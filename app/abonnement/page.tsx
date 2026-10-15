'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Subscription {
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'
  interval: 'month' | 'year'
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}
interface Me { plan: 'standard' | 'pro'; subscription: Subscription | null }
interface PlansData {
  features: { standard: string[]; pro: string[] }
  proPricing: { month: { amountCents: number; trialDays: number }; year: { amountCents: number } }
  billingEnabled: boolean
}

const euros = (cents: number) => (cents / 100).toFixed(2).replace('.', ',') + ' €'
const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '')

export default function AbonnementPage() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [plans, setPlans] = useState<PlansData | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState<'success' | 'canceled' | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('success') ? 'success' : params.get('canceled') ? 'canceled' : null
    Promise.all([
      fetch('/api/auth/me', { credentials: 'include' }).then(r => (r.ok ? r.json() : null)),
      fetch('/api/plans').then(r => r.json()),
    ]).then(([meData, plansData]) => {
      if (!meData?.user) { router.push('/login?redirect=/abonnement'); return }
      setFlash(status)
      setMe(meData.user)
      setPlans(plansData)
    })
  }, [router])

  const go = async (endpoint: string, body?: object) => {
    setBusy(true)
    setError('')
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body ?? {}),
    })
    const data = await res.json()
    if (data.url) { window.location.href = data.url; return }
    setError(data.message || 'Une erreur est survenue')
    setBusy(false)
  }

  if (!me || !plans) {
    return <div className="min-h-screen flex items-center justify-center" style={{ color: '#6B7789' }}>Chargement...</div>
  }

  const sub = me.subscription
  const isPro = me.plan === 'pro'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 min-h-screen">
      <Link href="/profil" className="text-sm" style={{ color: '#6B7789' }}>← Mon profil</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6" style={{ color: '#0B1F3A' }}>Mon abonnement</h1>

      {flash === 'success' && (
        <div className="mb-5 p-4 rounded-[4px] text-sm" style={{ backgroundColor: '#F0FFF4', border: '1px solid #BBF7D0', color: '#15803D' }}>
          Merci ! Votre pack Pro est en cours d&apos;activation (quelques secondes). Rechargez la page si besoin.
        </div>
      )}
      {flash === 'canceled' && (
        <div className="mb-5 p-4 rounded-[4px] text-sm" style={{ backgroundColor: '#F3F1EA', border: '1px solid #D9D5C9', color: '#6B7789' }}>
          Paiement annule. Vous restez sur le pack Standard.
        </div>
      )}
      {error && (
        <div className="mb-5 p-4 rounded-[4px] text-sm" style={{ backgroundColor: '#FFF0F0', color: '#DC2626' }}>{error}</div>
      )}

      <div className="rounded-[4px] p-6" style={{ backgroundColor: '#FFFFFF', border: `${isPro ? 2 : 1}px solid ${isPro ? '#0B1F3A' : '#D9D5C9'}` }}>
        <p className="text-sm" style={{ color: '#6B7789' }}>Pack actuel</p>
        <p className="text-2xl font-bold mt-1" style={{ color: isPro ? '#0B1F3A' : '#0B1F3A' }}>{isPro ? 'Pro' : 'Standard'}</p>

        {isPro && sub && (
          <div className="mt-3 text-sm space-y-1" style={{ color: '#33465F' }}>
            <p>Formule {sub.interval === 'month' ? 'mensuelle' : 'annuelle'}</p>
            {sub.status === 'trialing' && <p>Periode offerte jusqu&apos;au {date(sub.trialEndsAt)}</p>}
            {sub.status === 'active' && <p>Prochain renouvellement le {date(sub.currentPeriodEnd)}</p>}
            {sub.status === 'canceled' && <p style={{ color: '#B45309' }}>Resilie : le Pro reste actif jusqu&apos;au {date(sub.currentPeriodEnd)}</p>}
            {sub.status === 'past_due' && <p style={{ color: '#DC2626' }}>Paiement en echec : mettez à jour votre carte pour garder le Pro.</p>}
          </div>
        )}

        <ul className="mt-5 space-y-2">
          {plans.features[isPro ? 'pro' : 'standard'].map(f => (
            <li key={f} className="text-sm" style={{ color: '#33465F' }}>✓ {f}</li>
          ))}
        </ul>

        {sub && (
          <button type="button" disabled={busy} onClick={() => go('/api/billing/portal')}
            className="mt-6 w-full py-3 rounded-[3px] text-sm font-bold border-2 disabled:opacity-50" style={{ borderColor: '#0B1F3A', color: '#0B1F3A' }}>
            Gérer mon abonnement et mes factures
          </button>
        )}
      </div>

      {!isPro && (
        <div className="mt-6 rounded-[4px] p-6" style={{ backgroundColor: '#FFF3CC', border: '1px solid #FFC72C' }}>
          <h2 className="text-lg font-bold" style={{ color: '#0B1F3A' }}>Passez au Pro</h2>
          <ul className="mt-3 space-y-2">
            {plans.features.pro.map(f => (
              <li key={f} className="text-sm" style={{ color: '#0B1F3A' }}>✓ {f}</li>
            ))}
          </ul>
          {plans.billingEnabled ? (
            <div className="grid sm:grid-cols-2 gap-3 mt-5">
              <button type="button" disabled={busy} onClick={() => go('/api/billing/checkout', { interval: 'month' })}
                className="py-3 rounded-[3px] text-sm font-bold text-white disabled:opacity-50" style={{ backgroundColor: '#0B1F3A' }}>
                {euros(plans.proPricing.month.amountCents)}/mois{!sub ? ' · 1er mois offert' : ''}
              </button>
              <button type="button" disabled={busy} onClick={() => go('/api/billing/checkout', { interval: 'year' })}
                className="py-3 rounded-[3px] text-sm font-bold border-2 disabled:opacity-50" style={{ borderColor: '#0B1F3A', color: '#0B1F3A' }}>
                {euros(plans.proPricing.year.amountCents)}/an · 2 mois offerts
              </button>
            </div>
          ) : (
            <p className="text-sm mt-4" style={{ color: '#6B7789' }}>Le paiement en ligne ouvre tres bientot.</p>
          )}
          <p className="text-xs mt-3" style={{ color: '#6B7789' }}>Prix TTC. Paiement sécurisé par Stripe. Résiliable a tout moment.</p>
        </div>
      )}
    </div>
  )
}
