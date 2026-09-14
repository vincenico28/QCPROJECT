-- ==============================================================================
-- QUEZON CITY FLOW GUARDIAN — PAYMENTS & SETTLEMENT COMMUNICATIONS RLS FIX
-- Allows motorists to record online citation payment settlements and automated
-- e-OR & LTO Clearance notifications without Row Level Security violations.
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/wcprajgotifqgwdjnpss/sql/new
-- ==============================================================================

-- 1. Ensure payments table has RLS enabled
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 2. Drop old restrictive policies for payments
DROP POLICY IF EXISTS "payments_select" ON public.payments;
DROP POLICY IF EXISTS "payments_insert" ON public.payments;
DROP POLICY IF EXISTS "payments_update" ON public.payments;
DROP POLICY IF EXISTS "payments_delete" ON public.payments;
DROP POLICY IF EXISTS "payments_select_all" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_all" ON public.payments;
DROP POLICY IF EXISTS "payments_update_all" ON public.payments;
DROP POLICY IF EXISTS "payments_delete_admin" ON public.payments;

-- 3. Create permissive and validated policies for payments
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

-- 4. Grant privileges for payments
GRANT ALL ON TABLE public.payments TO anon, authenticated, service_role;


-- ==============================================================================
-- 5. Ensure email_logs table has RLS policies for settlement dispatch
-- ==============================================================================
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_logs_select" ON public.email_logs;
DROP POLICY IF EXISTS "email_logs_insert" ON public.email_logs;
DROP POLICY IF EXISTS "email_logs_update" ON public.email_logs;
DROP POLICY IF EXISTS "email_logs_delete" ON public.email_logs;

CREATE POLICY "email_logs_select" ON public.email_logs
  FOR SELECT
  USING (true);

CREATE POLICY "email_logs_insert" ON public.email_logs
  FOR INSERT
  WITH CHECK (length(recipient_email) >= 3);

CREATE POLICY "email_logs_update" ON public.email_logs
  FOR UPDATE
  USING (true);

GRANT ALL ON TABLE public.email_logs TO anon, authenticated, service_role;


-- ==============================================================================
-- 6. Ensure audit_logs table has RLS policies for dispatch audit trails
-- ==============================================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;

CREATE POLICY "audit_logs_select" ON public.audit_logs
  FOR SELECT
  USING (true);

CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

GRANT ALL ON TABLE public.audit_logs TO anon, authenticated, service_role;
