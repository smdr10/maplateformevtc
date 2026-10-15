'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight, GraduationCap, ShieldCheck, Smartphone, Wrench, BadgeCheck } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

const reveal = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: EASE } }),
}

function Tile({ i, href, className, children }: { i: number; href: string; className: string; children: React.ReactNode }) {
  return (
    <motion.div custom={i} variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
      className={`group relative min-w-[78%] snap-start sm:min-w-0 ${className}`}>
      <Link href={href} className="relative flex h-full flex-col overflow-hidden rounded-[28px] p-6 transition duration-300 group-hover:-translate-y-1">
        {children}
      </Link>
    </motion.div>
  )
}

export default function ServicesBento() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Services & professionnels</p>
          <h2 className="display mt-2 max-w-2xl text-4xl sm:text-5xl">Tout ce qu’il faut pour <span className="text-brand">rouler sereinement</span>.</h2>
        </div>
        <Link href="/services" className="btn btn-line">Tout l’annuaire <ArrowRight className="h-4 w-4" /></Link>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4 lg:grid-rows-2">
        {/* Garages : grande tuile orange */}
        <Tile i={0} href="/services?category=maintenance" className="sm:col-span-2 lg:row-span-2">
          <div className="absolute inset-0 bg-gradient-to-br from-brand via-[#FF6A1A] to-[#FF8A3D]" />
          <motion.div aria-hidden="true" className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full border-[28px] border-white/15"
            animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} />
          <div aria-hidden="true" className="absolute bottom-8 right-8 flex h-28 w-28 items-center justify-center rounded-[32px] bg-white/20 backdrop-blur transition duration-500 group-hover:rotate-[-12deg] group-hover:scale-110">
            <Wrench className="h-14 w-14 text-white" strokeWidth={1.6} />
          </div>
          <div className="relative text-white">
            <span className="chip bg-white/20 text-white">Le plus demandé</span>
            <h3 className="display mt-4 text-4xl lg:text-5xl">Garages<br />spécialisés VTC</h3>
            <p className="mt-3 max-w-xs text-white/85">Entretien, pneus, carrosserie : des ateliers qui connaissent les contraintes d’un véhicule qui roule tous les jours.</p>
            <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-brand">Trouver un garage <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </div>
        </Tile>

        {/* Assurance : tuile sombre */}
        <Tile i={1} href="/services?category=insurance" className="lg:col-span-2">
          <div className="absolute inset-0 bg-night" />
          <div aria-hidden="true" className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand/30 blur-3xl" />
          <div className="relative flex h-full items-center justify-between gap-4 text-white">
            <div>
              <h3 className="text-2xl font-extrabold tracking-tight">Assurance VTC</h3>
              <p className="mt-1 max-w-xs text-sm text-white/65">Assureurs et courtiers spécialisés transport de personnes.</p>
            </div>
            <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-[var(--shadow-brand)] transition duration-500 group-hover:scale-110">
              <ShieldCheck className="h-8 w-8" />
            </span>
          </div>
        </Tile>

        {/* Formation */}
        <Tile i={2} href="/services?category=formation" className="">
          <div className="absolute inset-0 bg-brand-soft" />
          <div className="relative">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand shadow-sm transition duration-500 group-hover:-rotate-6 group-hover:scale-110">
              <GraduationCap className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-xl font-extrabold tracking-tight">Formation</h3>
            <p className="mt-1 text-sm text-ink-soft">Carte professionnelle VTC et remises à niveau.</p>
          </div>
        </Tile>

        {/* Equipement */}
        <Tile i={3} href="/services?category=accessories" className="">
          <div className="absolute inset-0 border border-rule bg-white" style={{ borderRadius: 28 }} />
          <div className="relative">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white transition duration-500 group-hover:rotate-6 group-hover:scale-110">
              <Smartphone className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-xl font-extrabold tracking-tight">Équipement</h3>
            <p className="mt-1 text-sm text-ink-soft">Terminaux de paiement, supports, caméras embarquées.</p>
          </div>
        </Tile>
      </div>

      {/* Appel aux professionnels */}
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: EASE }}
        className="relative mt-6 overflow-hidden rounded-[28px] bg-gradient-to-r from-ink to-[#2A2D35] p-8 text-white sm:p-10">
        <div aria-hidden="true" className="absolute -right-20 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-brand/30 blur-[90px]" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 text-sm font-bold text-brand"><BadgeCheck className="h-4 w-4" /> Loueurs, flottes, garages, assureurs</p>
            <h3 className="display mt-2 text-3xl sm:text-4xl">Faites-vous connaître des chauffeurs VTC</h3>
            <p className="mt-2 text-white/70">Compte pro gratuit, badge « Pro certifié », et un pack Flotte avec statistiques et baromètre de la demande par ville.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/register" className="btn btn-brand">Créer un compte pro</Link>
            <Link href="/abonnement" className="btn border-white/20 bg-white/10 text-white hover:bg-white/20">Voir les packs</Link>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
