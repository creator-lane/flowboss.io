import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

// Web launch date — existing mobile users created before this date get access
const WEB_LAUNCH_DATE = new Date('2026-04-13T00:00:00Z');

interface Props {
  children: ReactNode;
}

export function RequireSubscription({ children }: Props) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
  });

  if (isLoading) {
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

  // No valid subscription — redirect to pricing
  return <Navigate to="/pricing" replace />;
}
