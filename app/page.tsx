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

interface Stats {
  totalListings: number
  totalUsers: number
  totalServices: number
}

interface Review {
  id: string
  rating: number
  comment: string
  user: { name: string; role: string }
}

function AvisSection() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/platform-reviews')
      .then(r => r.json())
      .then(data => {
        setReviews((data.reviews || []).slice(0, 3))
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  if (!loaded) return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-gray-800 rounded-2xl p-6 animate-pulse">
          <div className="h-3 bg-gray-700 rounded w-1/3 mb-4" />
          <div className="h-3 bg-gray-700 rounded w-full mb-2" />
          <div className="h-3 bg-gray-700 rounded w-3/4" />
        </div>
      ))}
    </div>
  )

  if (reviews.length === 0) return (
    <div className="text-center py-10 bg-gray-800 border border-gray-700 rounded-2xl">
      <p className="text-gray-500 text-sm">Aucun avis pour le moment</p>
      <Link href="/avis" className="text-orange-500 text-sm font-medium hover:text-orange-400 mt-2 inline-block">
        Soyez le premier a partager votre experience
      </Link>
    </div>
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {reviews.map((review, i) => (
        <div key={i} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 hover:border-orange-500/30 transition-all">
          <div className="flex gap-1 mb-4">
            {[...Array(review.rating)].map((_, s) => (
              <span key={s} className="text-orange-400 text-sm">★</span>
            ))}
            {[...Array(5 - review.rating)].map((_, s) => (
              <span key={s} className="text-gray-700 text-sm">★</span>
            ))}
          </div>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">"{review.comment}"</p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm">
              {review.user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{review.user.name}</p>
              <p className="text-gray-500 text-xs">
                {review.user.role === 'pro' ? 'Pro / Flotte' : review.user.role === 'admin' ? 'Admin' : 'Membre VTC'}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [stats, setStats] = useState<Stats>({ totalListings: 0, totalUsers: 0, totalServices: 0 })
  const [loading, setLoading] = useState(true)
  const [count, setCount] = useState({ listings: 0, users: 0, services: 0 })

  useEffect(() => {
    Promise.all([
      fetch('/api/listings?sort=recent&page=1').then(r => r.json()),
      fetch('/api/admin/stats').then(r => r.json()).catch(() => null),
    ]).then(([listingsData, statsData]) => {
      setListings((listingsData.listings || []).slice(0, 6))
      if (statsData) {
        setStats({
          totalListings: statsData.totalListings || 0,
          totalUsers: statsData.totalUsers || 0,
          totalServices: statsData.totalServices || 0,
        })
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading) return
    const duration = 2000
    const steps = 60
    const interval = duration / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps
      setCount({
        listings: Math.floor(stats.totalListings * progress),
        users: Math.floor(stats.totalUsers * progress),
        services: Math.floor(stats.totalServices * progress),
      })
      if (step >= steps) clearInterval(timer)
    }, interval)
    return () => clearInterval(timer)
  }, [loading, stats])

  return (
    <div className="bg-gray-900 min-h-screen">

      {/* HERO */}
      <section className="relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 py-24 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-orange-400 text-xs font-semibold uppercase tracking-widest">La plateforme N1 des professionnels VTC</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight text-white">
            Trouvez ou vendez votre<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">vehicule VTC</span>
            <br />en toute confiance
          </h1>

          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Annonces verifiees, statut VTC renseigne, mise en relation directe.<br />
            La communaute de reference pour les chauffeurs VTC.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10 max-w-3xl mx-auto">
            <Link href="/annonces" className="flex-1 bg-orange-500 text-white font-bold px-6 py-4 rounded-2xl hover:bg-orange-600 transition-all hover:scale-105 text-center shadow-lg shadow-orange-500/20 whitespace-nowrap">
              Voir les annonces
            </Link>
            <Link href="/services" className="flex-1 bg-orange-500 text-white font-bold px-6 py-4 rounded-2xl hover:bg-orange-600 transition-all hover:scale-105 text-center shadow-lg shadow-orange-500/20 whitespace-nowrap">
              Voir les services
            </Link>
            <Link href="/annonces/new" className="flex-1 bg-white/5 border border-white/10 text-white font-bold px-6 py-4 rounded-2xl hover:bg-white/10 transition-all hover:scale-105 text-center backdrop-blur-sm whitespace-nowrap">
              Publier une annonce
            </Link>
            <Link href="/services/new" className="flex-1 bg-white/5 border border-white/10 text-white font-bold px-6 py-4 rounded-2xl hover:bg-white/10 transition-all hover:scale-105 text-center backdrop-blur-sm whitespace-nowrap">
              Proposer un service
            </Link>
          </div>

          <div className="flex justify-center gap-3 flex-wrap">
            {[
              { href: '/annonces?type=sale', label: 'Vente' },
              { href: '/annonces?type=rent', label: 'Location' },
              { href: '/annonces?fuel=electric', label: 'Electrique' },
              { href: '/annonces?vtcOnly=true', label: 'VTC certifie' },
            ].map(tag => (
              <Link key={tag.href} href={tag.href} className="text-xs px-4 py-2 rounded-full border border-white/10 text-gray-400 hover:border-orange-500/50 hover:text-orange-400 transition-all hover:bg-orange-500/5">
                {tag.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5">
          <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-3 gap-4">
            {[
              { value: count.listings, label: 'Annonces publiees', suffix: '+' },
              { value: count.users, label: 'Chauffeurs inscrits', suffix: '+' },
              { value: count.services, label: 'Professionnels', suffix: '+' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-black text-white">{stat.value}{stat.suffix}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ANNONCES RECENTES */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex justify-between items-baseline mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Annonces recentes</h2>
            <p className="text-gray-500 text-sm mt-1">Les dernieres opportunites disponibles</p>
          </div>
          <Link href="/annonces" className="text-sm text-orange-500 hover:text-orange-400 font-medium transition-colors">
            Voir tout
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-700" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 bg-gray-800 rounded-2xl border border-gray-700">
            <p className="text-gray-500">Aucune annonce pour le moment</p>
            <Link href="/annonces/new" className="text-orange-500 text-sm font-medium hover:underline mt-2 inline-block">
              Soyez le premier a publier
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map(listing => (
              <Link key={listing.id} href={`/annonces/${listing.id}`} className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5 transition-all group">
                <div className="h-48 bg-gray-700 relative overflow-hidden">
                  {listing.images[0] ? (
                    <img src={listing.images[0].imageUrl} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {listing.vtcCompliant && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/20 font-medium backdrop-blur-sm">VTC</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium backdrop-blur-sm border ${listing.listingType === 'sale' ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' : listing.rentDuration === 'loa' ? 'bg-purple-500/20 text-purple-400 border-purple-500/20' : 'bg-orange-500/20 text-orange-400 border-orange-500/20'}`}>
                      {listing.listingType === 'sale' ? 'Vente' : listing.rentDuration === 'loa' ? 'LOA' : 'Location'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-white text-sm truncate group-hover:text-orange-400 transition-colors">{listing.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{listing.year} · {listing.mileage.toLocaleString()} km · {listing.locationCity}</p>
                  <p className="font-bold text-orange-400 mt-3 text-lg">
                    {parseFloat(listing.price.toString()).toLocaleString()} EUR
                    {listing.listingType === 'rent' && <span className="text-xs font-normal text-gray-500"> /mois</span>}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* SERVICES */}
      <section className="border-t border-gray-800 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-baseline mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Services & Professionnels</h2>
              <p className="text-gray-500 text-sm mt-1">Des experts pour accompagner votre activite VTC</p>
            </div>
            <Link href="/services" className="text-sm text-orange-500 hover:text-orange-400 font-medium transition-colors">
              Voir tout
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { href: '/services?category=maintenance', label: 'Entretien & Mecanique', color: 'blue', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
              { href: '/services?category=formation', label: 'Formation VTC', color: 'green', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg> },
              { href: '/services?category=insurance', label: 'Assurance VTC', color: 'purple', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
              { href: '/services?category=accessories', label: 'Accessoires', color: 'orange', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg> },
            ].map(cat => (
              <Link key={cat.href} href={cat.href} className="bg-gray-800 border border-gray-700 p-5 rounded-2xl hover:border-orange-500/30 hover:shadow-lg transition-all group text-center hover:scale-105">
                <div className={`w-12 h-12 rounded-xl bg-${cat.color}-500/10 flex items-center justify-center mx-auto mb-3 text-${cat.color}-400 group-hover:bg-${cat.color}-500/20 transition-colors`}>
                  {cat.icon}
                </div>
                <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{cat.label}</p>
              </Link>
            ))}
          </div>

          <div className="relative bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-2xl p-6 flex items-center justify-between overflow-hidden">
            <div>
              <p className="text-white font-bold text-lg">Vous etes un professionnel ?</p>
              <p className="text-gray-400 text-sm mt-1">Rejoignez des milliers de chauffeurs VTC et developpez votre clientele</p>
            </div>
            <Link href="/services/new" className="bg-orange-500 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-orange-600 transition-all hover:scale-105 flex-shrink-0 shadow-lg shadow-orange-500/20">
              Proposer mon service
            </Link>
          </div>
        </div>
      </section>

      {/* TEMOIGNAGES */}
      <section className="border-t border-gray-800 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-2">Ce que disent nos membres</h2>
            <p className="text-gray-500">Des chauffeurs VTC satisfaits de la plateforme</p>
          </div>

          <AvisSection />

          <div className="text-center mt-8">
            <Link href="/avis" className="inline-flex items-center gap-2 bg-orange-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-600 transition-all hover:scale-105 shadow-lg shadow-orange-500/20">
              Voir tous les avis & laisser le votre
            </Link>
          </div>
        </div>
      </section>

      {/* POURQUOI NOUS */}
      <section className="border-t border-gray-800 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-2">Pourquoi choisir MaPlateformeVTC ?</h2>
            <p className="text-gray-500">La plateforme de confiance pour les professionnels VTC</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, title: 'Annonces verifiees', desc: 'Chaque annonce est validee par notre equipe avant publication' },
              { icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, title: 'Statut VTC renseigne', desc: 'Conformite VTC clairement indiquee sur chaque annonce' },
              { icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>, title: 'Mise en relation directe', desc: 'Messagerie integree entre acheteurs et vendeurs' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 text-center hover:border-orange-500/20 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4 text-orange-400 group-hover:bg-orange-500/20 transition-colors">
                  {item.icon}
                </div>
                <p className="font-semibold text-white mb-2">{item.title}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="border-t border-gray-800 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-3">Pret a rejoindre la communaute ?</h2>
          <p className="text-gray-400 mb-8">Des milliers de chauffeurs VTC font deja confiance a MaPlateformeVTC</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/register" className="bg-orange-500 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-orange-600 transition-all hover:scale-105 shadow-lg shadow-orange-500/20">
              Creer mon compte gratuitement
            </Link>
            <Link href="/annonces" className="bg-gray-800 border border-gray-700 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-gray-700 transition-all hover:scale-105">
              Parcourir les annonces
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
