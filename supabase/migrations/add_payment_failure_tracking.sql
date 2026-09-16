-- ==============================================================================
-- QUEZON CITY FLOW GUARDIAN — PAYMENT FAILURE & DECLINE TRACKING MIGRATION
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ooqqgnphtanvgrhvygnu/sql/new
-- ==============================================================================

-- 1. Add failure_reason and notes columns to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS failure_reason TEXT;

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Ensure citations table status permits payment_failed
-- Citations status is TEXT, so 'payment_failed' is already supported.
-- Create index on citations status for faster queue and citizen filtering
CREATE INDEX IF NOT EXISTS idx_citations_status 
ON public.citations (status);

-- 3. Create index on payments status
CREATE INDEX IF NOT EXISTS idx_payments_status 
ON public.payments (status);
