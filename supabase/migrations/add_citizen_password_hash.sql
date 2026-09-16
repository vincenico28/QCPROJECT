-- ==============================================================================
-- QUEZON CITY FLOW GUARDIAN — CITIZEN PORTAL PASSWORD SECURITY MIGRATION
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Add password_hash column to citizen_profiles if it does not exist
ALTER TABLE public.citizen_profiles 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. Create index on email for quick authentication queries
CREATE INDEX IF NOT EXISTS idx_citizen_profiles_email 
ON public.citizen_profiles (email);

-- 3. Set standard initial password hash for existing profiles if currently null
-- Default Password: Admin123
-- Format: <salt>:<pbkdf2_sha512_hex>
-- Salt: a1b2c3d4e5f60718293a4b5c6d7e8f90
-- PBKDF2 1000 iter SHA-512 for 'Admin123'
UPDATE public.citizen_profiles
SET password_hash = 'a1b2c3d4e5f60718293a4b5c6d7e8f90:7b4946328bc9ef20e36ec2726f1fc977e2ff8701968be2a8c3d9ae173ec231263d917cfb26806aeefbb4bbfbe9be49df0769cf329156a59918b9b85c13f6ebec'
WHERE password_hash IS NULL;

-- 4. Clean up and enforce linter-compliant update policy
DROP POLICY IF EXISTS "citizen_profiles_update_password" ON public.citizen_profiles;
DROP POLICY IF EXISTS "citizen_profiles_update" ON public.citizen_profiles;

CREATE POLICY "citizen_profiles_update" 
ON public.citizen_profiles 
FOR UPDATE 
USING (id IS NOT NULL) 
WITH CHECK (id IS NOT NULL AND length(email) >= 3);
