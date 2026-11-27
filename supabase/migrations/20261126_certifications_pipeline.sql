-- =========================================================================
-- MIGRATION: 20261126_certifications_pipeline.sql
-- Certifications Discovery, Catalog, Job Evidence, and Goal Progress Pipeline
-- =========================================================================

-- 1. CERTIFICATION CATALOG TABLE
CREATE TABLE IF NOT EXISTS public.certification_catalog (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Foundational', 'Associate', 'Professional', 'Specialty')),
  exam_code TEXT,
  category TEXT NOT NULL,
  cost_usd_min INTEGER NOT NULL DEFAULT 0,
  cost_usd_max INTEGER NOT NULL DEFAULT 0,
  cost_currency TEXT NOT NULL DEFAULT 'USD',
  is_free BOOLEAN NOT NULL DEFAULT false,
  study_weeks INTEGER NOT NULL DEFAULT 4,
  validity_years INTEGER,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  official_url TEXT NOT NULL,
  common_employers JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  aliases JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_name TEXT NOT NULL DEFAULT 'Official Catalog',
  source_url TEXT,
  confidence NUMERIC(3, 2) NOT NULL DEFAULT 0.95,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cert_catalog_category ON public.certification_catalog (category);
CREATE INDEX IF NOT EXISTS idx_cert_catalog_level ON public.certification_catalog (level);

-- 2. CERTIFICATION SOURCES TABLE (Pluggable Adapter Tracking)
CREATE TABLE IF NOT EXISTS public.cert_sources (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  adapter_name TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL CHECK (source_type IN ('official_vendor', 'learning_platform', 'credly_badge', 'verified_feed')),
  base_url TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT NOT NULL DEFAULT 'healthy' CHECK (sync_status IN ('healthy', 'degraded', 'error')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. COMPANY BOARDS TABLE (Curated public ATS boards for employer evidence)
CREATE TABLE IF NOT EXISTS public.company_boards (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company TEXT NOT NULL,
  ats TEXT NOT NULL CHECK (ats IN ('greenhouse', 'lever', 'ashby', 'smartrecruiters', 'workable')),
  board_token TEXT NOT NULL,
  base_url TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_company_ats UNIQUE (company, ats)
);

CREATE INDEX IF NOT EXISTS idx_company_boards_company ON public.company_boards (company);

-- 4. CERTIFICATION JOB MENTIONS TABLE (Employer Evidence - 45 day TTL)
CREATE TABLE IF NOT EXISTS public.cert_job_mentions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  cert_key TEXT NOT NULL REFERENCES public.certification_catalog(key) ON DELETE CASCADE,
  company TEXT NOT NULL,
  job_title TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Remote',
  url TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'HELP U Index',
  matches_goal BOOLEAN NOT NULL DEFAULT true,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cert_job_mentions_key ON public.cert_job_mentions (cert_key);
CREATE INDEX IF NOT EXISTS idx_cert_job_mentions_company ON public.cert_job_mentions (company);
CREATE INDEX IF NOT EXISTS idx_cert_job_mentions_last_seen ON public.cert_job_mentions (last_seen);

-- 5. GOAL CERTIFICATIONS TABLE (User candidate progress and readiness)
CREATE TABLE IF NOT EXISTS public.goal_certifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  analysis_id TEXT NOT NULL,
  cert_key TEXT NOT NULL REFERENCES public.certification_catalog(key) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'studying', 'booked', 'earned')),
  target_date DATE,
  earned_date DATE,
  credential_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_user_analysis_cert_v2 UNIQUE (user_id, analysis_id, cert_key)
);

CREATE INDEX IF NOT EXISTS idx_goal_certs_user_v2 ON public.goal_certifications (user_id);
CREATE INDEX IF NOT EXISTS idx_goal_certs_analysis_v2 ON public.goal_certifications (analysis_id);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.certification_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cert_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cert_job_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_certifications ENABLE ROW LEVEL SECURITY;

-- POLICIES: Public read for catalog, sources, company boards, and job mentions
CREATE POLICY "Public read on certification catalog"
  ON public.certification_catalog FOR SELECT USING (true);

CREATE POLICY "Public read on certification sources"
  ON public.cert_sources FOR SELECT USING (true);

CREATE POLICY "Public read on company boards"
  ON public.company_boards FOR SELECT USING (true);

CREATE POLICY "Public read on job mentions evidence"
  ON public.cert_job_mentions FOR SELECT USING (true);

-- POLICIES: User-isolated read and write on goal certifications
CREATE POLICY "Users read own goal certifications"
  ON public.goal_certifications FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = 'usr_demo_101');

CREATE POLICY "Users insert/update own goal certifications"
  ON public.goal_certifications FOR ALL
  USING (auth.uid()::text = user_id OR user_id = 'usr_demo_101');
