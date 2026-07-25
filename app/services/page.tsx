'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface Service {
  id: string
  name: string
  category: string
  description: string
  city: string
  phone: string | null
  email: string | null
  website: string | null
  user: { name: string }
}

const CATEGORY_LABELS: Record<string, string> = {
  maintenance: 'Entretien & Mecanique',
  formation: 'Formation VTC',
  insurance: 'Assurance VTC',
  accessories: 'Accessoires & Equipement',
}

const CATEGORY_ICONS: Record<string, string> = {
  maintenance: '🔧',
  formation: '🎓',
  insurance: '🛡️',
  accessories: '🎒',
}

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  maintenance: { bg: '#EFF6FF', color: '#3B82F6' },
  formation: { bg: '#F0FFF4', color: '#22C55E' },
  insurance: { bg: '#F5F3FF', color: '#8B5CF6' },
  accessories: { bg: '#FFF5F0', color: '#FF5500' },
}

function ServicesList() {
  const searchParams = useSearchParams()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '')
  const [city, setCity] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeCategory) params.set('category', activeCategory)
    if (city) params.set('city', city)
    fetch(`/api/services?${params}`)
      .then(r => r.json())
      .then(data => { setServices(data.services || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [activeCategory, city])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 min-h-screen" style={{ backgroundColor: '#F8F8F8' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1A1A1A' }}>Services & Professionnels</h1>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Trouvez des professionnels VTC de confiance</p>
        </div>
        <Link href="/services/new" className="text-white text-sm font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-all" style={{ backgroundColor: '#FF5500' }}>
          + Proposer un service
        </Link>
      </div>

      {/* FILTRES CATEGORIES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <button key={value} onClick={() => setActiveCategory(activeCategory === value ? '' : value)}
            className="p-4 rounded-xl text-center transition-all hover:shadow-md"
            style={{
              backgroundColor: activeCategory === value ? CATEGORY_COLORS[value].bg : '#FFFFFF',
              border: `2px solid ${activeCategory === value ? CATEGORY_COLORS[value].color : '#E8E8E8'}`,
            }}>
            <span className="text-2xl block mb-1">{CATEGORY_ICONS[value]}</span>
            <p className="text-xs font-medium" style={{ color: activeCategory === value ? CATEGORY_COLORS[value].color : '#333' }}>{label}</p>
          </button>
        ))}
      </div>

      {/* FILTRE VILLE */}
      <div className="mb-6">
        <input
          type="text"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="Filtrer par ville..."
          className="px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-orange-400 transition-all"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E8E8', color: '#1A1A1A', width: '200px' }}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8', height: '160px' }} />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
          <p style={{ color: '#888' }} className="mb-2">Aucun service trouve</p>
          <Link href="/services/new" className="text-sm font-medium" style={{ color: '#FF5500' }}>Proposer le premier service</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(service => (
            <Link key={service.id} href={`/services/${service.id}`} className="rounded-2xl p-5 transition-all hover:shadow-md group" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[service.category]?.bg || '#F8F8F8' }}>
                  {CATEGORY_ICONS[service.category]}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: CATEGORY_COLORS[service.category]?.bg, color: CATEGORY_COLORS[service.category]?.color }}>
                    {CATEGORY_LABELS[service.category]}
                  </span>
                  <p className="font-bold text-sm mt-1 truncate group-hover:text-orange-500 transition-colors" style={{ color: '#1A1A1A' }}>{service.name}</p>
                </div>
              </div>
              <p className="text-xs mb-3 line-clamp-2" style={{ color: '#888' }}>{service.description}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: '#AAA' }}>📍 {service.city}</p>
                <p className="text-xs font-medium" style={{ color: '#FF5500' }}>Voir →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F8F8', color: '#888' }}>Chargement...</div>}>
      <ServicesList />
    </Suspense>
  )
}
