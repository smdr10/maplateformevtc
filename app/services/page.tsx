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
  maintenance: 'Entretien & Mécanique',
  formation: 'Formation VTC',
  insurance: 'Assurance VTC',
  accessories: 'Accessoires & Équipement',
}

const CATEGORY_ICONS: Record<string, string> = {
  maintenance: '🔧',
  formation: '🎓',
  insurance: '🛡️',
  accessories: '🎒',
}

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  maintenance: { bg: '#EFF6FF', color: '#1D4ED8' },
  formation: { bg: '#F0FFF4', color: '#15803D' },
  insurance: { bg: '#F5F3FF', color: '#8B5CF6' },
  accessories: { bg: '#FFF3CC', color: '#0B1F3A' },
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
    <div className="max-w-6xl mx-auto px-4 py-8 min-h-screen" style={{ backgroundColor: '#F3F1EA' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#0B1F3A' }}>Services & Professionnels</h1>
          <p className="text-sm mt-1" style={{ color: '#6B7789' }}>Trouvez des professionnels VTC de confiance</p>
        </div>
        <Link href="/services/new" className="text-white text-sm font-bold px-4 py-2 rounded-[3px] hover:opacity-90 transition-all" style={{ backgroundColor: '#0B1F3A' }}>
          + Proposer un service
        </Link>
      </div>

      {/* FILTRES CATEGORIES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <button key={value} onClick={() => setActiveCategory(activeCategory === value ? '' : value)}
            className="p-4 rounded-[3px] text-center transition-all hover:shadow-md"
            style={{
              backgroundColor: activeCategory === value ? CATEGORY_COLORS[value].bg : '#FFFFFF',
              border: `2px solid ${activeCategory === value ? CATEGORY_COLORS[value].color : '#D9D5C9'}`,
            }}>
            <span className="text-2xl block mb-1">{CATEGORY_ICONS[value]}</span>
            <p className="text-xs font-medium" style={{ color: activeCategory === value ? CATEGORY_COLORS[value].color : '#0B1F3A' }}>{label}</p>
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
          className="px-4 py-2.5 border rounded-[3px] text-sm focus:outline-none focus:border-[#0B1F3A] transition-all"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#D9D5C9', color: '#0B1F3A', width: '200px' }}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-[4px] p-5 animate-pulse" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D5C9', height: '160px' }} />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 rounded-[4px]" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D5C9' }}>
          <p style={{ color: '#6B7789' }} className="mb-2">Aucun service trouve</p>
          <Link href="/services/new" className="text-sm font-medium" style={{ color: '#0B1F3A' }}>Proposer le premier service</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(service => (
            <Link key={service.id} href={`/services/${service.id}`} className="rounded-[4px] p-5 transition-all hover:shadow-md group" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D5C9' }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-[3px] flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[service.category]?.bg || '#F3F1EA' }}>
                  {CATEGORY_ICONS[service.category]}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: CATEGORY_COLORS[service.category]?.bg, color: CATEGORY_COLORS[service.category]?.color }}>
                    {CATEGORY_LABELS[service.category]}
                  </span>
                  <p className="font-bold text-sm mt-1 truncate group-hover:underline transition-colors" style={{ color: '#0B1F3A' }}>{service.name}</p>
                </div>
              </div>
              <p className="text-xs mb-3 line-clamp-2" style={{ color: '#6B7789' }}>{service.description}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: '#6B7789' }}>📍 {service.city}</p>
                <p className="text-xs font-medium" style={{ color: '#0B1F3A' }}>Voir →</p>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3F1EA', color: '#6B7789' }}>Chargement...</div>}>
      <ServicesList />
    </Suspense>
  )
}
