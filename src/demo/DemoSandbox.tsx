import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session, User } from '@supabase/supabase-js';
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react';

import { AuthContext } from '../lib/auth';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { DemoPaywallProvider, useDemoPaywall } from './DemoPaywallContext';
import { installDemoMode, uninstallDemoMode } from './apiOverride';
import type { DemoPersona } from './data/personas';
import { DEMO_USER_ID } from './data/personas';

// ──────────────────────────────────────────────────────────────────────
// /demo/full/:persona — sandboxed dashboard.
//
// Mounts a separate QueryClient + AuthContext provider so the demo never
// touches the real session or query cache. installDemoMode swaps `api`
// and `supabase` to return seeded data; uninstall on unmount.
// ──────────────────────────────────────────────────────────────────────

function isValidPersona(p: string | undefined): p is DemoPersona {
  return p === 'gc' || p === 'sub';
}

export function DemoSandbox() {
  const { persona } = useParams();
  if (!isValidPersona(persona)) {
    return <Navigate to="/demo/full" replace />;
  }
  return <DemoSandboxInner persona={persona} />;
}

function DemoSandboxInner({ persona }: { persona: DemoPersona }) {
  // Lazily create the demo QueryClient so it persists across re-renders but
  // resets fresh whenever the persona changes (the key on the parent ensures
  // unmount/remount, but keep this safe regardless).
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stay on cached/seeded data — no auto-refetch in the demo. This
            // matters for the small number of hooks (useSubscriptionTier,
            // RequireSubscription's settings poll) that hardcode staleTime.
            staleTime: Infinity,
            gcTime: Infinity,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: false,
          },
          mutations: {
            retry: false,
          },
        },
      }),
    [persona],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <DemoPaywallProvider>
        <DemoModeBoundary persona={persona}>
          <DemoAuthBridge persona={persona}>
            <DemoBanner persona={persona} />
            <DashboardLayout />
          </DemoAuthBridge>
        </DemoModeBoundary>
      </DemoPaywallProvider>
    </QueryClientProvider>
  );
}

// Installs demo mode (api/supabase override) on mount, uninstalls on unmount.
// Also wires the paywall trigger from the override into the context.
function DemoModeBoundary({
  persona,
  children,
}: {
  persona: DemoPersona;
  children: React.ReactNode;
}) {
  const { trigger } = useDemoPaywall();
  const triggerRef = useRef(trigger);
  triggerRef.current = trigger;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    installDemoMode({
      persona,
      onPaywall: (method) => triggerRef.current(method),
    });
    setReady(true);
    return () => {
      uninstallDemoMode();
      setReady(false);
    };
  }, [persona]);

  // Time-delayed conversion nudge: after ~90s of poking around, surface the
  // signup modal once. sessionStorage gates it to once-per-tab so persona
  // switches and re-renders don't re-fire it.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const KEY = 'demo:upgradeNudgeFired';
    if (window.sessionStorage.getItem(KEY) === '1') return;
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem(KEY, '1');
      triggerRef.current('upgrade');
    }, 90_000);
    return () => window.clearTimeout(timer);
  }, [persona]);

  // Don't render the dashboard until the override is in place — otherwise the
  // first render would fire real api calls before installation completes.
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}

// Provides a fake auth session anchored to the demo user. Overrides the real
// AuthContext so any useAuth() consumer in the dashboard sees the demo user.
function DemoAuthBridge({
  persona,
  children,
}: {
  persona: DemoPersona;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();

  const value = useMemo(() => {
    const fakeUser = {
      id: DEMO_USER_ID[persona],
      email:
        persona === 'gc'
          ? 'marcos@riverside-demo.com'
          : 'carlos@carloselectric-demo.com',
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString(),
    } as unknown as User;

    const fakeSession = {
      access_token: 'demo-access-token',
      refresh_token: 'demo-refresh-token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: fakeUser,
    } as unknown as Session;

    return {
      session: fakeSession,
      user: fakeUser,
      loading: false,
      // "Sign out" of the demo → bounce back to the picker.
      signOut: async () => {
        navigate('/demo/full');
      },
    };
  }, [persona, navigate]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Top banner that signals "you're in a demo" + offers a real signup CTA.
function DemoBanner({ persona }: { persona: DemoPersona }) {
  const navigate = useNavigate();
  const label =
    persona === 'gc' ? 'General Contractor view' : 'Trade view';

  return (
    <div className="sticky top-0 z-[60] bg-gradient-to-r from-violet-600 via-brand-600 to-blue-600 text-white shadow-md shadow-brand-500/20">
      <div className="px-4 py-2 flex items-center justify-between gap-3 max-w-[100vw]">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold truncate">
            Live demo · {label}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/demo/full')}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-white/90 hover:bg-white/15 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Switch view
          </button>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white text-brand-700 text-xs font-bold hover:bg-gray-100 transition-colors shadow-sm"
          >
            Try free
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Renders nothing of its own — DashboardLayout uses <Outlet /> and our routes
// nest the dashboard pages under the sandbox route. We export Outlet here for
// route consumers that want a placeholder when adding their own children.
export function DemoOutlet() {
  return <Outlet />;
}
