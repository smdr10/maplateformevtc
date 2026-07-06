'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PhotoUploader from '../../components/PhotoUploader'

const BRAND_SUGGESTIONS = [
  'Audi', 'BMW', 'Citroen', 'Dacia', 'DS', 'Fiat', 'Ford', 'Honda', 'Hyundai',
  'Jaguar', 'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Mazda', 'Mercedes', 'Mini',
  'Mitsubishi', 'Nissan', 'Opel', 'Peugeot', 'Porsche', 'Renault', 'Seat',
  'Skoda', 'Smart', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo',
  'Alfa Romeo', 'Chevrolet', 'Chrysler', 'Dodge', 'Genesis', 'Infiniti',
  'Lancia', 'Maserati', 'MG', 'Polestar', 'SsangYong',
]

export default function NewListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [listingId, setListingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', brand: '', model: '',
    year: new Date().getFullYear().toString(),
    mileage: '', fuelType: 'electric', transmission: 'automatic',
    color: '', seats: '5', vtcCompliant: false,
    listingType: 'sale', price: '', rentDuration: 'month',
    description: '', locationCity: '',
  })

  const update = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const isLOA = form.listingType === 'rent' && form.rentDuration === 'loa'

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) { router.push('/login?redirect=/annonces/new'); return }
        setError(data.message || 'Erreur lors de la publication')
        return
      }
      setListingId(data.listing.id)
      setStep(4)
    } catch {
      setError('Erreur reseau, reessayez')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-all"
  const labelClass = "block text-sm font-medium text-gray-400 mb-1"

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 min-h-screen">
      <div className="mb-8">
        <Link href="/annonces" className="text-sm text-gray-500 hover:text-orange-500">← Retour</Link>
        <h1 className="text-2xl font-bold text-white mt-3">Publier une annonce</h1>
        <p className="text-gray-500 text-sm mt-1">Votre annonce sera visible apres validation par notre equipe</p>
      </div>

      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${step >= s ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
              {s}
            </div>
            <div className={`h-0.5 flex-1 ${s < 4 ? (step > s ? 'bg-orange-500' : 'bg-gray-700') : 'hidden'}`} />
          </div>
        ))}
      </div>

      {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{error}</div>}

      {step === 1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-white">Informations vehicule</h2>

          <div>
            <label className={labelClass}>Titre <span className="text-red-500">*</span></label>
            <input type="text" value={form.title} onChange={e => update('title', e.target.value)} placeholder="Ex: Tesla Model 3 - 2022 - Electrique - VTC" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Marque <span className="text-red-500">*</span></label>
              <input type="text" value={form.brand} onChange={e => update('brand', e.target.value)} placeholder="Ex: Peugeot, Tesla, BYD..." list="brand-suggestions" className={inputClass} />
              <datalist id="brand-suggestions">
                {BRAND_SUGGESTIONS.map(b => <option key={b} value={b} />)}
              </datalist>
              <p className="text-xs text-gray-500 mt-1">Tapez librement, suggestions disponibles</p>
            </div>
            <div>
              <label className={labelClass}>Modele <span className="text-red-500">*</span></label>
              <input type="text" value={form.model} onChange={e => update('model', e.target.value)} placeholder="Ex: 508, Model 3, Atto 3..." className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Annee <span className="text-red-500">*</span></label>
              <input type="number" value={form.year} onChange={e => update('year', e.target.value)} min="2000" max="2027" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Kilometrage <span className="text-red-500">*</span></label>
              <input type="number" value={form.mileage} onChange={e => update('mileage', e.target.value)} placeholder="42000" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Places <span className="text-red-500">*</span></label>
              <select value={form.seats} onChange={e => update('seats', e.target.value)} className={inputClass}>
                {[2,4,5,6,7,8,9].map(n => <option key={n} value={n} className="bg-gray-800">{n}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Energie <span className="text-red-500">*</span></label>
              <select value={form.fuelType} onChange={e => update('fuelType', e.target.value)} className={inputClass}>
                <option value="electric" className="bg-gray-800">Electrique</option>
                <option value="hybrid" className="bg-gray-800">Hybride</option>
                <option value="diesel" className="bg-gray-800">Diesel</option>
                <option value="gasoline" className="bg-gray-800">Essence</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Transmission <span className="text-red-500">*</span></label>
              <select value={form.transmission} onChange={e => update('transmission', e.target.value)} className={inputClass}>
                <option value="automatic" className="bg-gray-800">Automatique</option>
                <option value="manual" className="bg-gray-800">Manuelle</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Couleur</label>
              <input type="text" value={form.color} onChange={e => update('color', e.target.value)} placeholder="Noir, Blanc..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Ville <span className="text-red-500">*</span></label>
              <input type="text" value={form.locationCity} onChange={e => update('locationCity', e.target.value)} placeholder="Paris" className={inputClass} />
            </div>
          </div>

          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.vtcCompliant} onChange={e => update('vtcCompliant', e.target.checked)} className="w-4 h-4 text-green-500 rounded" />
              <div>
                <p className="text-sm font-medium text-green-400">Vehicule conforme VTC</p>
                <p className="text-xs text-green-500/70">Cochez si le vehicule repond aux criteres VTC</p>
              </div>
            </label>
          </div>

          <button onClick={() => setStep(2)} disabled={!form.title || !form.brand || !form.model || !form.mileage || !form.locationCity} className="w-full bg-orange-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-50 transition-all hover:scale-[1.02]">
            Suivant →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-white">Offre commerciale</h2>

          <div>
            <label className={labelClass}>Type d'offre <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-3 gap-3">
              <button type="button" onClick={() => { update('listingType', 'sale'); update('rentDuration', 'month') }} className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${form.listingType === 'sale' ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                Vente
              </button>
              <button type="button" onClick={() => { update('listingType', 'rent'); update('rentDuration', 'month') }} className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${form.listingType === 'rent' && !isLOA ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                Location
              </button>
              <button type="button" onClick={() => { update('listingType', 'rent'); update('rentDuration', 'loa') }} className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${isLOA ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                LOA
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{isLOA ? 'Loyer mensuel (EUR)' : form.listingType === 'rent' ? 'Prix location (EUR)' : 'Prix de vente (EUR)'} <span className="text-red-500">*</span></label>
              <input type="number" value={form.price} onChange={e => update('price', e.target.value)} placeholder={isLOA ? '450' : '28500'} className={inputClass} />
            </div>
            {form.listingType === 'rent' && !isLOA && (
              <div>
                <label className={labelClass}>Duree location</label>
                <select value={form.rentDuration} onChange={e => update('rentDuration', e.target.value)} className={inputClass}>
                  <option value="week" className="bg-gray-800">Par semaine</option>
                  <option value="month" className="bg-gray-800">Par mois</option>
                  <option value="year" className="bg-gray-800">Par an</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Description <span className="text-red-500">*</span></label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={6} placeholder="Decrivez l'etat du vehicule, l'historique d'entretien, les options..." className={inputClass + ' resize-none'} />
            <p className="text-xs text-gray-500 mt-1">{form.description.length} / 2000 caracteres</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-700 transition-all">← Retour</button>
            <button onClick={() => setStep(3)} disabled={!form.price || !form.description} className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-50 transition-all">Suivant →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-white">Verification et publication</h2>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 space-y-2 text-sm">
            {[
              ['Titre', form.title],
              ['Vehicule', `${form.brand} ${form.model} ${form.year}`],
              ['Kilometrage', `${parseInt(form.mileage || '0').toLocaleString()} km`],
              ['Type', form.listingType === 'sale' ? 'Vente' : isLOA ? 'LOA' : 'Location'],
              ['Prix', `${parseFloat(form.price || '0').toLocaleString()} EUR${isLOA ? '/mois' : ''}`],
              ['VTC', form.vtcCompliant ? 'Oui' : 'Non'],
              ['Ville', form.locationCity],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-400">{label}</span>
                <span className="font-medium text-white">{value}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-sm text-blue-400 font-medium">Information importante</p>
            <p className="text-xs text-blue-400/70 mt-1">Votre annonce sera verifiee par notre equipe avant d'etre publiee. Vous serez notifie sous 24h.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-700 transition-all">← Retour</button>
            <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-50 transition-all">
              {loading ? 'Creation...' : 'Continuer →'}
            </button>
          </div>
        </div>
      )}

      {step === 4 && listingId && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-white">Photos du vehicule</h2>
          <p className="text-sm text-gray-500">Ajoutez au minimum 3 photos. La premiere sera la photo principale.</p>
          <PhotoUploader listingId={listingId} onComplete={() => router.push(`/annonces/${listingId}`)} />
          <button onClick={() => router.push(`/annonces/${listingId}`)} className="w-full py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-400 hover:bg-gray-700 transition-all">
            Passer cette etape (photos plus tard)
          </button>
        </div>
      )}
    </div>
  )
}