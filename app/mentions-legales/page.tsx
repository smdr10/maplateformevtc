import Link from 'next/link'

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 min-h-screen" style={{ backgroundColor: '#F8F8F8' }}>
      <Link href="/" className="text-sm hover:text-orange-500 transition-colors mb-6 inline-block" style={{ color: '#888' }}>
        ← Retour à l'accueil
      </Link>

      <div className="rounded-2xl p-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E8E8' }}>
        <h1 className="text-2xl font-black mb-2" style={{ color: '#1A1A1A' }}>Mentions Légales</h1>
        <p className="text-sm mb-8" style={{ color: '#888' }}>Dernière mise à jour : Juillet 2026</p>

        <div className="space-y-8">

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#FF5500' }}>1. Éditeur du site</h2>
            <div className="space-y-1 text-sm" style={{ color: '#555' }}>
              <p><strong style={{ color: '#1A1A1A' }}>Raison sociale :</strong> SM Drivers</p>
              <p><strong style={{ color: '#1A1A1A' }}>SIRET :</strong> 912 147 899 00013</p>
              <p><strong style={{ color: '#1A1A1A' }}>Siège social :</strong> 13 Allée des Effes, 94260 Fresnes – France</p>
              <p><strong style={{ color: '#1A1A1A' }}>Site web :</strong> <a href="https://smdrivers.fr" className="hover:underline" style={{ color: '#FF5500' }}>https://smdrivers.fr</a></p>
              <p><strong style={{ color: '#1A1A1A' }}>Email :</strong> <a href="mailto:contact@smdrivers.fr" className="hover:underline" style={{ color: '#FF5500' }}>contact@smdrivers.fr</a></p>
              <p><strong style={{ color: '#1A1A1A' }}>Téléphone :</strong> <a href="tel:0983547539" className="hover:underline" style={{ color: '#FF5500' }}> 09 83 54 75 39</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#FF5500' }}>2. Directeur de la publication</h2>
            <p className="text-sm" style={{ color: '#555' }}>
              Le directeur de la publication est le représentant légal de SM Drivers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#FF5500' }}>3. Hébergement</h2>
            <div className="space-y-1 text-sm" style={{ color: '#555' }}>
              <p><strong style={{ color: '#1A1A1A' }}>Hébergeur :</strong> Netlify, Inc.</p>
              <p><strong style={{ color: '#1A1A1A' }}>Adresse :</strong> 512 2nd Street, Suite 200, San Francisco, CA 94107, USA</p>
              <p><strong style={{ color: '#1A1A1A' }}>Site :</strong> <a href="https://www.netlify.com" className="hover:underline" style={{ color: '#FF5500' }}>https://www.netlify.com</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#FF5500' }}>4. Propriété intellectuelle</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#555' }}>
              L'ensemble du contenu présent sur le site MaPlateformeVTC (textes, images, logos, graphismes) est la propriété exclusive de SM Drivers et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction, représentation, modification ou adaptation, même partielle, de ces éléments est strictement interdite sans l'autorisation préalable et écrite de SM Drivers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#FF5500' }}>5. Responsabilité</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#555' }}>
              SM Drivers s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, SM Drivers ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à la disposition sur ce site. En conséquence, SM Drivers décline toute responsabilité pour toute imprécision, inexactitude ou omission portant sur des informations disponibles sur ce site.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#FF5500' }}>6. Données personnelles</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#555' }}>
              Les informations recueillies sur ce site sont traitées conformément à notre{' '}
              <Link href="/confidentialite" className="hover:underline" style={{ color: '#FF5500' }}>Politique de confidentialité</Link>.
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, contactez-nous à{' '}
              <a href="mailto:contact@smdrivers.fr" className="hover:underline" style={{ color: '#FF5500' }}>contact@smdrivers.fr</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#FF5500' }}>7. Droit applicable</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#555' }}>
              Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#FF5500' }}>8. Contact</h2>
            <p className="text-sm" style={{ color: '#555' }}>
              Pour toute question concernant ces mentions légales, contactez-nous :<br />
              <a href="mailto:contact@smdrivers.fr" className="hover:underline font-medium" style={{ color: '#FF5500' }}>contact@smdrivers.fr</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
