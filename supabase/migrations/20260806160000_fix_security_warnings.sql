-- Fix mutable search path warning for the trigger function
ALTER FUNCTION public.set_citation_contested() SET search_path = public;

-- Fix unrestricted INSERT RLS warning
DROP POLICY IF EXISTS "Anyone can create disputes" ON public.disputes;

-- Create a more restrictive policy that ensures valid data is inserted
CREATE POLICY "Anyone can create disputes"
    ON public.disputes
    FOR INSERT
    WITH CHECK (
        status = 'pending' AND 
        reason IS NOT NULL AND 
        length(trim(reason)) > 0
    );
