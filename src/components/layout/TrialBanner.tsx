import { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, X, ArrowRight } from 'lucide-react';

import { api } from '../../lib/api';

// ─────────────────────────────────────────────────────────────────────────
// Trial banner — shows trial users their remaining days + an upgrade CTA
// across the top of the dashboard, just under the header.
//
// Modeled on the demo's persistent "Live demo · [role]" strip that gives
// visitors a clear sense of where they are. Real trial users had nothing
// equivalent: no idea what day of the trial they were on, no nudge toward
// the upgrade flow until things broke.
//
// Visibility rules:
//   - subscription_status === 'trialing'  AND  trial_end is set
//   - hidden when the user is on /dashboard/settings (they're already in
//     the billing context — duplicate)
//   - dismissable for the session (sessionStorage)
// ─────────────────────────────────────────────────────────────────────────

const SESSION_DISMISS_KEY = 'flowboss:trialBanner:dismissed';

function daysUntil(iso: string): number | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function TrialBanner() {
  const location = useLocation();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
    staleTime: 60_000,
  });

  const settings: any = (data as any)?.data ?? data ?? {};
  const status = settings?.subscription_status ?? settings?.subscriptionStatus;
  const trialEnd = settings?.trial_end ?? settings?.trialEnd;
  const isTrialing = status === 'trialing' && !!trialEnd;

  const remaining = useMemo(() => (trialEnd ? daysUntil(trialEnd) : null), [trialEnd]);

  // Reset dismissal when trial state goes away (so users who upgrade and
  // then return to trial — edge case — get a fresh banner).
  useEffect(() => {
    if (!isTrialing) {
      try {
        sessionStorage.removeItem(SESSION_DISMISS_KEY);
      } catch { /* ignore */ }
    }
  }, [isTrialing]);

  if (!isTrialing) return null;
  if (dismissed) return null;
  // Don't double up on the Settings page where the subscription card already
  // shows the same info.
  if (location.pathname.startsWith('/dashboard/settings')) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(SESSION_DISMISS_KEY, '1');
    } catch { /* ignore */ }
    setDismissed(true);
  };

  // Color shift as the trial winds down — calm at >5 days, urgent at ≤2.
  const urgent = remaining !== null && remaining <= 2;
  const moderate = remaining !== null && remaining <= 5 && !urgent;

  const tone = urgent
    ? 'from-rose-600 to-orange-500'
    : moderate
      ? 'from-amber-500 to-orange-500'
      : 'from-brand-600 to-violet-600';

  const headline = remaining === null
    ? 'You\'re on a free trial'
    : remaining === 0
      ? 'Your trial ends today'
      : remaining === 1
        ? '1 day left in your free trial'
        : `${remaining} days left in your free trial`;

  const subline = urgent
    ? 'Pick a plan to keep your data, customers, and invoices flowing.'
    : 'Pick a plan whenever you\'re ready — keep everything you\'ve set up.';

  return (
    <div className={`bg-gradient-to-r ${tone} text-white`}>
      <div className="px-4 lg:px-6 py-2 flex items-center justify-between gap-3 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-2 min-w-0 text-xs sm:text-sm">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="font-semibold truncate">{headline}</span>
          <span className="hidden sm:inline text-white/80 truncate">· {subline}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            to="/dashboard/settings"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/15 hover:bg-white/25 text-[11px] font-bold transition-colors whitespace-nowrap"
          >
            Pick a plan
            <ArrowRight className="w-3 h-3" />
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss trial banner"
            className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/15 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
