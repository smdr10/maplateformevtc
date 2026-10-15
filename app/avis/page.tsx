'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string
  user: { name: string; role: string }
}

export default function AvisPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string; name: string } | null>(null)
  const [form, setForm] = useState({ rating: 5, comment: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [avgRating, setAvgRating] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch('/api/platform-reviews').then(r => r.json()),
      fetch('/api/auth/me', { credentials: 'include' }).then(r => r.ok ? r.json() : null),
    ]).then(([reviewsData, meData]) => {
      setReviews(reviewsData.reviews || [])
      setAvgRating(reviewsData.avgRating || 0)
      if (meData?.user) setUser(meData.user)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { router.push('/login?redirect=/avis'); return }
    setSubmitting(true)
    const res = await fetch('/api/platform-reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setSubmitted(true)
      const data = await res.json()
      setReviews(prev => [data.review, ...prev])
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3F1EA' }}>
      <div style={{ color: '#6B7789' }}>Chargement...</div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen" style={{ backgroundColor: '#F3F1EA' }}>
      <h1 className="text-xl font-bold mb-2" style={{ color: '#0B1F3A' }}>Avis de la communauté</h1>
      <p className="text-sm mb-6" style={{ color: '#6B7789' }}>Ce que pensent les membres de MaPlateformeVTC</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* FORMULAIRE */}
        <div>
          <div className="rounded-[4px] p-6 mb-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D5C9' }}>
            <div className="text-center mb-4">
              <p className="text-4xl font-bold" style={{ color: '#0B1F3A' }}>{avgRating.toFixed(1)}</p>
              <div className="flex justify-center gap-1 my-1">
                {[1,2,3,4,5].map(s => (
                  <span key={s} className="text-lg" style={{ color: s <= Math.round(avgRating) ? '#0B1F3A' : '#D9D5C9' }}>★</span>
                ))}
              </div>
              <p className="text-sm" style={{ color: '#6B7789' }}>{reviews.length} avis</p>
            </div>
          </div>

          {submitted ? (
            <div className="rounded-[4px] p-6 text-center" style={{ backgroundColor: '#F0FFF4', border: '1px solid #BBF7D0' }}>
              <p className="text-green-600 font-medium">Merci pour votre avis !</p>
            </div>
          ) : (
            <div className="rounded-[4px] p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D5C9' }}>
              <h2 className="font-bold text-sm mb-4" style={{ color: '#0B1F3A' }}>Laisser un avis</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: '#6B7789' }}>Note</label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} type="button" onClick={() => setForm(p => ({ ...p, rating: s }))}
                        className="text-2xl transition-all hover:scale-110"
                        style={{ color: s <= form.rating ? '#0B1F3A' : '#D9D5C9' }}>★</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: '#6B7789' }}>Commentaire</label>
                  <textarea
                    value={form.comment}
                    onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
                    required
                    minLength={10}
                    rows={4}
                    placeholder="Partagez votre experience..."
                    className="w-full px-3 py-2.5 border rounded-[3px] text-sm resize-none focus:outline-none focus:border-[#0B1F3A] transition-all"
                    style={{ backgroundColor: '#F3F1EA', borderColor: '#D9D5C9', color: '#0B1F3A' }}
                  />
                </div>
                <button type="submit" disabled={submitting || !form.comment} className="w-full py-2.5 rounded-[3px] text-sm text-white font-bold disabled:opacity-50 transition-all hover:opacity-90" style={{ backgroundColor: '#0B1F3A' }}>
                  {submitting ? 'Envoi...' : user ? 'Publier mon avis' : 'Se connecter pour noter'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* LISTE AVIS */}
        <div className="lg:col-span-2 space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center py-12 rounded-[4px]" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D5C9' }}>
              <p style={{ color: '#6B7789' }}>Aucun avis pour le moment</p>
            </div>
          ) : reviews.map(review => (
            <div key={review.id} className="rounded-[4px] p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D5C9' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#0B1F3A' }}>
                  {review.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm" style={{ color: '#0B1F3A' }}>{review.user.name}</p>
                  <p className="text-xs" style={{ color: '#6B7789' }}>{new Date(review.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className="text-sm" style={{ color: s <= review.rating ? '#0B1F3A' : '#D9D5C9' }}>★</span>
                  ))}
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#33465F' }}>{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
