import { useEffect, useState } from 'react';
import { Link, useSearchParams, Navigate } from 'react-router-dom';
import { Wrench, Smartphone } from 'lucide-react';
import { useAuth } from '../lib/auth';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-12 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 dark:bg-white/5 dark:backdrop-blur-sm dark:border-white/10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mb-3">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Checkout</h1>
          </div>

          {/* Plan summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 dark:bg-white/5 dark:border dark:border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{plan.name} Plan</p>
                <p className="text-xs text-gray-500 mt-0.5 dark:text-gray-400">14-day free trial included</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{plan.interval}</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-8">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to secure checkout...</p>
            </div>
          ) : error ? (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300">
              {error}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 dark:bg-blue-500/10 dark:border dark:border-blue-500/20">
                <Smartphone className="w-7 h-7 text-blue-600 dark:text-blue-300" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 dark:text-white">
                Start your 14-day free trial
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-6 dark:text-gray-400">
                You won't be charged during the trial. Cancel anytime from Settings.
              </p>
              <button
                type="button"
                onClick={createCheckoutSession}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/20"
              >
                Continue to Secure Checkout
              </button>
              <p className="text-[11px] text-gray-400 mt-3 dark:text-gray-500">Powered by Stripe · SSL secured</p>
            </div>
          )}
        </div>

        {/* Back links */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <Link to="/pricing" className="text-sm text-gray-500 hover:text-brand-500 transition-colors dark:text-gray-500 dark:hover:text-blue-300">
            &larr; Back to pricing
          </Link>
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-brand-500 transition-colors dark:text-gray-500 dark:hover:text-blue-300">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
