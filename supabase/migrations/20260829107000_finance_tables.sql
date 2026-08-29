-- ==============================================================================
-- QUEZON CITY FLOW GUARDIAN — FINANCE & PAYMENTS MIGRATION
-- Creates dedicated tables for: Payments, Refunds, and Finance Analytics
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ooqqgnphtanvgrhvygnu/sql/new
-- ==============================================================================

-- 1. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citation_id TEXT NOT NULL, -- references citation_number or citation id
  plate_number TEXT NOT NULL,
  payer_name TEXT,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  reference_number TEXT NOT NULL,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending_verification', -- 'pending_verification', 'verified', 'rejected'
  submitted_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. REFUNDS TABLE
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citation_id TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  claimant TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processed', 'rejected'
  approved_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. FINANCE ANALYTICS (REVENUE) TABLE
CREATE TABLE IF NOT EXISTS public.revenue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL UNIQUE,
  citations NUMERIC NOT NULL DEFAULT 0,
  towing NUMERIC NOT NULL DEFAULT 0,
  ev_charging NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. FINANCE ANALYTICS (BUDGET) TABLE
CREATE TABLE IF NOT EXISTS public.budget_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure columns exist if table was already created earlier
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payer_name TEXT;

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select" ON public.payments;
DROP POLICY IF EXISTS "payments_insert" ON public.payments;
DROP POLICY IF EXISTS "payments_update" ON public.payments;
DROP POLICY IF EXISTS "payments_delete" ON public.payments;

CREATE POLICY "payments_select" ON public.payments FOR SELECT USING (true);
CREATE POLICY "payments_insert" ON public.payments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "payments_update" ON public.payments FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "payments_delete" ON public.payments FOR DELETE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "refunds_select" ON public.refunds;
DROP POLICY IF EXISTS "refunds_insert" ON public.refunds;
DROP POLICY IF EXISTS "refunds_update" ON public.refunds;
DROP POLICY IF EXISTS "refunds_delete" ON public.refunds;

CREATE POLICY "refunds_select" ON public.refunds FOR SELECT USING (true);
CREATE POLICY "refunds_insert" ON public.refunds FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "refunds_update" ON public.refunds FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "refunds_delete" ON public.refunds FOR DELETE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "revenue_select" ON public.revenue_reports;
DROP POLICY IF EXISTS "revenue_insert" ON public.revenue_reports;
DROP POLICY IF EXISTS "revenue_update" ON public.revenue_reports;
DROP POLICY IF EXISTS "revenue_delete" ON public.revenue_reports;

CREATE POLICY "revenue_select" ON public.revenue_reports FOR SELECT USING (true);
CREATE POLICY "revenue_insert" ON public.revenue_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "revenue_update" ON public.revenue_reports FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "revenue_delete" ON public.revenue_reports FOR DELETE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "budget_select" ON public.budget_allocations;
DROP POLICY IF EXISTS "budget_insert" ON public.budget_allocations;
DROP POLICY IF EXISTS "budget_update" ON public.budget_allocations;
DROP POLICY IF EXISTS "budget_delete" ON public.budget_allocations;

CREATE POLICY "budget_select" ON public.budget_allocations FOR SELECT USING (true);
CREATE POLICY "budget_insert" ON public.budget_allocations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "budget_update" ON public.budget_allocations FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "budget_delete" ON public.budget_allocations FOR DELETE USING (auth.uid() IS NOT NULL);

-- -------------------------------------------------------------
-- SEED INITIAL SYSTEM DATA
-- -------------------------------------------------------------
INSERT INTO public.payments (citation_id, plate_number, payer_name, amount, method, reference_number, status, proof_url, submitted_date)
VALUES
  ('NOV-2026-QC-00129', 'NDB-8921', 'Juan Dela Cruz', 2000, 'gcash', 'GCASH-9821039812', 'pending_verification', '/assets/violation-1.jpg', now() - interval '1 day'),
  ('NOV-2026-QC-00142', 'XYZ-987', 'Gabriel Mendoza', 2500, 'maya', 'MAYA-7712398412', 'pending_verification', '/assets/violation-3.jpg', now() - interval '45 minutes'),
  ('NOV-2026-QC-00150', 'CAS-3901', 'Enterprise Fleet Corp.', 5000, 'over-the-counter', 'OTC-CULIAT-88129', 'verified', '/assets/violation-2.jpg', now() - interval '2 hours')
ON CONFLICT DO NOTHING;

INSERT INTO public.refunds (citation_id, plate_number, amount, claimant, reason, status, approved_date)
VALUES
  ('NOV-2026-QC-00042', 'CAR-9912', 2000, 'Dr. Manuel Quezon', 'TAB Appeal Dismissal', 'pending', now() - interval '1 day'),
  ('NOV-2026-QC-00018', 'WXY-1122', 1500, 'Ana Dela Rosa', 'Overpayment', 'pending', now() - interval '2 days')
ON CONFLICT DO NOTHING;

INSERT INTO public.revenue_reports (month, citations, towing, ev_charging)
VALUES
  ('Jan', 1250000, 350000, 45000),
  ('Feb', 1100000, 320000, 52000),
  ('Mar', 950000, 280000, 68000),
  ('Apr', 1050000, 310000, 80000),
  ('May', 880000, 250000, 95000),
  ('Jun', 750000, 200000, 115000)
ON CONFLICT (month) DO UPDATE 
  SET citations = EXCLUDED.citations, towing = EXCLUDED.towing, ev_charging = EXCLUDED.ev_charging;

INSERT INTO public.budget_allocations (category, amount)
VALUES
  ('Command Center Ops', 4500000),
  ('IoT & Cameras', 2800000),
  ('EV Infrastructure', 1500000),
  ('Officer Gear', 1200000)
ON CONFLICT (category) DO UPDATE 
  SET amount = EXCLUDED.amount;
