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

  // When the edge function is deployed, uncomment this to auto-redirect to Stripe
  useEffect(() => {
    if (!session) return;

    async function createCheckoutSession() {
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

        if (!response.ok) {
          // Edge function not deployed yet — fall through to "coming soon" UI
          setLoading(false);
          return;
        }

        const { url } = await response.json();
        if (url) {
          window.location.href = url;
        } else {
          setLoading(false);
        }
      } catch {
        // Edge function not available yet — show coming soon state
        setLoading(false);
      }
    }

    createCheckoutSession();
  }, [session, planKey]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mb-3">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
          </div>

          {/* Plan summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{plan.name} Plan</p>
                <p className="text-xs text-gray-500 mt-0.5">14-day free trial included</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-sm text-gray-500">{plan.interval}</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-8">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-500">Redirecting to secure checkout...</p>
            </div>
          ) : error ? (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          ) : (
            <>
              {/* Coming Soon state */}
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Web Payments Coming Soon
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  We're finalizing web payments. In the meantime, download the app to start
                  your free trial today.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="https://apps.apple.com/app/id6761025816"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    App Store
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=io.flowboss.app"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35zm13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27zm.91-.91L19.59 12l-1.87-2.21-2.27 2.27 2.27 2.15zM6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z" />
                    </svg>
                    Google Play
                  </a>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Back links */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <Link to="/pricing" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">
            &larr; Back to pricing
          </Link>
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-brand-500 transition-colors">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
