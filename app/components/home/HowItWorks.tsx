'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { BadgeCheck, Camera, MessageCircle, Check } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

// Mini-ecrans illustrant chaque etape
function PublishMock() {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <motion.div key={i} initial={{ scale: 0.6, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.12, ease: EASE }}
            className="flex h-14 flex-1 items-center justify-center rounded-xl bg-brand-soft text-brand"><Camera className="h-5 w-5" /></motion.div>
        ))}
      </div>
      <div className="h-2.5 w-3/4 rounded-full bg-rule" />
      <div className="h-2.5 w-1/2 rounded-full bg-rule" />
      <div className="rounded-full bg-brand py-1.5 text-center text-[11px] font-bold text-white">Publier</div>
    </div>
  )
}

function ReviewMock() {
  return (
    <div className="space-y-2">
      {['SIRET vérifié', 'Photos conformes', 'Prix cohérent'].map((t, i) => (
        <motion.div key={t} initial={{ x: -12, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.2 + i * 0.15, ease: EASE }} className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-go text-white"><Check className="h-3 w-3" strokeWidth={3} /></span>
          <span className="text-xs font-semibold">{t}</span>
        </motion.div>
      ))}
    </div>
  )
}

function ChatMock() {
  const bubbles = [
    { me: false, t: 'Bonjour, le Model Y est dispo ?' },
    { me: true, t: 'Oui, dès lundi. 390 €/sem.' },
    { me: false, t: 'Parfait, je passe le voir !' },
  ]
  return (
    <div className="space-y-1.5">
      {bubbles.map((b, i) => (
        <motion.div key={i} initial={{ y: 8, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.25 + i * 0.25, ease: EASE }} className={`flex ${b.me ? 'justify-end' : ''}`}>
          <span className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-[11px] font-medium ${b.me ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-paper'}`}>{b.t}</span>
        </motion.div>
      ))}
    </div>
  )
}

const STEPS = [
  { icon: Camera, title: 'Publiez en 3 minutes', text: 'Photos, prix, conditions de location : votre annonce est prête depuis votre téléphone.', Mock: PublishMock },
  { icon: BadgeCheck, title: 'Notre équipe vérifie', text: 'Chaque annonce et chaque professionnel sont contrôlés avant la mise en ligne.', Mock: ReviewMock },
  { icon: MessageCircle, title: 'Échangez en direct', text: 'Les chauffeurs vous écrivent sur la messagerie. Aucune commission, jamais.', Mock: ChatMock },
]

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 60%'] })
  const progress = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <section className="relative overflow-hidden bg-night py-20 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[780px] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-4">
        <p className="eyebrow">Comment ça marche</p>
        <h2 className="display mt-2 max-w-2xl text-4xl sm:text-5xl">De l’annonce au contrat, <span className="text-brand">sans intermédiaire</span>.</h2>

        <div ref={ref} className="relative mt-14">
          {/* Route qui se remplit au defilement */}
          <div aria-hidden="true" className="absolute left-[27px] top-0 h-full w-[3px] rounded-full bg-white/10 lg:left-0 lg:top-[27px] lg:h-[3px] lg:w-full">
            <motion.div style={{ height: progress }} className="w-full rounded-full bg-gradient-to-b from-brand to-[#FF8A3D] lg:hidden" />
            <motion.div style={{ width: progress }} className="hidden h-full rounded-full bg-gradient-to-r from-brand to-[#FF8A3D] lg:block" />
          </div>

          <ol className="grid gap-10 lg:grid-cols-3 lg:gap-6">
            {STEPS.map((s, i) => (
              <motion.li key={s.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: i * 0.12, duration: 0.6, ease: EASE }} className="relative pl-20 lg:pl-0 lg:pt-20">
                <span className="absolute left-0 top-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-[var(--shadow-brand)]">
                  <s.icon className="h-6 w-6" />
                </span>
                <p className="text-sm font-bold text-brand">Étape {i + 1}</p>
                <h3 className="mt-1 text-2xl font-extrabold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-white/65">{s.text}</p>
                <div className="mt-5 max-w-xs rounded-3xl bg-white p-4 text-ink shadow-2xl">
                  <s.Mock />
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
