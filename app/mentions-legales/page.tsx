import Link from 'next/link'

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 min-h-screen" style={{ backgroundColor: '#F3F1EA' }}>
      <Link href="/" className="text-sm hover:underline transition-colors mb-6 inline-block" style={{ color: '#6B7789' }}>
        ← Retour à l'accueil
      </Link>

      <div className="rounded-[4px] p-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D5C9' }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#0B1F3A' }}>Mentions Légales</h1>
        <p className="text-sm mb-8" style={{ color: '#6B7789' }}>Dernière mise à jour : Juillet 2026</p>

        <div className="space-y-8">

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0B1F3A' }}>1. Éditeur du site</h2>
            <div className="space-y-1 text-sm" style={{ color: '#33465F' }}>
              <p><strong style={{ color: '#0B1F3A' }}>Raison sociale :</strong> SM Drivers</p>
              <p><strong style={{ color: '#0B1F3A' }}>Forme juridique :</strong> SAS (société par actions simplifiee)</p>
              <p><strong style={{ color: '#0B1F3A' }}>SIRET :</strong> 912 147 899 00013</p>
              <p><strong style={{ color: '#0B1F3A' }}>TVA intracommunautaire :</strong> FR86 912 147 899</p>
              <p><strong style={{ color: '#0B1F3A' }}>Siège social :</strong> 13 Allée des Effes, 94260 Fresnes – France</p>
              <p><strong style={{ color: '#0B1F3A' }}>Site web :</strong> <a href="https://smdrivers.fr" className="hover:underline" style={{ color: '#0B1F3A' }}>https://smdrivers.fr</a></p>
              <p><strong style={{ color: '#0B1F3A' }}>Email :</strong> <a href="mailto:contact@smdrivers.fr" className="hover:underline" style={{ color: '#0B1F3A' }}>contact@smdrivers.fr</a></p>
              <p><strong style={{ color: '#0B1F3A' }}>Téléphone :</strong> <a href="tel:0983547539" className="hover:underline" style={{ color: '#0B1F3A' }}> 09 83 54 75 39</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0B1F3A' }}>2. Directeur de la publication</h2>
            <p className="text-sm" style={{ color: '#33465F' }}>
              Le directeur de la publication est le représentant légal de SM Drivers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0B1F3A' }}>3. Hébergement</h2>
            <div className="space-y-1 text-sm" style={{ color: '#33465F' }}>
              <p><strong style={{ color: '#0B1F3A' }}>Hébergeur :</strong> Netlify, Inc.</p>
              <p><strong style={{ color: '#0B1F3A' }}>Adresse :</strong> 512 2nd Street, Suite 200, San Francisco, CA 94107, USA</p>
              <p><strong style={{ color: '#0B1F3A' }}>Site :</strong> <a href="https://www.netlify.com" className="hover:underline" style={{ color: '#0B1F3A' }}>https://www.netlify.com</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0B1F3A' }}>4. Propriété intellectuelle</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#33465F' }}>
              L'ensemble du contenu présent sur le site MaPlateformeVTC (textes, images, logos, graphismes) est la propriété exclusive de SM Drivers et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction, représentation, modification ou adaptation, même partielle, de ces éléments est strictement interdite sans l'autorisation préalable et écrite de SM Drivers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0B1F3A' }}>5. Responsabilité</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#33465F' }}>
              SM Drivers s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, SM Drivers ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à la disposition sur ce site. En conséquence, SM Drivers décline toute responsabilité pour toute imprécision, inexactitude ou omission portant sur des informations disponibles sur ce site.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0B1F3A' }}>6. Données personnelles</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#33465F' }}>
              Les informations recueillies sur ce site sont traitées conformément à notre{' '}
              <Link href="/confidentialite" className="hover:underline" style={{ color: '#0B1F3A' }}>Politique de confidentialité</Link>.
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, contactez-nous à{' '}
              <a href="mailto:contact@smdrivers.fr" className="hover:underline" style={{ color: '#0B1F3A' }}>contact@smdrivers.fr</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0B1F3A' }}>7. Droit applicable</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#33465F' }}>
              Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0B1F3A' }}>8. Contact</h2>
            <p className="text-sm" style={{ color: '#33465F' }}>
              Pour toute question concernant ces mentions légales, contactez-nous :<br />
              <a href="mailto:contact@smdrivers.fr" className="hover:underline font-medium" style={{ color: '#0B1F3A' }}>contact@smdrivers.fr</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
