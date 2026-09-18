-- ==============================================================================
-- QUEZON CITY FLOW GUARDIAN — AUTOMATIC RBAC SETUP MIGRATION
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/wcprajgotifqgwdjnpss/sql/new
-- ==============================================================================

-- 1. Ensure public.user_roles exists with required structure
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- references auth.users in Supabase
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Ensure column exists if table was previously created
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- 2. Ensure public.role_permissions exists
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role, permission)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);

-- 3. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow anyone authenticated (or public read for initial clearance validation) to select
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "role_permissions_select" ON public.role_permissions;
CREATE POLICY "role_permissions_select" ON public.role_permissions FOR SELECT USING (true);

-- Allow authenticated users to insert/update their own role if no role exists yet (self-bootstrap),
-- or admins can manage all roles
DROP POLICY IF EXISTS "user_roles_insert_policy" ON public.user_roles;
CREATE POLICY "user_roles_insert_policy" ON public.user_roles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "user_roles_update_policy" ON public.user_roles;
CREATE POLICY "user_roles_update_policy" ON public.user_roles 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "user_roles_delete_policy" ON public.user_roles;
CREATE POLICY "user_roles_delete_policy" ON public.user_roles 
  FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- 5. Seed / Sync Standard Role Permissions for Quezon City Flow Guardian
INSERT INTO public.role_permissions (role, permission) VALUES
-- Super Admin: Full system clearance
('super_admin', '*'),
('super_admin', 'dashboard:view'),
('super_admin', 'cameras:view'),
('super_admin', 'cameras:manage'),
('super_admin', 'violations:view'),
('super_admin', 'violations:manage'),
('super_admin', 'violations:create'),
('super_admin', 'citations:view'),
('super_admin', 'citations:manage'),
('super_admin', 'citations:create'),
('super_admin', 'officers:view'),
('super_admin', 'officers:manage'),
('super_admin', 'dispatches:view'),
('super_admin', 'dispatches:manage'),
('super_admin', 'disputes:view'),
('super_admin', 'disputes:manage'),
('super_admin', 'finance:view'),
('super_admin', 'finance:manage'),
('super_admin', 'audit_logs:view'),
('super_admin', 'settings:manage'),
('super_admin', 'employees:manage'),
('super_admin', 'ai_training:manage'),

-- Command Center Admin: Operational command oversight
('admin', 'dashboard:view'),
('admin', 'cameras:view'),
('admin', 'cameras:manage'),
('admin', 'violations:view'),
('admin', 'violations:manage'),
('admin', 'citations:view'),
('admin', 'citations:manage'),
('admin', 'officers:view'),
('admin', 'officers:manage'),
('admin', 'dispatches:view'),
('admin', 'dispatches:manage'),
('admin', 'disputes:view'),
('admin', 'disputes:manage'),
('admin', 'finance:view'),
('admin', 'finance:manage'),
('admin', 'audit_logs:view'),
('admin', 'settings:manage'),
('admin', 'employees:manage'),
('admin', 'ai_training:manage'),

-- Rapid Incident Dispatcher: Real-time CCTV, incident escalation, and dispatching
('dispatcher', 'dashboard:view'),
('dispatcher', 'cameras:view'),
('dispatcher', 'cameras:manage'),
('dispatcher', 'violations:view'),
('dispatcher', 'violations:manage'),
('dispatcher', 'citations:view'),
('dispatcher', 'officers:view'),
('dispatcher', 'dispatches:view'),
('dispatcher', 'dispatches:manage'),
('dispatcher', 'map:view'),

-- Field Traffic Enforcer: On-street mobile terminal, issuance, scanning
('officer', 'officer:terminal'),
('officer', 'cameras:view'),
('officer', 'violations:view'),
('officer', 'violations:create'),
('officer', 'citations:view'),
('officer', 'citations:create'),
('officer', 'dispatches:view'),

-- Treasury & Finance Cashier: Settlement, cashier drawers, refund approvals
('finance', 'dashboard:view'),
('finance', 'citations:view'),
('finance', 'citations:manage'),
('finance', 'finance:view'),
('finance', 'finance:manage'),
('finance', 'reports:view'),

-- TAB Hearing Adjudicator: NOV appeals, dispute adjudication, hearings
('adjudicator', 'dashboard:view'),
('adjudicator', 'violations:view'),
('adjudicator', 'citations:view'),
('adjudicator', 'disputes:view'),
('adjudicator', 'disputes:manage'),

-- Registered Motorist / Citizen: Public lookup, citation payments, dispute submission
('citizen', 'citizen:lookup'),
('citizen', 'citizen:pay'),
('citizen', 'citizen:dispute'),
('citizen', 'citizen:profile')
ON CONFLICT (role, permission) DO NOTHING;

-- 6. Helper Security Invoker Functions (100% Supabase Linter Compliant)
-- Drop any previous SECURITY DEFINER function to eliminate linter security warnings
DROP FUNCTION IF EXISTS public.get_or_sync_user_role(uuid, text, text);
DROP FUNCTION IF EXISTS public.get_or_sync_user_role(uuid, text);
DROP FUNCTION IF EXISTS public.get_or_sync_user_role();

-- Clean, safe SECURITY INVOKER function to retrieve the current authenticated caller's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;

-- Restrict execution: Revoke from anon/public, allow only authenticated callers
REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
