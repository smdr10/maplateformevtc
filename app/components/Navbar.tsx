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
  const router = useRouter()
  const notifRef = useRef<HTMLDivElement>(null)

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
    router.push('/')
    router.refresh()
  }

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <nav className="bg-black border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold text-orange-500">MaPlateformeVTC</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/annonces" className="text-gray-300 hover:text-orange-400 text-sm font-medium transition-colors">
              Annonces
            </Link>
            
            <Link href="/services" className="text-gray-300 hover:text-orange-400 text-sm font-medium transition-colors">
              Services
            </Link>
            {user && (
              <Link href="/messages" className="text-gray-300 hover:text-orange-400 text-sm font-medium transition-colors">
                Messages
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-8 w-24 bg-gray-800 rounded animate-pulse" />
            ) : user ? (
              <>
                <div className="relative" ref={notifRef}>
                  <button onClick={openNotifications} className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-300 hover:text-orange-400 hover:bg-gray-800 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-700">
                        <p className="text-sm font-semibold text-white">Notifications</p>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-6">Aucune notification</p>
                        ) : (
                          notifications.map(notif => (
                            <div key={notif.id} className={`px-4 py-3 border-b border-gray-800 hover:bg-gray-800 transition-colors ${!notif.isRead ? 'bg-gray-800' : ''}`}>
                              <p className="text-sm text-gray-200">{notif.content.text}</p>
                              <p className="text-xs text-gray-500 mt-1">{new Date(notif.createdAt).toLocaleDateString('fr-FR')}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-orange-400 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:block">{user.name.split(' ')[0]}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-lg py-1 z-50">
                      <Link href="/profil" className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-800" onClick={() => setMenuOpen(false)}>
                        Mon profil
                      </Link>
                      <Link href="/annonces/new" className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-800" onClick={() => setMenuOpen(false)}>
                        Publier une annonce
                      </Link>
                      <Link href="/favoris" className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-800" onClick={() => setMenuOpen(false)}>
                        Mes favoris
                      </Link>
                      <Link href="/messages" className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-800" onClick={() => setMenuOpen(false)}>
                        Messages
                      </Link>
                      {user.role === 'admin' && (
                        <Link href="/admin" className="block px-4 py-2 text-sm text-orange-400 hover:bg-gray-800" onClick={() => setMenuOpen(false)}>
                          Dashboard admin
                        </Link>
                      )}
                      <hr className="my-1 border-gray-700" />
                      <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800">
                        Se deconnecter
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-orange-400 transition-colors">
                  Connexion
                </Link>
                <Link href="/annonces/new" className="bg-orange-500 text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-orange-600 transition-colors shadow-md">
                  Publier
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}