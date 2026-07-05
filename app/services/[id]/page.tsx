'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  user: { id: string; name: string; email: string }
}

const CATEGORY_LABELS: Record<string, string> = {
  maintenance: 'Entretien & Mecanique',
  formation: 'Formation VTC',
  insurance: 'Assurance VTC',
  accessories: 'Accessoires & Equipement',
}

const CATEGORY_COLORS: Record<string, string> = {
  maintenance: 'bg-blue-100 text-blue-700',
  formation: 'bg-green-100 text-green-700',
  insurance: 'bg-purple-100 text-purple-700',
  accessories: 'bg-orange-100 text-orange-700',
}

const CATEGORY_ICONS: Record<string, string> = {
  maintenance: '🔧',
  formation: '🎓',
  insurance: '🛡️',
  accessories: '🎒',
}

export default function ServiceDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/services/${id}`)
      .then(r => r.json())
      .then(data => {
        setService(data.service)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const sendMessage = async () => {
    if (!message.trim()) return
    setSending(true)
    setError('')

    const meRes = await fetch('/api/auth/me', { credentials: 'include' })
    if (!meRes.ok) {
      router.push(`/login?redirect=/services/${id}`)
      return
    }

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        receiverId: service?.user.id,
        message: `[SERVICE: ${service?.name}]\n${message}`,
        listingId: null,
        serviceId: id,
      }),
    })

    if (res.ok) {
      setSent(true)
      setMessage('')
    } else {
      setError('Erreur lors de l\'envoi. Reessayez.')
    }
    setSending(false)
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-400">Chargement...</div>
  }

  if (!service) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Service introuvable</p>
        <Link href="/services" className="text-orange-500 text-sm mt-2 inline-block hover:underline">
          Retour aux services
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/services" className="text-sm text-gray-500 hover:text-orange-500 mb-6 inline-flex items-center gap-1">
        ← Retour aux services
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-2xl flex-shrink-0">
            {CATEGORY_ICONS[service.category]}
          </div>
          <div className="flex-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[service.category]}`}>
              {CATEGORY_LABELS[service.category]}
            </span>
            <h1 className="text-xl font-semibold text-gray-900 mt-1">{service.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">📍 {service.city} · Publie le {new Date(service.createdAt).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{service.description}</p>
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {service.phone && (
            <a href={`tel:${service.phone}`} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-colors">
              <span className="text-xl">📞</span>
              <div>
                <p className="text-xs text-gray-400">Telephone</p>
                <p className="text-sm font-medium text-gray-900">{service.phone}</p>
              </div>
            </a>
          )}
          {service.email && (
            <a href={`mailto:${service.email}`} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-colors">
              <span className="text-xl">✉️</span>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-900 truncate">{service.email}</p>
              </div>
            </a>
          )}
          {service.website && (
            <a href={service.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-colors">
              <span className="text-xl">🌐</span>
              <div>
                <p className="text-xs text-gray-400">Site web</p>
                <p className="text-sm font-medium text-orange-500">Visiter le site</p>
              </div>
            </a>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold">
            {service.user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{service.user.name}</p>
            <p className="text-xs text-gray-500">Prestataire de service</p>
            <p className="text-xs text-orange-500 font-semibold mt-0.5">SM Drivers</p>
          </div>
        </div>

        {sent ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 text-center">
            ✓ Message envoye ! Le professionnel vous repondra bientot.
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Envoyer un message</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Bonjour, je suis interesse par vos services..."
              rows={4}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !message.trim()}
              className="w-full bg-orange-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {sending ? 'Envoi...' : 'Contacter ce professionnel'}
            </button>
            <p className="text-xs text-gray-400 text-center">Vous devez etre connecte pour envoyer un message</p>
          </div>
        )}
      </div>
    </div>
  )
}