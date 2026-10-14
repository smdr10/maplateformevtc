'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', accountType: 'individual', companyName: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const getPasswordStrength = (pwd: string) => {
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return score
  }

  const strength = getPasswordStrength(form.password)
  const strengthLabels = ['', 'Faible', 'Moyen', 'Bon', 'Fort']
  const strengthColors = ['', '#EF4444', '#F59E0B', '#3B82F6', '#22C55E']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'Erreur inscription'); return }
      window.location.href = '/bienvenue'
    } catch {
      setError('Erreur reseau, reessayez')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { backgroundColor: '#F8F8F8', borderColor: '#E8E8E8', color: '#1A1A1A' }
  const inputClass = "w-full px-4 py-3 border rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all"

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: '#F8F8F8' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black" style={{ color: '#FF5500' }}>MaPlateformeVTC</Link>
          <p className="text-sm mt-2" style={{ color: '#888' }}>Rejoignez la communaute VTC</p>
        </div>

        <div className="rounded-2xl p-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h1 className="text-xl font-bold mb-6" style={{ color: '#1A1A1A' }}>Creer un compte</h1>

          {error && (
            <div className="mb-5 p-3 rounded-xl text-sm text-red-500" style={{ backgroundColor: '#FFF0F0', border: '1px solid #FFD0D0' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#555' }}>Type de compte</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'individual', label: 'Particulier', hint: 'Sans societe' },
                  { value: 'professional', label: 'Professionnel', hint: 'Societe, micro-entreprise' },
                ].map(r => (
                  <button key={r.value} type="button" onClick={() => update('accountType', r.value)}
                    className="p-3 rounded-xl border-2 text-sm font-medium transition-all"
                    style={{ borderColor: form.accountType === r.value ? '#FF5500' : '#E8E8E8', backgroundColor: form.accountType === r.value ? '#FFF5F0' : '#F8F8F8', color: form.accountType === r.value ? '#FF5500' : '#888' }}>
                    {r.label}
                    <span className="block text-xs font-normal mt-0.5" style={{ color: '#AAA' }}>{r.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {form.accountType === 'professional' && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#555' }}>Nom de la societe <span className="text-red-500">*</span></label>
                <input type="text" value={form.companyName} onChange={e => update('companyName', e.target.value)} required placeholder="VTC Express SAS" className={inputClass} style={inputStyle} />
                <p className="text-xs mt-1" style={{ color: '#AAA' }}>Vous completerez SIRET et documents apres l&apos;inscription pour obtenir le badge certifie.</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#555' }}>Nom complet <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e => update('name', e.target.value)} required placeholder="Jean Dupont" className={inputClass} style={inputStyle} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#555' }}>Email <span className="text-red-500">*</span></label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)} required placeholder="jean@email.fr" className={inputClass} style={inputStyle} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#555' }}>Telephone</label>
              <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+33 6 12 34 56 78" className={inputClass} style={inputStyle} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#555' }}>Mot de passe <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} required placeholder="••••••••" className={inputClass + ' pr-12'} style={inputStyle} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: '#AAA' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="h-1.5 flex-1 rounded-full transition-all" style={{ backgroundColor: i <= strength ? strengthColors[strength] : '#E8E8E8' }} />
                    ))}
                  </div>
                  <p className="text-xs mt-1" style={{ color: strengthColors[strength] }}>
                    {strengthLabels[strength]} — min. 8 caracteres, 1 majuscule, 1 chiffre
                  </p>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="w-full text-white py-3.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all hover:opacity-90 mt-2" style={{ backgroundColor: '#FF5500' }}>
              {loading ? 'Creation...' : 'Creer mon compte'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: '#888' }}>
            Deja un compte ?{' '}
            <Link href="/login" className="font-medium hover:opacity-80 transition-colors" style={{ color: '#FF5500' }}>
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
