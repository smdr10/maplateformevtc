'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  { href: '/annonces?type=rent&rentDuration=week', label: 'Louer à la semaine' },
  { href: '/annonces?rentDuration=loa', label: 'LOA' },
  { href: '/services', label: 'Garages & services' },
  { href: '/avis', label: 'Avis' },
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
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex h-8 items-stretch overflow-hidden rounded-[3px] border-[1.5px] border-ink bg-signal font-display text-sm font-bold">
        <span className="flex items-center bg-plate px-1 text-[10px] text-white">F</span>
        <span className="flex items-center px-1.5 text-ink">VTC</span>
      </span>
      <span className={`font-display text-xl font-bold uppercase tracking-wide ${inverted ? 'text-paper' : 'text-ink'}`}>
        MaPlateforme<span className={inverted ? 'text-signal' : 'text-plate'}>VTC</span>
      </span>
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
  const router = useRouter()
  const notifRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const searchForm = (
    <form onSubmit={handleSearch} className="relative w-full">
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Tesla Model Y, Toyota C-HR, Marseille…"
        aria-label="Rechercher un véhicule"
        className="field pr-11"
      />
      <button type="submit" aria-label="Rechercher" className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[2px] bg-ink text-paper">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </button>
    </form>
  )

  return (
    <header className="sticky top-0 z-50 border-b-[1.5px] border-ink bg-paper">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center gap-4">
          <Link href="/" className="flex-shrink-0" aria-label="Accueil MaPlateformeVTC">
            <Logo />
          </Link>

          <div className="mx-2 hidden max-w-lg flex-1 md:block">{searchForm}</div>

          <div className="ml-auto flex items-center gap-2">
            {loading ? (
              <div className="h-9 w-32 animate-pulse rounded-[3px] bg-rule" />
            ) : user ? (
              <>
                <Link href="/annonces/new" className="btn btn-signal hidden lg:inline-flex !py-2 text-sm">+ Publier</Link>

                <div className="relative" ref={notifRef}>
                  <button onClick={openNotifications} aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-[3px] border-[1.5px] border-transparent hover:border-ink">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-[2px] bg-signal px-1 font-display text-[11px] font-bold text-ink">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="panel absolute right-0 z-50 mt-2 w-80 overflow-hidden">
                      <p className="border-b border-rule px-4 py-3 font-display text-sm font-semibold uppercase tracking-wider">Notifications</p>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="py-6 text-center text-sm text-ink-mute">Aucune notification</p>
                        ) : notifications.map(n => (
                          <div key={n.id} className={`border-b border-rule px-4 py-3 ${!n.isRead ? 'bg-signal-soft' : ''}`}>
                            <p className="text-sm">{n.content.text}</p>
                            <p className="mt-1 text-xs text-ink-mute">{new Date(n.createdAt).toLocaleDateString('fr-FR')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative" ref={menuRef}>
                  <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 rounded-[3px] border-[1.5px] border-ink bg-card px-2 py-1">
                    <span className="flex h-7 w-7 items-center justify-center rounded-[2px] bg-ink font-display text-sm font-bold text-paper">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden text-sm font-medium md:block">{user.name.split(' ')[0]}</span>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {menuOpen && (
                    <div className="panel absolute right-0 z-50 mt-2 w-56 py-1">
                      <p className="truncate border-b border-rule px-4 py-2 text-sm font-medium">{user.name}</p>
                      {MENU_LINKS.map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-paper">
                          {item.label}
                        </Link>
                      ))}
                      {user.role === 'admin' && (
                        <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm font-semibold text-plate hover:bg-paper">
                          Administration
                        </Link>
                      )}
                      <button onClick={logout} className="mt-1 block w-full border-t border-rule px-4 py-2 text-left text-sm text-stop hover:bg-stop-soft">
                        Se déconnecter
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="px-3 py-2 text-sm font-medium hover:underline underline-offset-4">Se connecter</Link>
                <Link href="/register" className="btn btn-ink !py-2 text-sm">Créer un compte</Link>
              </>
            )}
          </div>
        </div>

        <div className="pb-3 md:hidden">{searchForm}</div>

        <nav aria-label="Rubriques" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2">
          {NAV_LINKS.map(item => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-[2px] px-2.5 py-1 font-display text-sm font-semibold uppercase tracking-wider hover:bg-ink hover:text-paper">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
