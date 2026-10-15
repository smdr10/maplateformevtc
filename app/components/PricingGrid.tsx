'use client'

import { useState } from 'react'

export type Tier = 'standard' | 'pro' | 'flotte'
export type Interval = 'month' | 'year'

export interface PlansData {
  features: Record<Tier, string[]>
  pricing: Record<'pro' | 'flotte', Record<Interval, { amountCents: number; trialDays: number }>>
  billing: Record<'pro' | 'flotte', boolean>
}

const euros = (cents: number) => (cents / 100).toFixed(2).replace('.', ',') + ' €'

const TIERS: { tier: Tier; name: string; pitch: string }[] = [
  { tier: 'standard', name: 'Standard', pitch: 'Pour publier et échanger simplement' },
  { tier: 'pro', name: 'Pro', pitch: 'Pour vendre ou louer plus vite' },
  { tier: 'flotte', name: 'Flotte', pitch: 'Pour les loueurs et gestionnaires de flotte' },
]

export default function PricingGrid({
  plans, currentTier, busy, onChoose, highlight = 'pro',
}: {
  plans: PlansData
  currentTier?: Tier
  busy?: boolean
  highlight?: Tier
  onChoose: (tier: Tier, interval: Interval) => void
}) {
  const [interval, setInterval] = useState<Interval>('month')

  return (
    <div>
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-xl border border-rule bg-card p-1" role="tablist" aria-label="Périodicité">
          {([['month', 'Mensuel'], ['year', 'Annuel · 2 mois offerts']] as const).map(([v, l]) => (
            <button key={v} type="button" role="tab" aria-selected={interval === v} onClick={() => setInterval(v)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold ${interval === v ? 'bg-ink text-white' : ''}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {TIERS.map(({ tier, name, pitch }) => {
          const paid = tier !== 'standard'
          const price = paid ? plans.pricing[tier][interval] : null
          const monthlyEq = paid && interval === 'year' ? plans.pricing[tier].year.amountCents / 12 : null
          const isCurrent = currentTier === tier
          const featured = tier === highlight
          const available = !paid || plans.billing[tier]
          return (
            <div key={tier} className={`relative flex flex-col rounded-[24px] border border-rule bg-card ${featured ? 'lg:-translate-y-2' : ''}`}>
              <div className={`border-b border-rule px-5 py-3 ${featured ? 'bg-brand text-white' : tier === 'flotte' ? 'bg-ink text-white' : ''}`}>
                <p className="display text-3xl">{name}</p>
                <p className={`text-sm ${featured || tier === 'flotte' ? 'text-white/80' : 'text-ink-soft'}`}>{pitch}</p>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="flex items-baseline gap-1">
                  <span className="display text-5xl">{price ? euros(price.amountCents) : '0 €'}</span>
                  <span className="text-sm text-ink-mute">{price ? (interval === 'month' ? '/ mois' : '/ an') : 'pour toujours'}</span>
                </p>
                <p className="mt-1 min-h-[2.5rem] text-xs text-ink-mute">
                  {!price ? 'Sans carte bancaire.'
                    : interval === 'month' && price.trialDays > 0 ? `${price.trialDays} jours offerts au premier abonnement. Prix TTC, sans engagement.`
                    : monthlyEq ? `Soit ${euros(monthlyEq)} par mois. Prix TTC.` : 'Prix TTC, sans engagement.'}
                </p>
                <ul className="mt-4 flex-1 space-y-2">
                  {plans.features[tier].map(f => (
                    <li key={f} className="flex gap-2 text-sm">
                      <span aria-hidden="true" className="mt-0.5 font-bold text-go">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <button type="button" disabled={busy || isCurrent} onClick={() => onChoose(tier, interval)}
                  className={`btn mt-6 w-full disabled:opacity-50 ${featured ? 'btn-ink' : tier === 'flotte' ? 'btn-signal' : 'btn-line'}`}>
                  {isCurrent ? 'Votre pack actuel'
                    : !paid ? 'Commencer gratuitement'
                    : !available ? 'Bientôt disponible'
                    : interval === 'month' && price!.trialDays > 0 ? `Essayer ${name} gratuitement` : `Choisir ${name}`}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
