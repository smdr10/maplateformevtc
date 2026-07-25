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
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) {
          setUser(data.user)
          loadNotifications()
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const loadNotifications = async () => {
    const res = await fetch('/api/notifications', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    }
  }

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
      router.push(`/annonces?brand=${encodeURIComponent(search.trim())}`)
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

  return (
    <nav style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E8E8E8', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }} className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-16 gap-4">

          {/* LOGO */}
          <Link href="/" className="flex-shrink-0">
            <span style={{ color: '#FF5500' }} className="text-2xl font-black">MaPlateformeVTC</span>
          </Link>

          {/* BOUTON PUBLIER — uniquement non connecte */}
          {!loading && !user && (
            <Link href="/annonces/new" className="hidden md:flex items-center gap-1.5 text-white text-sm font-bold px-4 py-2 rounded-full transition-all flex-shrink-0 hover:opacity-90" style={{ backgroundColor: '#FF5500' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Publier une annonce
            </Link>
          )}

          {/* BARRE DE RECHERCHE */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-2 hidden md:block">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher une annonce, une marque..."
                style={{ backgroundColor: '#F0F0F0', borderColor: '#E8E8E8', color: '#1A1A1A' }}
                className="w-full pl-4 pr-12 py-2.5 border rounded-full text-sm placeholder-gray-400 focus:outline-none transition-all focus:bg-white"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: '#FF5500' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* NAVIGATION DROITE */}
          <div className="flex items-center gap-2 ml-auto">
            {loading ? (
              <div className="h-9 w-32 rounded-full animate-pulse" style={{ backgroundColor: '#F0F0F0' }} />
            ) : user ? (
              <>
                {/* NOTIFICATIONS */}
                <div className="relative" ref={notifRef}>
                  <button onClick={openNotifications} className="relative w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100" style={{ color: '#888' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: '#FF5500' }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl shadow-lg z-50 overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
                      <div className="px-4 py-3" style={{ borderBottom: '1px solid #E8E8E8' }}>
                        <p className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Notifications</p>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-6">Aucune notification</p>
                        ) : (
                          notifications.map(notif => (
                            <div key={notif.id} className="px-4 py-3 transition-colors hover:bg-gray-50" style={{ borderBottom: '1px solid #F0F0F0', backgroundColor: !notif.isRead ? '#FFF5F0' : 'transparent' }}>
                              <p className="text-sm" style={{ color: '#1A1A1A' }}>{notif.content.text}</p>
                              <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleDateString('fr-FR')}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* MENU UTILISATEUR */}
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all hover:bg-gray-100" style={{ border: '1px solid #E8E8E8', backgroundColor: '#FFFFFF' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#FF5500' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium hidden md:block" style={{ color: '#1A1A1A' }}>{user.name.split(' ')[0]}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-52 rounded-2xl shadow-lg py-2 z-50" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
                      <div className="px-4 py-2 mb-1" style={{ borderBottom: '1px solid #F0F0F0' }}>
                        <p className="text-xs text-gray-400">Connecte en tant que</p>
                        <p className="text-sm font-semibold truncate" style={{ color: '#1A1A1A' }}>{user.name}</p>
                      </div>
                      {[
                        { href: '/profil', label: 'Mon profil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                        { href: '/annonces/new', label: 'Publier une annonce', icon: 'M12 4v16m8-8H4' },
                        { href: '/messages', label: 'Messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
                        { href: '/favoris', label: 'Mes favoris', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
                        { href: '/avis', label: 'Laisser un avis', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
                      ].map(item => (
                        <Link key={item.href} href={item.href} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors" style={{ color: '#333' }} onClick={() => setMenuOpen(false)}>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                          {item.label}
                        </Link>
                      ))}
                      {user.role === 'admin' && (
                        <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-orange-50 transition-colors" style={{ color: '#FF5500' }} onClick={() => setMenuOpen(false)}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                          Dashboard admin
                        </Link>
                      )}
                      <div style={{ borderTop: '1px solid #F0F0F0', margin: '4px 0' }} />
                      <button onClick={logout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Se deconnecter
                      </button>
                    </div>
                  )}
                </div>

              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium hover:text-orange-500 transition-colors px-3 py-2" style={{ color: '#555' }}>
                  Se connecter
                </Link>
                <Link href="/register" className="text-sm font-medium hover:text-orange-500 transition-colors px-3 py-2 hidden md:block" style={{ color: '#555' }}>
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>

        {/* BARRE DE RECHERCHE MOBILE */}
        <div className="pb-3 md:hidden">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ backgroundColor: '#F0F0F0', borderColor: '#E8E8E8', color: '#1A1A1A' }} className="w-full pl-4 pr-12 py-2.5 border rounded-full text-sm placeholder-gray-400 focus:outline-none" />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#FF5500' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </div>
          </form>
        </div>

        {/* LIENS SECONDAIRES */}
        <div className="hidden md:flex items-center gap-6 pb-2 pt-1" style={{ borderTop: '1px solid #F0F0F0' }}>
          {[
            { href: '/annonces', label: 'Annonces', bold: true },
            { href: '/annonces?type=sale', label: 'Vente' },
            { href: '/annonces?type=rent', label: 'Location' },
            { href: '/annonces?rentDuration=loa', label: 'LOA' },
            { href: '/services', label: 'Services', bold: true },
            { href: '/services?category=maintenance', label: 'Entretien' },
            { href: '/services?category=formation', label: 'Formation' },
            { href: '/services?category=insurance', label: 'Assurance' },
            { href: '/avis', label: 'Avis' },
          ].map(item => (
            <Link key={item.href} href={item.href} className="text-xs transition-colors hover:text-orange-500" style={{ color: item.bold ? '#FF5500' : '#888', fontWeight: item.bold ? 600 : 400 }}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
