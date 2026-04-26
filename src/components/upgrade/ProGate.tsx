import { ReactNode } from 'react';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSubscriptionTier } from '../../hooks/useSubscriptionTier';
import { useUpgradeGate } from './UpgradeGateProvider';

type Feature = 'jobs' | 'customers' | 'invoices' | 'financials' | 'insights' | 'quickbooks' | 'marketplace' | 'generic';

interface ProGateProps {
  feature: Feature;
  children: ReactNode;
  /** Optional human-readable page name for the locked screen. */
  pageName?: string;
}

/**
 * Page-level gate. If the current user is a free sub (`sub_free`), this renders
 * an inline upgrade prompt instead of the page contents — blocking direct URL
 * access and not just nav clicks.
 *
 * GC / Sub Pro / trialing / past_due / unknown: passes through untouched.
 */
export function ProGate({ feature, children, pageName }: ProGateProps) {
  const { isFreeSub, isLoading } = useSubscriptionTier();
  const { openUpgrade } = useUpgradeGate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isFreeSub) return <>{children}</>;

  const label = pageName ?? featureLabel(feature);

  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-10">
      <div className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:border-indigo-500/20 dark:from-indigo-500/10 dark:via-gray-900 dark:to-blue-500/10 shadow-sm">
        {/* Subtle pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative p-8 lg:p-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-bold tracking-wide shadow shadow-indigo-500/30">
              <Sparkles className="w-3 h-3" />
              TRADE PRO
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">$14.99/mo · 14-day trial</span>
          </div>

          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                {label} is a Trade Pro feature
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                You're on the free Trade plan — perfect for tracking GC-assigned work. Upgrade to
                Trade Pro to run your own direct jobs, customers, invoicing, and financials.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            {PRO_BULLETS.map((b) => (
              <div key={b} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => openUpgrade(feature)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all"
            >
              See what's included
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/checkout?plan=sub_pro_monthly"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              Start 14-day trial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shared list so ProGate and UpgradeModal can't drift out of sync. Both the
// locked page AND the upgrade modal now show the exact same bullets.
// NOTE: Kept to features that actually exist. Marketplace was previously
// listed but the UI isn't built — removing until it ships so we don't
// promise something users can't find after they pay.
export const SUB_PRO_BENEFITS = [
  'Your own direct jobs & customers',
  'Send Stripe invoices',
  'QuickBooks sync',
  'Revenue-per-hour analytics',
  'Route optimization',
  'Auto-learning pricebook',
];

const PRO_BULLETS = SUB_PRO_BENEFITS;

function featureLabel(f: Feature): string {
  switch (f) {
    case 'jobs': return 'Jobs';
    case 'customers': return 'Customers';
    case 'invoices': return 'Invoices';
    case 'financials': return 'Financials';
    case 'insights': return 'Insights';
    case 'quickbooks': return 'QuickBooks sync';
    case 'marketplace': return 'Marketplace';
    default: return 'This area';
  }
}
