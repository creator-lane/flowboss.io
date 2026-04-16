import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';

/**
 * Subscription tier detection — the single source of truth for "what can this user do?"
 *
 * Three possible states (matches the public business model):
 *
 *  1. 'gc'         — paid $29.99/mo Contractor plan (or in trial). Full product.
 *  2. 'sub_pro'    — paid $19.99/mo Sub Pro plan (or in trial). Own shop + GC work.
 *  3. 'sub_free'   — unpaid, but assigned to at least one gc_project_trade. Gets GC-work
 *                    features free forever; Pro features (Jobs/Customers/Invoices/etc.)
 *                    are locked behind an upgrade modal.
 *  4. 'none'       — unpaid + no GC assignment. Gets bounced to /pricing by RequireSubscription.
 *
 * Keep this aligned with RequireSubscription.tsx. If the gating logic there drifts,
 * this hook drifts too.
 */
export type SubscriptionTier = 'gc' | 'sub_pro' | 'sub_free' | 'none';

export function useSubscriptionTier() {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
    staleTime: 60_000,
  });

  const { data: invitedSubData, isLoading: invitedLoading } = useQuery({
    queryKey: ['is-invited-sub'],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) return { isInvitedSub: false };
      const { data, error } = await supabase
        .from('gc_project_trades')
        .select('id')
        .eq('assigned_user_id', userId)
        .limit(1);
      if (error) return { isInvitedSub: false };
      return { isInvitedSub: (data?.length ?? 0) > 0 };
    },
    staleTime: 60_000,
  });

  const settings: any = (profile as any)?.data ?? profile ?? {};
  const status = settings?.subscription_status ?? settings?.subscriptionStatus;
  const tier = settings?.subscription_tier ?? settings?.subscriptionTier;
  const isInvitedSub = invitedSubData?.isInvitedSub ?? false;
  const isActive = status === 'active' || status === 'trialing' || status === 'past_due';

  // Resolve tier. Note: we default paid users (no tier column yet) to 'gc' to avoid
  // regressing existing customers while the DB migration lands.
  let resolvedTier: SubscriptionTier = 'none';
  if (isActive) {
    resolvedTier = tier === 'sub_pro' ? 'sub_pro' : 'gc';
  } else if (isInvitedSub) {
    resolvedTier = 'sub_free';
  }

  // Convenience booleans. "Can access Pro features" = has a paid subscription OR is trialing.
  const canAccessProFeatures = resolvedTier === 'gc' || resolvedTier === 'sub_pro';
  const isFreeSub = resolvedTier === 'sub_free';

  return {
    tier: resolvedTier,
    isLoading: profileLoading || invitedLoading,
    canAccessProFeatures,
    isFreeSub,
    isInvitedSub,
    status,
  };
}
