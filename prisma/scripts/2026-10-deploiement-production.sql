-- ============================================================
-- MISE A JOUR DE LA BASE DE PRODUCTION (Supabase) - octobre 2026
-- A executer UNE SEULE FOIS dans Supabase > SQL Editor, AVANT le deploiement du code.
-- Uniquement des ajouts : aucune table ni colonne supprimee.
-- Faire une sauvegarde de la base avant.
-- ============================================================

-- 1. Nouveaux types de notification (hors transaction)
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'certification_approved';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'certification_rejected';

-- 2. Structure : si une instruction echoue, tout est annule
BEGIN;
-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('individual', 'professional');

-- CreateEnum
CREATE TYPE "LegalForm" AS ENUM ('micro_entreprise', 'ei', 'eurl', 'sasu', 'sarl', 'sas', 'sa', 'other');

-- CreateEnum
CREATE TYPE "ProActivity" AS ENUM ('driver_independent', 'fleet', 'dealer', 'lessor_loa', 'garage', 'insurer', 'trainer', 'accountant', 'lawyer', 'equipment_supplier');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('unverified', 'pending', 'verified', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('id_card', 'kbis', 'sirene_notice', 'rne_extract', 'vtc_card', 'insurance_certificate', 'vtc_register', 'orias', 'training_approval', 'professional_order', 'other');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateEnum
CREATE TYPE "AiVerdict" AS ENUM ('compliant', 'doubtful', 'non_compliant');

-- CreateEnum
CREATE TYPE "AdminDecision" AS ENUM ('approved', 'rejected');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('standard', 'pro', 'flotte');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('month', 'year');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'expired');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "account_type" "AccountType" NOT NULL DEFAULT 'individual',
ADD COLUMN     "plan_choice_at" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "available_from" DATE,
ADD COLUMN     "deposit_amount" DECIMAL(10,2),
ADD COLUMN     "driver_requirements" VARCHAR(500),
ADD COLUMN     "included_km_per_week" INTEGER,
ADD COLUMN     "insurance_included" BOOLEAN,
ADD COLUMN     "min_rental_weeks" SMALLINT,
ADD COLUMN     "priority_review" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "service_id" UUID,
ALTER COLUMN "listing_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "legal_name" VARCHAR(150) NOT NULL,
    "trade_name" VARCHAR(150),
    "siret" VARCHAR(14),
    "legal_form" "LegalForm",
    "activities" "ProActivity"[],
    "address" VARCHAR(255),
    "postal_code" VARCHAR(10),
    "city" VARCHAR(100),
    "phone" VARCHAR(20),
    "website" VARCHAR(255),
    "description" TEXT,
    "logo_url" TEXT,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'unverified',
    "verified_at" TIMESTAMPTZ,
    "verification_expires_at" TIMESTAMPTZ,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "type" "DocumentType" NOT NULL,
    "storage_key" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMPTZ,
    "extracted_data" JSONB,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purged_at" TIMESTAMPTZ,

    CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "ai_verdict" "AiVerdict",
    "ai_score" SMALLINT,
    "ai_report" JSONB,
    "ai_model" VARCHAR(100),
    "ai_analyzed_at" TIMESTAMPTZ,
    "admin_decision" "AdminDecision",
    "admin_id" UUID,
    "admin_comment" TEXT,
    "decided_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "tier" "PlanTier" NOT NULL DEFAULT 'pro',
    "interval" "BillingInterval" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "trial_ends_at" TIMESTAMPTZ,
    "current_period_end" TIMESTAMPTZ,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "stripe_customer_id" VARCHAR(255),
    "stripe_subscription_id" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_daily_stats" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "listing_id" UUID NOT NULL,
    "day" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "contacts" INTEGER NOT NULL DEFAULT 0,
    "favorites" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "listing_daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "city" VARCHAR(100),
    "listing_type" "ListingType",
    "rent_duration" "RentDuration",
    "fuel_type" "FuelType",
    "query" VARCHAR(100),
    "results_count" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_user_id_key" ON "companies"("user_id");

-- CreateIndex
CREATE INDEX "companies_siret_idx" ON "companies"("siret");

-- CreateIndex
CREATE INDEX "companies_verification_status_idx" ON "companies"("verification_status");

-- CreateIndex
CREATE INDEX "verification_documents_company_id_idx" ON "verification_documents"("company_id");

-- CreateIndex
CREATE INDEX "verification_reviews_company_id_idx" ON "verification_reviews"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_customer_id_key" ON "subscriptions"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "listing_daily_stats_day_idx" ON "listing_daily_stats"("day");

-- CreateIndex
CREATE UNIQUE INDEX "listing_daily_stats_listing_id_day_key" ON "listing_daily_stats"("listing_id", "day");

-- CreateIndex
CREATE INDEX "search_events_created_at_idx" ON "search_events"("created_at");

-- CreateIndex
CREATE INDEX "search_events_city_idx" ON "search_events"("city");

-- CreateIndex
CREATE INDEX "messages_service_id_idx" ON "messages"("service_id");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_reviews" ADD CONSTRAINT "verification_reviews_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_reviews" ADD CONSTRAINT "verification_reviews_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_daily_stats" ADD CONSTRAINT "listing_daily_stats_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Securite Supabase : les nouvelles tables ne sont pas lisibles via l'API publique
--    (le site s'y connecte avec le role proprietaire, non concerne par RLS)
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "listing_daily_stats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "search_events" ENABLE ROW LEVEL SECURITY;

-- 4. Reprise des donnees
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

COMMIT;
