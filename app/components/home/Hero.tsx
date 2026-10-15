'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { BadgeCheck, CarFront, Handshake, MapPin, MessageCircle, Search, ShieldCheck, Sparkles } from 'lucide-react'

type Mode = 'sale' | 'week' | 'loa'

const MODES: { v: Mode; l: string }[] = [
  { v: 'sale', l: 'Acheter' },
  { v: 'week', l: 'Louer' },
  { v: 'loa', l: 'LOA' },
]

const ROTATING = ['acheter.', 'louer.', 'financer.', 'vendre.']
const EASE = [0.22, 1, 0.36, 1] as const

const TRUST = [
  { icon: ShieldCheck, label: 'Pros vérifiés' },
  { icon: BadgeCheck, label: 'Annonces relues' },
  { icon: Handshake, label: 'Sans commission' },
]

function RotatingWord() {
  const [i, setI] = useState(0)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (reduce) return
    const t = setInterval(() => setI(v => (v + 1) % ROTATING.length), 2200)
    return () => clearInterval(t)
  }, [reduce])
  return (
    <span className="relative inline-flex overflow-hidden align-bottom">
      <AnimatePresence mode="wait">
        <motion.span key={ROTATING[i]}
          initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="bg-gradient-to-r from-brand to-[#FF8A3D] bg-clip-text pb-1 text-transparent">
          {ROTATING[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

// Carte flottante decorative autour du telephone
function Floating({ children, className, delay = 0, y = 10 }: { children: React.ReactNode; className: string; delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: [0, -y, 0] }}
      transition={{ opacity: { delay, duration: 0.5 }, scale: { delay, duration: 0.5, ease: EASE }, y: { delay: delay + 0.5, duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
      className={`absolute rounded-2xl border border-rule bg-white/95 p-3 shadow-[var(--shadow-lift)] backdrop-blur ${className}`}>
      {children}
    </motion.div>
  )
}

export default function Hero({ firstName }: { firstName?: string }) {
  const [mode, setMode] = useState<Mode>('sale')
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (mode === 'sale') params.set('type', 'sale')
    if (mode === 'week') { params.set('type', 'rent'); params.set('rentDuration', 'week') }
    if (mode === 'loa') params.set('rentDuration', 'loa')
    if (query.trim()) params.set('q', query.trim())
    if (city.trim()) params.set('city', city.trim())
    window.location.href = `/annonces?${params}`
  }

  const words = ['Le', 'véhicule', 'VTC', 'à']

  return (
    <section className="relative -mt-20 overflow-hidden pt-20">
      {/* Halo orange anime */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <motion.div animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.08, 1] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-32 -top-40 h-[560px] w-[560px] rounded-full bg-brand/25 blur-[110px]" />
        <motion.div animate={{ x: [0, -30, 0], y: [0, 40, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-40 top-40 h-[420px] w-[420px] rounded-full bg-[#FFB089]/30 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgb(22_24_29_/_0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24 lg:pt-16">
        <div>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white/80 px-3 py-1.5 text-xs font-bold text-brand shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {firstName ? `Bonjour ${firstName}, prêt à rouler ?` : 'Le marché des chauffeurs VTC'}
          </motion.p>

          <h1 className="display mt-5 text-[2.75rem] sm:text-6xl lg:text-7xl">
            {words.map((w, i) => (
              <motion.span key={w + i} initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: EASE }} className="mr-[0.22em] inline-block">
                {w}
              </motion.span>
            ))}
            <br className="hidden sm:block" />
            <motion.span initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.6, ease: EASE }} className="inline-block">
              <RotatingWord />
            </motion.span>
          </h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.6, ease: EASE }}
            className="mt-5 max-w-xl text-lg text-ink-soft">
            Achat, location à la semaine ou LOA : trouvez votre outil de travail auprès de pros vérifiés, et les garages, assureurs et formations qui vont avec.
          </motion.p>

          <motion.form onSubmit={submit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.6, ease: EASE }}
            className="mt-8 rounded-[26px] border border-rule bg-white p-2 shadow-[var(--shadow-lift)]">
            <div className="flex gap-1 p-1" role="tablist" aria-label="Type de recherche">
              {MODES.map(m => (
                <button key={m.v} type="button" role="tab" aria-selected={mode === m.v} onClick={() => setMode(m.v)}
                  className={`relative rounded-full px-4 py-2 text-sm font-bold transition-colors ${mode === m.v ? 'text-white' : 'text-ink-soft hover:text-ink'}`}>
                  {mode === m.v && <motion.span layoutId="hero-mode" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                  <span className="relative">{m.l}</span>
                </button>
              ))}
            </div>
            <div className="grid gap-2 p-1 sm:grid-cols-[1.3fr_1fr_auto]">
              <label className="relative">
                <span className="sr-only">Marque ou modèle</span>
                <CarFront className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-mute" />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tesla Model Y, Corolla…" className="field !rounded-2xl !py-3.5 !pl-12" />
              </label>
              <label className="relative">
                <span className="sr-only">Ville</span>
                <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-mute" />
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Marseille, Paris…" className="field !rounded-2xl !py-3.5 !pl-12" />
              </label>
              <button type="submit" className="btn btn-brand !rounded-2xl !px-6">
                <Search className="h-5 w-5" strokeWidth={2.6} /> Rechercher
              </button>
            </div>
          </motion.form>

          <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.8 } } }}
            className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {TRUST.map(t => (
              <motion.li key={t.label} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft">
                <t.icon className="h-4 w-4 text-brand" /> {t.label}
              </motion.li>
            ))}
          </motion.ul>
        </div>

        {/* Telephone + cartes flottantes */}
        <div aria-hidden="true" className="relative mx-auto hidden h-[560px] w-full max-w-[460px] lg:block">
          <motion.div initial={{ opacity: 0, y: 40, rotate: -4 }} animate={{ opacity: 1, y: 0, rotate: -4 }} transition={{ delay: 0.3, duration: 0.9, ease: EASE }}
            className="absolute left-1/2 top-4 w-[270px] -translate-x-1/2 rounded-[44px] border-[10px] border-ink bg-ink shadow-[0_40px_80px_rgb(22_24_29_/_0.35)]">
            <div className="overflow-hidden rounded-[34px] bg-paper">
              <div className="flex items-center justify-between px-5 pb-2 pt-4 text-[10px] font-bold text-ink"><span>9:41</span><span className="h-4 w-16 rounded-full bg-ink" /><span>5G</span></div>
              <div className="px-4 pb-4">
                <p className="text-[11px] font-bold text-brand">Location semaine · Marseille</p>
                <div className="mt-2 overflow-hidden rounded-2xl bg-white shadow-sm">
                  <div className="flex h-32 items-center justify-center bg-gradient-to-br from-brand to-[#FF8A3D] text-white/90"><CarFront className="h-14 w-14" strokeWidth={1.4} /></div>
                  <div className="p-3">
                    <p className="text-sm font-extrabold">Tesla Model Y</p>
                    <p className="text-[11px] text-ink-mute">2024 · Électrique · 1 500 km/sem.</p>
                    <p className="mt-1 text-lg font-extrabold">390 €<span className="text-[11px] font-semibold text-ink-mute"> / semaine</span></p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {['Toyota C-HR', 'Kia Niro EV'].map(t => (
                    <div key={t} className="rounded-xl bg-white p-2 shadow-sm">
                      <div className="h-14 rounded-lg bg-brand-soft" />
                      <p className="mt-1 text-[10px] font-bold">{t}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-full bg-brand py-2 text-center text-[11px] font-bold text-white">Contacter le loueur</div>
              </div>
            </div>
          </motion.div>

          <Floating className="left-0 top-24 w-52" delay={0.9}>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-go/10 text-go"><ShieldCheck className="h-4 w-4" /></span>
              <div><p className="text-xs font-bold">Pro certifié</p><p className="text-[11px] text-ink-mute">SIRET et documents vérifiés</p></div>
            </div>
          </Floating>
          <Floating className="-right-2 top-56 w-56" delay={1.1} y={14}>
            <div className="flex items-start gap-2">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand text-white"><MessageCircle className="h-4 w-4" /></span>
              <div><p className="text-xs font-bold">Nouveau message</p><p className="text-[11px] text-ink-mute">« Disponible dès lundi ? »</p></div>
            </div>
          </Floating>
          <Floating className="bottom-16 left-6 w-44" delay={1.3} y={8}>
            <p className="text-[11px] font-semibold text-ink-mute">Annonce validée</p>
            <p className="text-sm font-extrabold">en moins de 12 h</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-rule">
              <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ delay: 1.6, duration: 1.4, ease: EASE }} className="h-full rounded-full bg-brand" />
            </div>
          </Floating>
        </div>
      </div>
    </section>
  )
}
