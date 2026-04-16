import { useState } from 'react';
import { Link, useSearchParams, Navigate } from 'react-router-dom';
import { Wrench, ArrowRight, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { AuthShell, AuthCard } from '../components/ui/AuthShell';

const PLANS: Record<string, { name: string; price: string; interval: string }> = {
  monthly: { name: 'Monthly', price: '$29.99', interval: '/mo' },
  annual: { name: 'Annual', price: '$199.99', interval: '/yr' },
};

export function Checkout() {
  const { session, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const planKey = searchParams.get('plan') || 'monthly';
  const plan = PLANS[planKey] || PLANS.monthly;

  // Not signed in → bounce to signup, preserving the plan
  if (!authLoading && !session) {
    return <Navigate to={`/signup?plan=${planKey}`} replace />;
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Explicit button click → create Stripe session and redirect. No auto-fire on mount:
  // that would yank users to Stripe any time routing happens to land on /checkout.
  async function createCheckoutSession() {
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        'https://besbtasjpqmfqjkudmgu.supabase.co/functions/v1/create-checkout-session',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session!.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ plan: planKey, userId: session!.user.id }),
        }
      );
      const body = await response.text();
      if (!response.ok) {
        setError(`Checkout failed (HTTP ${response.status}): ${body}`);
        setLoading(false);
        return;
      }
      try {
        const { url } = JSON.parse(body);
        if (url) {
          window.location.href = url;
        } else {
          setError(`Checkout failed: no URL in response. Body: ${body}`);
          setLoading(false);
        }
      } catch {
        setError(`Checkout failed: bad JSON. Body: ${body}`);
        setLoading(false);
      }
    } catch (e) {
      setError(`Network error: ${e instanceof Error ? e.message : String(e)}`);
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="w-full max-w-md mx-auto">
        <AuthCard>
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Confirm your plan
            </h1>
            <p className="text-sm text-gray-500 mt-1.5 text-center dark:text-gray-400">
              You'll land on Stripe's secure checkout next.
            </p>
          </div>

          {/* Plan summary */}
          <div className="relative rounded-2xl p-4 sm:p-5 mb-6 border border-blue-200 bg-gradient-to-br from-blue-50 to-white overflow-hidden dark:border-blue-500/20 dark:from-blue-500/10 dark:to-transparent">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-bold tracking-wide uppercase text-blue-600 dark:text-blue-300 mb-1">
                  {plan.name} plan
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  14-day free trial · Cancel anytime
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums">
                  {plan.price}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{plan.interval}</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-8">
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-xl animate-pulse" />
                <div className="relative w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Redirecting to secure checkout...</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Don't close this tab.</p>
            </div>
          ) : error ? (
            <>
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300">
                {error}
              </div>
              <button
                type="button"
                onClick={createCheckoutSession}
                className="w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors dark:bg-white/10 dark:hover:bg-white/20"
              >
                Try again
              </button>
            </>
          ) : (
            <div>
              <button
                type="button"
                onClick={createCheckoutSession}
                className="group w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-500 hover:to-blue-500 transition-all"
              >
                <Lock className="w-4 h-4" />
                Continue to secure checkout
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>SSL secured</span>
                </div>
                <span className="text-gray-300 dark:text-gray-700">·</span>
                <span>Powered by Stripe</span>
              </div>
              <p className="text-center text-[11px] text-gray-400 mt-2 dark:text-gray-500">
                You won't be charged during the 14-day trial.
              </p>
            </div>
          )}
        </AuthCard>

        {/* Back links */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <Link to="/pricing" className="text-sm text-gray-500 hover:text-gray-700 transition-colors dark:text-gray-500 dark:hover:text-blue-300">
            &larr; Back to pricing
          </Link>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition-colors dark:text-gray-500 dark:hover:text-blue-300">
            Go to dashboard
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
