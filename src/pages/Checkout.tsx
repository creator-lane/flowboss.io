import { useState } from 'react';
import { Link, useSearchParams, Navigate } from 'react-router-dom';
import { Wrench, ArrowRight, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { AuthShell, AuthCard } from '../components/ui/AuthShell';

type Plan = {
  name: string;
  tier: 'gc' | 'sub_pro';
  price: string;
  interval: 'mo' | 'yr';
  perMonthEquivalent?: string;
  saveCopy?: string;
  partnerKey: string; // the OTHER interval for this tier (toggle target)
};

const PLANS: Record<string, Plan> = {
  monthly:         { name: 'Contractor', tier: 'gc',     price: '$29.99',  interval: 'mo', partnerKey: 'annual' },
  annual:          { name: 'Contractor', tier: 'gc',     price: '$199.99', interval: 'yr', perMonthEquivalent: '$16.67/mo', saveCopy: 'Save $160/yr', partnerKey: 'monthly' },
  sub_pro_monthly: { name: 'Trade Pro',  tier: 'sub_pro', price: '$14.99',  interval: 'mo', partnerKey: 'sub_pro_annual' },
  sub_pro_annual:  { name: 'Trade Pro',  tier: 'sub_pro', price: '$99.99',  interval: 'yr', perMonthEquivalent: '$8.33/mo', saveCopy: 'Save $80/yr', partnerKey: 'sub_pro_monthly' },
};

export function Checkout() {
  const { session, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  // All hooks must run BEFORE any conditional early return, otherwise React's
  // hook count changes between renders and the component crashes with
  // "Rendered fewer hooks than expected" once auth resolves.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const planKey = searchParams.get('plan') || 'monthly';
  const plan = PLANS[planKey] || PLANS.monthly;
  const partner = PLANS[plan.partnerKey];

  // Switching billing cadence (monthly ↔ annual) keeps the user on this
  // page — just rewrites the ?plan= param so the rest of the page
  // recomputes. No bounce to /pricing required.
  function switchPlan(nextKey: string) {
    setError('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('plan', nextKey);
      return next;
    }, { replace: true });
  }

  // Not signed in → bounce to signup, preserving the plan
  if (!authLoading && !session) {
    return <Navigate to={`/signup?plan=${planKey}`} replace />;
  }

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
          {/* Logo + headline. Lead with "14 days free" — that's the
              psychological anchor that gets users to click Continue.
              The price comes after, as "what happens after the trial,"
              not as the first big number on the screen. */}
          <div className="flex flex-col items-center mb-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold tracking-wide uppercase mb-2 dark:bg-emerald-500/15 dark:text-emerald-300">
              <Sparkles className="w-3 h-3" />
              14 days free
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight text-center">
              Try {plan.name} free for 14 days
            </h1>
            <p className="text-sm text-gray-500 mt-2 text-center dark:text-gray-400 max-w-xs">
              No charge today. Cancel anytime during the trial — you'll never be billed.
            </p>
          </div>

          {/* Billing toggle — monthly ↔ annual without leaving the page. */}
          <div className="flex p-1 rounded-xl bg-gray-100 ring-1 ring-gray-200/70 mb-4 dark:bg-white/5 dark:ring-white/10">
            <button
              type="button"
              onClick={() => switchPlan(plan.interval === 'mo' ? planKey : plan.partnerKey)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                plan.interval === 'mo'
                  ? 'bg-white text-blue-700 shadow-md shadow-gray-300/30 ring-1 ring-blue-200/60 dark:bg-white/15 dark:text-blue-200 dark:ring-blue-400/30'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => switchPlan(plan.interval === 'yr' ? planKey : plan.partnerKey)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                plan.interval === 'yr'
                  ? 'bg-white text-blue-700 shadow-md shadow-gray-300/30 ring-1 ring-blue-200/60 dark:bg-white/15 dark:text-blue-200 dark:ring-blue-400/30'
                  : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Annual
              {/* Savings tag is always visible so users glancing at "Annual"
                  see the upside immediately, regardless of which is selected. */}
              <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Save {plan.interval === 'yr' ? plan.saveCopy?.replace('Save ', '') : partner?.saveCopy?.replace('Save ', '')}
              </span>
            </button>
          </div>

          {/* Plan summary — price as "after trial," not as the headline. */}
          <div className="relative rounded-2xl p-4 sm:p-5 mb-5 border border-blue-200 bg-gradient-to-br from-blue-50 to-white overflow-hidden dark:border-blue-500/20 dark:from-blue-500/10 dark:to-transparent">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-bold tracking-wide uppercase text-blue-600 dark:text-blue-300 mb-1">
                  {plan.name} {plan.interval === 'yr' ? 'Annual' : 'Monthly'}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  After your 14-day free trial
                </p>
                {plan.perMonthEquivalent && (
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1 dark:text-emerald-300">
                    Works out to {plan.perMonthEquivalent}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-baseline justify-end gap-0.5">
                  <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums">
                    {plan.price}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">/{plan.interval}</span>
                </div>
                {plan.saveCopy && (
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-700 mt-0.5 dark:text-emerald-300">
                    {plan.saveCopy}
                  </span>
                )}
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
              {/* Disabled while auth is still hydrating — without this, the
                  first click while `session` was still null fired
                  createCheckoutSession's `if (!session) return` silently,
                  forcing the user to click twice. We now refuse the click
                  until session is real, and the loading spinner shows the
                  in-flight state explicitly. */}
              <button
                type="button"
                onClick={createCheckoutSession}
                disabled={authLoading || !session}
                className="group w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-500 hover:to-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Lock className="w-4 h-4" />
                {authLoading || !session ? 'Loading…' : 'Continue to secure checkout'}
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
