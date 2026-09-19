-- ==============================================================================
-- FIX: citations_update RLS policy missing payment-related statuses
-- The WITH CHECK clause only allowed: pending, paid, unpaid, contested, waived, overdue
-- but the payment flow sets status to 'payment_pending' (GCash/Maya) and
-- 'payment_failed' (failed transactions), causing RLS violations from the citizen portal.
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/ooqqgnphtanvgrhvygnu/sql/new
-- ==============================================================================

-- Drop and recreate the citations_update policy with all valid statuses
DROP POLICY IF EXISTS "citations_update" ON public.citations;

CREATE POLICY "citations_update"
  ON public.citations
  FOR UPDATE
  USING (id IS NOT NULL)
  WITH CHECK (status IN (
    'pending',
    'paid',
    'unpaid',
    'contested',
    'waived',
    'overdue',
    'payment_pending',
    'payment_failed'
  ));
