import { Resend } from 'resend'

// Client cree a la demande : le build ne doit pas exiger RESEND_API_KEY
let resendClient: Resend | null = null
function getResend(): Resend {
  resendClient ??= new Resend(process.env.RESEND_API_KEY)
  return resendClient
}
const FROM = 'MaPlateformeVTC <noreply@maplateformevtc.com>'

// Echappe les donnees saisies par les utilisateurs avant de les injecter dans le HTML des emails
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendWelcomeEmail(to: string, name: string) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: 'Bienvenue sur MaPlateformeVTC !',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#F8F8F8;padding:20px;">
        <div style="background:#FFFFFF;border-radius:16px;padding:32px;border:1px solid #E8E8E8;">
          <h1 style="color:#FF5500;font-size:24px;margin:0 0 8px;">MaPlateformeVTC</h1>
          <h2 style="color:#1A1A1A;font-size:20px;margin:0 0 16px;">Bienvenue ${esc(name)} ! 👋</h2>
          <p style="color:#555;line-height:1.6;">Votre compte a bien ete cree. Vous pouvez maintenant :</p>
          <ul style="color:#555;line-height:2;">
            <li>Publier vos annonces de vente, location ou LOA</li>
            <li>Contacter d'autres membres de la communaute</li>
            <li>Trouver des services professionnels VTC</li>
          </ul>
          <a href="https://maplateformevtc.com/annonces" style="display:inline-block;background:#FF5500;color:#FFFFFF;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;margin-top:16px;">
            Voir les annonces
          </a>
          <p style="color:#AAA;font-size:12px;margin-top:24px;">MaPlateformeVTC — La communaute des professionnels VTC</p>
        </div>
      </div>
    `,
  })
}

export async function sendMessageNotificationEmail(to: string, name: string, senderName: string, listingTitle: string) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Nouveau message de ${senderName} sur MaPlateformeVTC`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#F8F8F8;padding:20px;">
        <div style="background:#FFFFFF;border-radius:16px;padding:32px;border:1px solid #E8E8E8;">
          <h1 style="color:#FF5500;font-size:24px;margin:0 0 16px;">MaPlateformeVTC</h1>
          <h2 style="color:#1A1A1A;font-size:18px;margin:0 0 12px;">Nouveau message 💬</h2>
          <p style="color:#555;line-height:1.6;">Bonjour ${esc(name)},</p>
          <p style="color:#555;line-height:1.6;"><strong>${esc(senderName)}</strong> vous a envoye un message concernant votre annonce :</p>
          <div style="background:#FFF5F0;border:1px solid #FFD0B0;border-radius:12px;padding:16px;margin:16px 0;">
            <p style="color:#FF5500;font-weight:bold;margin:0;">${esc(listingTitle)}</p>
          </div>
          <a href="https://maplateformevtc.com/messages" style="display:inline-block;background:#FF5500;color:#FFFFFF;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;">
            Voir le message
          </a>
          <p style="color:#AAA;font-size:12px;margin-top:24px;">MaPlateformeVTC — La communaute des professionnels VTC</p>
        </div>
      </div>
    `,
  })
}

export async function sendListingApprovedEmail(to: string, name: string, listingTitle: string, listingId: string) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: 'Votre annonce a ete approuvee !',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#F8F8F8;padding:20px;">
        <div style="background:#FFFFFF;border-radius:16px;padding:32px;border:1px solid #E8E8E8;">
          <h1 style="color:#FF5500;font-size:24px;margin:0 0 16px;">MaPlateformeVTC</h1>
          <h2 style="color:#1A1A1A;font-size:18px;margin:0 0 12px;">Annonce approuvee ✅</h2>
          <p style="color:#555;line-height:1.6;">Bonjour ${esc(name)},</p>
          <p style="color:#555;line-height:1.6;">Votre annonce a ete validee et est maintenant visible par tous les membres :</p>
          <div style="background:#F0FFF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px;margin:16px 0;">
            <p style="color:#22C55E;font-weight:bold;margin:0;">${esc(listingTitle)}</p>
          </div>
          <a href="https://maplateformevtc.com/annonces/${listingId}" style="display:inline-block;background:#FF5500;color:#FFFFFF;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;">
            Voir mon annonce
          </a>
          <p style="color:#AAA;font-size:12px;margin-top:24px;">MaPlateformeVTC — La communaute des professionnels VTC</p>
        </div>
      </div>
    `,
  })
}

export async function sendListingRejectedEmail(to: string, name: string, listingTitle: string, reason: string) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: 'Votre annonce a ete rejetee',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#F8F8F8;padding:20px;">
        <div style="background:#FFFFFF;border-radius:16px;padding:32px;border:1px solid #E8E8E8;">
          <h1 style="color:#FF5500;font-size:24px;margin:0 0 16px;">MaPlateformeVTC</h1>
          <h2 style="color:#1A1A1A;font-size:18px;margin:0 0 12px;">Annonce rejetee ❌</h2>
          <p style="color:#555;line-height:1.6;">Bonjour ${esc(name)},</p>
          <p style="color:#555;line-height:1.6;">Votre annonce n'a pas pu etre validee :</p>
          <div style="background:#FFF0F0;border:1px solid #FFD0D0;border-radius:12px;padding:16px;margin:16px 0;">
            <p style="color:#EF4444;font-weight:bold;margin:0 0 8px;">${esc(listingTitle)}</p>
            <p style="color:#888;margin:0;font-size:14px;">Motif : ${esc(reason || 'Non conforme aux regles de la plateforme')}</p>
          </div>
          <a href="https://maplateformevtc.com/annonces/new" style="display:inline-block;background:#FF5500;color:#FFFFFF;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;">
            Publier une nouvelle annonce
          </a>
          <p style="color:#AAA;font-size:12px;margin-top:24px;">MaPlateformeVTC — La communaute des professionnels VTC</p>
        </div>
      </div>
    `,
  })
}

export async function sendNewFavoriteEmail(to: string, name: string, listingTitle: string, listingId: string) {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Quelqu'un a ajoute votre annonce en favori !`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#F8F8F8;padding:20px;">
        <div style="background:#FFFFFF;border-radius:16px;padding:32px;border:1px solid #E8E8E8;">
          <h1 style="color:#FF5500;font-size:24px;margin:0 0 16px;">MaPlateformeVTC</h1>
          <h2 style="color:#1A1A1A;font-size:18px;margin:0 0 12px;">Nouveau favori ❤️</h2>
          <p style="color:#555;line-height:1.6;">Bonjour ${esc(name)},</p>
          <p style="color:#555;line-height:1.6;">Un membre a ajoute votre annonce a ses favoris :</p>
          <div style="background:#FFF5F0;border:1px solid #FFD0B0;border-radius:12px;padding:16px;margin:16px 0;">
            <p style="color:#FF5500;font-weight:bold;margin:0;">${esc(listingTitle)}</p>
          </div>
          <a href="https://maplateformevtc.com/annonces/${listingId}" style="display:inline-block;background:#FF5500;color:#FFFFFF;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;">
            Voir mon annonce
          </a>
          <p style="color:#AAA;font-size:12px;margin-top:24px;">MaPlateformeVTC — La communaute des professionnels VTC</p>
        </div>
      </div>
    `,
  })
}