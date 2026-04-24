-- ──────────────────────────────────────────────────────────────────────
-- is_demo flag — distinguishes seed/sample data from real user data.
--
-- Goal:
--   • New users who opt into sample data during onboarding get 3 customers,
--     5 jobs, 2 invoices stamped with is_demo = true.
--   • The UI shows a small "Sample" chip on those records so users never
--     confuse them with real work.
--   • Settings → Sample Data has a one-tap "Wipe sample data" button that
--     deletes every row where is_demo = true (scoped to the current user).
--
-- Application contract:
--   • Writes that don't explicitly set is_demo default to false.
--   • The seedData.ts helper stamps true after creating each record.
--   • Client-side queries don't filter on this — it's purely a display/
--     deletion affordance. RLS still scopes to user_id.
--
-- Safe to run multiple times (uses IF NOT EXISTS).
-- Does NOT backfill existing records — they stay false (treated as real).
-- ──────────────────────────────────────────────────────────────────────

-- customers
ALTER TABLE IF EXISTS public.customers
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_customers_is_demo
  ON public.customers(user_id, is_demo)
  WHERE is_demo = true;

-- jobs
ALTER TABLE IF EXISTS public.jobs
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_jobs_is_demo
  ON public.jobs(user_id, is_demo)
  WHERE is_demo = true;

-- invoices
ALTER TABLE IF EXISTS public.invoices
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_invoices_is_demo
  ON public.invoices(user_id, is_demo)
  WHERE is_demo = true;

-- properties (created alongside demo customers)
ALTER TABLE IF EXISTS public.properties
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_properties_is_demo
  ON public.properties(user_id, is_demo)
  WHERE is_demo = true;

-- ──────────────────────────────────────────────────────────────────────
-- RPC: wipe_sample_data() — one-tap cleanup for the Settings panel.
--
-- Deletes all rows with is_demo = true owned by the current auth user.
-- Ordered to respect foreign keys: invoices → jobs → properties →
-- customers. Returns per-table counts so the UI can show a confirmation.
--
-- Invoked client-side via supabase.rpc('wipe_sample_data').
-- ──────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.wipe_sample_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  inv_count int := 0;
  job_count int := 0;
  prop_count int := 0;
  cust_count int := 0;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  WITH d AS (
    DELETE FROM public.invoices WHERE user_id = uid AND is_demo = true RETURNING 1
  )
  SELECT count(*) INTO inv_count FROM d;

  WITH d AS (
    DELETE FROM public.jobs WHERE user_id = uid AND is_demo = true RETURNING 1
  )
  SELECT count(*) INTO job_count FROM d;

  WITH d AS (
    DELETE FROM public.properties WHERE user_id = uid AND is_demo = true RETURNING 1
  )
  SELECT count(*) INTO prop_count FROM d;

  WITH d AS (
    DELETE FROM public.customers WHERE user_id = uid AND is_demo = true RETURNING 1
  )
  SELECT count(*) INTO cust_count FROM d;

  RETURN jsonb_build_object(
    'invoices', inv_count,
    'jobs', job_count,
    'properties', prop_count,
    'customers', cust_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.wipe_sample_data() TO authenticated;
