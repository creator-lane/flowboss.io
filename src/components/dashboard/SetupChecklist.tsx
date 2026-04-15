import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  X,
  Check,
  Circle,
  ChevronRight,
  PartyPopper,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────

export interface SetupChecklistProps {
  customersCount: number;
  jobsCount: number;
  sentInvoicesCount: number;
  scheduledJobsCount: number;
  hasPhone: boolean;
  hasBusinessName: boolean;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  done: boolean;
  href: string;
  cta: string;
}

// ── Storage key ─────────────────────────────────────────────────────

const DISMISSED_KEY = 'flowboss-setup-dismissed';

// ── Component ───────────────────────────────────────────────────────

export function SetupChecklist({
  customersCount,
  jobsCount,
  sentInvoicesCount,
  scheduledJobsCount,
  hasPhone,
  hasBusinessName,
}: SetupChecklistProps) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [fadingOut, setFadingOut] = useState(false);

  // Track which items just became checked so we can animate them
  const [prevDone, setPrevDone] = useState<Record<string, boolean>>({});
  const [justCompleted, setJustCompleted] = useState<Set<string>>(new Set());

  const items: ChecklistItem[] = useMemo(
    () => [
      {
        id: 'customers',
        label: 'Add your first customer',
        description: 'Import or create a customer to get rolling.',
        done: customersCount > 0,
        href: '/dashboard/customers',
        cta: 'Add customer',
      },
      {
        id: 'jobs',
        label: 'Create a job',
        description: 'Track work, materials, and progress in one place.',
        done: jobsCount > 0,
        href: '/dashboard/jobs',
        cta: 'Create job',
      },
      {
        id: 'invoices',
        label: 'Send an invoice',
        description: 'Bill a customer and get paid faster.',
        done: sentInvoicesCount > 0,
        href: '/dashboard/invoices',
        cta: 'Send invoice',
      },
      {
        id: 'schedule',
        label: 'Set up your schedule',
        description: 'Schedule a job so your crew knows where to be.',
        done: scheduledJobsCount > 0,
        href: '/dashboard/schedule',
        cta: 'Open schedule',
      },
      {
        id: 'profile',
        label: 'Complete your profile',
        description: 'Add your phone number and business name.',
        done: hasPhone && hasBusinessName,
        href: '/dashboard/settings',
        cta: 'Edit profile',
      },
    ],
    [customersCount, jobsCount, sentInvoicesCount, scheduledJobsCount, hasPhone, hasBusinessName],
  );

  // Detect newly-completed items for animation
  useEffect(() => {
    const newlyCompleted = new Set<string>();
    for (const item of items) {
      if (item.done && prevDone[item.id] === false) {
        newlyCompleted.add(item.id);
      }
    }
    if (newlyCompleted.size > 0) {
      setJustCompleted(newlyCompleted);
      const timer = setTimeout(() => setJustCompleted(new Set()), 600);
      return () => clearTimeout(timer);
    }
    // Update previous state
    const next: Record<string, boolean> = {};
    for (const item of items) next[item.id] = item.done;
    setPrevDone(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Update prevDone when items change (separate from animation effect)
  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const item of items) next[item.id] = item.done;
    setPrevDone(next);
  }, [items]);

  const completedCount = items.filter((i) => i.done).length;
  const allDone = completedCount === items.length;
  const pct = Math.round((completedCount / items.length) * 100);

  // Find the first uncompleted item to highlight
  const activeId = items.find((i) => !i.done)?.id ?? null;

  function handleDismiss() {
    setFadingOut(true);
    setTimeout(() => {
      try {
        localStorage.setItem(DISMISSED_KEY, 'true');
      } catch {
        // storage full — ignore
      }
      setDismissed(true);
    }, 300);
  }

  if (dismissed) return null;

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-300 ${
        fadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/30">
            {allDone ? (
              <PartyPopper className="w-4.5 h-4.5 text-brand-600 dark:text-brand-400" />
            ) : (
              <Sparkles className="w-4.5 h-4.5 text-brand-600 dark:text-brand-400" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {allDone ? "You're all set!" : 'Get Started with FlowBoss'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {allDone
                ? 'You completed every setup step. Nice work!'
                : `${completedCount} of ${items.length} complete`}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          aria-label="Dismiss setup checklist"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Progress bar ───────────────────────────────────────── */}
      <div className="px-5 pb-4">
        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* ── Checklist ──────────────────────────────────────────── */}
      {!allDone && (
        <ul className="border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((item) => {
            const isActive = item.id === activeId;
            const isJust = justCompleted.has(item.id);

            return (
              <li
                key={item.id}
                className={`flex items-center gap-3.5 px-5 py-3.5 transition-colors duration-200 ${
                  isActive
                    ? 'bg-brand-50/50 dark:bg-brand-900/10'
                    : ''
                } ${isJust ? 'animate-check-flash' : ''}`}
              >
                {/* Checkbox circle */}
                <div
                  className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                    item.done
                      ? 'bg-green-500 border-green-500 scale-100'
                      : 'border-gray-300 dark:border-gray-600'
                  } ${isJust ? 'scale-110' : ''}`}
                >
                  {item.done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium transition-colors ${
                      item.done
                        ? 'line-through text-gray-400 dark:text-gray-500'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {item.label}
                  </p>
                  <p
                    className={`text-xs mt-0.5 ${
                      item.done
                        ? 'text-gray-400 dark:text-gray-600'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {item.description}
                  </p>
                </div>

                {/* CTA */}
                {!item.done && (
                  <Link
                    to={item.href}
                    className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                  >
                    {item.cta}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* ── All-done celebration ───────────────────────────────── */}
      {allDone && (
        <div className="px-5 pb-5">
          <div className="flex items-center justify-center gap-3 py-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-800/40">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                Setup complete
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                FlowBoss is ready to roll. Go crush it.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="mt-3 w-full text-center text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Dismiss this card
          </button>
        </div>
      )}
    </div>
  );
}
