import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';

// Web launch date — existing mobile users created before this date get access
const WEB_LAUNCH_DATE = new Date('2026-04-13T00:00:00Z');

// Grace period after Stripe checkout completes, to let the webhook land
// before we decide the user has no subscription and bounce them to /pricing.
const CHECKOUT_GRACE_MS = 10000;
const CHECKOUT_POLL_MS = 1500;

interface Props {
  children: ReactNode;
}

export function RequireSubscription({ children }: Props) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const justCheckedOut =
    new URLSearchParams(location.search).get('checkout') === 'success';

  // If we just came back from Stripe, poll the profile until the webhook
  // writes the status (or we give up after CHECKOUT_GRACE_MS).
  const [graceActive, setGraceActive] = useState(justCheckedOut);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
    refetchInterval: graceActive ? CHECKOUT_POLL_MS : false,
    refetchOnMount: justCheckedOut ? 'always' : true,
  });

  // Core homepage promise: "Invited subs are always free." If the current user
  // is assigned to at least one gc_project_trade (i.e. a GC invited them to a
  // trade and they accepted), let them into the dashboard without a Stripe
  // subscription. Subs shouldn't see the paywall — ever.
  const { data: invitedSubData, isLoading: invitedSubLoading } = useQuery({
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

  // On first mount after checkout, force-refetch immediately (don't trust the
  // cache from before the Stripe redirect) and start the grace-period timer.
  useEffect(() => {
    if (!justCheckedOut) return;
    queryClient.invalidateQueries({ queryKey: ['settings'] });
    const t = setTimeout(() => setGraceActive(false), CHECKOUT_GRACE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justCheckedOut]);

  if (isLoading || invitedSubLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const settings = profile?.data ?? profile;
  const status = settings?.subscription_status ?? settings?.subscriptionStatus;
  const provider = settings?.subscription_provider ?? settings?.subscriptionProvider;
  const createdAt = settings?.created_at ?? settings?.createdAt;
  const isInvitedSub = invitedSubData?.isInvitedSub ?? false;

  // Invited subs are always free — if they're assigned to any GC project trade,
  // they get full dashboard access without paying.
  if (isInvitedSub) {
    return <>{children}</>;
  }

  // Active or trialing — full access
  if (status === 'active' || status === 'trialing') {
    return <>{children}</>;
  }

  // Past due — show warning banner but allow access
  if (status === 'past_due') {
    return (
      <>
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <p className="text-sm text-amber-800 text-center font-medium">
            Payment failed. Please{' '}
            <a href="/dashboard/settings" className="underline hover:text-amber-900">
              update your payment method
            </a>
            .
          </p>
        </div>
        {children}
      </>
    );
  }

  // Mobile subscribers (Apple / Google) — let them in
  if (provider === 'apple' || provider === 'google') {
    return <>{children}</>;
  }

  // Existing mobile users created before web launch — let them in for now
  if (createdAt) {
    const userCreated = new Date(createdAt);
    if (userCreated < WEB_LAUNCH_DATE) {
      return <>{children}</>;
    }
  }

  // Just came back from Stripe — hold off on redirecting while we wait for
  // the webhook to land. Show a friendly "finalizing" screen.
  if (graceActive) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 px-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          Finalizing your subscription...
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          This usually takes just a few seconds.
        </p>
      </div>
    );
  }

  // No valid subscription — redirect to pricing
  return <Navigate to="/pricing" replace />;
}
