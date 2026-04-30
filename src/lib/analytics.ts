/**
 * Tiny gtag wrapper for FlowBoss web.
 *
 * The actual gtag.js script is loaded in `index.html`:
 *   - Google Ads tag:        AW-17189957809  (conversion tracking)
 *   - Google Analytics 4:    G-9V3QXTMG28    (sessions + events)
 *
 * This module wraps the global `gtag` so React code can fire events
 * without each call site repeating `window.dataLayer.push(...)` boilerplate
 * and without typing `(window as any).gtag` everywhere.
 *
 * Why a wrapper at all:
 *   - SPA route changes don't fire pageviews automatically. `pageView()`
 *     called from RouteChangeTracker fixes that.
 *   - We want a single place to add new providers later (PostHog,
 *     Segment, etc.) without grepping every call site.
 *   - Failures are swallowed. Analytics down ≠ user flow broken.
 *
 * Conventions:
 *   - Event names use GA4 recommended-event names where one exists
 *     (`sign_up`, `begin_checkout`, `purchase`). These auto-populate
 *     standard reports + map cleanly to Google Ads conversion goals.
 *   - Custom events use lower_snake_case (`trial_started`, etc.).
 */

const GA4_ID = 'G-9V3QXTMG28';
const ADS_ID = 'AW-17189957809';

type GtagFn = (...args: unknown[]) => void;

function gtag(): GtagFn | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { gtag?: GtagFn };
  return typeof w.gtag === 'function' ? w.gtag : null;
}

/**
 * Fire a page_view event for the current path. Call from a route-change
 * listener — gtag's auto-pageview only fires on hard page loads, so without
 * this all SPA navigations are invisible to GA.
 */
export function pageView(path: string, title?: string): void {
  const g = gtag();
  if (!g) return;
  try {
    g('event', 'page_view', {
      page_path: path,
      page_location: typeof window !== 'undefined' ? window.location.href : path,
      page_title: title ?? (typeof document !== 'undefined' ? document.title : undefined),
      send_to: GA4_ID,
    });
  } catch {
    /* never break a route change because of analytics */
  }
}

/**
 * Generic event tracker. Use for anything that doesn't have a dedicated
 * helper below. `params` is forwarded straight to gtag.
 */
export function track(event: string, params: Record<string, unknown> = {}): void {
  const g = gtag();
  if (!g) return;
  try {
    g('event', event, { ...params, send_to: GA4_ID });
  } catch {
    /* swallow */
  }
}

/**
 * Tag the active gtag session with the user id once they're known.
 * Lets GA4 stitch sessions across devices for the same logged-in user.
 * Pass null on signout to clear.
 */
export function identify(userId: string | null): void {
  const g = gtag();
  if (!g) return;
  try {
    g('config', GA4_ID, { user_id: userId ?? undefined });
  } catch {
    /* swallow */
  }
}

// ─────────────────────────────────────────────────────────────────────
// Conversion helpers — call sites read clearer with intent-named helpers
// than with stringly-typed `track('sign_up', ...)` everywhere.
// ─────────────────────────────────────────────────────────────────────

/**
 * Sign up succeeded (Supabase user created). Fires both to GA4 (`sign_up`
 * recommended event) and Google Ads (same event ID, picked up by the Ads
 * tag for conversion attribution).
 */
export function trackSignUp(params: { method?: string; plan?: string | null } = {}): void {
  track('sign_up', {
    method: params.method ?? 'email',
    plan: params.plan ?? null,
  });
}

/**
 * User clicked through to Stripe Checkout (about to be redirected to
 * Stripe's hosted page). GA4 recommended event — drives the
 * "begin_checkout → purchase" funnel report.
 */
export function trackBeginCheckout(params: { plan: string; value: number; currency?: string }): void {
  track('begin_checkout', {
    currency: params.currency ?? 'USD',
    value: params.value,
    items: [
      {
        item_id: params.plan,
        item_name: params.plan,
        price: params.value,
        quantity: 1,
      },
    ],
  });
}

/**
 * Trial started — Stripe Checkout completed and we landed back on
 * /dashboard/home?welcome=1. The transaction is technically a $0 trial
 * start (Stripe's checkout.session.completed fires before any money
 * moves), so we report it as a `begin_checkout`-style event with value 0
 * to avoid skewing revenue metrics, and a separate `trial_started`
 * custom event for funnel reporting.
 *
 * The real money event is reported server-side from stripe-webhook on
 * `invoice.paid` (when the trial converts) — that's where Ads
 * conversion value should be measured. We don't fire `purchase` here.
 */
export function trackTrialStarted(params: { plan: string | null; transactionId?: string | null }): void {
  track('trial_started', {
    plan: params.plan,
    transaction_id: params.transactionId ?? null,
  });
}

export const ANALYTICS_IDS = { GA4_ID, ADS_ID } as const;
