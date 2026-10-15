'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PricingGrid, { PlansData, Tier, Interval } from '../components/PricingGrid'

interface Subscription {
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'
  interval: 'month' | 'year'
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}
interface Me { plan: Tier; subscription: Subscription | null }

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : '')
const TIER_NAME: Record<Tier, string> = { standard: 'Standard', pro: 'Pro', flotte: 'Flotte' }

export default function AbonnementPage() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [plans, setPlans] = useState<PlansData | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const load = () => Promise.all([
    fetch('/api/auth/me', { credentials: 'include' }).then(r => (r.ok ? r.json() : null)),
    fetch('/api/plans').then(r => r.json()),
  ])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    load().then(([meData, plansData]) => {
      if (!meData?.user) { router.push('/login?redirect=/abonnement'); return }
      if (params.get('success')) setMessage({ ok: true, text: 'Merci ! Votre pack est en cours d’activation (quelques secondes). Rechargez la page si besoin.' })
      if (params.get('canceled')) setMessage({ ok: false, text: 'Paiement annulé. Votre pack actuel est inchangé.' })
      setMe(meData.user)
      setPlans(plansData)
    })
  }, [router])

  const post = async (endpoint: string, body?: object) => {
    setBusy(true)
    setMessage(null)
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body ?? {}),
    })
    const data = await res.json()
    if (data.url) { window.location.href = data.url; return }
    if (data.updated) {
      setMessage({ ok: true, text: `Votre abonnement passe au pack ${TIER_NAME[data.tier as Tier]}.` })
      const [meData] = await load()
      if (meData?.user) setMe(meData.user)
    } else {
      setMessage({ ok: false, text: data.message || 'Une erreur est survenue' })
    }
    setBusy(false)
  }

  const choose = (tier: Tier, interval: Interval) => {
    if (tier === 'standard') {
      // Revenir au Standard = resilier depuis le portail Stripe
      if (me?.subscription) post('/api/billing/portal')
      return
    }
    post('/api/billing/checkout', { tier, interval })
  }

  if (!me || !plans) {
    return <div className="flex min-h-screen items-center justify-center text-ink-mute">Chargement…</div>
  }

  const sub = me.subscription
  const paid = me.plan !== 'standard'

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/espace" className="text-sm text-ink-mute hover:underline">← Mon espace</Link>
      <div className="mb-8 mt-3 flex flex-wrap items-end justify-between gap-4 border-b-[1.5px] border-ink pb-3">
        <div>
          <p className="eyebrow">Mon abonnement</p>
          <h1 className="display mt-1 text-5xl">Pack {TIER_NAME[me.plan]}</h1>
          {paid && sub && (
            <p className="mt-2 text-sm text-ink-soft">
              Formule {sub.interval === 'month' ? 'mensuelle' : 'annuelle'}
              {sub.status === 'trialing' && ` · période offerte jusqu’au ${date(sub.trialEndsAt)}`}
              {sub.status === 'active' && ` · prochain renouvellement le ${date(sub.currentPeriodEnd)}`}
              {sub.status === 'canceled' && ` · résilié, actif jusqu’au ${date(sub.currentPeriodEnd)}`}
            </p>
          )}
          {sub?.status === 'past_due' && <p className="mt-2 text-sm font-semibold text-stop">Paiement en échec : mettez à jour votre carte pour garder votre pack.</p>}
        </div>
        {sub && (
          <button type="button" disabled={busy} onClick={() => post('/api/billing/portal')} className="btn btn-line">
            Gérer mon abonnement et mes factures
          </button>
        )}
      </div>

      {message && (
        <div className={`mb-6 rounded-[3px] border-[1.5px] p-4 text-sm ${message.ok ? 'border-go bg-go-soft text-go' : 'border-stop bg-stop-soft text-stop'}`}>{message.text}</div>
      )}

      <PricingGrid plans={plans} currentTier={me.plan} busy={busy} highlight={me.plan === 'pro' ? 'flotte' : 'pro'} onChoose={choose} />
      <p className="mt-6 text-center text-xs text-ink-mute">Prix TTC. Paiement sécurisé par Stripe. Résiliable à tout moment depuis cette page.</p>
    </div>
  )
}
