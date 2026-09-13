-- ==============================================================================
-- QUEZON CITY FLOW GUARDIAN — PAYMENTS TABLE RLS POLICIES FIX
-- Allows motorists to record online citation payment settlements without RLS violations.
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/wcprajgotifqgwdjnpss/sql/new
-- ==============================================================================

-- 1. Ensure table has RLS enabled
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 2. Drop old restrictive policies
DROP POLICY IF EXISTS "payments_select" ON public.payments;
DROP POLICY IF EXISTS "payments_insert" ON public.payments;
DROP POLICY IF EXISTS "payments_update" ON public.payments;
DROP POLICY IF EXISTS "payments_delete" ON public.payments;
DROP POLICY IF EXISTS "payments_select_all" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_all" ON public.payments;
DROP POLICY IF EXISTS "payments_update_all" ON public.payments;
DROP POLICY IF EXISTS "payments_delete_admin" ON public.payments;

-- 3. Create permissive and validated policies
CREATE POLICY "payments_select_all" ON public.payments
  FOR SELECT
  USING (true);

CREATE POLICY "payments_insert_all" ON public.payments
  FOR INSERT
  WITH CHECK (length(citation_id) >= 2 AND length(plate_number) >= 3);

CREATE POLICY "payments_update_all" ON public.payments
  FOR UPDATE
  USING (id IS NOT NULL)
  WITH CHECK (status IN ('pending_verification', 'verified', 'rejected', 'settled', 'paid'));

CREATE POLICY "payments_delete_admin" ON public.payments
  FOR DELETE
  USING (auth.role() = 'authenticated' AND id IS NOT NULL);

-- 4. Grant privileges to anon and authenticated roles
GRANT ALL ON TABLE public.payments TO anon, authenticated, service_role;
