import { ReactNode } from 'react';

/**
 * Shared wrapper for auth-funnel pages (signup, login, checkout, pricing).
 * Provides the atmospheric layered-glow dark mode background that matches
 * the homepage and onboarding, and handles mobile-safe horizontal padding.
 */
export function AuthShell({
  children,
  withGlow = true,
  center = true,
}: {
  children: ReactNode;
  /** Render the atmospheric radial-glow backdrop (dark mode only). */
  withGlow?: boolean;
  /** Vertically + horizontally center the children in a flex column. */
  center?: boolean;
}) {
  return (
    <div
      className={
        'relative min-h-screen overflow-x-hidden bg-gray-100 dark:bg-gray-950 ' +
        (center ? 'flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-12' : '')
      }
    >
      {withGlow && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden hidden dark:block">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>
      )}
      <div className="relative w-full">{children}</div>
    </div>
  );
}

/**
 * Shared card surface for auth-funnel forms. Mobile-safe padding, glassy in
 * dark mode with a subtle top-edge blue gradient.
 */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white shadow-xl p-6 sm:p-8 overflow-hidden dark:border-white/10 dark:bg-white/[0.04] dark:backdrop-blur-xl dark:shadow-2xl dark:shadow-blue-500/5">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent dark:via-blue-400/30" />
      <div className="relative">{children}</div>
    </div>
  );
}
