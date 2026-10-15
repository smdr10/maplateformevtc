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
  maintenance: 'Entretien & Mécanique',
  formation: 'Formation VTC',
  insurance: 'Assurance VTC',
  accessories: 'Accessoires & Équipement',
}

const CATEGORY_COLORS: Record<string, string> = {
  maintenance: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  formation: 'bg-green-500/20 text-green-400 border-green-500/20',
  insurance: 'bg-purple-500/20 text-purple-400 border-purple-500/20',
  accessories: 'bg-[#0B1F3A]/20 text-[#FF6620] border-[#0B1F3A]/20',
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
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)

  useEffect(() => {
    fetch(`/api/services/${id}`)
      .then(r => r.json())
      .then(data => {
        setService(data.service)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.user) setCurrentUser(data.user) })
      .catch(() => {})
  }, [id])

  const sendMessage = async () => {
    if (!message.trim()) return

    if (!currentUser) {
      router.push(`/login?redirect=/services/${id}`)
      return
    }

    setSending(true)
    setError('')

    try {
      const res = await fetch(`/api/services/${id}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message }),
      })

      if (res.ok) {
        setSent(true)
        setMessage('')
      } else {
        const data = await res.json()
        setError(data.message || "Erreur lors de l'envoi. Réessayez.")
      }
    } catch {
      setError("Erreur reseau. Réessayez.")
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-[#6B7789]">Chargement...</div>

  if (!service) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-[#6B7789]">Service introuvable</p>
        <Link href="/services" className="text-[#0B1F3A] text-sm mt-2 inline-block hover:underline">
          Retour aux services
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 min-h-screen">
      <Link href="/services" className="text-sm text-[#6B7789] hover:text-[#0B1F3A] mb-6 inline-flex items-center gap-1">
        ← Retour aux services
      </Link>

      <div className="bg-[#111118] border border-[#D9D5C9] rounded-[4px] p-6 mb-4">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-[4px] bg-[#0B1F3A]/10 flex items-center justify-center text-2xl flex-shrink-0">
            {CATEGORY_ICONS[service.category]}
          </div>
          <div className="flex-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${CATEGORY_COLORS[service.category]}`}>
              {CATEGORY_LABELS[service.category]}
            </span>
            <h1 className="text-xl font-bold text-[#0B1F3A] mt-1">{service.name}</h1>
            <p className="text-sm text-[#6B7789] mt-0.5">📍 {service.city} · Publie le {new Date(service.createdAt).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">{service.description}</p>

        <div className="mt-6 pt-5 border-t border-[#D9D5C9] grid grid-cols-1 sm:grid-cols-3 gap-3">
          {service.phone && (
            <a href={`tel:${service.phone}`} className="flex items-center gap-2 p-3 bg-[#16161F] rounded-[3px] hover:bg-gray-700 border border-[#22223A] transition-all">
              <span className="text-xl">📞</span>
              <div>
                <p className="text-xs text-[#6B7789]">Téléphone</p>
                <p className="text-sm font-medium text-[#0B1F3A]">{service.phone}</p>
              </div>
            </a>
          )}
          {service.email && (
            <a href={`mailto:${service.email}`} className="flex items-center gap-2 p-3 bg-[#16161F] rounded-[3px] hover:bg-gray-700 border border-[#22223A] transition-all">
              <span className="text-xl">✉️</span>
              <div>
                <p className="text-xs text-[#6B7789]">Email</p>
                <p className="text-sm font-medium text-[#0B1F3A] truncate">{service.email}</p>
              </div>
            </a>
          )}
          {service.website && (
            <a href={service.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-[#16161F] rounded-[3px] hover:bg-gray-700 border border-[#22223A] transition-all">
              <span className="text-xl">🌐</span>
              <div>
                <p className="text-xs text-[#6B7789]">Site web</p>
                <p className="text-sm font-medium text-[#FF6620]">Visiter le site</p>
              </div>
            </a>
          )}
        </div>
      </div>

      <div className="bg-[#111118] border border-[#D9D5C9] rounded-[4px] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#0B1F3A]/20 flex items-center justify-center text-[#FF6620] font-bold">
            {service.user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-[#0B1F3A] text-sm">{service.user.name}</p>
            <p className="text-xs text-[#6B7789]">Prestataire de service</p>
            <p className="text-xs text-[#0B1F3A] font-semibold">SM Drivers</p>
          </div>
        </div>

        {sent ? (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-[3px] text-sm text-green-400 text-center">
            ✓ Message envoyé ! Le professionnel vous repondra bientot.
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#33465F]">Envoyer un message</p>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Bonjour, je suis interesse par vos services..."
              rows={4}
              className="w-full text-sm bg-[#16161F] border border-[#22223A] text-[#0B1F3A] rounded-[3px] px-3 py-2.5 focus:outline-none focus:border-[#0B1F3A]/50 transition-all resize-none placeholder-gray-600"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !message.trim()}
              className="w-full bg-[#0B1F3A] text-[#0B1F3A] py-2.5 rounded-[3px] text-sm font-bold hover:bg-[#142D52] disabled:opacity-50 transition-all hover:scale-[1.02]"
            >
              {sending ? 'Envoi...' : currentUser ? 'Contacter ce professionnel' : 'Se connecter pour contacter'}
            </button>
            {!currentUser && <p className="text-xs text-[#6B7789] text-center">Vous devez etre connecte pour envoyer un message</p>}
          </div>
        )}
      </div>
    </div>
  )
}
