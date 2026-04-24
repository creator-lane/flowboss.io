import { useState } from 'react';
import { AlertTriangle, CreditCard, Loader2 } from 'lucide-react';
import { useSubscriptionTier } from '../../hooks/useSubscriptionTier';
import { useAuth } from '../../lib/auth';
import { useToast } from '../ui/Toast';

// ──────────────────────────────────────────────────────────────────────
// GracePeriodBanner — shown when Stripe has flipped the user to past_due
// (card declined during auto-renewal, trial-to-paid charge failed, etc.).
//
// Why this gets top-of-dashboard real estate:
//   - Paid-trial model means Stripe will keep trying the card for ~23 days
//     before canceling. Every retry that fails is a lost opportunity to
//     recover the customer — and every day the user ignores the issue
//     makes it exponentially less likely they'll come back once canceled.
//   - Tracker (engagement.html) lists Grace Period as P0 #1: highest
//     per-user EV of any journey because the user already validated
//     intent with a card.
//
// The banner is intentionally non-dismissable. The only way to clear
// it is to update the card — which is exactly what we want.
// ──────────────────────────────────────────────────────────────────────

const BILLING_PORTAL_URL =
  'https://besbtasjpqmfqjkudmgu.supabase.co/functions/v1/create-billing-portal';

export function GracePeriodBanner() {
  const { status, isLoading } = useSubscriptionTier();
  const { session } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  if (isLoading || status !== 'past_due') return null;

  const handleUpdateCard = async () => {
    if (!session) {
      addToast('Sign in again to update your billing', 'error');
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(BILLING_PORTAL_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      const body = await resp.json().catch(() => ({}));
      if (resp.ok && body.url) {
        window.open(body.url, '_blank', 'noopener,noreferrer');
      } else {
        addToast(body.error || 'Could not open billing portal. Try again?', 'error');
      }
    } catch (err: any) {
      addToast(err?.message || 'Network error opening billing portal', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="alert"
      className="relative overflow-hidden rounded-2xl ring-2 ring-red-500/50 dark:ring-red-400/40 bg-gradient-to-r from-red-50 via-red-50/60 to-amber-50 dark:from-red-500/15 dark:via-red-500/10 dark:to-amber-500/10 p-4 sm:p-5 shadow-[0_0_0_4px_rgba(239,68,68,0.06)] dark:shadow-[0_0_0_4px_rgba(239,68,68,0.12)]"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-white dark:bg-white/10 ring-1 ring-red-300 dark:ring-red-400/40 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold tracking-wider uppercase text-red-700 dark:text-red-300 mb-0.5">
              Action needed — card declined
            </p>
            <p className="text-sm sm:text-base font-semibold text-red-900 dark:text-red-100 leading-snug">
              Your subscription didn't renew. Update your card in the next few days to keep access to invoices, jobs, and your whole book.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleUpdateCard}
          disabled={loading}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          Update payment method
        </button>
      </div>
    </div>
  );
}
