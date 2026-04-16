import { Link } from 'react-router-dom';
import { X, Sparkles, CheckCircle2, ArrowRight, Lock, HardHat } from 'lucide-react';
import { useEffect } from 'react';
import { useProfile } from '../../hooks/useProfile';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  /** Which feature the user tried to access — shapes the headline + body copy. */
  feature?:
    | 'jobs'
    | 'customers'
    | 'invoices'
    | 'financials'
    | 'insights'
    | 'quickbooks'
    | 'marketplace'
    | 'generic';
}

/**
 * The feature map — headline + lead copy per locked feature.
 *
 * Purpose: meet the user where they are. If they clicked "Invoices" we lead with
 * invoicing. If they clicked "Customers" we lead with CRM. Generic copy feels
 * templatey; targeted copy converts.
 */
const FEATURE_COPY: Record<NonNullable<UpgradeModalProps['feature']>, { title: string; lead: string }> = {
  jobs: {
    title: 'Run your own direct jobs',
    lead: 'Sub Pro unlocks your own jobs — the ones you book directly, outside of GC projects. Full scheduling, invoicing, and customer tracking.',
  },
  customers: {
    title: 'Build your own customer CRM',
    lead: 'Keep track of every customer you\'ve served — their history, invoices, notes, photos. Sub Pro gives you the full CRM for your own shop.',
  },
  invoices: {
    title: 'Send direct invoices to your customers',
    lead: 'Create Stripe payment links, take on-site payments, and sync to QuickBooks. All without going through a GC.',
  },
  financials: {
    title: 'See your full financial picture',
    lead: 'Revenue, expenses, and profit across all your work — GC-referred AND direct. Understand where you actually make money.',
  },
  insights: {
    title: 'Revenue-per-hour analytics',
    lead: 'See which jobs actually pay the best. Margin per trade, revenue per hour, top customers — the numbers that change how you bid.',
  },
  quickbooks: {
    title: 'Sync everything to QuickBooks',
    lead: 'Push invoices, payments, and customer records straight to your books. No double-entry, no end-of-month cleanup.',
  },
  marketplace: {
    title: 'Claim your marketplace listing',
    lead: 'Sub Pro members get priority placement when GCs browse for reliable trades. Let quality work find you.',
  },
  generic: {
    title: 'Unlock your full shop with Sub Pro',
    lead: 'This feature is part of Sub Pro — direct jobs, your own customers, invoicing, and the full analytics suite.',
  },
};

const BENEFITS = [
  'Direct jobs & customer CRM',
  'Send Stripe invoices',
  'QuickBooks sync',
  'Revenue-per-hour analytics',
  'Auto-learning pricebook',
  'Marketplace listing priority',
];

export function UpgradeModal({ open, onClose, feature = 'generic' }: UpgradeModalProps) {
  const { isGC } = useProfile();
  const copy = FEATURE_COPY[feature];

  // If the user registered as a GC (or "both"), they should pay for the
  // Contractor plan, not Sub Pro. Show both, recommend Contractor. Marketplace
  // is Sub-Pro-only territory so keep the single-card layout there.
  const dualOffer = isGC && feature !== 'marketplace';

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm animate-backdrop-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white dark:bg-gray-900 dark:border dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-modal-fade-in overflow-hidden">
        {/* Gradient header */}
        <div className="relative bg-gradient-to-br from-indigo-500 via-blue-500 to-blue-600 px-6 py-8 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white blur-3xl" />
            <div className="absolute -bottom-10 right-0 w-40 h-40 rounded-full bg-indigo-300 blur-3xl" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] font-bold tracking-wider uppercase mb-3">
              <Sparkles className="w-3 h-3" />
              Sub Pro
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">
              {copy.title}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-6">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-5">
            {copy.lead}
          </p>

          {/* Benefit list */}
          <ul className="space-y-2.5 mb-6">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="w-4.5 h-4.5 text-green-500 flex-shrink-0 mt-0.5" />
                {b}
              </li>
            ))}
          </ul>

          {/* Price cards — transparent: real billable numbers. Dual-offer for GCs. */}
          {dualOffer ? (
            <>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider font-bold">
                You set up as a GC — Contractor plan is likely the right fit
              </p>
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {/* Sub Pro (secondary) */}
                <div className="relative rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <div className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400">Sub Pro</div>
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-extrabold text-gray-900 dark:text-white">$14.99</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">/mo</span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1 leading-snug">
                    Own shop only · no sub invites
                  </p>
                </div>
                {/* Contractor (recommended) */}
                <div className="relative rounded-xl border-2 border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-500/10 p-3">
                  <div className="absolute -top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-blue-600 text-white">
                    Recommended
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <HardHat className="w-3 h-3 text-blue-600" />
                    <div className="text-[10px] font-bold tracking-wider uppercase text-blue-700 dark:text-blue-300">Contractor</div>
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-extrabold text-gray-900 dark:text-white">$29.99</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">/mo</span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1 leading-snug">
                    Full tools + invite unlimited subs
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                14-day free trial on both plans · Cancel anytime
              </p>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-4 mb-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 mb-0.5">Sub Pro</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-gray-900 dark:text-white">$14.99</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">/mo</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500">Or annual</div>
                    <div className="flex items-baseline gap-1 justify-end">
                      <span className="text-lg font-bold text-gray-700 dark:text-gray-300">$99</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">/yr</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  14-day free trial · Cancel anytime · Your GC work stays free
                </p>
              </div>

              {/* Free tier reassurance — only for non-GC subs */}
              <div className="flex items-start gap-2.5 text-xs text-gray-500 dark:text-gray-400 mb-5 px-3 py-2.5 rounded-lg bg-green-50 border border-green-100 dark:bg-green-500/5 dark:border-green-500/20">
                <Lock className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-green-800 dark:text-green-300 leading-relaxed">
                  <strong>Nothing you have today goes away.</strong> GC projects, messages, tasks, and your earnings
                  view stay free forever — even if you never upgrade.
                </span>
              </div>
            </>
          )}

          {/* CTAs */}
          {dualOffer ? (
            <>
              <Link
                to="/checkout?plan=monthly"
                onClick={onClose}
                className="group w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
              >
                Start 14-day Contractor trial
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/checkout?plan=sub_pro_monthly"
                onClick={onClose}
                className="w-full mt-2 py-2.5 text-center block text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 underline decoration-dotted underline-offset-4 transition-colors"
              >
                Or just Sub Pro ($14.99/mo) →
              </Link>
            </>
          ) : (
            <Link
              to="/checkout?plan=sub_pro_monthly"
              onClick={onClose}
              className="group w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
            >
              Start 14-day Pro trial
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-2 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
