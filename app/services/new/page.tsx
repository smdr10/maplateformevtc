'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'maintenance', label: 'Entretien & Mecanique', icon: '🔧', desc: 'Garage, mecano, carrosserie, revision...' },
  { value: 'formation', label: 'Formation VTC', icon: '🎓', desc: 'Preparation examen, coaching, formations...' },
  { value: 'insurance', label: 'Assurance VTC', icon: '🛡️', desc: 'Assurance pro, RC, tous risques VTC...' },
  { value: 'accessories', label: 'Accessoires & Equipement', icon: '🎒', desc: 'GPS, dashcam, housses, bornes...' },
]

export default function NewServicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    city: '',
    phone: '',
    email: '',
    website: '',
  })

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

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
        if (res.status === 401) {
          router.push('/login?redirect=/services/new')
          return
        }
        setError(data.message || 'Erreur lors de la publication')
        return
      }

      router.push('/services')
    } catch {
      setError('Erreur reseau, reessayez')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/services" className="text-sm text-gray-500 hover:text-orange-500">← Retour aux services</Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-3">Proposer mon service</h1>
        <p className="text-gray-500 text-sm mt-1">Creez votre fiche professionnelle et soyez contacte par des chauffeurs VTC</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">

        <div>
          <label className={labelClass}>Nom de votre service / entreprise <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.name}
            onChange={e => update('name', e.target.value)}
            placeholder="Ex: Garage Auto Pro, Formation VTC Paris..."
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Categorie <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => update('category', cat.value)}
                className={`p-3 rounded-xl border-2 text-left transition-colors ${
                  form.category === cat.value
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-xl block mb-1">{cat.icon}</span>
                <p className="text-sm font-medium text-gray-900">{cat.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{cat.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Description de vos services <span className="text-red-500">*</span></label>
          <textarea
            value={form.description}
            onChange={e => update('description', e.target.value)}
            placeholder="Decrivez vos services, votre experience, vos tarifs, vos specialites..."
            rows={5}
            className={inputClass + ' resize-none'}
          />
          <p className="text-xs text-gray-400 mt-1">{form.description.length} caracteres</p>
        </div>

        <div>
          <label className={labelClass}>Ville <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.city}
            onChange={e => update('city', e.target.value)}
            placeholder="Paris, Lyon, Marseille..."
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Telephone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
              placeholder="+33 6 12 34 56 78"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Email professionnel</label>
            <input
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              placeholder="contact@monservice.fr"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Site web</label>
          <input
            type="url"
            value={form.website}
            onChange={e => update('website', e.target.value)}
            placeholder="https://monservice.fr"
            className={inputClass}
          />
        </div>

        <div className="pt-2 flex gap-3">
          <Link href="/services" className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 text-center">
            Annuler
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.name || !form.category || !form.description || !form.city}
            className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Publication...' : 'Publier ma fiche'}
          </button>
        </div>
      </div>
    </div>
  )
}