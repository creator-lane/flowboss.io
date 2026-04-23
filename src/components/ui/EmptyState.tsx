import React from 'react';
import { SignatureStripe } from './SignatureStripe';

interface EmptyStateProps {
  /** Lucide icon — used when no `illustration` is provided (default, works for internal/secondary empty states). */
  icon?: React.ElementType;
  /** Custom illustration component (SVG). Takes precedence over `icon` — use for high-visibility empty states (Jobs, Customers, Invoices, GC Projects). */
  illustration?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
  /** Optional click handler for the secondary action. Preferred over secondaryHref when the secondary action is a button (e.g. "Load Demo Data"). */
  onSecondaryAction?: () => void;
  /** When true, disable the secondary action (e.g. already-performed demo load). */
  secondaryDisabled?: boolean;
  accentColor?: string;
  /** Show the amber hi-vis signature stripe behind the illustration. Defaults to true when `illustration` is provided. */
  showStripe?: boolean;
}

// Light: warm gradient chips. Dark: translucent brand-tinted chip (matches homepage pattern).
const COLOR_MAP: Record<string, { bg: string; dark: string; btn: string; btnHover: string }> = {
  brand:   { bg: 'from-blue-100 to-blue-50',       dark: 'dark:bg-blue-500/10 dark:border dark:border-blue-500/20 dark:bg-none',       btn: 'bg-blue-600',    btnHover: 'hover:bg-blue-700' },
  emerald: { bg: 'from-emerald-100 to-emerald-50', dark: 'dark:bg-emerald-500/10 dark:border dark:border-emerald-500/20 dark:bg-none', btn: 'bg-emerald-600', btnHover: 'hover:bg-emerald-700' },
  cyan:    { bg: 'from-cyan-100 to-cyan-50',       dark: 'dark:bg-cyan-500/10 dark:border dark:border-cyan-500/20 dark:bg-none',       btn: 'bg-cyan-600',    btnHover: 'hover:bg-cyan-700' },
  amber:   { bg: 'from-amber-100 to-amber-50',     dark: 'dark:bg-amber-500/10 dark:border dark:border-amber-500/20 dark:bg-none',     btn: 'bg-amber-600',   btnHover: 'hover:bg-amber-700' },
  violet:  { bg: 'from-violet-100 to-violet-50',   dark: 'dark:bg-violet-500/10 dark:border dark:border-violet-500/20 dark:bg-none',   btn: 'bg-violet-600',  btnHover: 'hover:bg-violet-700' },
  indigo:  { bg: 'from-indigo-100 to-indigo-50',   dark: 'dark:bg-indigo-500/10 dark:border dark:border-indigo-500/20 dark:bg-none',   btn: 'bg-indigo-600',  btnHover: 'hover:bg-indigo-700' },
  green:   { bg: 'from-green-100 to-green-50',     dark: 'dark:bg-green-500/10 dark:border dark:border-green-500/20 dark:bg-none',     btn: 'bg-green-600',   btnHover: 'hover:bg-green-700' },
  purple:  { bg: 'from-purple-100 to-purple-50',   dark: 'dark:bg-purple-500/10 dark:border dark:border-purple-500/20 dark:bg-none',   btn: 'bg-purple-600',  btnHover: 'hover:bg-purple-700' },
  blue:    { bg: 'from-blue-100 to-blue-50',       dark: 'dark:bg-blue-500/10 dark:border dark:border-blue-500/20 dark:bg-none',       btn: 'bg-blue-600',    btnHover: 'hover:bg-blue-700' },
};

export function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
  onSecondaryAction,
  secondaryDisabled,
  accentColor = 'brand',
  showStripe,
}: EmptyStateProps) {
  const colors = COLOR_MAP[accentColor] || COLOR_MAP.brand;
  const stripeVisible = showStripe ?? !!illustration;

  const handlePrimary = () => {
    if (onAction) {
      onAction();
    } else if (actionHref) {
      window.location.href = actionHref;
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center py-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Decorative dots — retained as ambient background texture */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] dark:opacity-[0.06]">
        <div
          className="w-64 h-64"
          style={{
            backgroundImage:
              'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />
      </div>

      {/* Illustration slot — takes precedence over icon. Wrapped in a
          signature-stripe container so every illustrated empty state carries
          the same amber accent, giving us brand repetition without custom
          SVG work for each page. */}
      {illustration ? (
        <div className="relative w-40 h-40 mb-5">
          {stripeVisible && (
            <div className="absolute inset-2 rounded-3xl overflow-hidden">
              <SignatureStripe intensity="low" />
            </div>
          )}
          <div className="relative z-10 w-full h-full">{illustration}</div>
        </div>
      ) : Icon ? (
        <div
          className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${colors.bg} ${colors.dark} flex items-center justify-center mb-5 shadow-sm`}
        >
          <Icon className="w-7 h-7 text-gray-500 dark:text-gray-300" />
        </div>
      ) : null}

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center px-4">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-center leading-relaxed px-4">
        {description}
      </p>

      {/* Primary CTA */}
      {actionLabel && (
        <button
          type="button"
          onClick={handlePrimary}
          className={`mt-6 inline-flex items-center gap-2 px-5 py-2.5 ${colors.btn} ${colors.btnHover} text-white text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-200`}
        >
          {actionLabel}
        </button>
      )}

      {/* Secondary action — button wins over href since we want to drive
          in-app mutations (e.g. "Load Demo Data") without full-page reloads. */}
      {secondaryLabel && onSecondaryAction ? (
        <button
          type="button"
          onClick={onSecondaryAction}
          disabled={secondaryDisabled}
          className="mt-3 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline decoration-dotted underline-offset-4 transition-colors disabled:opacity-50 disabled:no-underline"
        >
          {secondaryLabel}
        </button>
      ) : secondaryLabel && secondaryHref ? (
        <a
          href={secondaryHref}
          className="mt-3 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {secondaryLabel}
        </a>
      ) : null}
    </div>
  );
}
