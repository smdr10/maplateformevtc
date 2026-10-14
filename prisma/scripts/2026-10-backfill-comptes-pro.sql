-- A executer UNE fois, apres `npx prisma db push`, sur la base de production.
-- Bascule les comptes "pro" existants vers le nouveau modele (type de compte + fiche societe).

UPDATE users SET account_type = 'professional' WHERE role = 'pro';

INSERT INTO companies (user_id, legal_name, updated_at)
SELECT id, COALESCE(NULLIF(company_name, ''), name), now()
FROM users
WHERE role = 'pro'
  AND id NOT IN (SELECT user_id FROM companies);

-- Annonces deja en ligne sans date d'expiration : 30 jours a partir d'aujourd'hui
UPDATE listings SET expires_at = now() + interval '30 days'
WHERE status = 'active' AND deleted_at IS NULL AND expires_at IS NULL;

-- Nettoyage des annonces fantomes creees par l'ancien contact de service
UPDATE listings SET deleted_at = now()
WHERE title LIKE '[SERVICE] %' AND brand = 'Service' AND deleted_at IS NULL;
