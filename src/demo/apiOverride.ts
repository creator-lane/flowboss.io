// Demo-mode runtime override for `api` (lib/api.ts) and `supabase` (lib/supabase.ts).
//
// On demo entry: every method on `api` is swapped with a function that either
// returns seeded fixture data (reads) or fires the paywall modal (writes that
// represent real conversion moments). `supabase.from`, `supabase.rpc`, and
// `supabase.auth.{getUser,getSession}` are also patched to return safe no-op
// chains, which catches the small number of components that bypass api.ts
// and call Supabase directly (RequireSubscription, useSubscriptionTier,
// SampleDataPanel.wipe_sample_data, lib/api.ts learn_price, etc.).
//
// On demo exit: originals are restored. Production code is never modified;
// this module is the one and only entry point that touches `api`/`supabase`.
//
// KNOWN LIMITATION: `window.location.href = '/dashboard/...'` writes (e.g.
// EmptyState.actionHref, Checkout success URL) bypass pushState entirely
// and would hard-navigate the visitor out of the demo subtree. In practice
// the seeded fixtures populate every list, so empty states rarely render —
// but if a future page introduces a hard-href escape, intercept it here
// (e.g. capture-phase document click listener for `<a href>` to /dashboard).

import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { DemoPersona } from './data/personas';
import { DEMO_USER_ID } from './data/personas';
import { isPaywallMethod, isReadMethod, paywallCopyKeyFor, resolveSeedRead, resolveSeedWrite } from './data/seedResolver';

export class DemoPaywallError extends Error {
  readonly method: string;
  constructor(method: string) {
    super(`Demo paywall: ${method}`);
    this.name = 'DemoPaywallError';
    this.method = method;
  }
}

type PaywallHandler = (method: string) => void;

interface InstallOptions {
  persona: DemoPersona;
  onPaywall: PaywallHandler;
}

let installed = false;
let originalApi: Record<string, any> | null = null;
let originalSupabaseFrom: any = null;
let originalSupabaseRpc: any = null;
let originalAuthGetUser: any = null;
let originalAuthGetSession: any = null;
let originalNestedQbo: Record<string, any> | null = null;
let originalPushState: typeof window.history.pushState | null = null;
let originalReplaceState: typeof window.history.replaceState | null = null;

// A chainable, awaitable proxy that always resolves to { data: null, error: null }.
// Any method call returns the same chain; awaiting it yields the empty result.
// Catches the chain pattern: supabase.from(x).select(y).eq(...).maybeSingle()
function makeEmptyChain(): any {
  const result = { data: null, error: null };
  const promise = Promise.resolve(result);
  const handler: ProxyHandler<any> = {
    get(target, prop) {
      if (prop === 'then') return promise.then.bind(promise);
      if (prop === 'catch') return promise.catch.bind(promise);
      if (prop === 'finally') return promise.finally.bind(promise);
      // Any other property → callable that returns the same chain
      return () => makeEmptyChain();
    },
  };
  return new Proxy(promise, handler);
}

function patchApi(persona: DemoPersona, onPaywall: PaywallHandler) {
  originalApi = {};
  for (const key of Object.keys(api)) {
    const original = (api as any)[key];
    originalApi[key] = original;

    if (typeof original === 'function') {
      (api as any)[key] = (...args: any[]) => {
        if (isReadMethod(key)) {
          return Promise.resolve(resolveSeedRead(key, args, persona));
        }
        if (isPaywallMethod(key, args)) {
          onPaywall(paywallCopyKeyFor(key, args));
          // Return a never-resolving promise so consumer try/catch never fires
          // and we don't leak ugly "Demo paywall: ..." into page-level error banners.
          // The modal is the sole signal; on navigate-away the page unmounts.
          return new Promise(() => {});
        }
        return Promise.resolve(resolveSeedWrite(key, args, persona));
      };
    } else if (original && typeof original === 'object') {
      // Nested namespaces (e.g. api.qbo). Snapshot original and replace each fn.
      if (key === 'qbo' || key === 'quickbooks') {
        originalNestedQbo = { ...original };
        for (const sub of Object.keys(original)) {
          if (typeof original[sub] === 'function') {
            original[sub] = (...args: any[]) => {
              const fullName = `${key}.${sub}`;
              if (isReadMethod(sub)) {
                return Promise.resolve(resolveSeedRead(fullName, args, persona));
              }
              if (isPaywallMethod(sub, args) || isPaywallMethod(fullName, args)) {
                // Prefer the bare sub name when copy is keyed off it, so the
                // modal shows the specific message instead of the generic one.
                const key = isPaywallMethod(sub, args) ? sub : fullName;
                onPaywall(paywallCopyKeyFor(key, args));
                return new Promise(() => {});
              }
              return Promise.resolve(resolveSeedWrite(fullName, args, persona));
            };
          }
        }
      }
    }
  }
}

function patchSupabase(persona: DemoPersona) {
  originalSupabaseFrom = supabase.from.bind(supabase);
  originalSupabaseRpc = supabase.rpc.bind(supabase);
  originalAuthGetUser = supabase.auth.getUser.bind(supabase.auth);
  originalAuthGetSession = supabase.auth.getSession.bind(supabase.auth);

  // Replace `supabase.from(...)` so any direct table query returns an empty chain.
  (supabase as any).from = (_table: string) => makeEmptyChain();

  // Replace `supabase.rpc(...)` similarly. A handful of components (e.g.
  // SampleDataPanel.handleWipe → wipe_sample_data, lib/api.ts learn_price)
  // call rpc directly, bypassing the api/seedResolver layer. Without this
  // patch, those calls would reach the real Supabase instance and either
  // fail (no real auth) or — worse — succeed against unrelated data.
  (supabase as any).rpc = (_fn: string, _args?: any) => makeEmptyChain();

  // `getUser` / `getSession` return a fake session anchored to the demo user.
  // useSubscriptionTier reads this to decide whether the user is an invited sub.
  const fakeUser = {
    id: DEMO_USER_ID[persona],
    email: persona === 'gc' ? 'marcos@riverside-demo.com' : 'carlos@carloselectric-demo.com',
    aud: 'authenticated',
    role: 'authenticated',
  };
  const fakeSession = {
    access_token: 'demo-access-token',
    refresh_token: 'demo-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: fakeUser,
  };

  (supabase.auth as any).getUser = async () => ({ data: { user: fakeUser }, error: null });
  (supabase.auth as any).getSession = async () => ({ data: { session: fakeSession }, error: null });
}

// Pin all in-app navigations to the demo subtree. Pages and shared components
// hardcode many absolute paths that would yank the visitor out of the demo:
//   /dashboard/*  → real (auth-gated) dashboard, bounces to /login
//   /onboarding   → first-run wizard from Signup; visitors get stranded
//   /login        → Sign Out paths and a few stray Links
//   /checkout?*   → ProGate / UpgradeModal "Upgrade to Pro" CTAs
//   /pricing      → various upgrade prompts
// Strategy:
//   - /dashboard/* → rewrite into the demo subtree (transparent)
//   - /checkout, /pricing → fire the paywall modal (this IS a conversion moment)
//   - /onboarding, /login → silently bounce to the demo home (no signal)
//   - /signup is left alone — it's the explicit "Try free" CTA from the demo
//     banner / paywall modal, the one path we *do* want to lead out.
function patchHistory(persona: DemoPersona, onPaywall: PaywallHandler) {
  const demoBase = `/demo/full/${persona}/dashboard`;
  const demoHome = `${demoBase}/home`;

  const rewrite = (url: string | URL | null | undefined): string | URL | null | undefined => {
    if (url == null) return url;
    const raw = typeof url === 'string' ? url : url.toString();
    // Already in demo or absolute external — let through.
    if (raw.startsWith('/demo/full/')) return url;
    if (/^https?:/i.test(raw)) return url;

    // Dashboard subtree → rewrite into demo subtree, preserving query/hash.
    const dashMatch = raw.match(/^\/dashboard(\/[^?#]*)?(\?[^#]*)?(#.*)?$/);
    if (dashMatch) {
      return `${demoBase}${dashMatch[1] || ''}${dashMatch[2] || ''}${dashMatch[3] || ''}`;
    }

    // Conversion-relevant out-of-app paths → fire paywall, stay on demo home.
    if (/^\/checkout(\/|\?|$)/.test(raw) || /^\/pricing(\/|\?|$)/.test(raw)) {
      onPaywall('upgrade');
      return demoHome;
    }

    // Auth/onboarding leaks → silently stay in demo.
    if (/^\/onboarding(\/|\?|$)/.test(raw) || /^\/login(\/|\?|$)/.test(raw)) {
      return demoHome;
    }

    return url;
  };

  originalPushState = window.history.pushState.bind(window.history);
  originalReplaceState = window.history.replaceState.bind(window.history);

  window.history.pushState = function (data: any, unused: string, url?: string | URL | null) {
    return originalPushState!(data, unused, rewrite(url) as any);
  } as typeof window.history.pushState;

  window.history.replaceState = function (data: any, unused: string, url?: string | URL | null) {
    return originalReplaceState!(data, unused, rewrite(url) as any);
  } as typeof window.history.replaceState;
}

export function installDemoMode(opts: InstallOptions) {
  if (installed) return;
  installed = true;
  patchApi(opts.persona, opts.onPaywall);
  patchSupabase(opts.persona);
  patchHistory(opts.persona, opts.onPaywall);
}

export function uninstallDemoMode() {
  if (!installed) return;
  installed = false;

  if (originalApi) {
    for (const [key, original] of Object.entries(originalApi)) {
      (api as any)[key] = original;
    }
    originalApi = null;
  }
  if (originalNestedQbo && (api as any).qbo) {
    for (const [key, original] of Object.entries(originalNestedQbo)) {
      (api as any).qbo[key] = original;
    }
    originalNestedQbo = null;
  }
  if (originalSupabaseFrom) {
    (supabase as any).from = originalSupabaseFrom;
    originalSupabaseFrom = null;
  }
  if (originalSupabaseRpc) {
    (supabase as any).rpc = originalSupabaseRpc;
    originalSupabaseRpc = null;
  }
  if (originalAuthGetUser) {
    (supabase.auth as any).getUser = originalAuthGetUser;
    originalAuthGetUser = null;
  }
  if (originalAuthGetSession) {
    (supabase.auth as any).getSession = originalAuthGetSession;
    originalAuthGetSession = null;
  }
  if (originalPushState) {
    window.history.pushState = originalPushState;
    originalPushState = null;
  }
  if (originalReplaceState) {
    window.history.replaceState = originalReplaceState;
    originalReplaceState = null;
  }
}

export function isDemoModeInstalled() {
  return installed;
}
