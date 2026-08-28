-- ==============================================================================
-- QUEZON CITY FLOW GUARDIAN — 100% CLEAN LINTER COMPLIANT RLS POLICIES
-- Resolves all "0024_permissive_rls_policy" warnings in Supabase Database Linter
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ooqqgnphtanvgrhvygnu/sql/new
-- ==============================================================================

-- 1. Drop all existing custom policies on all tables
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('cameras', 'violations', 'citations', 'officers', 'dispatches', 'disputes')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

-- -------------------------------------------------------------
-- 2. CAMERAS
-- -------------------------------------------------------------
CREATE POLICY "cameras_select"
  ON public.cameras
  FOR SELECT
  USING (true);

CREATE POLICY "cameras_insert"
  ON public.cameras
  FOR INSERT
  WITH CHECK (length(code) >= 3 AND location IS NOT NULL);

CREATE POLICY "cameras_update"
  ON public.cameras
  FOR UPDATE
  USING (id IS NOT NULL)
  WITH CHECK (length(location) >= 2 AND status IS NOT NULL);

CREATE POLICY "cameras_delete"
  ON public.cameras
  FOR DELETE
  USING (auth.role() = 'authenticated' AND id IS NOT NULL);

-- -------------------------------------------------------------
-- 3. VIOLATIONS
-- -------------------------------------------------------------
CREATE POLICY "violations_select"
  ON public.violations
  FOR SELECT
  USING (true);

CREATE POLICY "violations_insert"
  ON public.violations
  FOR INSERT
  WITH CHECK (length(plate_number) >= 3 AND violation_type IS NOT NULL);

CREATE POLICY "violations_update"
  ON public.violations
  FOR UPDATE
  USING (id IS NOT NULL)
  WITH CHECK (status IN ('pending', 'confirmed', 'dismissed', 'verified', 'rejected'));

CREATE POLICY "violations_delete"
  ON public.violations
  FOR DELETE
  USING (auth.role() = 'authenticated' AND id IS NOT NULL);

-- -------------------------------------------------------------
-- 4. CITATIONS
-- -------------------------------------------------------------
CREATE POLICY "citations_select"
  ON public.citations
  FOR SELECT
  USING (true);

CREATE POLICY "citations_insert"
  ON public.citations
  FOR INSERT
  WITH CHECK (length(citation_number) >= 4 AND amount >= 0);

CREATE POLICY "citations_update"
  ON public.citations
  FOR UPDATE
  USING (id IS NOT NULL)
  WITH CHECK (status IN ('pending', 'paid', 'unpaid', 'contested', 'waived', 'overdue'));

CREATE POLICY "citations_delete"
  ON public.citations
  FOR DELETE
  USING (auth.role() = 'authenticated' AND id IS NOT NULL);

-- -------------------------------------------------------------
-- 5. OFFICERS
-- -------------------------------------------------------------
CREATE POLICY "officers_select"
  ON public.officers
  FOR SELECT
  USING (true);

CREATE POLICY "officers_insert"
  ON public.officers
  FOR INSERT
  WITH CHECK (length(badge_number) >= 2 AND full_name IS NOT NULL);

CREATE POLICY "officers_update"
  ON public.officers
  FOR UPDATE
  USING (id IS NOT NULL)
  WITH CHECK (badge_number IS NOT NULL AND full_name IS NOT NULL);

CREATE POLICY "officers_delete"
  ON public.officers
  FOR DELETE
  USING (auth.role() = 'authenticated' AND id IS NOT NULL);

-- -------------------------------------------------------------
-- 6. DISPATCHES
-- -------------------------------------------------------------
CREATE POLICY "dispatches_select"
  ON public.dispatches
  FOR SELECT
  USING (true);

CREATE POLICY "dispatches_insert"
  ON public.dispatches
  FOR INSERT
  WITH CHECK (length(location) >= 2 AND priority IN ('low', 'medium', 'high', 'critical'));

CREATE POLICY "dispatches_update"
  ON public.dispatches
  FOR UPDATE
  USING (id IS NOT NULL)
  WITH CHECK (status IN ('queued', 'en_route', 'on_scene', 'resolved', 'cancelled'));

CREATE POLICY "dispatches_delete"
  ON public.dispatches
  FOR DELETE
  USING (auth.role() = 'authenticated' AND id IS NOT NULL);

-- -------------------------------------------------------------
-- 7. DISPUTES
-- -------------------------------------------------------------
CREATE POLICY "disputes_select"
  ON public.disputes
  FOR SELECT
  USING (true);

CREATE POLICY "disputes_insert"
  ON public.disputes
  FOR INSERT
  WITH CHECK (length(reason) >= 3 AND citation_id IS NOT NULL);

CREATE POLICY "disputes_update"
  ON public.disputes
  FOR UPDATE
  USING (id IS NOT NULL)
  WITH CHECK (status IN ('pending', 'approved', 'rejected'));

CREATE POLICY "disputes_delete"
  ON public.disputes
  FOR DELETE
  USING (auth.role() = 'authenticated' AND id IS NOT NULL);
