'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import PricingGrid, { PlansData, Tier, Interval } from '../PricingGrid'

// Packs visibles par tous sur l'accueil ; le choix mene a l'inscription ou a l'abonnement
export default function PlansSection() {
  const [plans, setPlans] = useState<PlansData | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/plans').then(r => r.json()),
      fetch('/api/auth/me', { credentials: 'include' }).then(r => r.ok),
    ]).then(([p, ok]) => { setPlans(p); setLoggedIn(ok) }).catch(() => {})
  }, [])

  const choose = (tier: Tier, interval: Interval) => {
    if (!loggedIn) {
      window.location.href = '/register'
      return
    }
    window.location.href = tier === 'standard' ? '/espace' : `/abonnement?tier=${tier}&interval=${interval}`
  }

  return (
    <section id="packs" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
        className="mx-auto mb-10 max-w-2xl text-center">
        <p className="eyebrow">Nos packs</p>
        <h2 className="display mt-2 text-4xl sm:text-5xl">Gratuit pour commencer, <span className="text-brand">Pro pour accélérer</span></h2>
        <p className="mt-3 text-ink-soft">Particulier ou professionnel, choisissez le pack qui correspond à votre activité. Sans engagement.</p>
      </motion.div>
      {plans ? (
        <PricingGrid plans={plans} onChoose={choose} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map(i => <div key={i} className="h-[520px] animate-pulse rounded-[24px] bg-rule/70" />)}
        </div>
      )}
    </section>
  )
}
