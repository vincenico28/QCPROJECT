-- Simplify the vehicles table policies.
-- Only authenticated users (who are all LGU staff) can access this table.
DROP POLICY IF EXISTS "Admin and staff can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admin and staff can update vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Anyone can view vehicles" ON public.vehicles;

CREATE POLICY "Authenticated users can insert vehicles"
    ON public.vehicles
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicles"
    ON public.vehicles
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can view vehicles"
    ON public.vehicles
    FOR SELECT
    TO authenticated
    USING (true);
