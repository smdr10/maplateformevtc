'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Status = 'pending' | 'verified' | 'rejected' | 'expired'
type CheckStatus = 'ok' | 'warning' | 'fail' | 'info'

interface CompanyRow {
  id: string
  legalName: string
  siret: string | null
  activities: string[]
  updatedAt: string
  user: { name: string; email: string }
  reviews: { aiVerdict: string | null; aiScore: number | null }[]
  _count: { documents: number }
}

interface Detail {
  id: string
  legalName: string
  tradeName: string | null
  siret: string | null
  legalForm: string | null
  activities: string[]
  address: string | null
  postalCode: string | null
  city: string | null
  verificationStatus: Status | 'unverified'
  user: { name: string; email: string; phone: string | null; createdAt: string }
  documents: { id: string; type: string; fileName: string; mimeType: string; uploadedAt: string; url: string | null }[]
  reviews: {
    id: string
    aiVerdict: string | null
    aiScore: number | null
    aiModel: string | null
    aiAnalyzedAt: string | null
    aiReport: { checks?: { id: string; label: string; status: CheckStatus; detail: string }[] } | null
    adminDecision: string | null
    adminComment: string | null
    decidedAt: string | null
    admin: { name: string } | null
  }[]
}

const VERDICT_UI: Record<string, { label: string; color: string }> = {
  compliant: { label: 'Conforme', color: '#15803D' },
  doubtful: { label: 'Douteux', color: '#F59E0B' },
  non_compliant: { label: 'Non conforme', color: '#B42318' },
}
const CHECK_ICON: Record<CheckStatus, string> = { ok: '✅', warning: '⚠️', fail: '❌', info: 'ℹ️' }

const card = { backgroundColor: '#102846', border: '1px solid #1E3A5F' }

export default function AdminCertificationsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Status>('pending')
  const [rows, setRows] = useState<CompanyRow[] | null>(null)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const fetchList = useCallback(async (status: Status): Promise<CompanyRow[] | null> => {
    const res = await fetch(`/api/admin/verifications?status=${status}`, { credentials: 'include' })
    if (res.status === 403) { router.push('/'); return null }
    return (await res.json()).companies ?? []
  }, [router])

  const loadList = useCallback((status: Status) => {
    fetchList(status).then(list => { if (list) setRows(list) })
  }, [fetchList])

  useEffect(() => {
    fetchList(tab).then(list => { if (list) setRows(list) })
  }, [tab, fetchList])

  const open = async (id: string) => {
    setError('')
    setComment('')
    const res = await fetch(`/api/admin/verifications/${id}`, { credentials: 'include' })
    setDetail((await res.json()).company)
  }

  const reanalyze = async () => {
    if (!detail) return
    setBusy(true)
    await fetch(`/api/admin/verifications/${detail.id}/analyze`, { method: 'POST', credentials: 'include' })
    setBusy(false)
    open(detail.id)
  }

  const decide = async (decision: 'approved' | 'rejected') => {
    if (!detail) return
    if (decision === 'rejected' && !comment.trim()) { setError('Indiquez le motif du refus (il sera envoyé au professionnel).'); return }
    setBusy(true)
    const res = await fetch(`/api/admin/verifications/${detail.id}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ decision, comment }),
    })
    setBusy(false)
    if (!res.ok) { setError((await res.json()).message || 'Erreur'); return }
    setDetail(null)
    loadList(tab)
  }

  const latest = detail?.reviews.find(r => r.aiAnalyzedAt)

  return (
    <div className="min-h-screen px-4 py-8" style={{ backgroundColor: '#0B1F3A' }}>
      <div className="max-w-6xl mx-auto">
        <Link href="/admin" className="text-sm" style={{ color: '#666' }}>← Administration</Link>
        <h1 className="text-2xl font-bold text-white mt-2 mb-6">Certifications des professionnels</h1>

        <div className="flex gap-2 mb-5">
          {([['pending', 'A traiter'], ['verified', 'Certifies'], ['rejected', 'Refuses'], ['expired', 'Expires']] as const).map(([v, l]) => (
            <button key={v} onClick={() => { setTab(v); setDetail(null); setRows(null) }} className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: tab === v ? '#FFC72C' : '#102846', color: tab === v ? '#FFFFFF' : '#6B7789' }}>
              {l}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-5 gap-5">
          {/* LISTE */}
          <div className="lg:col-span-2 rounded-[4px] overflow-hidden" style={card}>
            {rows === null ? (
              <p className="p-6 text-sm" style={{ color: '#666' }}>Chargement...</p>
            ) : rows.length === 0 ? (
              <p className="p-6 text-sm" style={{ color: '#666' }}>Aucun dossier.</p>
            ) : rows.map(c => {
              const v = c.reviews[0]?.aiVerdict ? VERDICT_UI[c.reviews[0].aiVerdict] : null
              return (
                <button key={c.id} onClick={() => open(c.id)} className="w-full text-left p-4 transition-colors"
                  style={{ borderBottom: '1px solid #1E3A5F', backgroundColor: detail?.id === c.id ? '#1E3A5F' : 'transparent' }}>
                  <div className="flex justify-between gap-2">
                    <p className="text-sm font-medium text-white truncate">{c.legalName}</p>
                    {v && <span className="text-xs font-bold flex-shrink-0" style={{ color: v.color }}>{v.label} · {c.reviews[0].aiScore}</span>}
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#6B7789' }}>{c.user.name} · SIRET {c.siret ?? '—'} · {c._count.documents} doc.</p>
                  <p className="text-xs mt-0.5" style={{ color: '#33465F' }}>Mis a jour le {new Date(c.updatedAt).toLocaleDateString('fr-FR')}</p>
                </button>
              )
            })}
          </div>

          {/* DETAIL */}
          <div className="lg:col-span-3">
            {!detail ? (
              <div className="rounded-[4px] p-10 text-center text-sm" style={{ ...card, color: '#666' }}>Sélectionnez un dossier</div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[4px] p-5" style={card}>
                  <h2 className="text-lg font-bold text-white">{detail.legalName}</h2>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs" style={{ color: '#6B7789' }}>
                    <p>SIRET : <span className="text-white">{detail.siret ?? '—'}</span></p>
                    <p>Forme : <span className="text-white">{detail.legalForm ?? '—'}</span></p>
                    <p>Titulaire : <span className="text-white">{detail.user.name}</span></p>
                    <p>Email : <span className="text-white">{detail.user.email}</span></p>
                    <p className="col-span-2">Activites : <span className="text-white">{detail.activities.join(', ') || '—'}</span></p>
                    <p className="col-span-2">Adresse : <span className="text-white">{[detail.address, detail.postalCode, detail.city].filter(Boolean).join(' ') || '—'}</span></p>
                  </div>
                </div>

                <div className="rounded-[4px] p-5" style={card}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Analyse automatique</h3>
                    <button onClick={reanalyze} disabled={busy} className="text-xs disabled:opacity-50" style={{ color: '#FFC72C' }}>Relancer</button>
                  </div>
                  {!latest ? (
                    <p className="text-xs mt-2" style={{ color: '#666' }}>Aucune analyse. Cliquez sur « Relancer ».</p>
                  ) : (
                    <>
                      <p className="text-sm mt-2">
                        <span className="font-bold" style={{ color: VERDICT_UI[latest.aiVerdict ?? '']?.color }}>{VERDICT_UI[latest.aiVerdict ?? '']?.label}</span>
                        <span style={{ color: '#6B7789' }}> · score {latest.aiScore}/100 · {latest.aiModel}</span>
                      </p>
                      <ul className="mt-3 space-y-2">
                        {latest.aiReport?.checks?.map(c => (
                          <li key={c.id} className="text-xs" style={{ color: '#6B7789' }}>
                            {CHECK_ICON[c.status]} <span className="text-white font-medium">{c.label}</span> — {c.detail}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs mt-3" style={{ color: '#33465F' }}>Avis indicatif : la decision vous revient.</p>
                    </>
                  )}
                </div>

                <div className="rounded-[4px] p-5" style={card}>
                  <h3 className="text-sm font-bold text-white mb-3">Documents</h3>
                  {detail.documents.length === 0 && <p className="text-xs" style={{ color: '#666' }}>Aucun document.</p>}
                  {detail.documents.map(d => (
                    <div key={d.id} className="flex justify-between gap-3 text-xs py-1.5" style={{ borderBottom: '1px solid #1E3A5F' }}>
                      <span style={{ color: '#6B7789' }}><span className="text-white">{d.type}</span> · {d.fileName}</span>
                      {d.url
                        ? <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0" style={{ color: '#FFC72C' }}>Ouvrir</a>
                        : <span style={{ color: '#33465F' }}>Supprimé</span>}
                    </div>
                  ))}
                  <p className="text-xs mt-2" style={{ color: '#33465F' }}>Liens valables 10 minutes.</p>
                </div>

                {detail.verificationStatus === 'pending' && (
                  <div className="rounded-[4px] p-5" style={card}>
                    <h3 className="text-sm font-bold text-white mb-3">Decision</h3>
                    <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                      placeholder="Commentaire (obligatoire en cas de refus, envoyé au professionnel)"
                      className="w-full p-3 rounded-[3px] text-sm text-white" style={{ backgroundColor: '#0B1F3A', border: '1px solid #1E3A5F' }} />
                    {error && <p className="text-xs mt-2" style={{ color: '#B42318' }}>{error}</p>}
                    <div className="flex gap-3 mt-3">
                      <button onClick={() => decide('approved')} disabled={busy} className="flex-1 py-2.5 rounded-[3px] text-sm font-bold text-white disabled:opacity-50" style={{ backgroundColor: '#15803D' }}>
                        Certifier
                      </button>
                      <button onClick={() => decide('rejected')} disabled={busy} className="flex-1 py-2.5 rounded-[3px] text-sm font-bold disabled:opacity-50" style={{ backgroundColor: '#1A0000', color: '#B42318' }}>
                        Refuser
                      </button>
                    </div>
                  </div>
                )}

                {detail.reviews.some(r => r.adminDecision) && (
                  <div className="rounded-[4px] p-5" style={card}>
                    <h3 className="text-sm font-bold text-white mb-2">Historique</h3>
                    {detail.reviews.filter(r => r.adminDecision).map(r => (
                      <p key={r.id} className="text-xs py-1" style={{ color: '#6B7789' }}>
                        {r.decidedAt && new Date(r.decidedAt).toLocaleDateString('fr-FR')} — {r.adminDecision === 'approved' ? 'Certifié' : 'Refuse'}
                        {r.admin ? ` par ${r.admin.name}` : ''}{r.adminComment ? ` : ${r.adminComment}` : ''}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
