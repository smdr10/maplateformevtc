import { isValidSiret, lookupSiret, RegistryCompany } from './companyRegistry'

export type DocumentType =
  | 'id_card' | 'kbis' | 'sirene_notice' | 'rne_extract' | 'vtc_card' | 'insurance_certificate'
  | 'vtc_register' | 'orias' | 'training_approval' | 'professional_order' | 'other'

export type ProActivity =
  | 'driver_independent' | 'fleet' | 'dealer' | 'lessor_loa' | 'garage'
  | 'insurer' | 'trainer' | 'accountant' | 'lawyer' | 'equipment_supplier'

export type LegalForm = 'micro_entreprise' | 'ei' | 'eurl' | 'sasu' | 'sarl' | 'sas' | 'sa' | 'other'

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  id_card: "Piece d'identite du dirigeant",
  kbis: 'Extrait Kbis (moins de 3 mois)',
  sirene_notice: 'Avis de situation SIRENE',
  rne_extract: "Extrait d'immatriculation RNE",
  vtc_card: 'Carte professionnelle VTC (recto/verso)',
  insurance_certificate: "Attestation d'assurance",
  vtc_register: 'Inscription au registre des VTC',
  orias: 'Immatriculation ORIAS',
  training_approval: 'Agrement prefectoral (centre de formation)',
  professional_order: "Inscription a l'Ordre / au barreau",
  other: 'Autre document',
}

export const ACTIVITY_LABELS: Record<ProActivity, string> = {
  driver_independent: 'Chauffeur VTC independant',
  fleet: 'Gestionnaire de flotte / exploitant',
  dealer: 'Concessionnaire / marchand auto',
  lessor_loa: 'Loueur / societe de LOA',
  garage: 'Garage',
  insurer: 'Assureur / courtier',
  trainer: 'Centre de formation',
  accountant: 'Expert-comptable',
  lawyer: 'Avocat / juriste',
  equipment_supplier: 'Equipementier / accessoiriste',
}

export const LEGAL_FORM_LABELS: Record<LegalForm, string> = {
  micro_entreprise: 'Micro-entreprise',
  ei: 'Entreprise individuelle (EI)',
  eurl: 'EURL',
  sasu: 'SASU',
  sarl: 'SARL',
  sas: 'SAS',
  sa: 'SA',
  other: 'Autre',
}

// Justificatif d'immatriculation : l'un de ces documents suffit
export const REGISTRATION_DOCUMENTS: DocumentType[] = ['kbis', 'sirene_notice', 'rne_extract']

const ACTIVITY_DOCUMENTS: Record<ProActivity, DocumentType[]> = {
  driver_independent: ['vtc_card', 'insurance_certificate'],
  fleet: ['vtc_register', 'insurance_certificate'],
  dealer: ['insurance_certificate'],
  lessor_loa: ['insurance_certificate'],
  garage: ['insurance_certificate'],
  insurer: ['orias'],
  trainer: ['training_approval'],
  accountant: ['professional_order'],
  lawyer: ['professional_order'],
  equipment_supplier: ['insurance_certificate'],
}

// Documents obligatoires (hors justificatif d'immatriculation, traite a part)
export function requiredDocuments(activities: ProActivity[]): DocumentType[] {
  const set = new Set<DocumentType>(['id_card'])
  for (const a of activities) ACTIVITY_DOCUMENTS[a]?.forEach(d => set.add(d))
  return [...set]
}

export function missingDocuments(activities: ProActivity[], provided: DocumentType[]): string[] {
  const missing = requiredDocuments(activities).filter(d => !provided.includes(d)).map(d => DOCUMENT_LABELS[d])
  if (!REGISTRATION_DOCUMENTS.some(d => provided.includes(d))) {
    missing.push('Kbis, avis SIRENE ou extrait RNE')
  }
  return missing
}

// ============================================================
// ANALYSE AUTOMATIQUE (gratuite) — un modele d'IA pourra s'ajouter ici plus tard
// ============================================================

export type CheckStatus = 'ok' | 'warning' | 'fail' | 'info'

export interface VerificationCheck {
  id: string
  label: string
  status: CheckStatus
  detail: string
}

export interface AnalysisResult {
  verdict: 'compliant' | 'doubtful' | 'non_compliant'
  score: number
  model: string
  checks: VerificationCheck[]
  registry: RegistryCompany | null
}

export const ANALYZER_VERSION = 'regles-v1 + api recherche-entreprises'

// Codes INSEE de nature juridique attendus pour chaque forme declaree
const LEGAL_NATURE_PREFIX: Partial<Record<LegalForm, string[]>> = {
  micro_entreprise: ['1000'],
  ei: ['1000'],
  eurl: ['5498'],
  sarl: ['5499', '5498'],
  sasu: ['5720'],
  sas: ['5710', '5720'],
  sa: ['55', '56'],
}

// Codes NAF habituels par activite (simple indice, jamais bloquant)
const ACTIVITY_NAF: Partial<Record<ProActivity, string[]>> = {
  driver_independent: ['49.32Z', '49.39A', '49.39B'],
  fleet: ['49.32Z', '49.39B', '77.11A', '77.11B'],
  dealer: ['45.11Z', '45.19Z'],
  lessor_loa: ['77.11A', '77.11B', '64.91Z'],
  garage: ['45.20A', '45.20B'],
  insurer: ['65.12Z', '66.22Z'],
  trainer: ['85.53Z', '85.59A', '85.59B'],
  accountant: ['69.20Z'],
  lawyer: ['69.10Z'],
  equipment_supplier: ['45.32Z', '46.', '47.'],
}

function normalizeName(value: string): string[] {
  return value
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\b(SAS|SASU|SARL|EURL|SA|EI|SOCIETE|STE)\b/g, ' ')
    .replace(/[^A-Z0-9]+/g, ' ')
    .split(' ')
    .filter(w => w.length > 1)
}

function namesMatch(a: string, b: string): boolean {
  const wa = normalizeName(a)
  const wb = new Set(normalizeName(b))
  if (wa.length === 0 || wb.size === 0) return false
  const common = wa.filter(w => wb.has(w)).length
  return common / Math.min(wa.length, wb.size) >= 0.5
}

export async function analyzeCompany(input: {
  ownerName: string
  legalName: string
  siret: string | null
  legalForm: LegalForm | null
  activities: ProActivity[]
  documentTypes: DocumentType[]
}): Promise<AnalysisResult> {
  const checks: VerificationCheck[] = []
  let registry: RegistryCompany | null = null

  // 1. Documents
  const missing = missingDocuments(input.activities, input.documentTypes)
  checks.push(missing.length === 0
    ? { id: 'documents', label: 'Documents obligatoires', status: 'ok', detail: 'Tous les documents requis sont fournis.' }
    : { id: 'documents', label: 'Documents obligatoires', status: 'fail', detail: `Manquant : ${missing.join(', ')}.` })

  // 2. SIRET
  if (!input.siret) {
    checks.push({ id: 'siret', label: 'Numero SIRET', status: 'fail', detail: 'SIRET non renseigne.' })
  } else if (!isValidSiret(input.siret)) {
    checks.push({ id: 'siret', label: 'Numero SIRET', status: 'fail', detail: 'Le SIRET est invalide (format ou cle de controle).' })
  } else {
    checks.push({ id: 'siret', label: 'Numero SIRET', status: 'ok', detail: 'Format et cle de controle valides.' })

    // 3. Registre officiel
    try {
      registry = await lookupSiret(input.siret)
    } catch (e) {
      checks.push({ id: 'registry', label: 'Registre des entreprises', status: 'warning', detail: `Verification impossible pour le moment : ${(e as Error).message}.` })
    }
    if (registry === null && !checks.some(c => c.id === 'registry')) {
      checks.push({ id: 'registry', label: 'Registre des entreprises', status: 'fail', detail: 'SIRET introuvable dans le registre officiel.' })
    }
  }

  if (registry) {
    checks.push(registry.companyActive && registry.establishmentActive
      ? { id: 'registry', label: 'Entreprise active', status: 'ok', detail: `Immatriculee au registre (SIREN ${registry.siren}), etablissement actif.` }
      : { id: 'registry', label: 'Entreprise active', status: 'fail', detail: "L'entreprise ou l'etablissement est ferme selon le registre." })

    // 4. Nom
    if (!registry.name) {
      checks.push({ id: 'name', label: 'Nom de l\'entreprise', status: 'warning', detail: 'Entreprise non diffusible : comparer le nom avec le Kbis / avis SIRENE.' })
    } else {
      const expected = registry.isIndividualEntrepreneur ? input.ownerName : input.legalName
      const ok = namesMatch(expected, registry.name) || namesMatch(input.legalName, registry.name)
      checks.push(ok
        ? { id: 'name', label: 'Nom de l\'entreprise', status: 'ok', detail: `Correspond au registre : ${registry.name}.` }
        : { id: 'name', label: 'Nom de l\'entreprise', status: 'warning', detail: `Registre : "${registry.name}", declare : "${input.legalName}" (titulaire du compte : ${input.ownerName}).` })
    }

    // 5. Dirigeant
    if (registry.directors.length > 0) {
      const ok = registry.directors.some(d => namesMatch(input.ownerName, `${d.firstNames} ${d.lastName}`))
      checks.push(ok
        ? { id: 'director', label: 'Dirigeant', status: 'ok', detail: 'Le titulaire du compte figure parmi les dirigeants.' }
        : { id: 'director', label: 'Dirigeant', status: 'warning', detail: `Le titulaire du compte (${input.ownerName}) ne figure pas parmi les dirigeants declares.` })
    }

    // 6. Forme juridique
    const prefixes = input.legalForm ? LEGAL_NATURE_PREFIX[input.legalForm] : undefined
    if (prefixes && registry.legalNatureCode) {
      const ok = prefixes.some(p => registry!.legalNatureCode!.startsWith(p))
      checks.push(ok
        ? { id: 'legal_form', label: 'Forme juridique', status: 'ok', detail: 'Coherente avec le registre.' }
        : { id: 'legal_form', label: 'Forme juridique', status: 'warning', detail: `Forme declaree differente du registre (code ${registry.legalNatureCode}).` })
    }

    // 7. Activite
    const expectedNaf = input.activities.flatMap(a => ACTIVITY_NAF[a] ?? [])
    if (expectedNaf.length > 0 && registry.nafCode) {
      const ok = expectedNaf.some(code => registry!.nafCode!.startsWith(code))
      checks.push(ok
        ? { id: 'naf', label: 'Code activite (NAF)', status: 'ok', detail: `${registry.nafCode} coherent avec les activites declarees.` }
        : { id: 'naf', label: 'Code activite (NAF)', status: 'warning', detail: `Code ${registry.nafCode} inhabituel pour les activites declarees.` })
    }
    if (input.activities.includes('trainer') && !registry.isTrainingOrganisation) {
      checks.push({ id: 'trainer', label: 'Organisme de formation', status: 'warning', detail: "Non reference comme organisme de formation dans le registre." })
    }
    if (input.activities.includes('lawyer') && !registry.isLawyer) {
      checks.push({ id: 'lawyer', label: 'Avocat', status: 'warning', detail: 'Non reference comme avocat dans le registre.' })
    }

    // 8. Anciennete
    if (registry.creationDate) {
      const ageDays = (Date.now() - new Date(registry.creationDate).getTime()) / 86_400_000
      if (ageDays < 90) {
        checks.push({ id: 'age', label: 'Anciennete', status: 'info', detail: `Entreprise creee le ${registry.creationDate} (moins de 3 mois).` })
      }
    }
  }

  // A controler a l'oeil par l'admin tant qu'aucun modele de lecture de documents n'est branche
  checks.push({
    id: 'manual',
    label: 'Controle visuel',
    status: 'info',
    detail: "Verifier l'authenticite des documents, la correspondance du nom sur la piece d'identite et les dates de validite.",
  })

  const fails = checks.filter(c => c.status === 'fail').length
  const warnings = checks.filter(c => c.status === 'warning').length
  const score = Math.max(0, 100 - fails * 40 - warnings * 15)
  const verdict = fails > 0 ? 'non_compliant' : warnings > 0 ? 'doubtful' : 'compliant'

  return { verdict, score, model: ANALYZER_VERSION, checks, registry }
}
