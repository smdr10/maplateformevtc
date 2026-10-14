// Verification des entreprises via l'API publique "Recherche d'entreprises" (data.gouv.fr)
// Gratuite, sans cle : https://recherche-entreprises.api.gouv.fr

export function normalizeSiret(value: string): string {
  return value.replace(/\s/g, '')
}

// Format (14 chiffres) + cle de Luhn. Exception connue : les etablissements de La Poste.
export function isValidSiret(value: string): boolean {
  const siret = normalizeSiret(value)
  if (!/^\d{14}$/.test(siret)) return false
  if (siret.startsWith('356000000')) {
    return siret.split('').reduce((sum, d) => sum + Number(d), 0) % 5 === 0
  }
  let sum = 0
  for (let i = 0; i < 14; i++) {
    let digit = Number(siret[13 - i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

export interface RegistryCompany {
  siren: string
  siret: string
  name: string | null           // null si l'entreprise n'est pas diffusible
  companyActive: boolean        // unite legale active
  establishmentActive: boolean  // etablissement (SIRET) actif
  legalNatureCode: string | null
  nafCode: string | null
  creationDate: string | null
  postalCode: string | null
  city: string | null
  address: string | null
  isIndividualEntrepreneur: boolean
  isTrainingOrganisation: boolean
  isLawyer: boolean
  directors: { lastName: string; firstNames: string }[]
}

interface ApiEstablishment {
  siret: string
  etat_administratif: string
  code_postal?: string | null
  libelle_commune?: string | null
  adresse?: string | null
}

interface ApiResult {
  siren: string
  nom_complet?: string | null
  nom_raison_sociale?: string | null
  etat_administratif: string
  nature_juridique?: string | null
  activite_principale?: string | null
  date_creation?: string | null
  statut_diffusion?: string
  siege?: ApiEstablishment
  matching_etablissements?: ApiEstablishment[]
  complements?: { est_entrepreneur_individuel?: boolean; est_organisme_formation?: boolean; est_avocat?: boolean }
  dirigeants?: { nom?: string; prenoms?: string; type_dirigeant?: string }[]
}

// null = SIRET introuvable ; lance une erreur si l'API est indisponible
export async function lookupSiret(value: string): Promise<RegistryCompany | null> {
  const siret = normalizeSiret(value)
  const res = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${siret}&per_page=1`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Registre indisponible (${res.status})`)
  const data: { results?: ApiResult[] } = await res.json()
  const result = data.results?.find(r => r.siren === siret.slice(0, 9))
  if (!result) return null

  const establishment =
    result.matching_etablissements?.find(e => e.siret === siret) ??
    (result.siege?.siret === siret ? result.siege : undefined)
  if (!establishment) return null

  const diffusible = result.statut_diffusion !== 'P'
  return {
    siren: result.siren,
    siret,
    name: diffusible ? (result.nom_complet ?? result.nom_raison_sociale ?? null) : null,
    companyActive: result.etat_administratif === 'A',
    establishmentActive: establishment.etat_administratif === 'A',
    legalNatureCode: result.nature_juridique ?? null,
    nafCode: result.activite_principale ?? null,
    creationDate: result.date_creation ?? null,
    postalCode: establishment.code_postal ?? null,
    city: establishment.libelle_commune ?? null,
    address: diffusible ? (establishment.adresse ?? null) : null,
    isIndividualEntrepreneur: !!result.complements?.est_entrepreneur_individuel,
    isTrainingOrganisation: !!result.complements?.est_organisme_formation,
    isLawyer: !!result.complements?.est_avocat,
    directors: (result.dirigeants ?? [])
      .filter(d => d.type_dirigeant === 'personne physique' && d.nom)
      .map(d => ({ lastName: d.nom!, firstNames: d.prenoms ?? '' })),
  }
}
