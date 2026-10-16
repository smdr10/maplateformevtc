-- ============================================================
-- SECURITE SUPABASE (recommande, facultatif) - a executer apres le script de deploiement
-- Supabase expose les tables du schema "public" via son API REST (cle "anon").
-- Le site n'utilise pas cette API : il se connecte directement a PostgreSQL avec le role
-- proprietaire, que la RLS ne bloque pas. Activer la RLS sans regle ferme donc l'API publique
-- sans rien changer au fonctionnement du site.
-- ============================================================

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "refresh_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "listings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "listing_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "favorites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "platform_reviews" ENABLE ROW LEVEL SECURITY;
