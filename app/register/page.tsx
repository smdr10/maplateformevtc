'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', role: 'user' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { score: 0, label: '', color: '' }
    if (pwd.length < 6) return { score: 1, label: 'Trop court', color: 'bg-red-500' }
    if (pwd.length < 8) return { score: 2, label: 'Faible', color: 'bg-orange-400' }
    if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { score: 3, label: 'Moyen', color: 'bg-yellow-400' }
    return { score: 4, label: 'Fort', color: 'bg-green-400' }
  }

  const strength = getPasswordStrength(form.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Les mots de passe ne correspondent pas'); return }
    if (form.password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caracteres'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, phone: form.phone || undefined, role: form.role }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || "Erreur lors de l'inscription"); return }
      router.push('/')
      router.refresh()
    } catch {
      setError('Erreur reseau, reessayez')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black text-orange-500">MaPlateformeVTC</Link>
          <p className="text-gray-500 text-sm mt-2">Rejoignez la communaute VTC</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <h1 className="text-xl font-bold text-white mb-6">Creer un compte</h1>

          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Type de compte</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => update('role', 'user')} className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${form.role === 'user' ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
                  Chauffeur VTC
                </button>
                <button type="button" onClick={() => update('role', 'pro')} className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${form.role === 'pro' ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
                  Pro / Flotte
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Nom complet <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e => update('name', e.target.value)} required placeholder="Thomas Dupont" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Email <span className="text-red-500">*</span></label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required placeholder="thomas@email.fr" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Telephone</label>
              <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+33 6 12 34 56 78" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Mot de passe <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} required placeholder="••••••••" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-all pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>
              </div>
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-white/10'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">{strength.label} — min. 8 caracteres, 1 majuscule, 1 chiffre</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Confirmer le mot de passe <span className="text-red-500">*</span></label>
              <input type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} required placeholder="••••••••" className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none transition-all ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-red-500/50' : 'border-white/10 focus:border-orange-500/50'}`} />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-400 mt-1">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (!!form.confirmPassword && form.password !== form.confirmPassword)}
              className="w-full bg-orange-500 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-50 transition-all hover:scale-[1.02] shadow-lg shadow-orange-500/20 mt-2"
            >
              {loading ? 'Creation...' : 'Creer mon compte'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Deja un compte ?{' '}
            <Link href="/login" className="text-orange-500 font-medium hover:text-orange-400 transition-colors">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
