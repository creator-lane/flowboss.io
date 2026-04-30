/**
 * Post-checkout welcome modal — fires once when the user lands on
 * `/dashboard/home?welcome=1` from Stripe's success redirect. Quick
 * celebratory beat that frames the next 14 days as free, then drops
 * them into the activation checklist below.
 *
 * Self-cleans the query param after rendering so a refresh doesn't
 * pop the modal again, and persists a "shown" flag in localStorage
 * so even if Stripe redirects back here a second time (e.g. on a
 * second subscription), the user doesn't get the same welcome twice.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowDown, X } from 'lucide-react';
import { trackTrialStarted } from '../../lib/analytics';

const STORAGE_KEY = 'fb_post_checkout_welcome_shown';

export function PostCheckoutWelcome() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const isWelcome = searchParams.get('welcome') === '1';
    if (!isWelcome) return;

    const alreadyShown = localStorage.getItem(STORAGE_KEY);
    if (alreadyShown) {
      // Already saw this once — strip the param and move on.
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('welcome');
        return next;
      }, { replace: true });
      return;
    }

    setOpen(true);

    // GA4 `trial_started` custom event. We DON'T fire `purchase` here —
    // Stripe's Checkout success means the trial started, not that
    // money moved. The real `purchase` event is reported server-side
    // from stripe-webhook on `invoice.paid` (~14 days later when the
    // trial converts). That keeps Ads conversion value accurate.
    const sessionId = searchParams.get('session_id');
    const planFromQuery = searchParams.get('plan');
    trackTrialStarted({
      plan: planFromQuery,
      transactionId: sessionId,
    });

    // Strip the query param so a refresh doesn't re-fire (and a back-nav
    // back to /dashboard/home doesn't carry it). We persist via STORAGE_KEY
    // separately for the cross-session double-fire guard.
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('welcome');
      return next;
    }, { replace: true });
  }, [searchParams, setSearchParams]);

  function close() {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
      />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-7 dark:bg-gray-900 dark:border dark:border-white/10">
        <button
          onClick={close}
          className="absolute top-4 right-4 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-2xl" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold tracking-wide uppercase mb-3 dark:bg-emerald-500/15 dark:text-emerald-300">
            14 days free
          </div>

          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 dark:text-white">
            You're in. Welcome to FlowBoss.
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6 dark:text-gray-400">
            No charge for 14 days. Cancel anytime during the trial and you'll never be billed.
            Below the dashboard headers you'll see a 5-step checklist — finish it to go from
            "I just signed up" to "I just got paid."
          </p>

          <button
            onClick={close}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
          >
            <ArrowDown className="w-4 h-4" />
            Show me what's next
          </button>

          <p className="text-[11px] text-gray-400 mt-3 dark:text-gray-500">
            Most contractors finish all 5 steps in under 15 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
