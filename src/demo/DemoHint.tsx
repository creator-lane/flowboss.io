// Demo-only "feature billboard" — big, colorful, in-line callout that
// teaches the visitor what a feature does and sells the outcome.
//
// Visitors land in /demo/full with zero context. They don't know what the
// buttons do, why they'd care, or that signing up unlocks them. Each hint
// answers three things:
//   1. WHAT the feature does ("Invite a sub-contractor to this trade")
//   2. WHY they care ("They get a free dashboard, you stay in control")
//   3. NEXT STEP ("Sign up free → 14 days, no card")
//
// The component self-detects demo mode by checking the URL pathname. In
// production it renders `null`, so it's safe to drop inline next to any
// real button without conditional wrappers everywhere.
//
// Sized like a mobile-interstitial on desktop — bright gradient, big icon,
// prominent CTA. NOT a small tooltip; this is supposed to grab attention.
//
// Variants:
//   - "billboard" (default) — big inline panel, ~full-width of its column
//   - "spotlight"           — same look but with an arrow pointing at a
//                             specific neighbor (use sparingly)
//
// Each hint takes a unique `id`. Visitors can dismiss them with X; the
// dismissal is remembered for the session via sessionStorage so we don't
// fight the user on every navigation.

import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';

interface DemoHintProps {
  /** Unique id used for "don't show again this session" memory */
  id: string;
  /** Headline — verb-led, e.g. "Assign a sub-contractor to this trade" */
  title: string;
  /** 1-2 sentence body. Explain the feature + sell the outcome. */
  body: string;
  /** CTA label — defaults to "Sign up free →" */
  cta?: string;
  /** Where the CTA goes — defaults to /signup */
  ctaHref?: string;
  /** Visual variant */
  variant?: 'billboard' | 'spotlight';
  /** For spotlight: where the arrow points relative to the hint's container */
  arrow?: 'up' | 'down' | 'left' | 'right';
  /** Optional className for outer wrapper positioning tweaks */
  className?: string;
  /** Color theme — defaults to "fuchsia" (hot pink → orange) */
  tone?: 'fuchsia' | 'blue' | 'emerald' | 'amber';
  /** Optional emoji shown next to the headline */
  emoji?: string;
}

function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/demo/full/');
}

const SESSION_DISMISS_KEY = 'flowboss:demoHint:dismissed';

function getDismissedSet(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SESSION_DISMISS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function rememberDismissed(id: string) {
  try {
    const set = getDismissedSet();
    set.add(id);
    sessionStorage.setItem(SESSION_DISMISS_KEY, JSON.stringify([...set]));
  } catch {
    /* noop */
  }
}

const TONES: Record<NonNullable<DemoHintProps['tone']>, {
  border: string;
  badge: string;
  badgeText: string;
  cta: string;
  iconBg: string;
  glow: string;
}> = {
  fuchsia: {
    border: 'from-fuchsia-500 via-orange-400 to-amber-300',
    badge: 'from-fuchsia-600 to-orange-500',
    badgeText: 'text-fuchsia-600',
    cta: 'bg-gradient-to-r from-fuchsia-600 to-orange-500 hover:from-fuchsia-700 hover:to-orange-600',
    iconBg: 'bg-gradient-to-br from-fuchsia-500 to-orange-400',
    glow: 'shadow-fuchsia-500/30',
  },
  blue: {
    border: 'from-blue-500 via-indigo-500 to-violet-500',
    badge: 'from-blue-600 to-violet-600',
    badgeText: 'text-blue-600',
    cta: 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700',
    iconBg: 'bg-gradient-to-br from-blue-500 to-violet-500',
    glow: 'shadow-blue-500/30',
  },
  emerald: {
    border: 'from-emerald-500 via-teal-400 to-cyan-400',
    badge: 'from-emerald-600 to-teal-500',
    badgeText: 'text-emerald-600',
    cta: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-400',
    glow: 'shadow-emerald-500/30',
  },
  amber: {
    border: 'from-amber-400 via-orange-500 to-rose-500',
    badge: 'from-amber-600 to-rose-500',
    badgeText: 'text-amber-700',
    cta: 'bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600',
    iconBg: 'bg-gradient-to-br from-amber-400 to-rose-500',
    glow: 'shadow-amber-500/30',
  },
};

export function DemoHint({
  id,
  title,
  body,
  cta = 'Sign up free →',
  ctaHref = '/signup',
  variant = 'billboard',
  arrow,
  className = '',
  tone = 'fuchsia',
  emoji,
}: DemoHintProps) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (id && getDismissedSet().has(id)) {
      setDismissed(true);
    }
    // Trigger the entrance animation after first paint
    const t = window.setTimeout(() => setMounted(true), 50);
    return () => window.clearTimeout(t);
  }, [id]);

  if (!isDemoMode() || dismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    rememberDismissed(id);
    setDismissed(true);
  };

  const t = TONES[tone];

  const arrowClass =
    variant === 'spotlight'
      ? arrow === 'up'
        ? `before:content-[''] before:absolute before:-top-2 before:left-8 before:w-4 before:h-4 before:rotate-45 before:bg-gradient-to-br ${t.border}`
        : arrow === 'down'
        ? `before:content-[''] before:absolute before:-bottom-2 before:left-8 before:w-4 before:h-4 before:rotate-45 before:bg-gradient-to-br ${t.border}`
        : arrow === 'left'
        ? `before:content-[''] before:absolute before:-left-2 before:top-8 before:w-4 before:h-4 before:rotate-45 before:bg-gradient-to-br ${t.border}`
        : arrow === 'right'
        ? `before:content-[''] before:absolute before:-right-2 before:top-8 before:w-4 before:h-4 before:rotate-45 before:bg-gradient-to-br ${t.border}`
        : ''
      : '';

  return (
    <div
      className={`relative w-full max-w-md transition-all duration-500 ease-out ${
        mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-[0.98]'
      } ${className}`}
      role="note"
    >
      <div
        className={`relative rounded-2xl p-[2.5px] bg-gradient-to-br ${t.border} shadow-xl ${t.glow} animate-[demoHintPulse_2.6s_ease-in-out_infinite] ${arrowClass}`}
      >
        <div className="rounded-[14px] bg-white p-4 sm:p-5 dark:bg-neutral-900">
          <div className="flex items-start gap-3">
            {/* Big sparkle/emoji icon */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-xl ${t.iconBg} flex items-center justify-center text-white shadow-lg ${t.glow}`}
            >
              {emoji ? (
                <span className="text-xl leading-none" aria-hidden>
                  {emoji}
                </span>
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div
                className={`text-[10px] font-extrabold uppercase tracking-[0.12em] bg-gradient-to-r ${t.badge} bg-clip-text text-transparent`}
              >
                Pro tip · Demo
              </div>
              <div className="text-base sm:text-lg font-bold text-gray-900 mt-1 leading-snug dark:text-white">
                {title}
              </div>
              <div className="text-sm text-gray-600 mt-1.5 leading-relaxed dark:text-gray-300">{body}</div>
              <a
                href={ctaHref}
                className={`inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-lg text-sm font-bold text-white shadow-md ${t.cta} transition-all hover:shadow-lg hover:scale-[1.02]`}
              >
                {cta}
              </a>
            </div>

            <button
              onClick={handleDismiss}
              aria-label="Dismiss tip"
              className="flex-shrink-0 -mr-1 -mt-1 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-white/10 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <DemoHintKeyframes />
    </div>
  );
}

// Inject a single global keyframes rule (idempotent — guarded by a DOM marker)
// so we don't have to wire Tailwind config for this one animation.
function DemoHintKeyframes() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById('demo-hint-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'demo-hint-keyframes';
    style.textContent = `
      @keyframes demoHintPulse {
        0%, 100% { box-shadow: 0 6px 18px 0 rgba(217, 70, 239, 0.30); }
        50%      { box-shadow: 0 10px 28px 6px rgba(251, 146, 60, 0.50); }
      }
    `;
    document.head.appendChild(style);
  }, []);
  return null;
}
