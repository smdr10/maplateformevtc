'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  // Uniquement des chemins internes (evite la redirection vers un site tiers)
  const requested = searchParams.get('redirect')
  const redirect = requested && requested.startsWith('/') && !requested.startsWith('//') ? requested : '/espace'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, rememberMe }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Erreur de connexion'); return }
      window.location.href = redirect
    } catch {
      setError('Erreur reseau, réessayez')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { backgroundColor: '#F3F1EA', borderColor: '#D9D5C9', color: '#0B1F3A' }
  const inputClass = "w-full px-4 py-3 border rounded-[3px] text-sm placeholder-gray-400 focus:outline-none focus:border-[#0B1F3A] transition-all"

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="text-2xl font-bold" style={{ color: '#0B1F3A' }}>MaPlateformeVTC</Link>
        <p className="text-sm mt-2" style={{ color: '#6B7789' }}>Bon retour parmi nous</p>
      </div>

      <div className="rounded-[4px] p-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D5C9', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h1 className="text-xl font-bold mb-6" style={{ color: '#0B1F3A' }}>Se connecter</h1>

        {error && (
          <div className="mb-5 p-3 rounded-[3px] text-sm text-red-500" style={{ backgroundColor: '#FFF0F0', border: '1px solid #FFD0D0' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#33465F' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="thomas@email.fr" className={inputClass} style={inputStyle} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#33465F' }}>Mot de passe</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className={inputClass + ' pr-12'} style={inputStyle} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: '#6B7789' }}>
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4 rounded" style={{ accentColor: '#0B1F3A' }} />
            <label htmlFor="rememberMe" className="text-sm" style={{ color: '#6B7789' }}>Se souvenir de moi (30 jours)</label>
          </div>

          <button type="submit" disabled={loading} className="w-full text-white py-3.5 rounded-[3px] text-sm font-bold disabled:opacity-50 transition-all hover:opacity-90 mt-2" style={{ backgroundColor: '#0B1F3A' }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm" style={{ color: '#6B7789' }}>
          Pas encore de compte ?{' '}
          <Link href="/register" className="font-medium hover:opacity-80 transition-colors" style={{ color: '#0B1F3A' }}>
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F3F1EA' }}>
      <Suspense fallback={<div style={{ color: '#6B7789' }}>Chargement...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
