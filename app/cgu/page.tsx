import Link from 'next/link'

export default function CGUPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 min-h-screen" style={{ backgroundColor: '#F3F1EA' }}>
      <Link href="/" className="text-sm hover:underline transition-colors mb-6 inline-block" style={{ color: '#6B7789' }}>
        ← Retour à l'accueil
      </Link>

      <div className="rounded-[4px] p-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #D9D5C9' }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#0B1F3A' }}>Conditions Générales d'Utilisation</h1>
        <p className="text-sm mb-8" style={{ color: '#6B7789' }}>Dernière mise à jour : Juillet 2026</p>

        <div className="space-y-8">

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0B1F3A' }}>1. Objet</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#33465F' }}>
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation du site MaPlateformeVTC (ci-après "la Plateforme"), exploité par SM Drivers. En accédant à la Plateforme, vous acceptez sans réserve les présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0B1F3A' }}>2. Description du service</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#33465F' }}>
              MaPlateformeVTC est une marketplace communautaire dédiée aux professionnels VTC (Voiture de Transport avec Chauffeur). Elle permet aux membres de publier, consulter et répondre à des annonces de vente, location ou LOA de véhicules VTC, ainsi que de proposer et consulter des services professionnels liés à l'activité VTC.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0B1F3A' }}>3. Inscription et compte utilisateur</h2>
            <p className="text-sm leading-relaxed mb-2" style={{ color: '#33465F' }}>
              Pour accéder aux fonctionnalités de la Plateforme, vous devez créer un compte. Lors de votre inscription, vous vous engagez à :
            </p>
            <ul className="space-y-1 text-sm" style={{ color: '#33465F' }}>
              <li className="flex gap-2"><span style={{ color: '#0B1F3A' }}>•</span> Fournir des informations exactes et à jour</li>
              <li className="flex gap-2"><span style={{ color: '#0B1F3A' }}>•</span> Maintenir la confidentialité de votre mot de passe</li>
              <li className="flex gap-2"><span style={{ color: '#0B1F3A' }}>•</span> Ne pas créer plusieurs comptes</li>
              <li className="flex gap-2"><span style={{ color: '#0B1F3A' }}>•</span> Notifier immédiatement SM Drivers en cas d'utilisation non autorisée de votre compte</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0B1F3A' }}>4. Publication d'annonces</h2>
            <p className="text-sm leading-relaxed mb-2" style={{ color: '#33465F' }}>
              En publiant une annonce sur la Plateforme, vous vous engagez à :
            </p>
            <ul className="space-y-1 text-sm" style={{ color: '#33465F' }}>
              <li className="flex gap-2"><span style={{ color: '#0B1F3A' }}>•</span> Être propriétaire ou avoir le droit de vendre/louer le véhicule proposé</li>
              <li className="flex gap-2"><span style={{ color: '#0B1F3A' }}>•</span> Fournir des informations exactes sur le véhicule (kilométrage, état, année, etc.)</li>
              <li className="flex gap-2"><span style={{ color: '#0B1F3A' }}>•</span> Utiliser uniquement des photos du véhicule réel proposé</li>
              <li className="flex gap-2"><span style={{ color: '#0B1F3A' }}>•</span> Respecter la législation en vigueur concernant la vente de véhicules</li>
              <li className="flex gap-2"><span style={{ color: '#0B1F3A' }}>•</span> Ne pas publier de contenu illégal, trompeur ou frauduleux</li>
            </ul>
            <p className="text-sm leading-relaxed mt-3" style={{ color: '#33465F' }}>
              Toute annonce est soumise à validation par notre équipe avant publication. SM Drivers se réserve le droit de refuser ou supprimer toute annonce ne respectant pas ces conditions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0B1F3A' }}>5. Comportement des utilisateurs</h2>
            <p className="text-sm leading-relaxed mb-2" style={{ color: '#33465F' }}>Il est strictement interdit de :</p>
            <ul className="space-y-1 text-sm" style={{ color: '#33465F' }}>
              <li className="flex gap-2"><span style={{ color: '#0B1F3A' }}>•</span> Publier des contenus illégaux, diffamatoires ou offensants</li>
              <li className="flex gap-2"><span style={{ color: '#0B1F3A' }}>•</span> Tenter d'escroquer d'autres utilisateurs</li>
              <li className="flex gap-2"><span style={{ color: '#0B1F3A' }}>•</span> Utiliser la Plateforme à des fins commerciales non autorisées</li>
              <li className="flex gap-2"><span style={{ color: '#0B1F3A' }}>•</span> Collecter des données personnelles d'autres utilisateurs</li>
              <li className="flex gap-2"><span style={{ color: '#0B1F3A' }}>•</span> Perturber le fonctionnement de la Plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0B1F3A' }}>6. Responsabilité</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#33465F' }}>
              SM Drivers agit en tant qu'intermédiaire entre acheteurs et vendeurs. SM Drivers n'est pas partie aux transactions réalisées entre utilisateurs et ne peut être tenu responsable des litiges entre utilisateurs. Les transactions se font directement entre particuliers ou professionnels, sous leur entière responsabilité.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0B1F3A' }}>7. Propriété intellectuelle</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#33465F' }}>
              Les contenus publiés par les utilisateurs (textes, photos) restent leur propriété. En les publiant sur la Plateforme, l'utilisateur accorde à SM Drivers une licence non exclusive d'utilisation pour les besoins du service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0B1F3A' }}>8. Suspension et résiliation</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#33465F' }}>
              SM Drivers se réserve le droit de suspendre ou supprimer tout compte utilisateur en cas de non-respect des présentes CGU, sans préavis ni indemnité.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0B1F3A' }}>9. Modification des CGU</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#33465F' }}>
              SM Drivers se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications par email ou notification sur la Plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0B1F3A' }}>10. Contact</h2>
            <p className="text-sm" style={{ color: '#33465F' }}>
              Pour toute question relative aux CGU :<br />
              <a href="mailto:contact@smdrivers.fr" className="hover:underline font-medium" style={{ color: '#0B1F3A' }}>contact@smdrivers.fr</a><br />
              <a href="tel:0983547539" className="hover:underline font-medium" style={{ color: '#0B1F3A' }}> 09 83 54 75 39</a><br />
              SM Drivers — 13 Allée des Effes, 94260 Fresnes – France
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
