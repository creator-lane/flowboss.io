import React from 'react';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
  accentColor?: string;
}

const COLOR_MAP: Record<string, { bg: string; bgTo: string; btn: string; btnHover: string }> = {
  brand:   { bg: 'from-blue-100 to-blue-50',     bgTo: 'dark:from-blue-900/30 dark:to-blue-800/20',   btn: 'bg-blue-600',    btnHover: 'hover:bg-blue-700' },
  emerald: { bg: 'from-emerald-100 to-emerald-50', bgTo: 'dark:from-emerald-900/30 dark:to-emerald-800/20', btn: 'bg-emerald-600', btnHover: 'hover:bg-emerald-700' },
  cyan:    { bg: 'from-cyan-100 to-cyan-50',       bgTo: 'dark:from-cyan-900/30 dark:to-cyan-800/20',     btn: 'bg-cyan-600',    btnHover: 'hover:bg-cyan-700' },
  amber:   { bg: 'from-amber-100 to-amber-50',     bgTo: 'dark:from-amber-900/30 dark:to-amber-800/20',   btn: 'bg-amber-600',   btnHover: 'hover:bg-amber-700' },
  violet:  { bg: 'from-violet-100 to-violet-50',   bgTo: 'dark:from-violet-900/30 dark:to-violet-800/20', btn: 'bg-violet-600',  btnHover: 'hover:bg-violet-700' },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
  accentColor = 'brand',
}: EmptyStateProps) {
  const colors = COLOR_MAP[accentColor] || COLOR_MAP.brand;

  const handlePrimary = () => {
    if (onAction) {
      onAction();
    } else if (actionHref) {
      window.location.href = actionHref;
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center py-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Decorative dots */}
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

      {/* Icon circle */}
      <div
        className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${colors.bg} ${colors.bgTo} flex items-center justify-center mb-5 shadow-sm`}
      >
        <Icon className="w-7 h-7 text-gray-500 dark:text-gray-300" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-center leading-relaxed">
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

      {/* Secondary link */}
      {secondaryLabel && secondaryHref && (
        <a
          href={secondaryHref}
          className="mt-3 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {secondaryLabel}
        </a>
      )}
    </div>
  );
}
