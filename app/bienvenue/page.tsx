'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PricingGrid, { PlansData, Tier, Interval } from '../components/PricingGrid'

interface Me {
  name: string
  accountType: 'individual' | 'professional'
  company: { activities: string[] } | null
}

export default function BienvenuePage() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [plans, setPlans] = useState<PlansData | null>(null)
  const [sending, setSending] = useState(false)
  const [pending, setPending] = useState<Tier | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me', { credentials: 'include' }).then(r => (r.ok ? r.json() : null)),
      fetch('/api/plans').then(r => r.json()),
    ]).then(([meData, plansData]) => {
      if (!meData?.user) { router.push('/login?redirect=/bienvenue'); return }
      setMe(meData.user)
      setPlans(plansData)
    })
  }, [router])

  const nextPage = me?.accountType === 'professional' ? '/profil/certification' : '/annonces/new'
  // Les loueurs et flottes voient le pack Flotte mis en avant
  const highlight: Tier = me?.company?.activities?.some(a => a === 'fleet' || a === 'lessor_loa') ? 'flotte' : 'pro'

  const choose = async (tier: Tier, interval: Interval) => {
    setSending(true)
    try {
      const choice = tier === 'standard' ? 'standard' : `${tier}_${interval}`
      const res = await fetch('/api/plans/choice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ choice }),
      })
      const data = await res.json()
      if (tier === 'standard') { router.push(nextPage); return }
      if (!data.paymentAvailable) { setPending(tier); return }
      const checkout = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tier, interval }),
      })
      const session = await checkout.json()
      if (session.url) { window.location.href = session.url; return }
      setPending(tier)
    } finally {
      setSending(false)
    }
  }

  if (!me || !plans) {
    return <div className="flex min-h-screen items-center justify-center text-ink-mute">Chargement…</div>
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 text-center">
        <p className="eyebrow">Bienvenue {me.name.split(' ')[0]}</p>
        <h1 className="display mt-2 text-5xl">Choisissez votre pack</h1>
        <p className="mt-2 text-ink-soft">Commencez gratuitement, changez quand vous voulez. Sans engagement.</p>
      </div>

      <PricingGrid plans={plans} busy={sending} highlight={highlight} onChoose={choose} />

      {me.accountType === 'professional' && (
        <div className="panel-soft mt-8 flex gap-3 p-5">
          <span aria-hidden="true" className="font-display text-2xl text-go">✓</span>
          <p className="text-sm text-ink-soft">
            <strong className="text-ink">Badge « Pro certifié » gratuit, quel que soit votre pack.</strong>{' '}
            Après ce choix, envoyez vos justificatifs (Kbis ou avis SIRENE, carte VTC…) pour faire certifier votre société.
          </p>
        </div>
      )}

      {pending && (
        <div className="panel mt-6 bg-signal-soft p-5">
          <p className="font-semibold">Merci pour votre intérêt pour le pack {pending === 'pro' ? 'Pro' : 'Flotte'} !</p>
          <p className="mt-1 text-sm text-ink-soft">
            Le paiement en ligne de ce pack ouvre très bientôt : nous vous préviendrons dès qu&apos;il est disponible.
            En attendant, vous profitez du pack Standard.
          </p>
          <Link href={nextPage} className="mt-3 inline-block font-display text-sm font-semibold uppercase tracking-wider underline underline-offset-4">Continuer →</Link>
        </div>
      )}

      <div className="mt-6 text-center">
        <button type="button" disabled={sending} onClick={() => choose('standard', 'month')} className="text-sm text-ink-mute underline">
          Je déciderai plus tard
        </button>
      </div>
    </div>
  )
}
