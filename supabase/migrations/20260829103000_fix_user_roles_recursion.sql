-- Fix infinite recursion on user_roles
DROP POLICY IF EXISTS "user_roles_modify" ON public.user_roles;

-- We break down the FOR ALL policy into individual policies for INSERT, UPDATE, and DELETE.
-- Since user_roles_select is just USING (true), this prevents the recursion loop.
CREATE POLICY "user_roles_insert" ON public.user_roles 
FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "user_roles_update" ON public.user_roles 
FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "user_roles_delete" ON public.user_roles 
FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Seed the user_roles table with the Super Admin account we created earlier
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email = 'escalavincenico28@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
