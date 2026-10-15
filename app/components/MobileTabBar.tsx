'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { House, Search, Plus, MessageCircle, User } from 'lucide-react'

// Barre d'onglets facon application mobile (affichee uniquement sur petit ecran)
const TABS = [
  { href: '/', label: 'Accueil', icon: House, match: (p: string) => p === '/' },
  { href: '/annonces', label: 'Explorer', icon: Search, match: (p: string) => p.startsWith('/annonces') && p !== '/annonces/new' },
  { href: '/annonces/new', label: 'Publier', icon: Plus, match: (p: string) => p === '/annonces/new', primary: true },
  { href: '/messages', label: 'Messages', icon: MessageCircle, match: (p: string) => p.startsWith('/messages') },
  { href: '/espace', label: 'Espace', icon: User, match: (p: string) => p.startsWith('/espace') || p.startsWith('/profil') },
]

export default function MobileTabBar() {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return null

  return (
    <nav aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-rule bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <ul className="mx-auto flex max-w-md items-end justify-around px-2">
        {TABS.map(tab => {
          const active = tab.match(pathname)
          const Icon = tab.icon
          if (tab.primary) {
            return (
              <li key={tab.href} className="-mt-5">
                <Link href={tab.href} aria-label={tab.label} className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-brand text-white shadow-[var(--shadow-brand)] transition active:scale-95">
                  <Icon className="h-6 w-6" strokeWidth={2.6} />
                </Link>
              </li>
            )
          }
          return (
            <li key={tab.href} className="flex-1">
              <Link href={tab.href} className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${active ? 'text-brand' : 'text-ink-mute'}`}>
                {active && <motion.span layoutId="tab-active" className="absolute top-0 h-[3px] w-8 rounded-full bg-brand" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 2} />
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
