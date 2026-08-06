-- ==============================================================================
-- 1. USER ROLES & PERMISSIONS TABLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  permission text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, permission)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, -- references auth.users in Supabase
  role text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "role_permissions_select" ON public.role_permissions;
CREATE POLICY "role_permissions_select" ON public.role_permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (true);

-- Only admins can modify roles and permissions
DROP POLICY IF EXISTS "role_permissions_modify" ON public.role_permissions;
CREATE POLICY "role_permissions_modify" ON public.role_permissions 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "user_roles_modify" ON public.user_roles;
CREATE POLICY "user_roles_modify" ON public.user_roles 
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Seed basic role permissions for QC Traffic Ops
TRUNCATE TABLE public.role_permissions;

INSERT INTO public.role_permissions (role, permission) VALUES
-- Admin: full access
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

-- Dispatcher: manage cameras and violations, but not officers or full citations
('dispatcher', 'cameras:view'),
('dispatcher', 'cameras:manage'),
('dispatcher', 'violations:view'),
('dispatcher', 'violations:manage'),
('dispatcher', 'citations:view'),
('dispatcher', 'officers:view'),
('dispatcher', 'dispatches:view'),
('dispatcher', 'dispatches:manage'),

-- Officer: view cameras, manage their own citations/violations
('officer', 'cameras:view'),
('officer', 'violations:view'),
('officer', 'violations:create'),
('officer', 'citations:view'),
('officer', 'citations:create');

-- ==============================================================================
-- 2. HELPER FUNCTIONS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.has_permission(required_permission text)
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = auth.uid()
      AND rp.permission = required_permission
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(roles text[])
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles
    WHERE user_id = auth.uid()
      AND role = ANY(roles)
  );
$$;

-- ==============================================================================
-- 3. APPLY RBAC POLICIES TO DOMAIN TABLES
-- ==============================================================================

-- Cameras
DROP POLICY IF EXISTS "Staff can manage cameras" ON public.cameras;
CREATE POLICY "Staff can manage cameras" ON public.cameras
  FOR ALL TO authenticated
  USING (public.has_permission('cameras:manage'))
  WITH CHECK (public.has_permission('cameras:manage'));

-- Violations
DROP POLICY IF EXISTS "Staff can manage violations" ON public.violations;
CREATE POLICY "Staff can manage violations" ON public.violations
  FOR ALL TO authenticated
  USING (public.has_permission('violations:manage') OR public.has_permission('violations:create'))
  WITH CHECK (public.has_permission('violations:manage') OR public.has_permission('violations:create'));

-- Citations
DROP POLICY IF EXISTS "Staff can manage citations" ON public.citations;
CREATE POLICY "Staff can manage citations" ON public.citations
  FOR ALL TO authenticated
  USING (public.has_permission('citations:manage') OR public.has_permission('citations:create'))
  WITH CHECK (public.has_permission('citations:manage') OR public.has_permission('citations:create'));

-- Officers
DROP POLICY IF EXISTS "Staff can manage officers" ON public.officers;
CREATE POLICY "Staff can manage officers" ON public.officers
  FOR ALL TO authenticated
  USING (public.has_permission('officers:manage'))
  WITH CHECK (public.has_permission('officers:manage'));

-- Dispatches
DROP POLICY IF EXISTS "Staff can manage dispatches" ON public.dispatches;
CREATE POLICY "Staff can manage dispatches" ON public.dispatches
  FOR ALL TO authenticated
  USING (public.has_permission('dispatches:manage'))
  WITH CHECK (public.has_permission('dispatches:manage'));
