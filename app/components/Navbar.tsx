'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'motion/react'
import { Bell, ChevronDown, Plus, Search } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Notification {
  id: string
  type: string
  content: { text: string; listingId?: string }
  isRead: boolean
  createdAt: string
}

const NAV_LINKS = [
  { href: '/annonces?type=sale', label: 'Acheter' },
  { href: '/annonces?type=rent&rentDuration=week', label: 'Louer' },
  { href: '/annonces?rentDuration=loa', label: 'LOA' },
  { href: '/services', label: 'Services pros' },
]

const MENU_LINKS = [
  { href: '/espace', label: 'Mon espace' },
  { href: '/annonces/new', label: 'Publier une annonce' },
  { href: '/messages', label: 'Messages' },
  { href: '/favoris', label: 'Mes favoris' },
  { href: '/abonnement', label: 'Abonnement' },
  { href: '/profil', label: 'Mon profil' },
]

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className={`text-xl font-extrabold tracking-tight ${inverted ? 'text-white' : 'text-ink'}`}>
      MaPlateforme<span className="text-brand">VTC</span>
    </span>
  )
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [search, setSearch] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const notifRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', y => setScrolled(y > 12))

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(async data => {
        if (data?.user) {
          setUser(data.user)
          const res = await fetch('/api/notifications', { credentials: 'include' })
          if (res.ok) {
            const n = await res.json()
            setNotifications(n.notifications || [])
            setUnreadCount(n.unreadCount || 0)
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const openNotifications = async () => {
    setNotifOpen(!notifOpen)
    if (!notifOpen && unreadCount > 0) {
      await fetch('/api/notifications', { method: 'PATCH', credentials: 'include' })
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
    setMenuOpen(false)
    window.location.href = '/'
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/annonces?q=${encodeURIComponent(search.trim())}`)
      setSearch('')
    }
  }

  // Sur l'accueil, la barre est transparente au-dessus du hero puis devient "verre depoli"
  const overHero = pathname === '/' && !scrolled

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`sticky top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300 ${
        overHero ? 'bg-transparent' : 'bg-white/80 shadow-[0_1px_0_rgb(22_24_29_/_0.06),0_8px_30px_rgb(22_24_29_/_0.06)] backdrop-blur-xl'
      }`}
    >
      <div className={`mx-auto flex max-w-7xl items-center gap-4 px-4 transition-[height] duration-300 ${scrolled ? 'h-16' : 'h-20'}`}>
        <Link href="/" className="flex-shrink-0" aria-label="Accueil MaPlateformeVTC">
          <Logo />
        </Link>

        <nav aria-label="Rubriques" className="ml-4 hidden items-center lg:flex" onMouseLeave={() => setHovered(null)}>
          {NAV_LINKS.map(item => (
            <Link key={item.href} href={item.href} onMouseEnter={() => setHovered(item.href)}
              className="relative rounded-full px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:text-ink">
              {hovered === item.href && (
                <motion.span layoutId="nav-hover" className="absolute inset-0 rounded-full bg-ink/[0.06]" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
              )}
              <span className="relative">{item.label}</span>
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearch} className="relative ml-auto hidden w-64 md:block xl:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un véhicule…" aria-label="Rechercher un véhicule"
            className="w-full rounded-full border border-rule bg-white/90 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand focus:shadow-[0_0_0_4px_rgb(255_85_0_/_0.12)]" />
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {loading ? (
            <div className="h-10 w-28 animate-pulse rounded-full bg-rule" />
          ) : user ? (
            <>
              <Link href="/annonces/new" className="btn btn-brand hidden !py-2.5 text-sm md:inline-flex">
                <Plus className="h-4 w-4" strokeWidth={2.6} /> Publier
              </Link>

              <div className="relative" ref={notifRef}>
                <button onClick={openNotifications} aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-ink/[0.06]">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.18 }}
                      className="panel absolute right-0 z-50 mt-2 w-80 overflow-hidden">
                      <p className="border-b border-rule px-4 py-3 text-sm font-bold">Notifications</p>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="py-8 text-center text-sm text-ink-mute">Aucune notification</p>
                        ) : notifications.map(n => (
                          <div key={n.id} className={`border-b border-rule px-4 py-3 last:border-0 ${!n.isRead ? 'bg-brand-soft' : ''}`}>
                            <p className="text-sm">{n.content.text}</p>
                            <p className="mt-1 text-xs text-ink-mute">{new Date(n.createdAt).toLocaleDateString('fr-FR')}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-1.5 rounded-full border border-rule bg-white py-1 pl-1 pr-2.5 transition hover:shadow-[var(--shadow-soft)]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-sm font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-ink-mute transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.18 }}
                      className="panel absolute right-0 z-50 mt-2 w-60 overflow-hidden py-1.5">
                      <div className="border-b border-rule px-4 pb-2.5 pt-1.5">
                        <p className="truncate text-sm font-bold">{user.name}</p>
                        <p className="truncate text-xs text-ink-mute">{user.email}</p>
                      </div>
                      {MENU_LINKS.map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm font-medium hover:bg-paper">
                          {item.label}
                        </Link>
                      ))}
                      {user.role === 'admin' && (
                        <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm font-bold text-brand hover:bg-brand-soft">Administration</Link>
                      )}
                      <button onClick={logout} className="mt-1 block w-full border-t border-rule px-4 py-2.5 text-left text-sm font-medium text-stop hover:bg-stop-soft">Se déconnecter</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold hover:bg-ink/[0.06] sm:block">Se connecter</Link>
              <Link href="/register" className="btn btn-brand !py-2.5 text-sm">Créer un compte</Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  )
}
