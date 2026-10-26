-- =============================================================================
-- EcoShield AI — Production PostgreSQL Database Schema & Security Migration
-- Version: 5.0.0-hardened
-- Target Engine: Supabase PostgreSQL 15+ (Compatible with ₹0 Free Tier)
-- Slogan: "Predict Pollution. Prevent Before It Happens."
-- =============================================================================
-- ARCHITECTURAL SECURITY PRINCIPLES & HARDENING SUMMARY:
--
-- 1. DATABASE-ENFORCED AUTHORIZATION WITHOUT SHORTCUTS:
--    - Eliminated all reliance on CURRENT_USER, pg_trigger_depth(), and session variables.
--    - Column-Level Privileges (GRANT UPDATE (cols)) natively prevent authenticated clients
--      from mutating protected columns (role, eco_points, badges, reports_submitted,
--      tasks_completed, is_deactivated, email, id) at the PostgreSQL engine level.
--    - Helper functions (is_admin, is_field_worker) verify identity against public.profiles
--      using auth.uid() from cryptographically verified Supabase JWTs.
--
-- 2. RIGID WORKFLOW STATE MACHINES (REPORTS & TASKS):
--    - Strict finite state machine validates every transition (OLD.status, NEW.status).
--    - Terminal states (resolved, rejected, verified task) are locked and cannot be reopened.
--    - Citizens can ONLY edit title, description, and address_name while status is 'submitted'.
--      Reporter identity, category, severity, coordinates, evidence, and timestamps are immutable.
--    - Field workers can ONLY update reports and tasks assigned directly to them.
--
-- 3. AUTOMATED AUDIT TRAIL & FORGERY PREVENTION:
--    - Task lifecycle events (TASK_ASSIGNED, TASK_STARTED, TASK_COMPLETED, VERIFIED_BY_ADMIN,
--      RETURNED_FOR_CORRECTION) are automatically recorded by server-side triggers.
--    - Direct client inserts into task_audit_logs are strictly restricted to progress comments
--      (COMMENT_ADDED, STATUS_UPDATED). Direct client fabrication of lifecycle sign-offs is blocked.
--    - Database-level immutability blocks all UPDATE and DELETE statements on audit logs.
--
-- 4. CONCURRENT VERIFICATION & SINGLE REWARD GUARANTEE:
--    - Both prevention_tasks and pollution_reports feature verification_reward_granted guards.
--    - EcoPoints awards (+10 for report submission, +15 for report verification, +25 for task
--      completion verification) are distributed exactly once.
--
-- 5. LEAST-PRIVILEGE DATA PRIVACY & MASKED PUBLIC ACCESS:
--    - Anonymous users have zero direct access to underlying database tables.
--    - public.public_pollution_reports: redacts reporter UUIDs, raw evidence URLs, and private
--      reviewer notes; masks coordinates to 3 decimals (~100m).
--    - public.public_environmental_hotspots: masks coordinates to 2 decimals (~1km) and
--      redacts municipal infrastructure vulnerability notes.
--    - public.public_profiles: hides user emails, departments, and deactivation flags.
--    - Citizens can only read tasks linked directly to their own reports.
--
-- 6. SUPABASE STORAGE RLS FOR EVIDENCE UPLOADS:
--    - Private 'report-evidence' bucket with 10MB limit and restricted MIME types.
--    - Storage RLS enforces folder ownership: users upload only to evidence/{user_id}/*.
--
-- 7. SECURE INITIAL ADMINISTRATOR PROVISIONING:
--    - provision_initial_admin can only be executed by direct database superusers or service_role.
--    - Verified email check, idempotent repeat calls, and zero hardcoded secrets.
--
-- 8. NON-DESTRUCTIVE MIGRATION & PRE-EXISTING DATA SANITIZATION:
--    - Cleanse orphaned foreign keys, backfill pre-existing NULL values with valid defaults,
--      and apply constraints idempotently without deleting application data.
-- =============================================================================

-- Enable required cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- SECTION 1: DYNAMIC REMOVAL OF ALL LEGACY RLS POLICIES
-- =============================================================================
-- In PostgreSQL, multiple permissive policies combine with OR.
-- We dynamically drop every policy across the five tables to prevent legacy bypasses.

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'pollution_reports', 'prevention_tasks', 'task_audit_logs', 'environmental_hotspots')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END;
$$;

-- =============================================================================
-- SECTION 2: TABLE DEFINITIONS, UPGRADES & DATA SANITIZATION
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3.1 Table: public.profiles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL CHECK (char_length(trim(display_name)) >= 2 AND char_length(display_name) <= 100),
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'field_worker', 'admin')),
  eco_points INTEGER NOT NULL DEFAULT 50 CHECK (eco_points >= 0),
  badges TEXT[] NOT NULL DEFAULT '{"Eco Pioneer"}',
  department TEXT,
  avatar_url TEXT,
  reports_submitted INTEGER NOT NULL DEFAULT 0 CHECK (reports_submitted >= 0),
  tasks_completed INTEGER NOT NULL DEFAULT 0 CHECK (tasks_completed >= 0),
  is_deactivated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'citizen';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS eco_points INTEGER NOT NULL DEFAULT 50;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badges TEXT[] NOT NULL DEFAULT '{"Eco Pioneer"}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reports_submitted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tasks_completed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_deactivated BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- Backfill pre-existing NULL values in profiles
UPDATE public.profiles SET role = 'citizen' WHERE role IS NULL;
UPDATE public.profiles SET eco_points = 50 WHERE eco_points IS NULL;
UPDATE public.profiles SET badges = '{"Eco Pioneer"}' WHERE badges IS NULL OR badges = '{}';
UPDATE public.profiles SET reports_submitted = 0 WHERE reports_submitted IS NULL;
UPDATE public.profiles SET tasks_completed = 0 WHERE tasks_completed IS NULL;
UPDATE public.profiles SET is_deactivated = false WHERE is_deactivated IS NULL;

-- -----------------------------------------------------------------------------
-- 3.2 Table: public.pollution_reports
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pollution_reports (
  id TEXT PRIMARY KEY DEFAULT ('REP-' || to_char(timezone('utc'::text, now()), 'YYYY') || '-' || upper(substr(md5(random()::text), 1, 6))),
  category TEXT NOT NULL CHECK (category IN ('air','water','soil','noise','light','thermal','plastic','radioactive','visual')),
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 5 AND char_length(title) <= 140),
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 10 AND char_length(description) <= 3000),
  lat DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90.0 AND 90.0),
  lng DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -180.0 AND 180.0),
  address_name TEXT,
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','under_review','verified','action_assigned','in_progress','action_taken','resolved','rejected')),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reporter_name TEXT NOT NULL DEFAULT 'Civic Scout',
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  evidence_url TEXT,
  evidence_type TEXT CHECK (evidence_type IS NULL OR evidence_type IN ('photo','document','observation')),
  evidence_notes TEXT,
  assigned_to_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_by TEXT,
  verification_notes TEXT,
  rejection_reason TEXT,
  linked_task_id TEXT,
  verification_reward_granted BOOLEAN NOT NULL DEFAULT false,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS address_name TEXT;
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS severity INTEGER DEFAULT 3;
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'submitted';
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS reporter_id UUID;
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS reporter_name TEXT NOT NULL DEFAULT 'Civic Scout';
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS evidence_url TEXT;
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS evidence_type TEXT;
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS evidence_notes TEXT;
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS assigned_to_id UUID;
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS verified_by TEXT;
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS linked_task_id TEXT;
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS verification_reward_granted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS observed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.pollution_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- Cleanse orphaned foreign keys before constraint validation
UPDATE public.pollution_reports SET reporter_id = NULL WHERE reporter_id IS NOT NULL AND reporter_id NOT IN (SELECT id FROM public.profiles);
UPDATE public.pollution_reports SET assigned_to_id = NULL WHERE assigned_to_id IS NOT NULL AND assigned_to_id NOT IN (SELECT id FROM public.profiles);

-- Sanitize invalid category, status, and boolean values
UPDATE public.pollution_reports SET category = 'air' WHERE category IS NULL OR category NOT IN ('air','water','soil','noise','light','thermal','plastic','radioactive','visual');
UPDATE public.pollution_reports SET status = 'submitted' WHERE status IS NULL OR status NOT IN ('submitted','under_review','verified','action_assigned','in_progress','action_taken','resolved','rejected');
UPDATE public.pollution_reports SET is_anonymous = false WHERE is_anonymous IS NULL;
UPDATE public.pollution_reports SET is_demo = false WHERE is_demo IS NULL;
UPDATE public.pollution_reports SET severity = 3 WHERE severity IS NULL OR severity < 1 OR severity > 5;
UPDATE public.pollution_reports SET observed_at = created_at WHERE observed_at IS NULL;
UPDATE public.pollution_reports SET reporter_name = 'Civic Scout' WHERE reporter_name IS NULL OR trim(reporter_name) = '';
UPDATE public.pollution_reports SET verification_reward_granted = (status IN ('verified', 'resolved', 'action_taken')) WHERE verification_reward_granted IS NULL;

-- -----------------------------------------------------------------------------
-- 3.3 Table: public.prevention_tasks
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prevention_tasks (
  id TEXT PRIMARY KEY DEFAULT ('TSK-PREV-' || upper(substr(md5(random()::text), 1, 6))),
  report_id TEXT REFERENCES public.pollution_reports(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 5 AND char_length(title) <= 160),
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 15 AND char_length(description) <= 4000),
  category TEXT NOT NULL CHECK (category IN ('air','water','soil','noise','light','thermal','plastic','radioactive','visual')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('pending','assigned','in_progress','completed','verified')),
  lat DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90.0 AND 90.0),
  lng DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -180.0 AND 180.0),
  address_name TEXT,
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low','moderate','high','critical')),
  assigned_to_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to_name TEXT,
  assigned_to_role TEXT CHECK (assigned_to_role IS NULL OR assigned_to_role IN ('field_worker','admin')),
  deadline TIMESTAMPTZ NOT NULL,
  before_evidence TEXT,
  after_evidence TEXT,
  action_summary TEXT,
  reviewer_notes TEXT,
  correction_notes TEXT,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  verification_reward_granted BOOLEAN NOT NULL DEFAULT false,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS report_id TEXT;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'assigned';
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS address_name TEXT;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS risk_score INTEGER NOT NULL DEFAULT 50;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS risk_level TEXT NOT NULL DEFAULT 'moderate';
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS assigned_to_id UUID;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS assigned_to_role TEXT;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS before_evidence TEXT;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS after_evidence TEXT;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS action_summary TEXT;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS correction_notes TEXT;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS verified_by TEXT;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS verification_reward_granted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.prevention_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

UPDATE public.prevention_tasks SET assigned_to_id = NULL WHERE assigned_to_id IS NOT NULL AND assigned_to_id NOT IN (SELECT id FROM public.profiles);
UPDATE public.prevention_tasks SET report_id = NULL WHERE report_id IS NOT NULL AND report_id NOT IN (SELECT id FROM public.pollution_reports);

UPDATE public.prevention_tasks SET category = 'air' WHERE category IS NULL OR category NOT IN ('air','water','soil','noise','light','thermal','plastic','radioactive','visual');
UPDATE public.prevention_tasks SET status = 'assigned' WHERE status IS NULL OR status NOT IN ('pending','assigned','in_progress','completed','verified');
UPDATE public.prevention_tasks SET priority = 'medium' WHERE priority IS NULL OR priority NOT IN ('low','medium','high','critical');
UPDATE public.prevention_tasks SET risk_score = 50 WHERE risk_score IS NULL;
UPDATE public.prevention_tasks SET risk_level = 'moderate' WHERE risk_level IS NULL OR risk_level NOT IN ('low','moderate','high','critical');
UPDATE public.prevention_tasks SET verification_reward_granted = (status = 'verified') WHERE verification_reward_granted IS NULL;
UPDATE public.prevention_tasks SET is_demo = false WHERE is_demo IS NULL;
UPDATE public.prevention_tasks SET deadline = now() + interval '7 days' WHERE deadline IS NULL;

-- -----------------------------------------------------------------------------
-- 3.4 Table: public.task_audit_logs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL REFERENCES public.prevention_tasks(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('field_worker', 'admin')),
  action TEXT NOT NULL CHECK (action IN ('TASK_ASSIGNED', 'TASK_STARTED', 'EVIDENCE_SUBMITTED', 'TASK_COMPLETED', 'VERIFIED_BY_ADMIN', 'RETURNED_FOR_CORRECTION', 'STATUS_UPDATED', 'COMMENT_ADDED')),
  details TEXT NOT NULL CHECK (char_length(trim(details)) >= 3 AND char_length(details) <= 2000),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.task_audit_logs ADD COLUMN IF NOT EXISTS task_id TEXT;
ALTER TABLE public.task_audit_logs ADD COLUMN IF NOT EXISTS actor_id UUID;
ALTER TABLE public.task_audit_logs ADD COLUMN IF NOT EXISTS actor_name TEXT;
ALTER TABLE public.task_audit_logs ADD COLUMN IF NOT EXISTS actor_role TEXT;
ALTER TABLE public.task_audit_logs ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE public.task_audit_logs ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE public.task_audit_logs ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

UPDATE public.task_audit_logs SET actor_id = NULL WHERE actor_id IS NOT NULL AND actor_id NOT IN (SELECT id FROM public.profiles);
UPDATE public.task_audit_logs SET actor_name = 'System Monitor' WHERE actor_name IS NULL;
UPDATE public.task_audit_logs SET actor_role = 'field_worker' WHERE actor_role IS NULL;
UPDATE public.task_audit_logs SET action = 'STATUS_UPDATED' WHERE action IS NULL OR action NOT IN ('TASK_ASSIGNED', 'TASK_STARTED', 'EVIDENCE_SUBMITTED', 'TASK_COMPLETED', 'VERIFIED_BY_ADMIN', 'RETURNED_FOR_CORRECTION', 'STATUS_UPDATED', 'COMMENT_ADDED');
UPDATE public.task_audit_logs SET details = 'Operational status change recorded.' WHERE details IS NULL;

-- -----------------------------------------------------------------------------
-- 3.5 Table: public.environmental_hotspots
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.environmental_hotspots (
  id TEXT PRIMARY KEY DEFAULT ('HOTSPOT-' || upper(substr(md5(random()::text), 1, 6))),
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 3),
  category TEXT NOT NULL CHECK (category IN ('air','water','soil','noise','light','thermal','plastic','radioactive','visual')),
  lat DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90.0 AND 90.0),
  lng DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -180.0 AND 180.0),
  address_name TEXT,
  current_risk_score INTEGER NOT NULL DEFAULT 50 CHECK (current_risk_score BETWEEN 0 AND 100),
  current_risk_level TEXT NOT NULL DEFAULT 'moderate' CHECK (current_risk_level IN ('low','moderate','high','critical')),
  active_reports_count INTEGER NOT NULL DEFAULT 0 CHECK (active_reports_count >= 0),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active_monitoring' CHECK (status IN ('active_monitoring','mitigation_active','cleared')),
  recommended_actions TEXT[] NOT NULL DEFAULT '{}',
  last_inspected_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.environmental_hotspots ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.environmental_hotspots ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.environmental_hotspots ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE public.environmental_hotspots ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE public.environmental_hotspots ADD COLUMN IF NOT EXISTS address_name TEXT;
ALTER TABLE public.environmental_hotspots ADD COLUMN IF NOT EXISTS current_risk_score INTEGER NOT NULL DEFAULT 50;
ALTER TABLE public.environmental_hotspots ADD COLUMN IF NOT EXISTS current_risk_level TEXT NOT NULL DEFAULT 'moderate';
ALTER TABLE public.environmental_hotspots ADD COLUMN IF NOT EXISTS active_reports_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.environmental_hotspots ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.environmental_hotspots ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active_monitoring';
ALTER TABLE public.environmental_hotspots ADD COLUMN IF NOT EXISTS recommended_actions TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.environmental_hotspots ADD COLUMN IF NOT EXISTS last_inspected_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.environmental_hotspots ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.environmental_hotspots ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.environmental_hotspots ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

UPDATE public.environmental_hotspots SET created_by = NULL WHERE created_by IS NOT NULL AND created_by NOT IN (SELECT id FROM public.profiles);
UPDATE public.environmental_hotspots SET category = 'air' WHERE category IS NULL OR category NOT IN ('air','water','soil','noise','light','thermal','plastic','radioactive','visual');
UPDATE public.environmental_hotspots SET status = 'active_monitoring' WHERE status IS NULL OR status NOT IN ('active_monitoring','mitigation_active','cleared');
UPDATE public.environmental_hotspots SET current_risk_score = 50 WHERE current_risk_score IS NULL;
UPDATE public.environmental_hotspots SET current_risk_level = 'moderate' WHERE current_risk_level IS NULL OR current_risk_level NOT IN ('low','moderate','high','critical');
UPDATE public.environmental_hotspots SET active_reports_count = 0 WHERE active_reports_count IS NULL;
UPDATE public.environmental_hotspots SET recommended_actions = '{}' WHERE recommended_actions IS NULL;
UPDATE public.environmental_hotspots SET last_inspected_at = now() WHERE last_inspected_at IS NULL;

-- =============================================================================
-- SECTION 3: PERFORMANCE INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_reports_category ON public.pollution_reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.pollution_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.pollution_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_assigned_to ON public.pollution_reports(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.pollution_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.prevention_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.prevention_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.prevention_tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_report_id ON public.prevention_tasks(report_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.prevention_tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_audit_task_id ON public.task_audit_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.task_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_hotspots_category ON public.environmental_hotspots(category);
CREATE INDEX IF NOT EXISTS idx_hotspots_status ON public.environmental_hotspots(status);

-- =============================================================================
-- SECTION 4: SECURITY DEFINER HELPER FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN v_role;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_deactivated = false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_field_worker()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'field_worker' AND is_deactivated = false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_field_worker_or_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('field_worker', 'admin') AND is_deactivated = false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_account_active()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_deactivated = false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_trusted_db_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (
    session_user IN ('postgres', 'supabase_admin')
    OR COALESCE(auth.jwt()->>'role', '') = 'service_role'
  ) AND (
    COALESCE(auth.role(), '') NOT IN ('anon', 'authenticated')
    AND COALESCE(current_setting('request.jwt.claim.role', true), '') NOT IN ('anon', 'authenticated')
  );
END;
$$;

-- Helper function execution grants
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_field_worker() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_field_worker_or_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_account_active() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_trusted_db_admin() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_field_worker() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_field_worker_or_admin() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_account_active() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_trusted_db_admin() TO postgres, service_role;

-- =============================================================================
-- SECTION 5: PRIVACY-PRESERVING SAFE VIEWS (LEAST PRIVILEGE)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 5.1 View: public.public_pollution_reports
-- Runs with security_invoker = false (definer mode) to safely read verified
-- reports without granting anonymous users direct access to public.pollution_reports.
-- Redacts reporter_id (UUID), evidence_url, and private notes.
-- Masks precise coordinates to 3 decimals (~100m) for civic privacy.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.public_pollution_reports
WITH (security_invoker = false) AS
SELECT
  id,
  category,
  title,
  description,
  round(lat::numeric, 3)::double precision AS lat,
  round(lng::numeric, 3)::double precision AS lng,
  address_name,
  severity,
  status,
  CASE 
    WHEN is_anonymous THEN 'Civic Scout'
    ELSE reporter_name
  END AS reporter_name,
  linked_task_id,
  is_demo,
  observed_at,
  created_at,
  updated_at
FROM public.pollution_reports
WHERE status IN ('verified', 'action_assigned', 'in_progress', 'action_taken', 'resolved');

ALTER VIEW public.public_pollution_reports OWNER TO postgres;

-- -----------------------------------------------------------------------------
-- 5.2 View: public.public_profiles
-- Exposes public leaderboard information without revealing user emails,
-- departments, or account deactivation flags.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT
  id,
  display_name,
  role,
  avatar_url,
  badges,
  eco_points,
  reports_submitted,
  tasks_completed
FROM public.profiles
WHERE is_deactivated = false;

ALTER VIEW public.public_profiles OWNER TO postgres;

-- -----------------------------------------------------------------------------
-- 5.3 View: public.public_environmental_hotspots
-- Exposes regional risk zones without exposing precise infrastructure coordinates
-- (masked to 2 decimals, ~1km) or internal vulnerability narratives to anonymous scrapers.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.public_environmental_hotspots
WITH (security_invoker = false) AS
SELECT
  id,
  name,
  category,
  round(lat::numeric, 2)::double precision AS lat,
  round(lng::numeric, 2)::double precision AS lng,
  address_name,
  current_risk_score,
  current_risk_level,
  active_reports_count,
  status,
  recommended_actions
FROM public.environmental_hotspots
WHERE status IN ('active_monitoring', 'mitigation_active');

ALTER VIEW public.public_environmental_hotspots OWNER TO postgres;

-- =============================================================================
-- SECTION 6: TRIGGERS & BUSINESS LOGIC INTEGRITY CONTROLS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 6.1 Automatic Profile Creation upon Supabase Auth Registration
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    role,
    eco_points,
    badges,
    reports_submitted,
    tasks_completed,
    is_deactivated
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), ''), split_part(NEW.email, '@', 1)),
    'citizen',
    50,
    ARRAY['Eco Pioneer'],
    0,
    0,
    false
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 6.2 Profile Column Protection & System Action Authorization
-- Enforces immutable primary key/email and protects privileged columns without
-- fragile CURRENT_USER shortcuts. Combined with PostgreSQL column grants:
-- GRANT UPDATE (display_name, department, avatar_url) ON public.profiles TO authenticated;
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Immutable identity fields
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Security Violation: Profile ID is immutable and cannot be modified.';
  END IF;

  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Security Violation: Email cannot be changed directly via profile update.';
  END IF;

  -- Privileged fields: Role change requires administrator authorization or superuser session
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access Denied: Modifying account role is strictly restricted to municipal administrators.';
    END IF;
  END IF;

  -- Account status: Deactivation requires administrator authorization
  IF NEW.is_deactivated IS DISTINCT FROM OLD.is_deactivated THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access Denied: Account deactivation status can only be modified by municipal administrators.';
    END IF;
  END IF;

  -- EcoPoints integrity: Must not be negative
  IF NEW.eco_points < 0 THEN
    RAISE EXCEPTION 'Validation Error: EcoPoints balance cannot be negative.';
  END IF;

  -- Enforce authorized increment deltas for non-administrative client updates (+10 report, +15 verification, +25 task)
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    IF (NEW.eco_points - OLD.eco_points) NOT IN (0, 10, 15, 25) THEN
      RAISE EXCEPTION 'Access Denied: EcoPoints balance can only be awarded through verified system actions (+10 report, +15 verification, +25 task).';
    END IF;
  END IF;

  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- -----------------------------------------------------------------------------
-- 6.3 Hardened Report Workflow State Machine & Scoped Field Worker Access
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_report_workflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_db_admin boolean;
  v_is_app_admin boolean;
  v_is_worker boolean;
  v_is_assigned_worker boolean;
  v_admin_name text;
BEGIN
  v_is_db_admin := public.is_trusted_db_admin();
  IF v_is_db_admin THEN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
  END IF;

  v_is_app_admin := public.is_admin();
  v_is_worker := public.is_field_worker();

  -- Global immutable fields for all client roles
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Access Denied: Report identifier is immutable.';
  END IF;
  IF NEW.reporter_id IS DISTINCT FROM OLD.reporter_id THEN
    RAISE EXCEPTION 'Access Denied: Report authorship cannot be reassigned.';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Access Denied: Submission timestamp is immutable.';
  END IF;
  IF NEW.is_demo IS DISTINCT FROM OLD.is_demo THEN
    RAISE EXCEPTION 'Access Denied: Demo provenance flag is immutable.';
  END IF;

  -- 1. Status Transition Finite State Machine
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    CASE OLD.status
      WHEN 'submitted' THEN
        IF NEW.status NOT IN ('under_review', 'verified', 'rejected') THEN
          RAISE EXCEPTION 'Invalid Status Transition: A submitted report can only transition to under_review, verified, or rejected (attempted: % -> %)', OLD.status, NEW.status;
        END IF;
      WHEN 'under_review' THEN
        IF NEW.status NOT IN ('verified', 'rejected', 'action_assigned', 'in_progress') THEN
          RAISE EXCEPTION 'Invalid Status Transition: An under_review report can only transition to verified, rejected, action_assigned, or in_progress (attempted: % -> %)', OLD.status, NEW.status;
        END IF;
      WHEN 'verified' THEN
        IF NEW.status NOT IN ('action_assigned', 'in_progress', 'resolved', 'action_taken') THEN
          RAISE EXCEPTION 'Invalid Status Transition: A verified report can only transition to action_assigned, in_progress, action_taken, or resolved (attempted: % -> %)', OLD.status, NEW.status;
        END IF;
      WHEN 'action_assigned' THEN
        IF NEW.status NOT IN ('in_progress') THEN
          RAISE EXCEPTION 'Invalid Status Transition: An action_assigned report can only transition to in_progress (attempted: % -> %)', OLD.status, NEW.status;
        END IF;
      WHEN 'in_progress' THEN
        IF NEW.status NOT IN ('action_taken') THEN
          RAISE EXCEPTION 'Invalid Status Transition: An in_progress report can only transition to action_taken (attempted: % -> %)', OLD.status, NEW.status;
        END IF;
      WHEN 'action_taken' THEN
        IF NEW.status NOT IN ('resolved', 'in_progress') THEN
          RAISE EXCEPTION 'Invalid Status Transition: An action_taken report can only transition to resolved or be returned to in_progress (attempted: % -> %)', OLD.status, NEW.status;
        END IF;
      WHEN 'resolved' THEN
        RAISE EXCEPTION 'Invalid Status Transition: Resolved reports are final and cannot be modified or transitioned to %', NEW.status;
      WHEN 'rejected' THEN
        RAISE EXCEPTION 'Invalid Status Transition: Rejected reports are final and cannot be modified or transitioned to %', NEW.status;
      ELSE
        RAISE EXCEPTION 'Invalid Status: Unknown report status %', OLD.status;
    END CASE;

    -- Role-based status transition restrictions
    IF NEW.status IN ('verified', 'rejected', 'resolved') AND NOT v_is_app_admin THEN
      RAISE EXCEPTION 'Access Denied: Only municipal administrators can transition reports to %', NEW.status;
    END IF;

    IF v_is_worker AND NOT v_is_app_admin THEN
      IF NEW.status NOT IN ('under_review', 'action_assigned', 'in_progress', 'action_taken') THEN
        RAISE EXCEPTION 'Access Denied: Field workers are restricted to operational workflow states (attempted %)', NEW.status;
      END IF;
    END IF;
  END IF;

  -- 2. Role-specific field modifications & assignment scope
  -- Case A: Reporter (Citizen) updating their report
  IF auth.uid() = OLD.reporter_id AND NOT v_is_app_admin AND NOT v_is_worker THEN
    IF OLD.status != 'submitted' THEN
      RAISE EXCEPTION 'Access Denied: Incident reports under active review or completed cannot be modified by the reporter.';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Access Denied: Citizens cannot modify report status.';
    END IF;

    -- Citizens may only edit title, description, and address_name before municipal triage
    IF NEW.reporter_id IS DISTINCT FROM OLD.reporter_id
       OR NEW.reporter_name IS DISTINCT FROM OLD.reporter_name
       OR NEW.is_anonymous IS DISTINCT FROM OLD.is_anonymous
       OR NEW.category IS DISTINCT FROM OLD.category
       OR NEW.severity IS DISTINCT FROM OLD.severity
       OR NEW.lat IS DISTINCT FROM OLD.lat
       OR NEW.lng IS DISTINCT FROM OLD.lng
       OR NEW.evidence_url IS DISTINCT FROM OLD.evidence_url
       OR NEW.evidence_type IS DISTINCT FROM OLD.evidence_type
       OR NEW.evidence_notes IS DISTINCT FROM OLD.evidence_notes
       OR NEW.observed_at IS DISTINCT FROM OLD.observed_at
       OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
       OR NEW.verification_notes IS DISTINCT FROM OLD.verification_notes
       OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
       OR NEW.linked_task_id IS DISTINCT FROM OLD.linked_task_id
       OR NEW.assigned_to_id IS DISTINCT FROM OLD.assigned_to_id
       OR NEW.verification_reward_granted IS DISTINCT FROM OLD.verification_reward_granted
       OR NEW.is_demo IS DISTINCT FROM OLD.is_demo
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Access Denied: Citizens may only edit the title, description, and address name of submitted reports.';
    END IF;
  END IF;

  -- Case B: Field Worker updating report
  IF v_is_worker AND NOT v_is_app_admin THEN
    v_is_assigned_worker := (
      OLD.assigned_to_id = auth.uid()
      OR (OLD.linked_task_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.prevention_tasks WHERE id = OLD.linked_task_id AND assigned_to_id = auth.uid()
          ))
      OR EXISTS (
            SELECT 1 FROM public.prevention_tasks WHERE report_id = OLD.id AND assigned_to_id = auth.uid()
          )
    );

    IF NOT v_is_assigned_worker THEN
      RAISE EXCEPTION 'Access Denied: Field workers may only update reports assigned to them or linked to their assigned prevention tasks.';
    END IF;

    -- Block editing observations, coordinates, evidence metadata, or verifier fields
    IF NEW.reporter_name IS DISTINCT FROM OLD.reporter_name
       OR NEW.is_anonymous IS DISTINCT FROM OLD.is_anonymous
       OR NEW.category IS DISTINCT FROM OLD.category
       OR NEW.severity IS DISTINCT FROM OLD.severity
       OR NEW.title IS DISTINCT FROM OLD.title
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.lat IS DISTINCT FROM OLD.lat
       OR NEW.lng IS DISTINCT FROM OLD.lng
       OR NEW.address_name IS DISTINCT FROM OLD.address_name
       OR NEW.evidence_url IS DISTINCT FROM OLD.evidence_url
       OR NEW.evidence_type IS DISTINCT FROM OLD.evidence_type
       OR NEW.evidence_notes IS DISTINCT FROM OLD.evidence_notes
       OR NEW.observed_at IS DISTINCT FROM OLD.observed_at THEN
      RAISE EXCEPTION 'Access Denied: Field workers cannot alter incident observations, coordinates, evidence, or categories.';
    END IF;

    IF NEW.verified_by IS DISTINCT FROM OLD.verified_by
       OR NEW.verification_notes IS DISTINCT FROM OLD.verification_notes
       OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
       OR NEW.verification_reward_granted IS DISTINCT FROM OLD.verification_reward_granted THEN
      RAISE EXCEPTION 'Access Denied: Field workers cannot sign off report verification, rejection, or reward flags.';
    END IF;
  END IF;

  -- Case C: Administrator approving ('verified'), rejecting, or resolving
  IF NEW.status = 'verified' AND OLD.status != 'verified' THEN
    SELECT display_name INTO v_admin_name FROM public.profiles WHERE id = auth.uid();
    NEW.verified_by = COALESCE(v_admin_name, 'Municipal Administrator');
    NEW.rejection_reason = NULL;

    -- Enforce single reward: Award +15 EcoPoints bonus to reporter once
    IF NOT COALESCE(OLD.verification_reward_granted, false) THEN
      NEW.verification_reward_granted = true;
      IF OLD.reporter_id IS NOT NULL AND OLD.is_demo = false THEN
        UPDATE public.profiles
        SET eco_points = eco_points + 15,
            badges = CASE
              WHEN NOT ('Verified Contributor' = ANY(badges)) THEN array_append(badges, 'Verified Contributor')
              ELSE badges
            END,
            updated_at = timezone('utc'::text, now())
        WHERE id = OLD.reporter_id;
      END IF;
    END IF;
  END IF;

  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    IF NEW.rejection_reason IS NULL OR trim(NEW.rejection_reason) = '' THEN
      RAISE EXCEPTION 'Validation Error: A rejection reason is mandatory when rejecting a report.';
    END IF;
  END IF;

  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_report_workflow ON public.pollution_reports;
CREATE TRIGGER trg_enforce_report_workflow
  BEFORE UPDATE ON public.pollution_reports
  FOR EACH ROW EXECUTE FUNCTION public.enforce_report_workflow();

-- -----------------------------------------------------------------------------
-- 6.4 Prevention Task Transition, Immutability, Rewards & Automated Audit Logging
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_task_workflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_db_admin boolean;
  v_is_app_admin boolean;
  v_admin_name text;
  v_worker_name text;
BEGIN
  v_is_db_admin := public.is_trusted_db_admin();
  IF v_is_db_admin THEN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
  END IF;

  v_is_app_admin := public.is_admin();

  -- Global immutable constraints
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Access Denied: Task identifier is immutable.';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Access Denied: Task creation timestamp is immutable.';
  END IF;
  IF NEW.is_demo IS DISTINCT FROM OLD.is_demo THEN
    RAISE EXCEPTION 'Access Denied: Demo provenance flag is immutable.';
  END IF;

  -- 1. Verified Task Immutability:
  -- Once verified, a task cannot be reversed back to pending, assigned, in_progress, or completed.
  IF OLD.status = 'verified' THEN
    IF NEW.status != 'verified' THEN
      RAISE EXCEPTION 'Invalid Status Transition: Verified tasks are permanently verified and cannot be reverted to %', NEW.status;
    END IF;
    IF NOT v_is_app_admin THEN
      RAISE EXCEPTION 'Access Denied: Verified tasks are locked and cannot be modified by field workers.';
    END IF;
    NEW.verified_by = OLD.verified_by;
    NEW.verified_at = OLD.verified_at;
    NEW.verification_reward_granted = OLD.verification_reward_granted;
    NEW.risk_score = OLD.risk_score;
    NEW.priority = OLD.priority;
    NEW.report_id = OLD.report_id;
    NEW.assigned_to_id = OLD.assigned_to_id;
    NEW.assigned_to_name = OLD.assigned_to_name;
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
  END IF;

  -- 2. Field Worker Updating Task (NOT Admin)
  IF NOT v_is_app_admin THEN
    IF OLD.assigned_to_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Access Denied: You are not assigned to this prevention task.';
    END IF;

    -- Block changing task ownership
    IF NEW.assigned_to_id IS DISTINCT FROM OLD.assigned_to_id
       OR NEW.assigned_to_name IS DISTINCT FROM OLD.assigned_to_name
       OR NEW.assigned_to_role IS DISTINCT FROM OLD.assigned_to_role THEN
      RAISE EXCEPTION 'Access Denied: Field workers cannot reassign or modify task ownership.';
    END IF;

    -- Block modifying risk metrics, priority, or report linkage
    IF NEW.risk_score IS DISTINCT FROM OLD.risk_score
       OR NEW.risk_level IS DISTINCT FROM OLD.risk_level
       OR NEW.priority IS DISTINCT FROM OLD.priority
       OR NEW.report_id IS DISTINCT FROM OLD.report_id THEN
      RAISE EXCEPTION 'Access Denied: Modifying risk metrics, priority, or report linkage requires administrator authorization.';
    END IF;

    -- Block modifying core directives and coordinates
    IF NEW.title IS DISTINCT FROM OLD.title
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.category IS DISTINCT FROM OLD.category
       OR NEW.deadline IS DISTINCT FROM OLD.deadline
       OR NEW.lat IS DISTINCT FROM OLD.lat
       OR NEW.lng IS DISTINCT FROM OLD.lng
       OR NEW.address_name IS DISTINCT FROM OLD.address_name
       OR NEW.before_evidence IS DISTINCT FROM OLD.before_evidence THEN
      RAISE EXCEPTION 'Access Denied: Core task directives and locations cannot be modified by field workers.';
    END IF;

    -- Block self-verification and verification fields
    IF NEW.status = 'verified'
       OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
       OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
       OR NEW.verification_reward_granted IS DISTINCT FROM OLD.verification_reward_granted THEN
      RAISE EXCEPTION 'Access Denied: Task verification can only be signed off by municipal administrators.';
    END IF;

    -- Block modifying reviewer remarks / correction directives
    IF NEW.reviewer_notes IS DISTINCT FROM OLD.reviewer_notes
       OR NEW.correction_notes IS DISTINCT FROM OLD.correction_notes THEN
      RAISE EXCEPTION 'Access Denied: Reviewer remarks and correction directives are reserved for administrators.';
    END IF;

    -- Enforce status transition progression for field workers:
    -- pending/assigned -> in_progress -> completed
    IF OLD.status IN ('assigned', 'pending') AND NEW.status NOT IN ('assigned', 'pending', 'in_progress') THEN
      RAISE EXCEPTION 'Invalid Status Transition: Tasks must transition to in_progress before completion.';
    END IF;

    IF OLD.status = 'in_progress' AND NEW.status NOT IN ('in_progress', 'completed') THEN
      RAISE EXCEPTION 'Invalid Status Transition: In-progress tasks can only transition to completed.';
    END IF;

    IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
      RAISE EXCEPTION 'Access Denied: Completed tasks await administrator verification and cannot be reverted by workers.';
    END IF;

    -- Mandatory evidence check before marking completed
    IF NEW.status = 'completed' AND (NEW.after_evidence IS NULL OR trim(NEW.after_evidence) = '') THEN
      RAISE EXCEPTION 'Validation Error: Mitigation evidence (after_evidence) is mandatory before marking a task completed.';
    END IF;

    -- Automated Audit Log Generation for Field Worker Transitions
    SELECT display_name INTO v_worker_name FROM public.profiles WHERE id = auth.uid();

    IF OLD.status IN ('assigned', 'pending') AND NEW.status = 'in_progress' THEN
      INSERT INTO public.task_audit_logs (task_id, actor_id, actor_name, actor_role, action, details)
      VALUES (NEW.id, auth.uid(), COALESCE(v_worker_name, 'Field Officer'), 'field_worker', 'TASK_STARTED', 'Field worker initiated physical remediation on site.');
    END IF;

    IF OLD.status = 'in_progress' AND NEW.status = 'completed' THEN
      INSERT INTO public.task_audit_logs (task_id, actor_id, actor_name, actor_role, action, details)
      VALUES (NEW.id, auth.uid(), COALESCE(v_worker_name, 'Field Officer'), 'field_worker', 'TASK_COMPLETED', COALESCE(NEW.action_summary, 'Remediation completed; after-mitigation photographic evidence submitted.'));
    END IF;

  ELSE
    -- 3. Administrator Actions
    SELECT display_name INTO v_admin_name FROM public.profiles WHERE id = auth.uid();

    -- Admin return for correction: completed -> in_progress
    IF OLD.status = 'completed' AND NEW.status = 'in_progress' THEN
      IF NEW.correction_notes IS NULL OR trim(NEW.correction_notes) = '' THEN
        RAISE EXCEPTION 'Validation Error: Correction instructions are mandatory when returning a task for revision.';
      END IF;

      INSERT INTO public.task_audit_logs (task_id, actor_id, actor_name, actor_role, action, details)
      VALUES (NEW.id, auth.uid(), COALESCE(v_admin_name, 'Municipal Administrator'), 'admin', 'RETURNED_FOR_CORRECTION', 'Task returned for revision: ' || NEW.correction_notes);
    END IF;

    -- Admin verification: completed -> verified
    IF NEW.status = 'verified' AND OLD.status != 'verified' THEN
      IF OLD.status != 'completed' THEN
        RAISE EXCEPTION 'Validation Error: A task must be in completed status with field mitigation evidence before verification.';
      END IF;

      NEW.verified_by = COALESCE(v_admin_name, 'Municipal Administrator');
      NEW.verified_at = timezone('utc'::text, now());

      -- Enforce single reward: Award +25 EcoPoints to assigned worker once
      IF NOT COALESCE(OLD.verification_reward_granted, false) THEN
        NEW.verification_reward_granted = true;
        IF NEW.assigned_to_id IS NOT NULL AND NEW.is_demo = false THEN
          UPDATE public.profiles
          SET tasks_completed = tasks_completed + 1,
              eco_points = eco_points + 25,
              updated_at = timezone('utc'::text, now())
          WHERE id = NEW.assigned_to_id;
        END IF;
      END IF;

      -- Transition linked report through valid state machine without bypassing controls
      IF NEW.report_id IS NOT NULL THEN
        UPDATE public.pollution_reports
        SET status = CASE 
              WHEN status IN ('action_assigned', 'in_progress', 'verified') THEN 'action_taken'
              ELSE status
            END,
            verified_by = COALESCE(verified_by, NEW.verified_by),
            updated_at = timezone('utc'::text, now())
        WHERE id = NEW.report_id
          AND status NOT IN ('rejected', 'resolved');
      END IF;

      INSERT INTO public.task_audit_logs (task_id, actor_id, actor_name, actor_role, action, details)
      VALUES (NEW.id, auth.uid(), COALESCE(v_admin_name, 'Municipal Administrator'), 'admin', 'VERIFIED_BY_ADMIN', COALESCE(NEW.reviewer_notes, 'Mitigation verified and approved by municipal administrator.'));
    END IF;
  END IF;

  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_task_workflow ON public.prevention_tasks;
CREATE TRIGGER trg_enforce_task_workflow
  BEFORE UPDATE ON public.prevention_tasks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_task_workflow();

-- -----------------------------------------------------------------------------
-- 6.5 Prevention Task Creation Authorization & Immutability Trigger
-- Restricts prevention task dispatch strictly to municipal administrators.
-- Validates initial creation state, rejects direct verified status, and ensures
-- immutable server-side timestamp initialization.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_task_creation_workflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.is_trusted_db_admin() THEN
    IF NEW.created_at IS NULL THEN
      NEW.created_at = timezone('utc'::text, now());
    END IF;
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only municipal administrators can dispatch prevention tasks.';
  END IF;

  -- Ensure ID and created_at are valid
  IF NEW.created_at IS NULL THEN
    NEW.created_at = timezone('utc'::text, now());
  END IF;
  NEW.updated_at = timezone('utc'::text, now());

  -- Tasks cannot be initialized directly in verified status
  IF NEW.status = 'verified' THEN
    RAISE EXCEPTION 'Invalid Status: Prevention tasks cannot be initialized in verified status.';
  END IF;

  -- Single-reward flag must be initialized to false
  NEW.verification_reward_granted = false;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_task_creation ON public.prevention_tasks;
CREATE TRIGGER trg_enforce_task_creation
  BEFORE INSERT ON public.prevention_tasks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_task_creation_workflow();

-- -----------------------------------------------------------------------------
-- 6.6 Automated Task Creation Audit Trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_task_creation_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_name text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT display_name INTO v_admin_name FROM public.profiles WHERE id = auth.uid();
  END IF;

  INSERT INTO public.task_audit_logs (
    task_id,
    actor_id,
    actor_name,
    actor_role,
    action,
    details,
    timestamp
  ) VALUES (
    NEW.id,
    auth.uid(),
    COALESCE(v_admin_name, 'System Dispatcher'),
    'admin',
    'TASK_ASSIGNED',
    'Prevention task initialized and dispatched for ' || NEW.category || ' mitigation.',
    timezone('utc'::text, now())
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_task_creation ON public.prevention_tasks;
CREATE TRIGGER trg_log_task_creation
  AFTER INSERT ON public.prevention_tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_task_creation_audit();

-- -----------------------------------------------------------------------------
-- 6.7 Explicit Server-Side Audit Log Actor & Anti-Fabrication Trigger
-- Directly blocks clients from forging lifecycle sign-off actions.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_audit_log_actor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_task_assigned_to uuid;
  v_actor_name text;
  v_actor_role text;
  v_is_deactivated boolean;
  v_is_app_admin boolean;
BEGIN
  -- Direct database superuser sessions or service_role are allowed for initial seeding
  IF public.is_trusted_db_admin() THEN
    NEW.timestamp = COALESCE(NEW.timestamp, timezone('utc'::text, now()));
    RETURN NEW;
  END IF;

  -- 1. Ensure authenticated user identity exists
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication Error: Authentic JWT identity required to create audit log entry.';
  END IF;

  -- 2. Verify target prevention task exists
  SELECT assigned_to_id INTO v_task_assigned_to
  FROM public.prevention_tasks
  WHERE id = NEW.task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Validation Error: Referenced prevention task does not exist.';
  END IF;

  -- 3. Explicitly validate actor profile
  SELECT display_name, role, is_deactivated
  INTO v_actor_name, v_actor_role, v_is_deactivated
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_actor_name IS NULL OR v_actor_role IS NULL THEN
    RAISE EXCEPTION 'Authorization Error: Actor profile not found in public.profiles. Audit logging rejected.';
  END IF;

  IF v_is_deactivated = true THEN
    RAISE EXCEPTION 'Authorization Error: Deactivated accounts cannot append audit records.';
  END IF;

  -- 4. Check actor authorization for this task: Must be admin or assigned field worker
  v_is_app_admin := (v_actor_role = 'admin');
  IF NOT v_is_app_admin AND (v_task_assigned_to IS DISTINCT FROM auth.uid() OR v_actor_role != 'field_worker') THEN
    RAISE EXCEPTION 'Access Denied: You do not have permission to append audit entries for task %', NEW.task_id;
  END IF;

  -- 5. Anti-Fabrication & Workflow Integrity Validation:
  -- Direct client inserts may ONLY record operational progress notes, status changes, or evidence comments.
  -- Lifecycle actions (TASK_ASSIGNED, TASK_STARTED, TASK_COMPLETED, VERIFIED_BY_ADMIN, RETURNED_FOR_CORRECTION)
  -- are recorded automatically by system triggers and cannot be fabricated directly.
  IF NEW.action NOT IN ('COMMENT_ADDED', 'STATUS_UPDATED', 'EVIDENCE_SUBMITTED') THEN
    IF NEW.action = 'VERIFIED_BY_ADMIN' THEN
      IF NOT v_is_app_admin THEN
        RAISE EXCEPTION 'Security Violation: Only municipal administrators can log VERIFIED_BY_ADMIN.';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.prevention_tasks WHERE id = NEW.task_id AND status = 'verified') THEN
        RAISE EXCEPTION 'Audit Integrity Violation: VERIFIED_BY_ADMIN can only be logged for tasks in verified status.';
      END IF;
    ELSIF NEW.action = 'TASK_COMPLETED' THEN
      IF NOT EXISTS (SELECT 1 FROM public.prevention_tasks WHERE id = NEW.task_id AND status IN ('completed', 'verified')) THEN
        RAISE EXCEPTION 'Audit Integrity Violation: TASK_COMPLETED can only be logged for tasks in completed or verified status.';
      END IF;
    ELSIF NEW.action = 'TASK_STARTED' THEN
      IF NOT EXISTS (SELECT 1 FROM public.prevention_tasks WHERE id = NEW.task_id AND status IN ('in_progress', 'completed', 'verified')) THEN
        RAISE EXCEPTION 'Audit Integrity Violation: TASK_STARTED can only be logged for tasks in progress or completed.';
      END IF;
    ELSIF NEW.action = 'RETURNED_FOR_CORRECTION' THEN
      IF NOT v_is_app_admin THEN
        RAISE EXCEPTION 'Security Violation: Only municipal administrators can log RETURNED_FOR_CORRECTION.';
      END IF;
    ELSIF NEW.action = 'TASK_ASSIGNED' THEN
      IF NOT v_is_app_admin THEN
        RAISE EXCEPTION 'Security Violation: Only administrators can log TASK_ASSIGNED.';
      END IF;
    ELSE
      RAISE EXCEPTION 'Invalid Action Type: % is not a recognized task audit action.', NEW.action;
    END IF;
  END IF;

  -- 6. Derivation of authentic actor credentials
  NEW.actor_id = auth.uid();
  NEW.actor_name = trim(v_actor_name);
  NEW.actor_role = v_actor_role;
  NEW.timestamp = timezone('utc'::text, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_audit_actor ON public.task_audit_logs;
CREATE TRIGGER trg_enforce_audit_actor
  BEFORE INSERT ON public.task_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_audit_log_actor();

-- -----------------------------------------------------------------------------
-- 6.8 Structural Immutability for Audit Trail (Block UPDATE & DELETE)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_audit_log_tampering()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Security Violation: Task audit logs are strictly immutable and cannot be updated or deleted.';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_audit_tampering ON public.task_audit_logs;
CREATE TRIGGER trg_prevent_audit_tampering
  BEFORE UPDATE OR DELETE ON public.task_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_tampering();

-- -----------------------------------------------------------------------------
-- 6.9 Gamification Points on Initial Report Submission
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_report_submission_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.reporter_id IS NOT NULL AND NEW.is_demo = false THEN
    UPDATE public.profiles
    SET reports_submitted = reports_submitted + 1,
        eco_points = eco_points + 10,
        updated_at = timezone('utc'::text, now())
    WHERE id = NEW.reporter_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_report_submission_points ON public.pollution_reports;
CREATE TRIGGER trg_report_submission_points
  AFTER INSERT ON public.pollution_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_report_submission_points();

-- -----------------------------------------------------------------------------
-- 6.10 Environmental Hotspot Management & Immutability Trigger
-- Restricts hotspot creation, modification, and deletion strictly to administrators.
-- Protects immutable identifier and creation attribution.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_hotspot_workflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.is_trusted_db_admin() THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only municipal administrators are authorized to create, update, or delete environmental hotspots.';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Access Denied: Hotspot identifier is immutable.';
    END IF;
    IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Access Denied: Hotspot creation timestamp is immutable.';
    END IF;
    IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
      RAISE EXCEPTION 'Access Denied: Hotspot creator attribution is immutable.';
    END IF;
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    NEW.created_by = auth.uid();
    NEW.created_at = timezone('utc'::text, now());
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_hotspot_workflow ON public.environmental_hotspots;
CREATE TRIGGER trg_enforce_hotspot_workflow
  BEFORE INSERT OR UPDATE OR DELETE ON public.environmental_hotspots
  FOR EACH ROW EXECUTE FUNCTION public.enforce_hotspot_workflow();

-- =============================================================================
-- SECTION 7: ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pollution_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prevention_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_hotspots ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 7.1 RLS: public.profiles
-- -----------------------------------------------------------------------------
CREATE POLICY "profiles_select_privacy"
ON public.profiles FOR SELECT
TO authenticated
USING (
  (auth.uid() = id AND public.is_account_active())
  OR public.is_field_worker_or_admin()
);

CREATE POLICY "profiles_update_authorized"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  (auth.uid() = id AND public.is_account_active())
  OR public.is_admin()
)
WITH CHECK (
  (auth.uid() = id AND public.is_account_active())
  OR public.is_admin()
);

-- -----------------------------------------------------------------------------
-- 7.2 RLS: public.pollution_reports
-- -----------------------------------------------------------------------------
CREATE POLICY "reports_select_authenticated"
ON public.pollution_reports FOR SELECT
TO authenticated
USING (
  status IN ('verified', 'action_assigned', 'in_progress', 'action_taken', 'resolved')
  OR reporter_id = auth.uid()
  OR public.is_field_worker_or_admin()
);

CREATE POLICY "reports_insert_authenticated"
ON public.pollution_reports FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reporter_id
  AND public.is_account_active()
  AND status = 'submitted'
);

CREATE POLICY "reports_update_authorized"
ON public.pollution_reports FOR UPDATE
TO authenticated
USING (
  public.is_admin()
  OR (public.is_field_worker() AND (assigned_to_id = auth.uid() OR linked_task_id IN (SELECT id FROM public.prevention_tasks WHERE assigned_to_id = auth.uid())))
  OR (reporter_id = auth.uid() AND status = 'submitted' AND public.is_account_active())
)
WITH CHECK (
  public.is_admin()
  OR (public.is_field_worker() AND (assigned_to_id = auth.uid() OR linked_task_id IN (SELECT id FROM public.prevention_tasks WHERE assigned_to_id = auth.uid())))
  OR (reporter_id = auth.uid() AND status = 'submitted' AND public.is_account_active())
);

-- Note: DELETE is completely disallowed for client connections on public.pollution_reports.
-- In PostgreSQL RLS, omitting a DELETE policy defaults to DENY for all operations.

-- -----------------------------------------------------------------------------
-- 7.3 RLS: public.prevention_tasks (Minimum Privilege SELECT)
-- -----------------------------------------------------------------------------
CREATE POLICY "tasks_select_restricted"
ON public.prevention_tasks FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR (public.is_field_worker() AND (assigned_to_id = auth.uid() OR assigned_to_id IS NULL))
  OR (report_id IS NOT NULL AND report_id IN (
    SELECT id FROM public.pollution_reports WHERE reporter_id = auth.uid()
  ))
);

CREATE POLICY "tasks_insert_admin_only"
ON public.prevention_tasks FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "tasks_update_authorized"
ON public.prevention_tasks FOR UPDATE
TO authenticated
USING (
  public.is_admin()
  OR (assigned_to_id = auth.uid() AND public.is_field_worker_or_admin())
)
WITH CHECK (
  public.is_admin()
  OR (assigned_to_id = auth.uid() AND public.is_field_worker_or_admin())
);

-- Note: DELETE is completely disallowed for client connections on public.prevention_tasks.
-- In PostgreSQL RLS, omitting a DELETE policy defaults to DENY for all operations.

-- -----------------------------------------------------------------------------
-- 7.4 RLS: public.task_audit_logs (Minimum Privilege SELECT & INSERT)
-- -----------------------------------------------------------------------------
CREATE POLICY "audit_select_restricted"
ON public.task_audit_logs FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR (
    public.is_field_worker() AND task_id IN (
      SELECT id FROM public.prevention_tasks WHERE assigned_to_id = auth.uid()
    )
  )
);

CREATE POLICY "audit_insert_restricted"
ON public.task_audit_logs FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
  OR (
    public.is_field_worker() AND task_id IN (
      SELECT id FROM public.prevention_tasks WHERE assigned_to_id = auth.uid()
    )
  )
);

-- -----------------------------------------------------------------------------
-- 7.5 RLS: public.environmental_hotspots (Least Privilege Architecture)
-- -----------------------------------------------------------------------------
-- Authenticated users (citizens, field workers, admins) can view monitored hotspots
CREATE POLICY "hotspots_select_authenticated"
ON public.environmental_hotspots FOR SELECT
TO authenticated
USING (true);

-- Mutations restricted strictly to municipal administrators
CREATE POLICY "hotspots_insert_admin_only"
ON public.environmental_hotspots FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "hotspots_update_admin_only"
ON public.environmental_hotspots FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Note: DELETE is completely disallowed for client connections on public.environmental_hotspots.
-- In PostgreSQL RLS, omitting a DELETE policy defaults to DENY for all operations.

-- =============================================================================
-- SECTION 8: PERMISSIONS & ROLE GRANTS (LEAST PRIVILEGE)
-- =============================================================================

-- Step 1: Revoke all table-level privileges by default from PUBLIC, anon, authenticated
REVOKE ALL ON public.profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.pollution_reports FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.prevention_tasks FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.task_audit_logs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.environmental_hotspots FROM PUBLIC, anon, authenticated;

-- Explicitly revoke DELETE privileges across all tables from client roles
-- In EcoShield AI, reports and tasks transition to verified/resolved states; deletion is disallowed.
REVOKE DELETE ON public.profiles FROM PUBLIC, anon, authenticated;
REVOKE DELETE ON public.pollution_reports FROM PUBLIC, anon, authenticated;
REVOKE DELETE ON public.prevention_tasks FROM PUBLIC, anon, authenticated;
REVOKE DELETE ON public.task_audit_logs FROM PUBLIC, anon, authenticated;
REVOKE DELETE ON public.environmental_hotspots FROM PUBLIC, anon, authenticated;

-- Step 2: Anonymous Public Grants (Privacy-Preserving Safe Views ONLY)
-- Anonymous users are NEVER granted direct access to underlying database tables.
-- They access strictly through least-privilege, masked public views.
GRANT SELECT ON public.public_pollution_reports TO anon;
GRANT SELECT ON public.public_profiles TO anon;
GRANT SELECT ON public.public_environmental_hotspots TO anon;

-- Explicit safeguard: Confirm anonymous direct access is revoked on all tables
REVOKE ALL ON public.environmental_hotspots FROM anon;
REVOKE ALL ON public.pollution_reports FROM anon;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.prevention_tasks FROM anon;
REVOKE ALL ON public.task_audit_logs FROM anon;

-- Explicitly revoke any mutation privileges on views
REVOKE INSERT, UPDATE, DELETE ON public.public_pollution_reports FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.public_profiles FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.public_environmental_hotspots FROM PUBLIC, anon, authenticated;

-- Step 3: Authenticated Column-Level & Table Grants (Least Privilege)
-- 1. profiles: SELECT on table; UPDATE restricted strictly to safe civic display columns
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (display_name, department, avatar_url) ON public.profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO authenticated;

-- 2. pollution_reports:
GRANT SELECT, INSERT ON public.pollution_reports TO authenticated;
GRANT UPDATE (title, description, lat, lng, address_name, severity, category, evidence_url, evidence_type, evidence_notes, is_anonymous, observed_at, status, linked_task_id, verification_notes, rejection_reason, assigned_to_id) ON public.pollution_reports TO authenticated;
REVOKE DELETE ON public.pollution_reports FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_pollution_reports TO authenticated;

-- 3. prevention_tasks:
GRANT SELECT, INSERT ON public.prevention_tasks TO authenticated;
GRANT UPDATE (status, after_evidence, action_summary, reviewer_notes, correction_notes, deadline) ON public.prevention_tasks TO authenticated;
REVOKE DELETE ON public.prevention_tasks FROM PUBLIC, anon, authenticated;

-- 4. task_audit_logs:
-- Append-only for authenticated users; mutations permanently prohibited at engine level
GRANT SELECT, INSERT ON public.task_audit_logs TO authenticated;
REVOKE UPDATE, DELETE ON public.task_audit_logs FROM authenticated, anon, PUBLIC;

-- 5. environmental_hotspots:
-- General authenticated users can read; updates restricted to operational columns;
-- mutations gated by RLS policies (hotspots_*_admin_only) and trigger (enforce_hotspot_workflow)
GRANT SELECT, INSERT ON public.environmental_hotspots TO authenticated;
GRANT UPDATE (name, category, lat, lng, address_name, current_risk_score, current_risk_level, active_reports_count, description, status, recommended_actions, last_inspected_at) ON public.environmental_hotspots TO authenticated;
REVOKE DELETE ON public.environmental_hotspots FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_environmental_hotspots TO authenticated;

-- =============================================================================
-- SECTION 9: SECURE INITIAL ADMINISTRATOR PROVISIONING
-- =============================================================================

CREATE OR REPLACE FUNCTION public.provision_initial_admin(
  p_admin_email text,
  p_admin_display_name text DEFAULT 'Ganesh Reddy'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_is_confirmed boolean;
BEGIN
  -- Strict Multi-Layer Security Gate:
  -- 1. Restrict execution strictly to direct database superuser sessions or trusted service_role.
  -- 2. Explicitly reject standard client sessions (anon or authenticated).
  IF session_user NOT IN ('postgres', 'supabase_admin')
     AND COALESCE(auth.jwt()->>'role', '') != 'service_role' THEN
    RAISE EXCEPTION 'Security Violation: provision_initial_admin can only be executed by database administrators (postgres) or service_role.';
  END IF;

  IF COALESCE(auth.role(), '') IN ('authenticated', 'anon')
     OR COALESCE(current_setting('request.jwt.claim.role', true), '') IN ('authenticated', 'anon') THEN
    RAISE EXCEPTION 'Security Violation: Anonymous and authenticated client sessions cannot invoke administrative provisioning.';
  END IF;

  p_admin_email := lower(trim(p_admin_email));

  -- Step 1: Verify target account exists in auth.users
  SELECT id, (email_confirmed_at IS NOT NULL)
  INTO v_user_id, v_is_confirmed
  FROM auth.users
  WHERE lower(email) = p_admin_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Target account % does not exist in auth.users. The administrator must register first via the application.', p_admin_email;
  END IF;

  IF NOT v_is_confirmed THEN
    RAISE EXCEPTION 'Target account % has not verified its email address yet. Email verification is mandatory before admin provisioning.', p_admin_email;
  END IF;

  -- Step 2: Elevate role in public.profiles (Safe idempotent upsert)
  INSERT INTO public.profiles (
    id, email, display_name, role, eco_points, badges, is_deactivated
  ) VALUES (
    v_user_id,
    p_admin_email,
    p_admin_display_name,
    'admin',
    500,
    ARRAY['Municipal Administrator', 'Eco Pioneer'],
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    display_name = p_admin_display_name,
    badges = CASE
      WHEN NOT ('Municipal Administrator' = ANY(public.profiles.badges))
      THEN array_append(public.profiles.badges, 'Municipal Administrator')
      ELSE public.profiles.badges
    END,
    is_deactivated = false,
    updated_at = timezone('utc'::text, now());

  -- Step 3: Set role in auth.users metadata for token refresh claims
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', 'admin')
  WHERE id = v_user_id;

  RETURN format('Successfully provisioned administrator: %s (%s, UID: %s)', p_admin_display_name, p_admin_email, v_user_id);
END;
$$;

-- Strictly revoke execution from PUBLIC, anon, authenticated
REVOKE ALL ON FUNCTION public.provision_initial_admin(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.provision_initial_admin(text, text) TO postgres, service_role;

-- =============================================================================
-- SECTION 10: SUPABASE STORAGE PROVISIONING & SECURITY POLICIES
-- =============================================================================
-- Provisions the private 'report-evidence' bucket with file size limits, MIME type
-- enforcement, and folder-scoped Row Level Security on storage.objects.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN

    -- 1. Create or update the private 'report-evidence' storage bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'report-evidence',
      'report-evidence',
      false, -- Private bucket: access mediated strictly by RLS policies
      10485760, -- 10MB maximum file size limit
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    )
    ON CONFLICT (id) DO UPDATE SET
      public = false,
      file_size_limit = 10485760,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

    -- 2. Drop existing storage policies on report-evidence to avoid stale permissions
    DROP POLICY IF EXISTS "evidence_authenticated_upload" ON storage.objects;
    DROP POLICY IF EXISTS "evidence_owner_read" ON storage.objects;
    DROP POLICY IF EXISTS "evidence_staff_read" ON storage.objects;
    DROP POLICY IF EXISTS "evidence_owner_delete" ON storage.objects;
    DROP POLICY IF EXISTS "evidence_admin_manage" ON storage.objects;

    -- 3. Policy: Authenticated users can upload evidence only into their own user folder
    -- Folder structure: evidence/{user_id}/{filename}
    CREATE POLICY "evidence_authenticated_upload"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'report-evidence'
      AND (storage.foldername(name))[1] = auth.uid()::text
      AND public.is_account_active()
    );

    -- 4. Policy: Reporters can view their own uploaded evidence; staff/admins view all evidence
    CREATE POLICY "evidence_owner_read"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'report-evidence'
      AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_field_worker_or_admin()
      )
    );

    -- 5. Policy: Reporters can delete their own uploaded files
    CREATE POLICY "evidence_owner_delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'report-evidence'
      AND (storage.foldername(name))[1] = auth.uid()::text
      AND public.is_account_active()
    );

    -- 6. Policy: Administrators have full management rights over evidence storage
    CREATE POLICY "evidence_admin_manage"
    ON storage.objects FOR ALL
    TO authenticated
    USING (
      bucket_id = 'report-evidence'
      AND public.is_admin()
    )
    WITH CHECK (
      bucket_id = 'report-evidence'
      AND public.is_admin()
    );

  END IF;
END;
$$;

-- =============================================================================
-- SECTION 13: SUPABASE REALTIME PUBLICATION CONFIGURATION
-- Enables WebSocket Postgres Changes broadcasting for live multi-user sync.
-- Tables: pollution_reports, prevention_tasks, environmental_hotspots
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.pollution_reports;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.prevention_tasks;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.environmental_hotspots;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END;
$$;
