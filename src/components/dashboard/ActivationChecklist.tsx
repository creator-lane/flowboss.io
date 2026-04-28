/**
 * Activation Checklist — the single most important UI on a brand-new
 * paid contractor's dashboard. Five sequenced milestones that take
 * them from "I just paid" to "I'm collecting money on this app."
 *
 * Pulled from src/hooks/useActivationProgress (which derives the five
 * booleans from real data). Sample data does NOT count — seeing a
 * pre-seeded sample customer shouldn't make a new user think step 1
 * is done.
 *
 * Auto-hides when:
 *   - All 5 steps are done (5/5 = activated, no more nag)
 *   - The user explicitly dismisses (persists in onboarding progress)
 *
 * Designed to be the literal first thing on the Home page — above
 * the daily briefing, alerts, the lot — for users who haven't hit
 * 5/5 yet. Mobile parity reference: GettingStartedChecklist on the
 * Schedule tab + ProgressInterstitial bottom-sheet after each step.
 * Web is a single card, no bottom-sheet — desktop space lets us
 * keep all 5 visible at once.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  X,
  Users,
  Calendar,
  CreditCard,
  Send,
  DollarSign,
} from 'lucide-react';
import { useActivationProgress } from '../../hooks/useActivationProgress';
import { useOnboardingProgress } from '../../hooks/useOnboardingProgress';

interface ActivationChecklistProps {
  onAddCustomer?: () => void;
  onAddJob?: () => void;
  onCreateInvoice?: () => void;
}

const DISMISS_KEY = 'activation-checklist';

export function ActivationChecklist({ onAddCustomer, onAddJob, onCreateInvoice }: ActivationChecklistProps) {
  const navigate = useNavigate();
  const progress = useActivationProgress();
  const { hasDismissedTip, dismissTip } = useOnboardingProgress();
  const [showCelebration, setShowCelebration] = useState(false);

  const dismissed = hasDismissedTip(DISMISS_KEY);

  // Hide entirely once user finished all 5 OR explicitly dismissed.
  if (dismissed || progress.isComplete) return null;

  // Don't flash an empty/loading skeleton on first paint — the queries
  // dedupe with the home page's existing fetches, so by the time the
  // home page paints we usually have the data. If somehow we don't,
  // just don't render until we do (avoids "1 of 5 done" flicker).
  if (progress.isLoading) return null;

  type Step = {
    key: 'customer' | 'job' | 'stripe' | 'invoice' | 'paid';
    done: boolean;
    icon: React.ElementType;
    title: string;
    helper: string;
    actionLabel: string;
    onClick: () => void;
  };

  const steps: Step[] = [
    {
      key: 'customer',
      done: progress.customer,
      icon: Users,
      title: 'Add your first customer',
      helper: 'Save a real customer so jobs and invoices have somewhere to land.',
      actionLabel: 'Add customer',
      onClick: () => (onAddCustomer ? onAddCustomer() : navigate('/dashboard/customers')),
    },
    {
      key: 'job',
      done: progress.job,
      icon: Calendar,
      title: 'Schedule a job',
      helper: 'Lock down a date, address, and scope. This is what flows into your schedule and invoices.',
      actionLabel: 'Add a job',
      onClick: () => (onAddJob ? onAddJob() : navigate('/dashboard/jobs')),
    },
    {
      key: 'stripe',
      done: progress.stripe,
      icon: CreditCard,
      title: 'Connect Stripe to get paid',
      helper: 'Takes 2 minutes. Without this, your customers can’t pay by card.',
      actionLabel: 'Connect Stripe',
      onClick: () => navigate('/dashboard/settings'),
    },
    {
      key: 'invoice',
      done: progress.invoice,
      icon: Send,
      title: 'Send your first invoice',
      helper: 'Pull line items off a job, send via email or text. Customers click → pay on Stripe.',
      actionLabel: 'Create invoice',
      onClick: () => (onCreateInvoice ? onCreateInvoice() : navigate('/dashboard/invoices')),
    },
    {
      key: 'paid',
      done: progress.paid,
      icon: DollarSign,
      title: 'Get paid',
      helper: 'When the customer pays, FlowBoss reconciles automatically. This is the magic moment.',
      actionLabel: 'View invoices',
      onClick: () => navigate('/dashboard/invoices'),
    },
  ];

  const nextStep = steps.find((s) => !s.done);

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-blue-50 via-white to-emerald-50/40 ring-1 ring-blue-200/60 shadow-sm p-5 lg:p-6 dark:from-blue-500/10 dark:via-transparent dark:to-emerald-500/5 dark:ring-blue-400/20">
      {/* Dismiss — small X top-right. Only available when at least 2/5
          done so a brand-new user doesn't accidentally hide it before
          they've gotten any value. */}
      {progress.totalDone >= 2 && (
        <button
          type="button"
          onClick={() => dismissTip(DISMISS_KEY)}
          className="absolute top-3 right-3 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-white/40 transition-colors dark:text-gray-500 dark:hover:text-gray-300"
          title="Hide this checklist"
          aria-label="Hide checklist"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/25">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {progress.totalDone === 0
              ? 'Get set up to make money'
              : `${progress.totalDone} of ${progress.totalSteps} done — keep going`}
          </h2>
          <p className="text-xs text-gray-500 leading-snug dark:text-gray-400">
            5 quick steps from sign-up to your first paid invoice. Most contractors finish in under 15 minutes.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-blue-100 overflow-hidden mb-5 dark:bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
          style={{ width: `${progress.pct}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isNext = step === nextStep;
          return (
            <button
              key={step.key}
              type="button"
              onClick={step.done ? undefined : step.onClick}
              disabled={step.done}
              className={`group w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                step.done
                  ? 'bg-emerald-50/60 cursor-default dark:bg-emerald-500/[0.06]'
                  : isNext
                  ? 'bg-white ring-1 ring-blue-300 hover:ring-blue-400 hover:shadow-md cursor-pointer dark:bg-white/5 dark:ring-blue-400/30'
                  : 'bg-white/60 hover:bg-white hover:shadow-sm cursor-pointer dark:bg-white/[0.03] dark:hover:bg-white/[0.06]'
              }`}
            >
              {/* Status icon */}
              <div className="flex-shrink-0">
                {step.done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors dark:text-gray-600" />
                )}
              </div>

              {/* Step number + icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                step.done
                  ? 'bg-emerald-100 dark:bg-emerald-500/15'
                  : isNext
                  ? 'bg-blue-100 dark:bg-blue-500/15'
                  : 'bg-gray-100 dark:bg-white/10'
              }`}>
                <Icon className={`w-4 h-4 ${
                  step.done
                    ? 'text-emerald-600 dark:text-emerald-300'
                    : isNext
                    ? 'text-blue-600 dark:text-blue-300'
                    : 'text-gray-500 dark:text-gray-400'
                }`} />
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold tracking-wider uppercase ${
                    step.done ? 'text-emerald-600 dark:text-emerald-300' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    Step {idx + 1}
                  </span>
                  {isNext && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                      Next
                    </span>
                  )}
                </div>
                <h3 className={`text-sm font-semibold ${
                  step.done ? 'text-gray-500 line-through dark:text-gray-500' : 'text-gray-900 dark:text-white'
                }`}>
                  {step.title}
                </h3>
                {!step.done && (
                  <p className="text-[11px] text-gray-500 leading-snug mt-0.5 dark:text-gray-400">
                    {step.helper}
                  </p>
                )}
              </div>

              {/* CTA */}
              {!step.done && (
                <div className={`flex-shrink-0 flex items-center gap-1 text-[12px] font-semibold ${
                  isNext ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 group-hover:text-blue-600 dark:text-gray-400 dark:group-hover:text-blue-300'
                }`}>
                  <span className="hidden sm:inline">{step.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer copy — reassurance + escape hatch */}
      <p className="text-[11px] text-gray-400 text-center mt-4 leading-relaxed dark:text-gray-500">
        Stuck on a step? <Link to="/support" className="text-blue-600 hover:text-blue-700 underline decoration-dotted dark:text-blue-300">Contact support</Link>
        {progress.totalDone >= 2 && (
          <>
            {' '}or{' '}
            <button onClick={() => dismissTip(DISMISS_KEY)} className="text-gray-500 hover:text-gray-700 underline decoration-dotted dark:text-gray-400 dark:hover:text-gray-200">
              hide this checklist
            </button>
          </>
        )}
        .
      </p>

      {/* Future: small celebration when isComplete transitions true.
          Punted to the post-checkout welcome modal for now since the
          checklist auto-hides at 5/5 anyway — celebration moves to a
          one-shot toast there. */}
    </div>
  );
}

// Re-export so the home page can show a celebratory toast at 5/5
// without re-importing useActivationProgress separately.
export { useActivationProgress };
