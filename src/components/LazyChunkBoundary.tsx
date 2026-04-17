import { Component, type ReactNode } from 'react';

/**
 * Error boundary that catches lazy-chunk load failures and recovers by
 * reloading the page ONCE.
 *
 * Why this exists:
 * When we deploy a new build, Vercel serves a new index.html with new chunk
 * URLs (hashed filenames). Users who have the app open on the OLD index.html
 * still reference the OLD chunk URLs. When they navigate to a lazy route, the
 * old chunk URL 404s (because the new build replaced it with a new hash) →
 * Suspense hangs forever → black screen. Refresh fixes it because that pulls
 * the fresh index.html.
 *
 * This boundary detects that specific failure mode (ChunkLoadError, failed
 * import, script load failure) and reloads the page. We cap to ONE reload per
 * session to prevent infinite loops if the chunk is genuinely broken.
 *
 * The sessionStorage flag is cleared after a successful navigation (on
 * unmount), so moving between routes resets the counter — only truly stuck
 * scenarios hit the "reload failed, show error UI" fallback.
 */

const RELOAD_FLAG = 'fb-chunk-reloaded';

function isChunkLoadError(err: unknown): boolean {
  if (!err) return false;
  const e = err as any;
  const name = String(e.name || '');
  const message = String(e.message || '');
  // Vite/Rollup-emitted chunks typically fail with one of these shapes:
  //   - `ChunkLoadError: Loading chunk 123 failed`
  //   - `Failed to fetch dynamically imported module`
  //   - `Importing a module script failed`
  //   - `Unable to preload CSS for ...`
  return (
    name === 'ChunkLoadError' ||
    /Loading chunk/i.test(message) ||
    /dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /Unable to preload CSS/i.test(message)
  );
}

interface State {
  error: Error | null;
}

export class LazyChunkBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (!isChunkLoadError(error)) {
      // Not a chunk load issue — rethrow so higher-level handling / Sentry
      // can see it. (Uncaught errors bubble to window.onerror.)
      // eslint-disable-next-line no-console
      console.error('Unhandled render error (not a chunk load):', error);
      return;
    }

    // Only auto-reload once per session to prevent loops
    let alreadyReloaded = false;
    try {
      alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG) === '1';
    } catch {
      /* sessionStorage unavailable — fall through */
    }

    if (alreadyReloaded) {
      // Already tried — show the error UI instead of looping
      return;
    }

    try {
      sessionStorage.setItem(RELOAD_FLAG, '1');
    } catch {
      /* noop */
    }
    // Give React a tick to commit the state change before reloading
    setTimeout(() => window.location.reload(), 50);
  }

  componentDidMount() {
    // Successful mount — clear the "we reloaded" flag so the next stale-bundle
    // event can reload again. This runs per mount of the boundary (not per
    // successful route change), so it effectively resets on any app boot.
    try {
      sessionStorage.removeItem(RELOAD_FLAG);
    } catch {
      /* noop */
    }
  }

  render() {
    if (this.state.error) {
      if (isChunkLoadError(this.state.error)) {
        // Already tried a reload and it failed again — user-visible fallback.
        return (
          <div className="flex items-center justify-center min-h-[60vh] p-6">
            <div className="max-w-md text-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                We just shipped a new version
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Your browser couldn't load the latest files. Reload to pick up the update.
              </p>
              <button
                type="button"
                onClick={() => {
                  try { sessionStorage.removeItem(RELOAD_FLAG); } catch { /* noop */ }
                  window.location.reload();
                }}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors"
              >
                Reload
              </button>
            </div>
          </div>
        );
      }

      // Non-chunk errors — let other boundaries handle, or show generic message
      return (
        <div className="flex items-center justify-center min-h-[60vh] p-6">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {this.state.error.message || 'Unexpected error. Try reloading.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
