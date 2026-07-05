'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Service {
  id: string
  name: string
  category: string
  description: string
  city: string
  phone: string | null
  email: string | null
  website: string | null
  createdAt: string
  user: { id: string; name: string }
}

const CATEGORIES = [
  { value: '', label: 'Tous les services' },
  { value: 'maintenance', label: 'Entretien & Mecanique' },
  { value: 'formation', label: 'Formation VTC' },
  { value: 'insurance', label: 'Assurance VTC' },
  { value: 'accessories', label: 'Accessoires & Equipement' },
]

const CATEGORY_COLORS: Record<string, string> = {
  maintenance: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  formation: 'bg-green-500/20 text-green-400 border-green-500/20',
  insurance: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
  accessories: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
}

const CATEGORY_LABELS: Record<string, string> = {
  maintenance: 'Entretien & Mecanique',
  formation: 'Formation VTC',
  insurance: 'Assurance VTC',
  accessories: 'Accessoires & Equipement',
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('')
  const [city, setCity] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeCategory) params.set('category', activeCategory)
      if (city) params.set('city', city)
      const res = await fetch(`/api/services?${params}`)
      const data = await res.json()
      setServices(data.services || [])
      setLoading(false)
    }
    load()
  }, [activeCategory, city])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 min-h-screen">

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Services & Professionnels</h1>
          <p className="text-gray-500 text-sm mt-1">Des experts pour accompagner votre activite VTC</p>
        </div>
        <Link href="/services/new" className="bg-orange-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-orange-600 transition-all hover:scale-105">
          + Proposer mon service
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              activeCategory === cat.value
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-orange-500/30 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-8">
        <input
          type="text"
          placeholder="Filtrer par ville..."
          value={city}
          onChange={e => setCity(e.target.value)}
          className="px-4 py-2.5 bg-gray-900 border border-gray-800 text-white rounded-xl text-sm focus:outline-none focus:border-orange-500/50 transition-all placeholder-gray-500 w-64"
        />
        {city && (
          <button onClick={() => setCity('')} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Effacer
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-gray-900 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-900 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-900 rounded w-full" />
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800">
          <p className="text-gray-500 font-medium">Aucun service trouve</p>
          <Link href="/services/new" className="inline-block mt-4 bg-orange-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-orange-600 transition-all">
            Proposer mon service
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(service => (
            <div key={service.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5 transition-all flex flex-col group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${CATEGORY_COLORS[service.category]}`}>
                    {CATEGORY_LABELS[service.category]}
                  </span>
                  <h3 className="font-semibold text-white mt-2 group-hover:text-orange-400 transition-colors">{service.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">📍 {service.city}</p>
                </div>
              </div>

              <p className="text-sm text-gray-400 leading-relaxed flex-1 mb-4 line-clamp-3">{service.description}</p>

              <div className="space-y-1.5 mb-4">
                {service.phone && (
                  <a href={`tel:${service.phone}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-400 transition-colors">
                    <span>📞</span> {service.phone}
                  </a>
                )}
                {service.email && (
                  <a href={`mailto:${service.email}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-400 transition-colors truncate">
                    <span>✉️</span> {service.email}
                  </a>
                )}
                {service.website && (
                  <a href={service.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-400 transition-colors truncate">
                    <span>🌐</span> Voir le site
                  </a>
                )}
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Par {service.user.name}</p>
                  <p className="text-xs text-orange-500 font-semibold">SM Drivers</p>
                </div>
                <Link href={`/services/${service.id}`} className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-medium hover:scale-105">
                  Contacter
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}