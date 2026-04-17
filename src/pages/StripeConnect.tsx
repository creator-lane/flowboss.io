import { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Smartphone, Monitor } from 'lucide-react';

/**
 * Detect whether the current browser is likely a mobile device.
 * Used to decide whether to auto-redirect to the flowboss:// custom scheme
 * (mobile) or show a desktop-dashboard CTA (everything else).
 */
function isLikelyMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  // Modern: navigator.userAgentData.mobile (Chromium only but accurate)
  const uaData: any = (navigator as any).userAgentData;
  if (uaData && typeof uaData.mobile === 'boolean') return uaData.mobile;
  // Fallback: UA string sniff. Not perfect but good enough for "should we
  // try the custom scheme?" — a false positive on desktop just means the
  // auto-open no-ops silently.
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile|Silk/i.test(navigator.userAgent || '');
}

export function StripeConnect() {
  const params = new URLSearchParams(window.location.search);
  const isRefresh = params.get('refresh') === 'true';
  const [mobile] = useState(() => isLikelyMobile());

  // Auto-open the mobile app only if we think we're on a mobile browser.
  // On desktop, firing flowboss:// does nothing useful — and even flashes
  // the "app not installed" prompt in some browsers. Skip it.
  useEffect(() => {
    if (!mobile) return;
    const timer = setTimeout(() => {
      window.location.href = 'flowboss://stripe-return';
    }, 1500);
    return () => clearTimeout(timer);
  }, [mobile]);

  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      {isRefresh ? (
        <>
          <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-6">
            <ArrowRight className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Let's finish setup</h1>
          <p className="text-gray-600 mb-8">
            Your Stripe setup wasn't completed. {mobile ? 'Return to FlowBoss to try again.' : 'Return to your dashboard to try again.'}
          </p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Stripe connected!</h1>
          <p className="text-gray-600 mb-8">
            {mobile
              ? 'Your Stripe account is set up. Returning you to FlowBoss now...'
              : 'Your Stripe account is set up. Head back to your dashboard to start sending invoices.'}
          </p>
        </>
      )}

      {mobile ? (
        <>
          <a
            href="flowboss://stripe-return"
            className="inline-flex items-center gap-2 bg-brand-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-600 transition-colors"
          >
            <Smartphone className="w-4 h-4" />
            Open FlowBoss
            <ArrowRight className="w-4 h-4" />
          </a>
          <p className="text-xs text-gray-400 mt-6">
            If the app doesn't open automatically,{' '}
            <a href="flowboss://stripe-return" className="underline">tap here</a>.
          </p>
        </>
      ) : (
        <>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-brand-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-600 transition-colors"
          >
            <Monitor className="w-4 h-4" />
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </a>
          <p className="text-xs text-gray-400 mt-6">
            You can also pick up in the FlowBoss mobile app if you prefer.
          </p>
        </>
      )}
    </div>
  );
}
