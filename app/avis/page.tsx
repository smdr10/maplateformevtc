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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F8F8' }}>
      <div style={{ color: '#888' }}>Chargement...</div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen" style={{ backgroundColor: '#F8F8F8' }}>
      <h1 className="text-xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Avis de la communaute</h1>
      <p className="text-sm mb-6" style={{ color: '#888' }}>Ce que pensent les membres de MaPlateformeVTC</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* FORMULAIRE */}
        <div>
          <div className="rounded-2xl p-6 mb-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
            <div className="text-center mb-4">
              <p className="text-4xl font-black" style={{ color: '#FF5500' }}>{avgRating.toFixed(1)}</p>
              <div className="flex justify-center gap-1 my-1">
                {[1,2,3,4,5].map(s => (
                  <span key={s} className="text-lg" style={{ color: s <= Math.round(avgRating) ? '#FF5500' : '#E8E8E8' }}>★</span>
                ))}
              </div>
              <p className="text-sm" style={{ color: '#888' }}>{reviews.length} avis</p>
            </div>
          </div>

          {submitted ? (
            <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: '#F0FFF4', border: '1px solid #BBF7D0' }}>
              <p className="text-green-600 font-medium">Merci pour votre avis !</p>
            </div>
          ) : (
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
              <h2 className="font-bold text-sm mb-4" style={{ color: '#1A1A1A' }}>Laisser un avis</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: '#888' }}>Note</label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} type="button" onClick={() => setForm(p => ({ ...p, rating: s }))}
                        className="text-2xl transition-all hover:scale-110"
                        style={{ color: s <= form.rating ? '#FF5500' : '#E8E8E8' }}>★</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: '#888' }}>Commentaire</label>
                  <textarea
                    value={form.comment}
                    onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
                    required
                    minLength={10}
                    rows={4}
                    placeholder="Partagez votre experience..."
                    className="w-full px-3 py-2.5 border rounded-xl text-sm resize-none focus:outline-none focus:border-orange-400 transition-all"
                    style={{ backgroundColor: '#F8F8F8', borderColor: '#E8E8E8', color: '#1A1A1A' }}
                  />
                </div>
                <button type="submit" disabled={submitting || !form.comment} className="w-full py-2.5 rounded-xl text-sm text-white font-bold disabled:opacity-50 transition-all hover:opacity-90" style={{ backgroundColor: '#FF5500' }}>
                  {submitting ? 'Envoi...' : user ? 'Publier mon avis' : 'Se connecter pour noter'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* LISTE AVIS */}
        <div className="lg:col-span-2 space-y-3">
          {reviews.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
              <p style={{ color: '#888' }}>Aucun avis pour le moment</p>
            </div>
          ) : reviews.map(review => (
            <div key={review.id} className="rounded-2xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#FF5500' }}>
                  {review.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm" style={{ color: '#1A1A1A' }}>{review.user.name}</p>
                  <p className="text-xs" style={{ color: '#AAA' }}>{new Date(review.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className="text-sm" style={{ color: s <= review.rating ? '#FF5500' : '#E8E8E8' }}>★</span>
                  ))}
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#555' }}>{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
