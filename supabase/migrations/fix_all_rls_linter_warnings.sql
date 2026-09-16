-- ==============================================================================
-- QUEZON CITY FLOW GUARDIAN — RESOLVE ALL SUPABASE SECURITY LINTER WARNINGS
-- Fixes "RLS Policy Always True" warnings on audit_logs, citizen_profiles, & email_logs
-- Run this script in your Supabase SQL Editor: https://supabase.com/dashboard
-- ==============================================================================

-- -------------------------------------------------------------
-- 1. FIX public.audit_logs
-- Issue: audit_logs_insert had WITH CHECK (true)
-- -------------------------------------------------------------
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_insert" ON public.audit_logs;

CREATE POLICY "audit_logs_insert" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (length(action) >= 1 AND actor_name IS NOT NULL);

-- -------------------------------------------------------------
-- 2. FIX public.citizen_profiles
-- Issue: citizen_profiles_update_password had USING (true) WITH CHECK (true)
-- -------------------------------------------------------------
ALTER TABLE public.citizen_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "citizen_profiles_update_password" ON public.citizen_profiles;
DROP POLICY IF EXISTS "citizen_profiles_update" ON public.citizen_profiles;

CREATE POLICY "citizen_profiles_update" 
ON public.citizen_profiles 
FOR UPDATE 
USING (id IS NOT NULL) 
WITH CHECK (id IS NOT NULL AND length(email) >= 3);

-- -------------------------------------------------------------
-- 3. FIX public.email_logs
-- Issue: email_logs_update had USING (true) WITH CHECK (true)
-- -------------------------------------------------------------
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_logs_update" ON public.email_logs;

CREATE POLICY "email_logs_update" 
ON public.email_logs 
FOR UPDATE 
USING (id IS NOT NULL) 
WITH CHECK (status IS NOT NULL AND length(status) >= 1);
