import { useEffect } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';

export function StripeConnect() {
  const params = new URLSearchParams(window.location.search);
  const isRefresh = params.get('refresh') === 'true';

  // Auto-open the app after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = 'flowboss://stripe-return';
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      {isRefresh ? (
        <>
          <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-6">
            <ArrowRight className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Let's finish setup</h1>
          <p className="text-gray-600 mb-8">
            Your Stripe setup wasn't completed. Return to FlowBoss to try again.
          </p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Stripe connected!</h1>
          <p className="text-gray-600 mb-8">
            Your Stripe account is set up. Returning you to FlowBoss now...
          </p>
        </>
      )}

      <a
        href="flowboss://stripe-return"
        className="inline-flex items-center gap-2 bg-brand-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-600 transition-colors"
      >
        Open FlowBoss
        <ArrowRight className="w-4 h-4" />
      </a>

      <p className="text-xs text-gray-400 mt-6">
        If the app doesn't open automatically,{' '}
        <a href="flowboss://stripe-return" className="underline">tap here</a>.
      </p>
    </div>
  );
}
