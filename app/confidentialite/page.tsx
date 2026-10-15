import Link from 'next/link'

export default function ConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 min-h-screen" style={{ backgroundColor: '#F7F7F8' }}>
      <Link href="/" className="text-sm hover:underline transition-colors mb-6 inline-block" style={{ color: '#8A8F9A' }}>
        ← Retour à l'accueil
      </Link>

      <div className="rounded-[20px] p-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #ECECEF' }}>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#16181D' }}>Politique de Confidentialité</h1>
        <p className="text-sm mb-8" style={{ color: '#8A8F9A' }}>Dernière mise à jour : Juillet 2026</p>

        <div className="space-y-8">

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#16181D' }}>1. Responsable du traitement</h2>
            <div className="text-sm space-y-1" style={{ color: '#4B5160' }}>
              <p><strong style={{ color: '#16181D' }}>SM Drivers</strong></p>
              <p>13 Allée des Effes, 94260 Fresnes – France</p>
              <p>SIRET : 912 147 899 00013</p>
              <p>Email : <a href="mailto:contact@smdrivers.fr" className="hover:underline" style={{ color: '#16181D' }}>contact@smdrivers.fr</a></p>
              <p>Téléphone : <a href="tel:0983547539" className="hover:underline" style={{ color: '#16181D' }}> 09 83 54 75 39</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#16181D' }}>2. Données collectées</h2>
            <p className="text-sm leading-relaxed mb-3" style={{ color: '#4B5160' }}>
              Nous collectons les données suivantes lors de votre utilisation de MaPlateformeVTC :
            </p>
            <div className="space-y-3">
              {[
                { title: 'Données d\'inscription', items: ['Nom complet', 'Adresse email', 'Numéro de téléphone (optionnel)', 'Mot de passe (chiffré)', 'Rôle (chauffeur ou professionnel)'] },
                { title: 'Données de profil', items: ['Nom d\'entreprise (optionnel)', 'Photo de profil (optionnelle)'] },
                { title: 'Données d\'annonces', items: ['Informations sur le véhicule', 'Photos du véhicule', 'Prix et conditions de vente/location'] },
                { title: 'Données de navigation', items: ['Adresse IP', 'Type de navigateur', 'Pages visitées', 'Durée des sessions'] },
              ].map(cat => (
                <div key={cat.title} className="p-4 rounded-xl" style={{ backgroundColor: '#F7F7F8', border: '1px solid #ECECEF' }}>
                  <p className="font-medium text-sm mb-2" style={{ color: '#16181D' }}>{cat.title}</p>
                  <ul className="space-y-1">
                    {cat.items.map(item => (
                      <li key={item} className="text-xs flex gap-2" style={{ color: '#8A8F9A' }}>
                        <span style={{ color: '#16181D' }}>•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#16181D' }}>3. Finalités du traitement</h2>
            <ul className="space-y-2 text-sm" style={{ color: '#4B5160' }}>
              <li className="flex gap-2"><span style={{ color: '#16181D' }}>•</span> Gestion de votre compte et authentification</li>
              <li className="flex gap-2"><span style={{ color: '#16181D' }}>•</span> Publication et gestion de vos annonces</li>
              <li className="flex gap-2"><span style={{ color: '#16181D' }}>•</span> Mise en relation entre acheteurs et vendeurs</li>
              <li className="flex gap-2"><span style={{ color: '#16181D' }}>•</span> Envoi de notifications et emails transactionnels</li>
              <li className="flex gap-2"><span style={{ color: '#16181D' }}>•</span> Modération du contenu et sécurité de la plateforme</li>
              <li className="flex gap-2"><span style={{ color: '#16181D' }}>•</span> Amélioration de nos services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#16181D' }}>4. Base légale</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#4B5160' }}>
              Le traitement de vos données est fondé sur l'exécution du contrat (CGU) que vous avez accepté lors de votre inscription, ainsi que sur notre intérêt légitime à assurer la sécurité et le bon fonctionnement de la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#16181D' }}>5. Durée de conservation</h2>
            <ul className="space-y-2 text-sm" style={{ color: '#4B5160' }}>
              <li className="flex gap-2"><span style={{ color: '#16181D' }}>•</span> <strong style={{ color: '#16181D' }}>Données de compte :</strong> Conservées pendant toute la durée d'activité du compte</li>
              <li className="flex gap-2"><span style={{ color: '#16181D' }}>•</span> <strong style={{ color: '#16181D' }}>Annonces supprimées :</strong> 3 ans après la suppression</li>
              <li className="flex gap-2"><span style={{ color: '#16181D' }}>•</span> <strong style={{ color: '#16181D' }}>Messages :</strong> 2 ans après le dernier échange</li>
              <li className="flex gap-2"><span style={{ color: '#16181D' }}>•</span> <strong style={{ color: '#16181D' }}>Données de navigation :</strong> 13 mois maximum</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#16181D' }}>6. Partage des données</h2>
            <p className="text-sm leading-relaxed mb-2" style={{ color: '#4B5160' }}>
              Vos données peuvent être partagées avec :
            </p>
            <ul className="space-y-2 text-sm" style={{ color: '#4B5160' }}>
              <li className="flex gap-2"><span style={{ color: '#16181D' }}>•</span> <strong style={{ color: '#16181D' }}>Netlify</strong> — Hébergement du site</li>
              <li className="flex gap-2"><span style={{ color: '#16181D' }}>•</span> <strong style={{ color: '#16181D' }}>Supabase</strong> — Base de données</li>
              <li className="flex gap-2"><span style={{ color: '#16181D' }}>•</span> <strong style={{ color: '#16181D' }}>Cloudinary</strong> — Stockage des photos</li>
              <li className="flex gap-2"><span style={{ color: '#16181D' }}>•</span> <strong style={{ color: '#16181D' }}>Resend</strong> — Envoi d'emails</li>
            </ul>
            <p className="text-sm mt-3" style={{ color: '#4B5160' }}>
              Nous ne vendons jamais vos données personnelles à des tiers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#16181D' }}>7. Vos droits</h2>
            <p className="text-sm leading-relaxed mb-2" style={{ color: '#4B5160' }}>
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="space-y-2 text-sm" style={{ color: '#4B5160' }}>
              <li className="flex gap-2"><span style={{ color: '#16181D' }}>•</span> <strong style={{ color: '#16181D' }}>Droit d'accès</strong> — Obtenir une copie de vos données</li>
              <li className="flex gap-2"><span style={{ color: '#16181D' }}>•</span> <strong style={{ color: '#16181D' }}>Droit de rectification</strong> — Corriger vos données inexactes</li>
              <li className="flex gap-2"><span style={{ color: '#16181D' }}>•</span> <strong style={{ color: '#16181D' }}>Droit à l'effacement</strong> — Supprimer votre compte et vos données</li>
              <li className="flex gap-2"><span style={{ color: '#16181D' }}>•</span> <strong style={{ color: '#16181D' }}>Droit à la portabilité</strong> — Recevoir vos données dans un format structuré</li>
              <li className="flex gap-2"><span style={{ color: '#16181D' }}>•</span> <strong style={{ color: '#16181D' }}>Droit d'opposition</strong> — Vous opposer au traitement de vos données</li>
            </ul>
            <p className="text-sm mt-3" style={{ color: '#4B5160' }}>
              Pour exercer ces droits, contactez-nous à{' '}
              <a href="mailto:contact@smdrivers.fr" className="hover:underline" style={{ color: '#16181D' }}>contact@smdrivers.fr</a>.
              Vous disposez également du droit de déposer une plainte auprès de la CNIL.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#16181D' }}>8. Sécurité</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#4B5160' }}>
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, modification, divulgation ou destruction. Les mots de passe sont chiffrés avec bcrypt et les communications sont sécurisées par HTTPS.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#16181D' }}>9. Cookies</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#4B5160' }}>
              Nous utilisons uniquement des cookies techniques nécessaires au fonctionnement du site (authentification, session). Aucun cookie publicitaire ou de tracking n'est utilisé.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#16181D' }}>10. Contact</h2>
            <p className="text-sm" style={{ color: '#4B5160' }}>
              Pour toute question relative à notre politique de confidentialité :<br />
              <a href="mailto:contact@smdrivers.fr" className="hover:underline font-medium" style={{ color: '#16181D' }}>contact@smdrivers.fr</a><br />
              SM Drivers — 13 Allée des Effes, 94260 Fresnes – France
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
