DROP POLICY "Staff can create dispatches" ON public.dispatches;
DROP POLICY "Staff can update dispatches" ON public.dispatches;

CREATE POLICY "Staff can create dispatches" ON public.dispatches
FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Staff can update dispatches" ON public.dispatches
FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
