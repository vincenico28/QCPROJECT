-- ==============================================================================
-- FIX SUPABASE SECURITY LINTER WARNINGS: REVOKE PUBLIC EXECUTE
-- Resolves:
--   1. "Public Can Execute SECURITY DEFINER Function"
--   2. "Signed-In Users Can Execute SECURITY DEFINER Function"
-- on public.sync_citizen_vehicle_to_main_registry()
--
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard
-- ==============================================================================

-- 1. Revoke execution from PUBLIC, anon, and authenticated
-- This prevents the trigger function from being called externally via /rest/v1/rpc
REVOKE EXECUTE ON FUNCTION public.sync_citizen_vehicle_to_main_registry() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_citizen_vehicle_to_main_registry() FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_citizen_vehicle_to_main_registry() FROM authenticated;

-- 2. Ensure only internal database engine and service_role have execution permissions
GRANT EXECUTE ON FUNCTION public.sync_citizen_vehicle_to_main_registry() TO postgres, service_role;
