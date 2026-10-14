'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Doc { id: string; type: string; fileName: string; status: string; uploadedAt: string }
interface Company {
  legalName: string
  tradeName: string | null
  siret: string | null
  legalForm: string | null
  activities: string[]
  address: string | null
  postalCode: string | null
  city: string | null
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected' | 'expired'
  verificationExpiresAt: string | null
  rejectionReason: string | null
  documents: Doc[]
}
interface CompanyResponse {
  company: Company | null
  requiredDocuments: string[]
  registrationDocuments: string[]
  labels: { activities: Record<string, string>; legalForms: Record<string, string>; documents: Record<string, string> }
}

const STATUS_UI: Record<Company['verificationStatus'], { label: string; bg: string; border: string; color: string }> = {
  unverified: { label: 'Non certifie', bg: '#F8F8F8', border: '#E8E8E8', color: '#888' },
  pending: { label: 'Verification en cours', bg: '#FFFBEB', border: '#FDE68A', color: '#B45309' },
  verified: { label: 'Pro certifie', bg: '#F0FFF4', border: '#BBF7D0', color: '#15803D' },
  rejected: { label: 'Certification refusee', bg: '#FFF0F0', border: '#FFD0D0', color: '#DC2626' },
  expired: { label: 'Certification a renouveler', bg: '#FFF5F0', border: '#FFD0B0', color: '#FF5500' },
}

const inputStyle = { backgroundColor: '#F8F8F8', borderColor: '#E8E8E8', color: '#1A1A1A' }
const inputClass = 'w-full px-4 py-2.5 border rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-orange-400'

export default function CertificationPage() {
  const router = useRouter()
  const [data, setData] = useState<CompanyResponse | null>(null)
  const [form, setForm] = useState({ legalName: '', siret: '', legalForm: '', activities: [] as string[], address: '', postalCode: '', city: '' })
  const [saving, setSaving] = useState(false)
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const applyData = useCallback((json: CompanyResponse) => {
    setData(json)
    if (json.company) {
      const c = json.company
      setForm({
        legalName: c.legalName, siret: c.siret ?? '', legalForm: c.legalForm ?? '', activities: c.activities,
        address: c.address ?? '', postalCode: c.postalCode ?? '', city: c.city ?? '',
      })
    }
  }, [])

  const fetchCompany = useCallback(async (): Promise<CompanyResponse | null> => {
    const res = await fetch('/api/company', { credentials: 'include' })
    if (res.status === 401) { router.push('/login?redirect=/profil/certification'); return null }
    return res.json()
  }, [router])

  const load = useCallback(async () => {
    const json = await fetchCompany()
    if (json) applyData(json)
  }, [fetchCompany, applyData])

  useEffect(() => {
    fetchCompany().then(json => { if (json) applyData(json) })
  }, [fetchCompany, applyData])

  if (!data) {
    return <div className="min-h-screen flex items-center justify-center" style={{ color: '#888' }}>Chargement...</div>
  }

  const status = data.company?.verificationStatus ?? 'unverified'
  const editable = ['unverified', 'rejected', 'expired'].includes(status)
  const docs = data.company?.documents ?? []
  const hasType = (t: string) => docs.some(d => d.type === t)
  const hasRegistration = data.registrationDocuments.some(hasType)
  const missingRequired = data.requiredDocuments.filter(t => !hasType(t))
  const identityComplete = !!(data.company?.siret && data.company.legalForm && data.company.activities.length > 0)
  const canSubmit = editable && identityComplete && missingRequired.length === 0 && hasRegistration

  const toggleActivity = (a: string) =>
    setForm(f => ({ ...f, activities: f.activities.includes(a) ? f.activities.filter(x => x !== a) : [...f.activities, a] }))

  const saveCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    const res = await fetch('/api/company', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...form, legalForm: form.legalForm || null }),
    })
    const json = await res.json()
    setSaving(false)
    setMessage(res.ok ? { ok: true, text: 'Informations enregistrees' } : { ok: false, text: json.message || 'Erreur' })
    if (res.ok) load()
  }

  const upload = async (type: string, file: File) => {
    setUploadingType(type)
    setMessage(null)
    const body = new FormData()
    body.append('type', type)
    body.append('file', file)
    const res = await fetch('/api/company/documents', { method: 'POST', credentials: 'include', body })
    const json = await res.json()
    setUploadingType(null)
    if (!res.ok) setMessage({ ok: false, text: json.message || "Erreur lors de l'envoi" })
    load()
  }

  const removeDoc = async (id: string) => {
    await fetch(`/api/company/documents/${id}`, { method: 'DELETE', credentials: 'include' })
    load()
  }

  const submit = async () => {
    setMessage(null)
    const res = await fetch('/api/company/submit', { method: 'POST', credentials: 'include' })
    const json = await res.json()
    setMessage({ ok: res.ok, text: json.message || (res.ok ? 'Dossier envoye' : 'Erreur') })
    if (res.ok) load()
  }

  // Documents a afficher : obligatoires, puis justificatif d'immatriculation au choix
  const docRows: { types: string[]; label: string; required: boolean }[] = [
    ...data.requiredDocuments.map(t => ({ types: [t], label: data.labels.documents[t], required: true })),
    { types: data.registrationDocuments, label: 'Kbis (societe) ou avis SIRENE / extrait RNE (micro-entreprise)', required: true },
  ]

  const ui = STATUS_UI[status]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 min-h-screen">
      <Link href="/profil" className="text-sm" style={{ color: '#888' }}>← Mon profil</Link>
      <h1 className="text-2xl font-black mt-2" style={{ color: '#1A1A1A' }}>Certification de ma societe</h1>
      <p className="text-sm mt-1" style={{ color: '#888' }}>
        Gratuit, quel que soit votre pack. Le badge « Pro certifie » rassure les acheteurs et les chauffeurs.
      </p>

      <div className="mt-5 rounded-2xl p-4" style={{ backgroundColor: ui.bg, border: `1px solid ${ui.border}` }}>
        <p className="text-sm font-bold" style={{ color: ui.color }}>{ui.label}</p>
        {status === 'pending' && <p className="text-sm mt-1" style={{ color: '#555' }}>Votre dossier est en cours d&apos;examen. Vous serez prevenu par email.</p>}
        {status === 'verified' && data.company?.verificationExpiresAt && (
          <p className="text-sm mt-1" style={{ color: '#555' }}>Valable jusqu&apos;au {new Date(data.company.verificationExpiresAt).toLocaleDateString('fr-FR')}.</p>
        )}
        {status === 'rejected' && data.company?.rejectionReason && (
          <p className="text-sm mt-1" style={{ color: '#555' }}>Motif : {data.company.rejectionReason}. Corrigez votre dossier puis renvoyez-le.</p>
        )}
      </div>

      {message && (
        <div className="mt-4 p-3 rounded-xl text-sm" style={{ backgroundColor: message.ok ? '#F0FFF4' : '#FFF0F0', color: message.ok ? '#15803D' : '#DC2626' }}>
          {message.text}
        </div>
      )}

      {/* 1. SOCIETE */}
      <form onSubmit={saveCompany} className="mt-6 rounded-2xl p-6 space-y-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
        <h2 className="font-bold" style={{ color: '#1A1A1A' }}>1. Votre societe</h2>
        <fieldset disabled={!editable} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#555' }}>Raison sociale *</label>
              <input value={form.legalName} onChange={e => setForm(f => ({ ...f, legalName: e.target.value }))} required className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#555' }}>SIRET (14 chiffres) *</label>
              <input value={form.siret} onChange={e => setForm(f => ({ ...f, siret: e.target.value }))} inputMode="numeric" placeholder="123 456 789 00012" className={inputClass} style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#555' }}>Forme juridique *</label>
            <select value={form.legalForm} onChange={e => setForm(f => ({ ...f, legalForm: e.target.value }))} className={inputClass} style={inputStyle}>
              <option value="">Choisir...</option>
              {Object.entries(data.labels.legalForms).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#555' }}>Vos activites * <span className="font-normal" style={{ color: '#AAA' }}>(plusieurs choix possibles)</span></label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.labels.activities).map(([v, l]) => {
                const on = form.activities.includes(v)
                return (
                  <button key={v} type="button" onClick={() => toggleActivity(v)} className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                    style={{ borderColor: on ? '#FF5500' : '#E8E8E8', backgroundColor: on ? '#FFF5F0' : '#FFFFFF', color: on ? '#FF5500' : '#888' }}>
                    {l}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Adresse" className={inputClass + ' md:col-span-3'} style={inputStyle} />
            <input value={form.postalCode} onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))} placeholder="Code postal" className={inputClass} style={inputStyle} />
            <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Ville" className={inputClass + ' md:col-span-2'} style={inputStyle} />
          </div>
        </fieldset>
        {editable && (
          <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ backgroundColor: '#1A1A1A' }}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        )}
      </form>

      {/* 2. DOCUMENTS */}
      {data.company && (
        <div className="mt-6 rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
          <h2 className="font-bold" style={{ color: '#1A1A1A' }}>2. Vos justificatifs</h2>
          <p className="text-xs mt-1 mb-4" style={{ color: '#AAA' }}>
            PDF, JPG ou PNG, 10 Mo max. Stockes de facon privee, consultes uniquement par notre equipe et supprimes 30 jours apres la decision.
          </p>
          <div className="space-y-3">
            {docRows.map(row => {
              const uploaded = docs.filter(d => row.types.includes(d.type))
              return (
                <div key={row.types.join()} className="rounded-xl p-3" style={{ border: '1px solid #F0F0F0' }}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
                      {uploaded.length > 0 ? '✅' : '⬜'} {row.label}
                    </p>
                    {editable && (
                      <label className="text-xs font-bold cursor-pointer flex-shrink-0" style={{ color: '#FF5500' }}>
                        {uploadingType === row.types[0] ? 'Envoi...' : '+ Ajouter'}
                        <input type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="hidden" disabled={!!uploadingType}
                          onChange={e => { const f = e.target.files?.[0]; if (f) upload(row.types[0], f); e.target.value = '' }} />
                      </label>
                    )}
                  </div>
                  {uploaded.map(d => (
                    <div key={d.id} className="flex items-center justify-between mt-2 text-xs" style={{ color: '#888' }}>
                      <span className="truncate">{d.fileName}</span>
                      {editable && <button type="button" onClick={() => removeDoc(d.id)} style={{ color: '#EF4444' }}>Supprimer</button>}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. ENVOI */}
      {data.company && editable && (
        <div className="mt-6 rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
          <h2 className="font-bold" style={{ color: '#1A1A1A' }}>3. Envoyer mon dossier</h2>
          {!canSubmit && (
            <p className="text-sm mt-2" style={{ color: '#888' }}>
              {!identityComplete ? 'Renseignez et enregistrez SIRET, forme juridique et activites. ' : ''}
              {missingRequired.length > 0 || !hasRegistration ? 'Ajoutez tous les justificatifs demandes.' : ''}
            </p>
          )}
          <button type="button" onClick={submit} disabled={!canSubmit} className="mt-4 w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40" style={{ backgroundColor: '#FF5500' }}>
            Envoyer pour certification
          </button>
        </div>
      )}
    </div>
  )
}
