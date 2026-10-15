import Link from 'next/link'
import { Logo } from './Navbar'

const COLUMNS = [
  {
    title: 'Véhicules',
    links: [
      { href: '/annonces?type=sale', label: 'Acheter un véhicule VTC' },
      { href: '/annonces?type=rent&rentDuration=week', label: 'Location à la semaine' },
      { href: '/annonces?rentDuration=loa', label: 'LOA' },
      { href: '/annonces/new', label: 'Publier une annonce' },
    ],
  },
  {
    title: 'Professionnels',
    links: [
      { href: '/services', label: 'Garages, assureurs, formations' },
      { href: '/services/new', label: 'Référencer mon activité' },
      { href: '/abonnement', label: 'Packs Standard, Pro et Flotte' },
      { href: '/profil/certification', label: 'Certification des pros' },
    ],
  },
  {
    title: 'Informations',
    links: [
      { href: '/cgu', label: "Conditions d'utilisation" },
      { href: '/confidentialite', label: 'Confidentialité' },
      { href: '/mentions-legales', label: 'Mentions légales' },
      { href: '/avis', label: 'Avis des membres' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-16 bg-ink text-paper">
      <div className="hazard" />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Logo inverted />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/70">
              Le marché des véhicules et services pour chauffeurs VTC : vente, location à la semaine, LOA, et professionnels vérifiés.
            </p>
          </div>
          {COLUMNS.map(col => (
            <div key={col.title}>
              <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-signal">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-paper/80 hover:text-paper hover:underline underline-offset-4">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-paper/20 pt-6 text-xs text-paper/60 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} MaPlateformeVTC — édité par SM DRIVERS SAS, Fresnes.</p>
          <p>Contact : <a href="mailto:contact@smdrivers.fr" className="hover:text-paper">contact@smdrivers.fr</a></p>
        </div>
      </div>
    </footer>
  )
}
