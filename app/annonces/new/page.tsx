'use client'

import { useState, useEffect } from 'react'
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
  const [authChecked, setAuthChecked] = useState(false)
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
    loaAcompte: '', loaDuree: '', loaAssurance: 'non', loaAssistant: 'non', loaVehiculeRelais: 'non',
    rentDeposit: '', rentKm: '', rentInsurance: '', rentMinWeeks: '', rentRequirements: '', availableFrom: '',
  })

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => {
        if (!r.ok) {
          router.push('/login?redirect=/annonces/new')
        } else {
          setAuthChecked(true)
        }
      })
      .catch(() => router.push('/login?redirect=/annonces/new'))
  }, [router])

  const update = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const isLOA = form.listingType === 'rent' && form.rentDuration === 'loa'

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const finalDescription = isLOA
        ? `CONDITIONS LOA:\n- Acompte : ${form.loaAcompte} EUR\n- Loyer mensuel : ${form.price} EUR/mois\n- Duree : ${form.loaDuree} mois\n- Assurance incluse : ${form.loaAssurance}\n- Assistant inclus : ${form.loaAssistant}\n- Véhicule de relais : ${form.loaVehiculeRelais}\n\nDESCRIPTION:\n${form.description}`
        : form.description

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          description: finalDescription,
          ...(form.listingType === 'rent' && !isLOA && {
            depositAmount: form.rentDeposit,
            includedKmPerWeek: form.rentKm,
            insuranceIncluded: form.rentInsurance === '' ? undefined : form.rentInsurance === 'oui',
            minRentalWeeks: form.rentMinWeeks,
            driverRequirements: form.rentRequirements,
            availableFrom: form.availableFrom,
          }),
        }),
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
      setError('Erreur réseau, réessayez')
    } finally {
      setLoading(false)
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F7F8' }}>
        <div className="text-ink-mute">Chargement…</div>
      </div>
    )
  }

  const inputClass = "field"
  const inputStyle = {}
  const labelClass = "mb-1.5 block text-sm font-semibold text-ink"

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 min-h-screen">
      <div className="mb-8">
        <Link href="/annonces" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-white">← Retour</Link>
        <h1 className="display mt-3 text-4xl">Publier une annonce</h1>
        <p className="mt-1 text-ink-soft">Votre annonce est relue par notre équipe avant sa mise en ligne.</p>
      </div>

      <div className="mb-8">
        <div className="grid grid-cols-4 gap-2 text-xs font-bold">
          {['Véhicule', 'Offre', 'Vérification', 'Photos'].map((label, i) => (
            <span key={label} className={step >= i + 1 ? 'text-brand' : 'text-ink-mute'}>{i + 1}. {label}</span>
          ))}
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-rule">
          <div className="h-full rounded-full bg-gradient-to-r from-brand to-[#FF8A3D] transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
      </div>

      {error && <div className="mb-6 rounded-2xl bg-stop-soft p-4 text-sm font-semibold text-stop">{error}</div>}

      {step === 1 && (
        <div className="step-in space-y-5 rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-xl font-extrabold tracking-tight">Informations véhicule</h2>

          <div>
            <label className={labelClass}>Titre <span className="text-brand">*</span></label>
            <input type="text" value={form.title} onChange={e => update('title', e.target.value)} placeholder="Ex: Tesla Model 3 - 2022 - Électrique - VTC" className={inputClass} style={inputStyle} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Marque <span className="text-brand">*</span></label>
              <input type="text" value={form.brand} onChange={e => update('brand', e.target.value)} placeholder="Ex: Peugeot, Tesla..." list="brand-suggestions" className={inputClass} style={inputStyle} />
              <datalist id="brand-suggestions">
                {BRAND_SUGGESTIONS.map(b => <option key={b} value={b} />)}
              </datalist>
            </div>
            <div>
              <label className={labelClass}>Modèle <span className="text-brand">*</span></label>
              <input type="text" value={form.model} onChange={e => update('model', e.target.value)} placeholder="Ex: 508, Model 3..." className={inputClass} style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Année <span className="text-brand">*</span></label>
              <input type="number" value={form.year} onChange={e => update('year', e.target.value)} min="2000" max="2027" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass}>Kilométrage <span className="text-brand">*</span></label>
              <input type="number" value={form.mileage} onChange={e => update('mileage', e.target.value)} placeholder="42000" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass}>Places <span className="text-brand">*</span></label>
              <select value={form.seats} onChange={e => update('seats', e.target.value)} className={inputClass} style={inputStyle}>
                {[2,4,5,6,7,8,9].map(n => <option key={n} value={n} style={{ backgroundColor: '#FFFFFF' }}>{n}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Énergie <span className="text-brand">*</span></label>
              <select value={form.fuelType} onChange={e => update('fuelType', e.target.value)} className={inputClass} style={inputStyle}>
                <option value="electric" style={{ backgroundColor: '#FFFFFF' }}>Électrique</option>
                <option value="hybrid" style={{ backgroundColor: '#FFFFFF' }}>Hybride</option>
                <option value="diesel" style={{ backgroundColor: '#FFFFFF' }}>Diesel</option>
                <option value="gasoline" style={{ backgroundColor: '#FFFFFF' }}>Essence</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Transmission <span className="text-brand">*</span></label>
              <select value={form.transmission} onChange={e => update('transmission', e.target.value)} className={inputClass} style={inputStyle}>
                <option value="automatic" style={{ backgroundColor: '#FFFFFF' }}>Automatique</option>
                <option value="manual" style={{ backgroundColor: '#FFFFFF' }}>Manuelle</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Couleur</label>
              <input type="text" value={form.color} onChange={e => update('color', e.target.value)} placeholder="Noir, Blanc..." className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass}>Ville <span className="text-brand">*</span></label>
              <input type="text" value={form.locationCity} onChange={e => update('locationCity', e.target.value)} placeholder="Paris" className={inputClass} style={inputStyle} />
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ backgroundColor: '#001A0A', border: '1px solid #003A15' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.vtcCompliant} onChange={e => update('vtcCompliant', e.target.checked)} className="w-4 h-4 rounded" />
              <div>
                <p className="text-sm font-medium text-green-400">Véhicule conforme VTC</p>
                <p className="text-xs mt-0.5" style={{ color: '#2A7A40' }}>Cochez si le véhicule repond aux criteres VTC</p>
              </div>
            </label>
          </div>

          <button onClick={() => setStep(2)} disabled={!form.title || !form.brand || !form.model || !form.mileage || !form.locationCity} className="btn btn-brand w-full disabled:opacity-50">
            Suivant →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="step-in space-y-5 rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-xl font-extrabold tracking-tight">Offre commerciale</h2>

          <div>
            <label className={labelClass}>Type d'offre <span className="text-brand">*</span></label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'sale', dur: 'month', label: 'Vente', active: form.listingType === 'sale' },
                { type: 'rent', dur: 'week', label: 'Location', active: form.listingType === 'rent' && !isLOA },
                { type: 'rent', dur: 'loa', label: 'LOA', active: isLOA },
              ].map(btn => (
                <button key={btn.label} type="button" onClick={() => { update('listingType', btn.type); update('rentDuration', btn.dur) }}
                  className="p-3 rounded-xl border-2 text-sm font-medium transition-all"
                  style={{ borderColor: btn.active ? '#FF5500' : '#ECECEF', backgroundColor: btn.active ? '#FFF1E8' : '#F7F7F8', color: btn.active ? '#16181D' : '#8A8F9A' }}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{isLOA ? 'Loyer mensuel (EUR)' : form.listingType === 'rent' ? 'Prix location (EUR)' : 'Prix de vente (EUR)'} <span className="text-brand">*</span></label>
              <input type="number" value={form.price} onChange={e => update('price', e.target.value)} placeholder={isLOA ? '1500' : '28500'} className={inputClass} style={inputStyle} />
            </div>
            {form.listingType === 'rent' && !isLOA && (
              <div>
                <label className={labelClass}>Duree location</label>
                <select value={form.rentDuration} onChange={e => update('rentDuration', e.target.value)} className={inputClass} style={inputStyle}>
                  <option value="week" style={{ backgroundColor: '#FFFFFF' }}>Par semaine</option>
                  <option value="month" style={{ backgroundColor: '#FFFFFF' }}>Par mois</option>
                  <option value="year" style={{ backgroundColor: '#FFFFFF' }}>Par an</option>
                </select>
              </div>
            )}
          </div>

          {form.listingType === 'rent' && !isLOA && (
            <div className="space-y-4 p-4 rounded-xl" style={{ backgroundColor: '#FFF1E8', border: '1px solid #FFD0B0' }}>
              <p className="text-sm font-bold" style={{ color: '#16181D' }}>Conditions de location</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Caution (EUR)</label>
                  <input type="number" min="0" value={form.rentDeposit} onChange={e => update('rentDeposit', e.target.value)} placeholder="1000" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass}>Kilomètres inclus par semaine</label>
                  <input type="number" min="0" value={form.rentKm} onChange={e => update('rentKm', e.target.value)} placeholder="1500" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass}>Durée minimale (semaines)</label>
                  <input type="number" min="1" value={form.rentMinWeeks} onChange={e => update('rentMinWeeks', e.target.value)} placeholder="4" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass}>Disponible à partir du</label>
                  <input type="date" value={form.availableFrom} onChange={e => update('availableFrom', e.target.value)} className={inputClass} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Assurance incluse</label>
                <div className="flex gap-2 mt-1">
                  {['oui', 'non'].map(v => (
                    <button key={v} type="button" onClick={() => update('rentInsurance', form.rentInsurance === v ? '' : v)}
                      className="flex-1 py-2 rounded-xl text-sm font-medium border"
                      style={{ backgroundColor: form.rentInsurance === v ? '#FF5500' : '#FFFFFF', borderColor: form.rentInsurance === v ? '#FF5500' : '#ECECEF', color: form.rentInsurance === v ? 'white' : '#8A8F9A' }}>
                      {v === 'oui' ? 'Oui' : 'Non'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Conditions demandées au chauffeur</label>
                <input value={form.rentRequirements} onChange={e => update('rentRequirements', e.target.value)} maxLength={500} placeholder="Carte VTC, permis depuis 3 ans, 25 ans minimum…" className={inputClass} style={inputStyle} />
              </div>
            </div>
          )}

          {isLOA && (
            <div className="space-y-4 p-4 rounded-xl" style={{ backgroundColor: '#FFF1E8', border: '1px solid #FFD0B0' }}>
              <p className="text-sm font-bold" style={{ color: '#16181D' }}>Conditions LOA</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Acompte (EUR) <span className="text-brand">*</span></label>
                  <input type="number" value={form.loaAcompte} onChange={e => update('loaAcompte', e.target.value)} placeholder="1000" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass}>Duree du contrat (mois) <span className="text-brand">*</span></label>
                  <input type="number" value={form.loaDuree} onChange={e => update('loaDuree', e.target.value)} placeholder="48" className={inputClass} style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { field: 'loaAssurance', label: 'Assurance incluse', val: form.loaAssurance },
                  { field: 'loaAssistant', label: 'Assistant inclus', val: form.loaAssistant },
                  { field: 'loaVehiculeRelais', label: 'Véhicule de relais', val: form.loaVehiculeRelais },
                ].map(item => (
                  <div key={item.field}>
                    <label className={labelClass}>{item.label}</label>
                    <div className="flex gap-2 mt-1">
                      {['oui', 'non'].map(v => (
                        <button key={v} type="button" onClick={() => update(item.field, v)}
                          className="flex-1 py-2 rounded-lg text-sm font-medium border transition-all capitalize"
                          style={{ backgroundColor: item.val === v ? '#FF5500' : '#FFFFFF', borderColor: item.val === v ? '#FF5500' : '#ECECEF', color: item.val === v ? 'white' : '#8A8F9A' }}>
                          {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>Description <span className="text-brand">*</span></label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={6} placeholder="Decrivez l'etat du véhicule, l'historique d'entretien, les options..." className={inputClass + ' resize-none'} style={inputStyle} />
            <p className="text-xs text-gray-600 mt-1">{form.description.length} / 2000 caracteres</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn btn-line flex-1">← Retour</button>
            <button onClick={() => setStep(3)} disabled={!form.price || !form.description || (isLOA && (!form.loaAcompte || !form.loaDuree))} className="btn btn-brand flex-1 disabled:opacity-50">Suivant →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="step-in space-y-5 rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-xl font-extrabold tracking-tight">Vérification</h2>

          <div className="p-4 rounded-xl space-y-2 text-sm" style={{ backgroundColor: '#FFF1E8', border: '1px solid #FFD0B0' }}>
            {[
              ['Titre', form.title],
              ['Véhicule', `${form.brand} ${form.model} ${form.year}`],
              ['Kilométrage', `${parseInt(form.mileage || '0').toLocaleString()} km`],
              ['Type', form.listingType === 'sale' ? 'Vente' : isLOA ? 'LOA' : 'Location'],
              ['Prix', `${parseFloat(form.price || '0').toLocaleString()} EUR${isLOA ? '/mois' : ''}`],
              ...(isLOA ? [['Acompte', `${form.loaAcompte} EUR`], ['Duree', `${form.loaDuree} mois`], ['Assurance', form.loaAssurance], ['Assistant', form.loaAssistant], ['Véhicule de relais', form.loaVehiculeRelais]] : []),
              ['VTC', form.vtcCompliant ? 'Oui' : 'Non'],
              ['Ville', form.locationCity],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-ink-soft">{label}</span>
                <span className="font-bold text-ink">{value}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-paper p-4">
            <p className="text-sm font-bold">Et ensuite ?</p>
            <p className="mt-1 text-sm text-ink-soft">Ajoutez vos photos, puis notre équipe relit l’annonce : vous êtes prévenu dès sa mise en ligne.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn btn-line flex-1">← Retour</button>
            <button onClick={handleSubmit} disabled={loading} className="btn btn-brand flex-1 disabled:opacity-50">
              {loading ? 'Création…' : 'Continuer →'}
            </button>
          </div>
        </div>
      )}

      {step === 4 && listingId && (
        <div className="step-in space-y-5 rounded-[28px] bg-white p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-xl font-extrabold tracking-tight">Photos du véhicule</h2>
          <p className="text-sm text-[#8A8F9A]">Ajoutez au moins 3 photos. La première sera la photo principale.</p>
          <PhotoUploader listingId={listingId} onComplete={() => router.push(`/annonces/${listingId}`)} />
          <button onClick={() => router.push(`/annonces/${listingId}`)} className="btn btn-line w-full">
            Ajouter les photos plus tard
          </button>
        </div>
      )}
    </div>
  )
}
