-- Subscription tier migration
-- Adds a `subscription_tier` text column to profiles so the app can tell apart
-- GCs, Sub Pro subscribers, and free subs. Used by:
--   web/src/hooks/useSubscriptionTier.ts
--   web/src/components/layout/DashboardLayout.tsx (nav gating)
--   web/supabase/functions/stripe-webhook/index.ts (write on checkout)
--   web/supabase/functions/create-checkout-session/index.ts
--
-- Values:
--   'gc'        - General contractor (full feature set, $29.99/mo or $199/yr)
--   'sub_pro'   - Independent sub paying for the full toolkit ($14.99/mo or $99/yr)
--   'sub_free'  - Invited sub using the free toolkit (tasks + payments only)
--   NULL / 'none' - Not subscribed / trial
--
-- Idempotent: safe to re-run.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT;

-- Backfill existing paying users as 'gc' (they all came in through the GC plans
-- pre-Sub-Pro). Free-acting users stay NULL so useSubscriptionTier can fall back
-- to role + invite detection.
UPDATE profiles
SET subscription_tier = 'gc'
WHERE subscription_tier IS NULL
  AND subscription_status IN ('trialing', 'active', 'past_due');

-- Optional sanity constraint. Kept permissive so future tiers can be added without
-- another migration. Nullable on purpose.
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IS NULL OR subscription_tier IN ('gc', 'sub_pro', 'sub_free', 'none'));

-- Helpful index for tier-based queries (rare, but cheap).
CREATE INDEX IF NOT EXISTS profiles_subscription_tier_idx
  ON profiles (subscription_tier);
