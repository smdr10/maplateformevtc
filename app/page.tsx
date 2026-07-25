'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface Listing {
  id: string
  title: string
  brand: string
  model: string
  year: number
  mileage: number
  price: number
  listingType: string
  locationCity: string
  vtcCompliant: boolean
  rentDuration: string | null
  images: { imageUrl: string }[]
}

interface User {
  id: string
  name: string
  role: string
}

interface Review {
  id: string
  rating: number
  comment: string
  user: { name: string }
}

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/listings?sort=recent&page=1').then(r => r.json()),
      fetch('/api/auth/me', { credentials: 'include' }).then(r => r.ok ? r.json() : null),
      fetch('/api/platform-reviews').then(r => r.json()),
    ]).then(([listingsData, meData, reviewsData]) => {
      setListings((listingsData.listings || []).slice(0, 8))
      if (meData?.user) setUser(meData.user)
      setReviews((reviewsData.reviews || []).slice(0, 3))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      window.location.href = `/annonces?brand=${encodeURIComponent(search.trim())}`
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F8F8' }}>

      {/* HERO */}
      <section style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E8E8E8' }} className="py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          {user ? (
            <div className="mb-6">
              <p className="text-sm mb-1" style={{ color: '#888' }}>Bonjour,</p>
              <h1 className="text-3xl font-black" style={{ color: '#1A1A1A' }}>
                {user.name.split(' ')[0]} 👋
              </h1>
              <p className="text-sm mt-2" style={{ color: '#888' }}>Que recherchez-vous aujourd'hui ?</p>
            </div>
          ) : (
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-black mb-2" style={{ color: '#1A1A1A' }}>
                La communaute <span style={{ color: '#FF5500' }}>VTC</span> de reference
              </h1>
              <p className="text-sm" style={{ color: '#888' }}>Achetez, vendez, louez — entre professionnels VTC</p>
            </div>
          )}

          {/* BARRE DE RECHERCHE */}
          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto mb-6">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Marque, modele, ville..."
              style={{ backgroundColor: '#F8F8F8', border: '2px solid #E8E8E8', color: '#1A1A1A' }}
              className="w-full pl-5 pr-14 py-4 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-all shadow-sm"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-white p-2 rounded-xl hover:opacity-90 transition-all" style={{ backgroundColor: '#FF5500' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* ACCES RAPIDE CONNECTE */}
          {user && (
            <div className="flex gap-3 justify-center flex-wrap">
              {[
                { href: '/profil', label: 'Mes annonces', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                { href: '/messages', label: 'Messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
                { href: '/favoris', label: 'Favoris', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
              ].map(item => (
                <Link key={item.href} href={item.href} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all hover:border-orange-300" style={{ backgroundColor: '#F8F8F8', border: '1px solid #E8E8E8', color: '#333' }}>
                  <svg className="w-4 h-4" style={{ color: '#FF5500' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                  {item.label}
                </Link>
              ))}
              <Link href="/annonces/new" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white font-bold hover:opacity-90 transition-all" style={{ backgroundColor: '#FF5500' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Deposer une annonce
              </Link>
            </div>
          )}

          {/* ACCES RAPIDE NON CONNECTE */}
          {!user && (
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/register" className="px-5 py-2.5 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all" style={{ backgroundColor: '#FF5500' }}>
                Rejoindre la communaute
              </Link>
              <Link href="/login" className="px-5 py-2.5 text-sm font-medium rounded-xl hover:border-orange-300 transition-all" style={{ backgroundColor: '#F8F8F8', border: '1px solid #E8E8E8', color: '#555' }}>
                Se connecter
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ANNONCES RECENTES */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>Annonces recentes</h2>
          <Link href="/annonces" className="text-sm font-medium hover:opacity-80 transition-colors" style={{ color: '#FF5500' }}>
            Voir tout →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden animate-pulse" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
                <div className="h-36" style={{ backgroundColor: '#F0F0F0' }} />
                <div className="p-3 space-y-2">
                  <div className="h-3 rounded w-3/4" style={{ backgroundColor: '#E8E8E8' }} />
                  <div className="h-3 rounded w-1/2" style={{ backgroundColor: '#E8E8E8' }} />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
            <p className="text-gray-400">Aucune annonce disponible</p>
            <Link href="/annonces/new" className="text-sm font-medium hover:opacity-80 mt-2 inline-block" style={{ color: '#FF5500' }}>
              Publiez la premiere annonce
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {listings.map(listing => (
              <Link key={listing.id} href={`/annonces/${listing.id}`} className="rounded-xl overflow-hidden transition-all group hover:shadow-md" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
                <div className="h-36 relative overflow-hidden" style={{ backgroundColor: '#F0F0F0' }}>
                  {listing.images[0] ? (
                    <img src={listing.images[0].imageUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: '#CCC' }}>
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {listing.vtcCompliant && <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: '#22C55E' }}>VTC</span>}
                    <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: listing.listingType === 'sale' ? '#3B82F6' : listing.rentDuration === 'loa' ? '#8B5CF6' : '#FF5500' }}>
                      {listing.listingType === 'sale' ? 'Vente' : listing.rentDuration === 'loa' ? 'LOA' : 'Location'}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm truncate" style={{ color: '#1A1A1A' }}>{listing.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#888' }}>{listing.year} · {listing.mileage.toLocaleString()} km · {listing.locationCity}</p>
                  <p className="font-bold mt-2" style={{ color: '#FF5500' }}>
                    {parseFloat(listing.price.toString()).toLocaleString()} EUR
                    {listing.listingType === 'rent' && <span className="text-xs font-normal" style={{ color: '#AAA' }}> /mois</span>}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* SERVICES */}
      <section style={{ borderTop: '1px solid #E8E8E8', backgroundColor: '#FFFFFF' }} className="py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-baseline mb-5">
            <h2 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>Services & Professionnels</h2>
            <Link href="/services" className="text-sm font-medium hover:opacity-80" style={{ color: '#FF5500' }}>Voir tout →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { href: '/services?category=maintenance', label: 'Entretien & Mecanique', icon: '🔧' },
              { href: '/services?category=formation', label: 'Formation VTC', icon: '🎓' },
              { href: '/services?category=insurance', label: 'Assurance VTC', icon: '🛡️' },
              { href: '/services?category=accessories', label: 'Accessoires', icon: '🎒' },
            ].map(cat => (
              <Link key={cat.href} href={cat.href} className="p-4 rounded-xl text-center transition-all hover:shadow-md hover:border-orange-200 group" style={{ backgroundColor: '#F8F8F8', border: '1px solid #E8E8E8' }}>
                <span className="text-2xl block mb-2">{cat.icon}</span>
                <p className="text-xs font-medium" style={{ color: '#333' }}>{cat.label}</p>
              </Link>
            ))}
          </div>
          <div className="p-5 rounded-2xl flex items-center justify-between" style={{ backgroundColor: '#FFF5F0', border: '1px solid #FFD0B0' }}>
            <div>
              <p className="font-bold" style={{ color: '#1A1A1A' }}>Vous etes un professionnel ?</p>
              <p className="text-sm mt-1" style={{ color: '#888' }}>Proposez vos services a des milliers de chauffeurs VTC</p>
            </div>
            <Link href="/services/new" className="text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all flex-shrink-0" style={{ backgroundColor: '#FF5500' }}>
              Proposer
            </Link>
          </div>
        </div>
      </section>

      {/* AVIS */}
      {reviews.length > 0 && (
        <section style={{ borderTop: '1px solid #E8E8E8' }} className="py-10 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-baseline mb-5">
              <h2 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>Ce que disent nos membres</h2>
              <Link href="/avis" className="text-sm font-medium hover:opacity-80" style={{ color: '#FF5500' }}>Voir tout →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {reviews.map((review, i) => (
                <div key={i} className="p-5 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(review.rating)].map((_, s) => <span key={s} style={{ color: '#FF5500' }} className="text-sm">★</span>)}
                    {[...Array(5 - review.rating)].map((_, s) => <span key={s} className="text-sm text-gray-300">★</span>)}
                  </div>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: '#555' }}>"{review.comment}"</p>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: '#FF5500' }}>
                      {review.user.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs font-medium" style={{ color: '#333' }}>{review.user.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA FINAL NON CONNECTE */}
      {!user && (
        <section style={{ borderTop: '1px solid #E8E8E8', backgroundColor: '#FFFFFF' }} className="py-12 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-black mb-2" style={{ color: '#1A1A1A' }}>Rejoignez la communaute VTC</h2>
            <p className="mb-6 text-sm" style={{ color: '#888' }}>Des milliers de chauffeurs VTC font deja confiance a MaPlateformeVTC</p>
            <div className="flex gap-3 justify-center">
              <Link href="/register" className="text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-all" style={{ backgroundColor: '#FF5500' }}>
                Creer mon compte
              </Link>
              <Link href="/annonces" className="font-medium px-6 py-3 rounded-xl hover:border-orange-300 transition-all" style={{ backgroundColor: '#F8F8F8', border: '1px solid #E8E8E8', color: '#555' }}>
                Parcourir les annonces
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
