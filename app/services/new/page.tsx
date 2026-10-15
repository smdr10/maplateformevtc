'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'maintenance', label: 'Entretien & Mécanique', icon: '🔧', desc: 'Garage, mecano, carrosserie, revision...' },
  { value: 'formation', label: 'Formation VTC', icon: '🎓', desc: 'Preparation examen, coaching, formations...' },
  { value: 'insurance', label: 'Assurance VTC', icon: '🛡️', desc: 'Assurance pro, RC, tous risques VTC...' },
  { value: 'accessories', label: 'Accessoires & Équipement', icon: '🎒', desc: 'GPS, dashcam, housses, bornes...' },
]

export default function NewServicePage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', category: '', description: '', city: '', phone: '', email: '', website: '',
  })

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => {
        if (!r.ok) {
          router.push('/login?redirect=/services/new')
        } else {
          setAuthChecked(true)
        }
      })
      .catch(() => router.push('/login?redirect=/services/new'))
  }, [router])

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    setError('')
    if (!form.name || !form.category || !form.description || !form.city) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) { router.push('/login?redirect=/services/new'); return }
        setError(data.message || 'Erreur lors de la publication')
        return
      }
      router.push('/services')
    } catch {
      setError('Erreur reseau, réessayez')
    } finally {
      setLoading(false)
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3F1EA' }}>
        <div className="text-[#6B7789]">Verification...</div>
      </div>
    )
  }

  const inputClass = "w-full px-3 py-2.5 border rounded-[3px] text-[#0B1F3A] text-sm placeholder-gray-500 focus:outline-none transition-all"
  const inputStyle = { backgroundColor: '#FFFFFF', borderColor: '#D9D5C9' }
  const labelClass = "block text-sm font-medium text-[#33465F] mb-1"

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 min-h-screen">
      <div className="mb-8">
        <Link href="/services" className="text-sm text-[#6B7789] hover:underline transition-colors">← Retour aux services</Link>
        <h1 className="text-2xl font-bold text-[#0B1F3A] mt-3">Proposer mon service</h1>
        <p className="text-[#6B7789] text-sm mt-1">Creez votre fiche professionnelle et soyez contacte par des chauffeurs VTC</p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-[3px] text-sm text-red-400" style={{ backgroundColor: '#1A0000', border: '1px solid #3A0000' }}>{error}</div>
      )}

      <div className="rounded-[4px] p-6 space-y-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D5C9' }}>

        <div>
          <label className={labelClass}>Nom de votre service / entreprise <span className="text-red-500">*</span></label>
          <input type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Ex: Garage Auto Pro, Formation VTC Paris..." className={inputClass} style={inputStyle} />
        </div>

        <div>
          <label className={labelClass}>Catégorie <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map(cat => (
              <button key={cat.value} type="button" onClick={() => update('category', cat.value)}
                className="p-3 rounded-[3px] border-2 text-left transition-all"
                style={{ borderColor: form.category === cat.value ? '#0B1F3A' : '#D9D5C9', backgroundColor: form.category === cat.value ? '#FFF3CC' : '#F3F1EA' }}>
                <span className="text-xl block mb-1">{cat.icon}</span>
                <p className="text-sm font-medium text-[#0B1F3A]">{cat.label}</p>
                <p className="text-xs mt-0.5 text-[#6B7789]">{cat.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Description de vos services <span className="text-red-500">*</span></label>
          <textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Decrivez vos services, votre experience, vos tarifs, vos specialites..." rows={5} className={inputClass + ' resize-none'} style={inputStyle} />
          <p className="text-xs text-gray-600 mt-1">{form.description.length} caracteres</p>
        </div>

        <div>
          <label className={labelClass}>Ville <span className="text-red-500">*</span></label>
          <input type="text" value={form.city} onChange={e => update('city', e.target.value)} placeholder="Paris, Lyon, Marseille..." className={inputClass} style={inputStyle} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Téléphone</label>
            <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+33 6 12 34 56 78" className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass}>Email professionnel</label>
            <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="contact@monservice.fr" className={inputClass} style={inputStyle} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Site web</label>
          <input type="url" value={form.website} onChange={e => update('website', e.target.value)} placeholder="https://monservice.fr" className={inputClass} style={inputStyle} />
        </div>

        <div className="pt-2 flex gap-3">
          <Link href="/services" className="flex-1 py-2.5 rounded-[3px] text-sm font-medium text-[#33465F] text-center transition-all" style={{ backgroundColor: '#F3F1EA', border: '1px solid #D9D5C9' }}>
            Annuler
          </Link>
          <button onClick={handleSubmit} disabled={loading || !form.name || !form.category || !form.description || !form.city} className="flex-1 text-white py-2.5 rounded-[3px] text-sm font-bold disabled:opacity-50 transition-all hover:opacity-90" style={{ backgroundColor: '#0B1F3A' }}>
            {loading ? 'Publication...' : 'Publier ma fiche'}
          </button>
        </div>
      </div>
    </div>
  )
}
