'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowRight, GraduationCap, LayoutGrid, MapPin, Plus, Search, ShieldCheck, Smartphone, Wrench, type LucideIcon } from 'lucide-react'

interface Service {
  id: string
  name: string
  category: string
  description: string
  city: string
  phone: string | null
  email: string | null
  website: string | null
  user: { name: string }
}

const EASE = [0.22, 1, 0.36, 1] as const

const CATEGORIES: { value: string; label: string; hint: string; icon: LucideIcon; tone: string; iconTone: string }[] = [
  { value: '', label: 'Tout', hint: 'Tous les professionnels', icon: LayoutGrid, tone: 'from-ink to-[#2A2D35] text-white', iconTone: 'bg-white/15 text-white' },
  { value: 'maintenance', label: 'Entretien', hint: 'Garages spécialisés VTC', icon: Wrench, tone: 'from-brand to-[#FF8A3D] text-white', iconTone: 'bg-white/20 text-white' },
  { value: 'insurance', label: 'Assurance', hint: 'Assureurs et courtiers', icon: ShieldCheck, tone: 'from-[#1F2230] to-[#3A2A22] text-white', iconTone: 'bg-brand text-white' },
  { value: 'formation', label: 'Formation', hint: 'Carte professionnelle VTC', icon: GraduationCap, tone: 'from-brand-soft to-white text-ink', iconTone: 'bg-white text-brand' },
  { value: 'accessories', label: 'Équipement', hint: 'Terminaux, supports, caméras', icon: Smartphone, tone: 'from-white to-paper text-ink', iconTone: 'bg-ink text-white' },
]

const CATEGORY = Object.fromEntries(CATEGORIES.map(c => [c.value, c]))

function ServicesList() {
  const searchParams = useSearchParams()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '')
  const [city, setCity] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (activeCategory) params.set('category', activeCategory)
    if (city) params.set('city', city)
    fetch(`/api/services?${params}`)
      .then(r => r.json())
      .then(data => { setServices(data.services || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [activeCategory, city])

  const pick = (value: string) => { setLoading(true); setActiveCategory(value) }

  return (
    <div>
      {/* En-tete */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-brand/20 blur-[110px]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-10">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="eyebrow">Services & professionnels</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, ease: EASE, duration: 0.6 }}
            className="display mt-2 max-w-3xl text-4xl sm:text-5xl">
            Les pros qui font <span className="text-brand">tourner votre activité</span>
          </motion.h1>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, ease: EASE, duration: 0.6 }}
            className="mt-6 flex flex-wrap items-center gap-3">
            <label className="relative w-full max-w-sm">
              <span className="sr-only">Ville</span>
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-mute" />
              <input value={city} onChange={e => { setLoading(true); setCity(e.target.value) }} placeholder="Dans quelle ville ?" className="field !rounded-full !py-3 !pl-12" />
            </label>
            <Link href="/services/new" className="btn btn-brand"><Plus className="h-4 w-4" strokeWidth={2.6} /> Référencer mon activité</Link>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0 lg:pb-0">
          {CATEGORIES.map((c, i) => {
            const active = activeCategory === c.value
            return (
              <motion.button key={c.value || 'all'} onClick={() => pick(c.value)} type="button"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06, ease: EASE, duration: 0.5 }}
                whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}
                className={`relative min-w-[160px] snap-start overflow-hidden lg:min-w-0 rounded-[24px] bg-gradient-to-br p-4 text-left shadow-[var(--shadow-soft)] ${c.tone} ${active ? 'ring-[3px] ring-brand ring-offset-2 ring-offset-paper' : 'border border-rule'}`}>
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${c.iconTone}`}><c.icon className="h-5 w-5" /></span>
                <p className="mt-6 text-lg font-extrabold tracking-tight">{c.label}</p>
                <p className="text-xs opacity-70">{c.hint}</p>
              </motion.button>
            )
          })}
        </div>
      </section>

      {/* Resultats */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-44 animate-pulse rounded-[24px] bg-rule/70" />)}
          </div>
        ) : services.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-brand to-[#FF8A3D] p-8 text-white sm:p-10">
            <div aria-hidden="true" className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full border-[28px] border-white/15" />
            <div className="relative max-w-xl">
              <Search className="h-8 w-8 text-white/80" />
              <p className="display mt-4 text-3xl">Pas encore de professionnel {activeCategory ? `en ${CATEGORY[activeCategory]?.label.toLowerCase()}` : 'ici'}{city ? ` à ${city}` : ''}</p>
              <p className="mt-2 text-white/85">Vous êtes garage, assureur, formateur ou équipementier ? Soyez le premier référencé et touchez les chauffeurs de votre ville.</p>
              <Link href="/services/new" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-brand">
                Référencer mon activité <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {services.map((s, i) => {
                const cat = CATEGORY[s.category] ?? CATEGORIES[0]
                return (
                  <motion.div key={s.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, ease: EASE, duration: 0.45 }}>
                    <Link href={`/services/${s.id}`} className="group flex h-full flex-col rounded-[24px] border border-rule bg-white p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand transition group-hover:scale-110"><cat.icon className="h-6 w-6" /></span>
                        <div className="min-w-0">
                          <p className="truncate font-extrabold tracking-tight">{s.name}</p>
                          <p className="text-xs font-semibold text-brand">{cat.label}</p>
                        </div>
                      </div>
                      <p className="mt-4 line-clamp-2 text-sm text-ink-soft">{s.description}</p>
                      <div className="mt-auto flex items-center justify-between pt-4 text-sm">
                        <span className="inline-flex items-center gap-1 font-medium text-ink-mute"><MapPin className="h-4 w-4" />{s.city}</span>
                        <span className="inline-flex items-center gap-1 font-bold text-ink transition group-hover:text-brand">Contacter <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  )
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-ink-mute">Chargement…</div>}>
      <ServicesList />
    </Suspense>
  )
}
