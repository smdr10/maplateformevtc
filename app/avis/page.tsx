'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string
  user: { id: string; name: string; role: string }
}

export default function AvisPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [avgRating, setAvgRating] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      const [reviewsRes, meRes] = await Promise.all([
        fetch('/api/platform-reviews'),
        fetch('/api/auth/me', { credentials: 'include' }),
      ])
      const reviewsData = await reviewsRes.json()
      setReviews(reviewsData.reviews || [])
      setAvgRating(reviewsData.avgRating || 0)
      setTotal(reviewsData.total || 0)
      if (meRes.ok) {
        const meData = await meRes.json()
        setUser(meData.user)
      }
      setLoading(false)
    }
    load()
  }, [])

  const submitReview = async () => {
    if (!user) { router.push('/login?redirect=/avis'); return }
    if (rating === 0) { setError('Veuillez choisir une note'); return }
    if (comment.trim().length < 10) { setError('Commentaire trop court (10 caracteres minimum)'); return }

    setSending(true)
    setError('')

    const res = await fetch('/api/platform-reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ rating, comment }),
    })

    if (res.ok) {
      const data = await res.json()
      setReviews(prev => [data.review, ...prev.filter(r => r.user.id !== user.id)])
      setSent(true)
      setRating(0)
      setComment('')
    } else {
      const data = await res.json()
      setError(data.message || 'Erreur lors de l\'envoi')
    }
    setSending(false)
  }

  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: total > 0 ? Math.round((reviews.filter(r => r.rating === star).length / total) * 100) : 0,
  }))

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Avis de la communaute</h1>
        <p className="text-gray-500 text-sm mt-1">Ce que pensent les membres de MaPlateformeVTC</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-center gap-6">
          <div className="text-center">
            <p className="text-5xl font-black text-white">{avgRating}</p>
            <div className="flex gap-0.5 justify-center my-2">
              {[1,2,3,4,5].map(s => (
                <span key={s} className={`text-lg ${s <= Math.round(avgRating) ? 'text-orange-400' : 'text-gray-700'}`}>★</span>
              ))}
            </div>
            <p className="text-xs text-gray-500">{total} avis</p>
          </div>
          <div className="flex-1 space-y-2">
            {distribution.map(d => (
              <div key={d.star} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-4">{d.star}</span>
                <span className="text-orange-400 text-xs">★</span>
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="text-xs text-gray-600 w-6">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="font-bold text-white mb-4">
            {user ? 'Laisser mon avis' : 'Connectez-vous pour laisser un avis'}
          </h2>

          {sent ? (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-sm text-green-400 text-center">
              Merci pour votre avis !
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">Votre note</p>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button
                      key={s}
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      className={`text-2xl transition-all hover:scale-110 ${s <= (hoverRating || rating) ? 'text-orange-400' : 'text-gray-700'}`}
                    >
                      ★
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="text-sm text-gray-500 ml-2 self-center">
                      {['', 'Mauvais', 'Passable', 'Bien', 'Tres bien', 'Excellent'][rating]}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">Votre commentaire</p>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Partagez votre experience avec MaPlateformeVTC..."
                  rows={4}
                  disabled={!user}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-xl text-sm focus:outline-none focus:border-orange-500/50 transition-all placeholder-gray-600 resize-none disabled:opacity-50"
                />
                <p className="text-xs text-gray-600 mt-1">{comment.length} / 500</p>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button
                onClick={submitReview}
                disabled={sending}
                className="w-full bg-orange-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-50 transition-all hover:scale-[1.02]"
              >
                {!user ? 'Se connecter pour noter' : sending ? 'Envoi...' : 'Publier mon avis'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-bold text-white">Tous les avis</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-1/4 mb-3" />
                <div className="h-3 bg-gray-800 rounded w-full mb-2" />
                <div className="h-3 bg-gray-800 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-gray-900 rounded-2xl border border-gray-800">
            <p className="text-gray-500">Aucun avis pour le moment</p>
            <p className="text-sm text-gray-600 mt-1">Soyez le premier a partager votre experience !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(review => (
              <div key={review.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-orange-500/20 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm flex-shrink-0">
                    {review.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{review.user.name}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          {review.user.role === 'pro' ? 'Pro' : review.user.role === 'admin' ? 'Admin' : 'Membre'}
                        </span>
                      </div>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className={`text-sm ${s <= review.rating ? 'text-orange-400' : 'text-gray-700'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{review.comment}</p>
                    <p className="text-xs text-gray-600 mt-2">{new Date(review.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}