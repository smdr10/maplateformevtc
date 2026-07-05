// src/hooks/useAuth.ts
// Hook React pour gérer l'état d'authentification côté client

'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'

// ============================================================
// TYPES
// ============================================================

export interface AuthUser {
  id:            string
  name:          string
  email:         string
  role:          'user' | 'pro' | 'admin'
  emailVerified: boolean
  companyName?:  string | null
  phone?:        string | null
  ratingAvg?:    number | null
  ratingCount?:  number
}

interface AuthState {
  user:         AuthUser | null
  loading:      boolean
  isLoggedIn:   boolean
  isAdmin:      boolean
  isPro:        boolean
}

interface AuthActions {
  login:    (email: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout:   () => Promise<void>
  refresh:  () => Promise<boolean>
}

interface RegisterData {
  name:      string
  email:     string
  password:  string
  phone?:    string
  role?:     'user' | 'pro'
}

// ============================================================
// CONTEXT
// ============================================================

const AuthContext = createContext<(AuthState & AuthActions) | null>(null)

// ============================================================
// PROVIDER — à envelopper dans src/app/layout.tsx
// ============================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Charger l'utilisateur au montage
  const fetchMe = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (!res.ok) {
        setUser(null)
        return false
      }
      const { user: u } = await res.json()
      setUser({
        id:            u.id,
        name:          u.name,
        email:         u.email,
        role:          u.role,
        emailVerified: !!u.emailVerifiedAt,
        companyName:   u.companyName,
        phone:         u.phone,
        ratingAvg:     u.ratingAvg ? Number(u.ratingAvg) : null,
        ratingCount:   u.ratingCount,
      })
      return true
    } catch {
      setUser(null)
      return false
    }
  }, [])

  // Rafraîchir le token silencieusement
  const refresh = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) return false
      return await fetchMe()
    } catch {
      return false
    }
  }, [fetchMe])

  useEffect(() => {
    // Au démarrage : essayer /me, si ça échoue essayer /refresh
    fetchMe().then(ok => {
      if (!ok) refresh().finally(() => setLoading(false))
      else setLoading(false)
    })
  }, [fetchMe, refresh])

  // --- LOGIN ---
  const login = async (email: string, password: string, rememberMe = false) => {
    const res = await fetch('/api/auth/login', {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:        JSON.stringify({ email, password, rememberMe }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message ?? 'Erreur de connexion')

    await fetchMe()
  }

  // --- REGISTER ---
  const register = async (formData: RegisterData) => {
    const res = await fetch('/api/auth/register', {
      method:      'POST',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:        JSON.stringify(formData),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message ?? "Erreur lors de l'inscription")

    await fetchMe()
  }

  // --- LOGOUT ---
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
    router.push('/')
  }

  return {
    AuthContext,
    value: {
      user,
      loading,
      isLoggedIn: !!user,
      isAdmin:    user?.role === 'admin',
      isPro:      user?.role === 'pro' || user?.role === 'admin',
      login,
      register,
      logout,
      refresh,
    },
  }
}

// ============================================================
// HOOK
// ============================================================

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}

// ============================================================
// USAGE DANS layout.tsx :
// ============================================================
//
// 'use client'
// import { AuthContext, AuthProvider } from '@/hooks/useAuth'
//
// export default function RootLayout({ children }) {
//   const auth = AuthProvider({ children })  // ← pas idéal, voir note ci-dessous
//   return (
//     <html>
//       <body>
//         <auth.AuthContext.Provider value={auth.value}>
//           {children}
//         </auth.AuthContext.Provider>
//       </body>
//     </html>
//   )
// }
//
// NOTE : Pour un vrai Provider React, créer un fichier séparé
// src/components/providers/AuthProvider.tsx (voir README)
