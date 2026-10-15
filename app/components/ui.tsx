import Link from 'next/link'
import { CarFront, Gauge, MapPin, Fuel, BadgeCheck } from 'lucide-react'

// ============================================================
// Briques visuelles partagees (identite orange)
// ============================================================

export const FUEL_LABELS: Record<string, string> = {
  electric: 'Électrique',
  hybrid: 'Hybride',
  diesel: 'Diesel',
  gasoline: 'Essence',
}

const RENT_SUFFIX: Record<string, string> = {
  week: '/ semaine',
  month: '/ mois',
  year: '/ an',
  loa: '/ mois',
}

export function formatPrice(price: number | string): string {
  return Number(price).toLocaleString('fr-FR', { maximumFractionDigits: 0 })
}

export function listingKind(listingType: string, rentDuration: string | null): { label: string; cls: string } {
  if (listingType === 'sale') return { label: 'Vente', cls: 'bg-white/95 text-ink' }
  if (rentDuration === 'loa') return { label: 'LOA', cls: 'bg-ink text-white' }
  return { label: rentDuration === 'week' ? 'Location semaine' : 'Location', cls: 'bg-brand text-white' }
}

export function PricePlate({
  price, listingType, rentDuration, size = 'md',
}: { price: number | string; listingType: string; rentDuration: string | null; size?: 'md' | 'lg' }) {
  const suffix = listingType === 'rent' ? RENT_SUFFIX[rentDuration ?? 'month'] ?? '' : ''
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className={`font-extrabold tracking-tight text-ink ${size === 'lg' ? 'text-4xl' : 'text-xl'}`}>{formatPrice(price)} €</span>
      {suffix && <span className={`font-semibold text-ink-mute ${size === 'lg' ? 'text-base' : 'text-xs'}`}>{suffix}</span>}
    </span>
  )
}

export function KindTag({ listingType, rentDuration }: { listingType: string; rentDuration: string | null }) {
  const { label, cls } = listingKind(listingType, rentDuration)
  return <span className={`chip shadow-sm ${cls}`}>{label}</span>
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
    <Link href={`/annonces/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-[22px] border border-rule bg-card shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-brand-soft to-paper">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={listing.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand/40">
            <CarFront className="h-16 w-16" strokeWidth={1.4} />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <KindTag listingType={listing.listingType} rentDuration={listing.rentDuration} />
          {listing.vtcCompliant && (
            <span className="chip bg-go text-white shadow-sm"><BadgeCheck className="h-3.5 w-3.5" /> Conforme VTC</span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="line-clamp-1 text-[15px] font-bold">{listing.title}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-ink-mute">
          <span>{listing.year}</span>
          <span className="inline-flex items-center gap-1"><Gauge className="h-3.5 w-3.5" />{Number(listing.mileage).toLocaleString('fr-FR')} km</span>
          {listing.fuelType && <span className="inline-flex items-center gap-1"><Fuel className="h-3.5 w-3.5" />{FUEL_LABELS[listing.fuelType] ?? listing.fuelType}</span>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <PricePlate price={listing.price} listingType={listing.listingType} rentDuration={listing.rentDuration} />
          <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-mute"><MapPin className="h-3.5 w-3.5" />{listing.locationCity}</span>
        </div>
      </div>
    </Link>
  )
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-rule bg-card">
      <div className="aspect-[4/3] animate-pulse bg-rule/70" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-rule" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-rule" />
        <div className="h-5 w-1/3 animate-pulse rounded-full bg-rule" />
      </div>
    </div>
  )
}

export function SectionHead({ title, subtitle, href, cta, eyebrow }: { title: string; subtitle?: string; href?: string; cta?: string; eyebrow?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="display text-3xl sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-2 max-w-xl text-ink-soft">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="hidden flex-shrink-0 rounded-full border border-rule bg-card px-4 py-2 text-sm font-bold transition hover:border-ink-mute sm:inline-flex">
          {cta ?? 'Tout voir'} →
        </Link>
      )}
    </div>
  )
}
