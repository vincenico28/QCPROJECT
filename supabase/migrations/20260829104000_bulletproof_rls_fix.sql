-- 1. Ensure the vehicle policies are bulletproof
DROP POLICY IF EXISTS "Admin and staff can insert vehicles" ON public.vehicles;
CREATE POLICY "Admin and staff can insert vehicles"
    ON public.vehicles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin', 'dispatcher', 'officer')
        )
        OR 
        (auth.jwt() ->> 'email') = 'escalavincenico28@gmail.com'
    );

DROP POLICY IF EXISTS "Admin and staff can update vehicles" ON public.vehicles;
CREATE POLICY "Admin and staff can update vehicles"
    ON public.vehicles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin', 'dispatcher', 'officer')
        )
        OR 
        (auth.jwt() ->> 'email') = 'escalavincenico28@gmail.com'
    );

-- 2. Force-inject the super admin into user_roles by wiping and recreating for this specific email
DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'escalavincenico28@gmail.com');
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin' FROM auth.users WHERE email = 'escalavincenico28@gmail.com';
