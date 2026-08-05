DROP POLICY IF EXISTS "Staff can manage cameras" ON public.cameras;
DROP POLICY IF EXISTS "Staff can manage violations" ON public.violations;
DROP POLICY IF EXISTS "Staff can manage citations" ON public.citations;
DROP POLICY IF EXISTS "Staff can manage officers" ON public.officers;

REVOKE INSERT, UPDATE, DELETE ON public.cameras FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.violations FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.citations FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.officers FROM authenticated;