-- ==============================================================================
-- SYNC CITIZEN VEHICLES TO COMMAND PORTAL VEHICLE REGISTRY
-- Automatically synchronizes citizen vehicles registered via the Citizen Portal
-- into the main vehicles table used by Command Center dispatchers and officers.
-- ==============================================================================

-- 1. Function to synchronize citizen vehicle into public.vehicles
CREATE OR REPLACE FUNCTION public.sync_citizen_vehicle_to_main_registry()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_name TEXT;
  v_contact TEXT;
BEGIN
  -- Retrieve motorist information from citizen_profiles
  SELECT full_name, phone INTO v_owner_name, v_contact
  FROM public.citizen_profiles
  WHERE id = NEW.citizen_id;

  IF v_owner_name IS NULL OR TRIM(v_owner_name) = '' THEN
    v_owner_name := 'Verified Citizen Motorist';
  END IF;

  INSERT INTO public.vehicles (
    plate_number,
    make_model,
    registered_owner,
    contact_number,
    registration_status,
    risk_level,
    lto_alarm_tagged,
    updated_at
  )
  VALUES (
    UPPER(TRIM(NEW.plate_number)),
    NEW.make_model,
    v_owner_name,
    v_contact,
    'CURRENT',
    CASE WHEN NEW.lto_alarm_status = 'LTO_ALARM_ACTIVE' THEN 'Flagged' ELSE 'Clean' END,
    (NEW.lto_alarm_status = 'LTO_ALARM_ACTIVE'),
    now()
  )
  ON CONFLICT (plate_number) DO UPDATE
  SET
    make_model = EXCLUDED.make_model,
    registered_owner = EXCLUDED.registered_owner,
    contact_number = COALESCE(EXCLUDED.contact_number, public.vehicles.contact_number),
    lto_alarm_tagged = EXCLUDED.lto_alarm_tagged,
    risk_level = CASE WHEN EXCLUDED.lto_alarm_tagged THEN 'Flagged' ELSE public.vehicles.risk_level END,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger on public.citizen_vehicles
DROP TRIGGER IF EXISTS tr_sync_citizen_vehicle ON public.citizen_vehicles;
CREATE TRIGGER tr_sync_citizen_vehicle
AFTER INSERT OR UPDATE ON public.citizen_vehicles
FOR EACH ROW
EXECUTE FUNCTION public.sync_citizen_vehicle_to_main_registry();

-- 3. Backfill all existing citizen_vehicles into public.vehicles
INSERT INTO public.vehicles (
  plate_number,
  make_model,
  registered_owner,
  contact_number,
  registration_status,
  risk_level,
  lto_alarm_tagged,
  updated_at
)
SELECT
  UPPER(TRIM(cv.plate_number)),
  cv.make_model,
  COALESCE(NULLIF(TRIM(cp.full_name), ''), 'Verified Citizen Motorist'),
  cp.phone,
  'CURRENT',
  CASE WHEN cv.lto_alarm_status = 'LTO_ALARM_ACTIVE' THEN 'Flagged' ELSE 'Clean' END,
  (cv.lto_alarm_status = 'LTO_ALARM_ACTIVE'),
  now()
FROM public.citizen_vehicles cv
LEFT JOIN public.citizen_profiles cp ON cv.citizen_id = cp.id
ON CONFLICT (plate_number) DO UPDATE
SET
  make_model = EXCLUDED.make_model,
  registered_owner = EXCLUDED.registered_owner,
  contact_number = COALESCE(EXCLUDED.contact_number, public.vehicles.contact_number),
  updated_at = now();

-- 4. Restrict Execution Privileges on Trigger Function (Resolves Linter Warnings)
REVOKE EXECUTE ON FUNCTION public.sync_citizen_vehicle_to_main_registry() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_citizen_vehicle_to_main_registry() FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_citizen_vehicle_to_main_registry() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.sync_citizen_vehicle_to_main_registry() TO postgres, service_role;
