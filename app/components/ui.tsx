import Link from 'next/link'

// ============================================================
// Briques visuelles partagees de l'identite "Signaletique"
// ============================================================

export const FUEL_LABELS: Record<string, string> = {
  electric: 'Électrique',
  hybrid: 'Hybride',
  diesel: 'Diesel',
  gasoline: 'Essence',
}

const RENT_SUFFIX: Record<string, string> = {
  week: '/ sem.',
  month: '/ mois',
  year: '/ an',
  loa: '/ mois',
}

export function formatPrice(price: number | string): string {
  return Number(price).toLocaleString('fr-FR', { maximumFractionDigits: 0 })
}

export function listingKind(listingType: string, rentDuration: string | null): { label: string; tone: 'ink' | 'plate' | 'signal' } {
  if (listingType === 'sale') return { label: 'Vente', tone: 'ink' }
  if (rentDuration === 'loa') return { label: 'LOA', tone: 'plate' }
  return { label: rentDuration === 'week' ? 'Location semaine' : 'Location', tone: 'signal' }
}

// Prix affiche comme une plaque d'immatriculation francaise
export function PricePlate({
  price, listingType, rentDuration, size = 'md',
}: { price: number | string; listingType: string; rentDuration: string | null; size?: 'md' | 'lg' }) {
  const suffix = listingType === 'rent' ? RENT_SUFFIX[rentDuration ?? 'month'] ?? '' : ''
  const big = size === 'lg'
  return (
    <span className={`inline-flex items-stretch overflow-hidden rounded-[3px] border-[1.5px] border-ink bg-card font-display font-semibold ${big ? 'text-3xl' : 'text-lg'}`}>
      <span className={`flex flex-col items-center justify-center bg-plate text-white ${big ? 'px-2 text-xs' : 'px-1.5 text-[10px]'}`}>
        <span aria-hidden="true">★</span>F
      </span>
      <span className={`flex items-baseline gap-1 ${big ? 'px-4 py-1' : 'px-2.5 py-0.5'}`}>
        {formatPrice(price)}&nbsp;€
        {suffix && <span className={`${big ? 'text-base' : 'text-xs'} font-medium text-ink-soft`}>{suffix}</span>}
      </span>
    </span>
  )
}

export function KindTag({ listingType, rentDuration }: { listingType: string; rentDuration: string | null }) {
  const { label, tone } = listingKind(listingType, rentDuration)
  const cls = tone === 'ink' ? 'bg-ink text-paper' : tone === 'plate' ? 'bg-plate text-white' : 'bg-signal text-ink'
  return <span className={`font-display text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[2px] ${cls}`}>{label}</span>
}

export interface CardListing {
  id: string
  title: string
  brand?: string
  model?: string
  year: number
  mileage: number
  price: number | string
  listingType: string
  rentDuration: string | null
  locationCity: string
  vtcCompliant: boolean
  fuelType?: string
  images: { imageUrl: string }[]
  user?: { companyName?: string | null; role?: string }
}

export function ListingCard({ listing }: { listing: CardListing }) {
  const image = listing.images[0]?.imageUrl
  return (
    <Link href={`/annonces/${listing.id}`} className="group panel flex flex-col overflow-hidden transition-transform hover:-translate-y-0.5">
      <div className="relative aspect-[4/3] overflow-hidden border-b-[1.5px] border-ink bg-rule">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={listing.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-sm uppercase tracking-widest text-ink-mute">Photo à venir</div>
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          <KindTag listingType={listing.listingType} rentDuration={listing.rentDuration} />
          {listing.vtcCompliant && <span className="font-display text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-go text-white">Conforme VTC</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="font-display text-lg font-semibold uppercase leading-tight">{listing.title}</p>
        <p className="text-sm text-ink-soft">
          {listing.year} · {Number(listing.mileage).toLocaleString('fr-FR')} km
          {listing.fuelType ? ` · ${FUEL_LABELS[listing.fuelType] ?? listing.fuelType}` : ''}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <PricePlate price={listing.price} listingType={listing.listingType} rentDuration={listing.rentDuration} />
          <span className="text-xs text-ink-mute text-right">{listing.locationCity}</span>
        </div>
      </div>
    </Link>
  )
}

export function CardSkeleton() {
  return (
    <div className="panel-soft overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-rule/60" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 rounded bg-rule/70" />
        <div className="h-3 w-1/2 rounded bg-rule/70" />
        <div className="h-6 w-1/3 rounded bg-rule/70" />
      </div>
    </div>
  )
}

// Titre de section facon panneau directionnel
export function SectionHead({ title, href, cta }: { title: string; href?: string; cta?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b-[1.5px] border-ink pb-2">
      <h2 className="display text-3xl">{title}</h2>
      {href && (
        <Link href={href} className="font-display text-sm font-semibold uppercase tracking-wider hover:underline underline-offset-4">
          {cta ?? 'Tout voir'} →
        </Link>
      )}
    </div>
  )
}
