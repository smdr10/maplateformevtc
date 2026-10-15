'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Me {
  name: string
  accountType: 'individual' | 'professional'
}

interface PlansData {
  features: { standard: string[]; pro: string[] }
  proPricing: { month: { amountCents: number; trialDays: number }; year: { amountCents: number; trialDays: number } }
}

type Interval = 'month' | 'year'

const euros = (cents: number) => (cents / 100).toFixed(2).replace('.', ',') + ' €'

function Check({ color }: { color: string }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke={color} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function BienvenuePage() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [plans, setPlans] = useState<PlansData | null>(null)
  const [interval, setBillingInterval] = useState<Interval>('month')
  const [sending, setSending] = useState(false)
  const [proPending, setProPending] = useState(false)

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

  const choose = async (choice: 'standard' | 'pro_month' | 'pro_year') => {
    setSending(true)
    try {
      const res = await fetch('/api/plans/choice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ choice }),
      })
      const data = await res.json()
      if (choice !== 'standard') {
        if (!data.paymentAvailable) { setProPending(true); return }
        const checkout = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ interval: choice === 'pro_month' ? 'month' : 'year' }),
        })
        const session = await checkout.json()
        if (session.url) { window.location.href = session.url; return }
        setProPending(true)
        return
      }
      router.push(nextPage)
    } finally {
      setSending(false)
    }
  }

  if (!me || !plans) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3F1EA' }}>
        <div style={{ color: '#6B7789' }}>Chargement...</div>
      </div>
    )
  }

  const pro = plans.proPricing[interval]
  const monthlyEquivalent = interval === 'year' ? plans.proPricing.year.amountCents / 12 : pro.amountCents

  return (
    <div className="min-h-screen px-4 py-10" style={{ backgroundColor: '#F3F1EA' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-sm font-medium mb-2" style={{ color: '#0B1F3A' }}>Bienvenue {me.name} 👋</p>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#0B1F3A' }}>Choisissez votre formule</h1>
          <p className="text-sm mt-2" style={{ color: '#6B7789' }}>
            Commencez gratuitement, passez au Pro quand vous voulez. Sans engagement.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 rounded-[3px]" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D5C9' }}>
            {([
              { v: 'month', l: 'Mensuel' },
              { v: 'year', l: 'Annuel · 2 mois offerts' },
            ] as const).map(o => (
              <button key={o.v} type="button" onClick={() => setBillingInterval(o.v)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ backgroundColor: interval === o.v ? '#0B1F3A' : 'transparent', color: interval === o.v ? '#FFFFFF' : '#6B7789' }}>
                {o.l}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* STANDARD */}
          <div className="rounded-[4px] p-6 flex flex-col" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D5C9' }}>
            <h2 className="text-lg font-bold" style={{ color: '#0B1F3A' }}>Standard</h2>
            <p className="text-sm mt-1" style={{ color: '#6B7789' }}>Pour publier et echanger simplement</p>
            <p className="mt-4">
              <span className="text-3xl font-bold" style={{ color: '#0B1F3A' }}>0 €</span>
              <span className="text-sm" style={{ color: '#6B7789' }}> / pour toujours</span>
            </p>
            <ul className="mt-5 space-y-2.5 flex-1">
              {plans.features.standard.map(f => (
                <li key={f} className="flex gap-2 text-sm" style={{ color: '#33465F' }}><Check color="#15803D" />{f}</li>
              ))}
            </ul>
            <button type="button" disabled={sending} onClick={() => choose('standard')}
              className="mt-6 w-full py-3 rounded-[3px] text-sm font-bold border-2 transition-all hover:bg-gray-50 disabled:opacity-50"
              style={{ borderColor: '#0B1F3A', color: '#0B1F3A' }}>
              Commencer gratuitement
            </button>
          </div>

          {/* PRO */}
          <div className="rounded-[4px] p-6 flex flex-col relative" style={{ backgroundColor: '#FFFFFF', border: '2px solid #0B1F3A', boxShadow: '0 8px 24px rgba(255,85,0,0.12)' }}>
            <span className="absolute -top-3 left-6 text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: '#0B1F3A' }}>
              Recommande{pro.trialDays > 0 ? ' · 1er mois offert' : ''}
            </span>
            <h2 className="text-lg font-bold" style={{ color: '#0B1F3A' }}>Pro</h2>
            <p className="text-sm mt-1" style={{ color: '#6B7789' }}>Pour vendre plus vite et gagner en visibilite</p>
            <p className="mt-4">
              <span className="text-3xl font-bold" style={{ color: '#0B1F3A' }}>{euros(pro.amountCents)}</span>
              <span className="text-sm" style={{ color: '#6B7789' }}> / {interval === 'month' ? 'mois' : 'an'}</span>
            </p>
            <p className="text-xs mt-1" style={{ color: '#6B7789' }}>
              {interval === 'month'
                ? `${pro.trialDays} jours offerts, puis ${euros(pro.amountCents)}/mois. Résiliable a tout moment.`
                : `Soit ${euros(monthlyEquivalent)}/mois au lieu de ${euros(plans.proPricing.month.amountCents)}.`}
            </p>
            <ul className="mt-5 space-y-2.5 flex-1">
              {plans.features.pro.map(f => (
                <li key={f} className="flex gap-2 text-sm" style={{ color: '#0B1F3A' }}><Check color="#0B1F3A" />{f}</li>
              ))}
            </ul>
            <button type="button" disabled={sending} onClick={() => choose(interval === 'month' ? 'pro_month' : 'pro_year')}
              className="mt-6 w-full py-3 rounded-[3px] text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#0B1F3A' }}>
              {interval === 'month' ? 'Essayer Pro gratuitement' : 'Passer au Pro annuel'}
            </button>
          </div>
        </div>

        {me.accountType === 'professional' && (
          <div className="mt-6 rounded-[4px] p-5 flex gap-3 items-start" style={{ backgroundColor: '#F0FFF4', border: '1px solid #BBF7D0' }}>
            <span className="text-xl">🛡️</span>
            <p className="text-sm" style={{ color: '#33465F' }}>
              <strong style={{ color: '#0B1F3A' }}>Badge « Pro certifié » gratuit, quel que soit votre pack.</strong>{' '}
              Apres ce choix, envoyez vos justificatifs (Kbis ou avis SIRENE, carte VTC...) pour faire certifier votre societe.
            </p>
          </div>
        )}

        {proPending && (
          <div className="mt-6 rounded-[4px] p-5" style={{ backgroundColor: '#FFF3CC', border: '1px solid #FFC72C' }}>
            <p className="text-sm font-bold" style={{ color: '#0B1F3A' }}>Merci pour votre interet pour le pack Pro !</p>
            <p className="text-sm mt-1" style={{ color: '#33465F' }}>
              Le paiement en ligne ouvre tres bientot : nous vous previendrons des qu&apos;il est disponible.
              En attendant, vous profitez du pack Standard.
            </p>
            <Link href={nextPage} className="inline-block mt-3 text-sm font-bold" style={{ color: '#0B1F3A' }}>Continuer →</Link>
          </div>
        )}

        <div className="text-center mt-6">
          <button type="button" disabled={sending} onClick={() => choose('standard')} className="text-sm underline" style={{ color: '#6B7789' }}>
            Je deciderai plus tard
          </button>
        </div>
      </div>
    </div>
  )
}
