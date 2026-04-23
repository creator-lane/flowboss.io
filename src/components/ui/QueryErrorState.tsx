import { AlertCircle, RefreshCw } from 'lucide-react';

// Rendered inline when a `useQuery` returns `isError`. Used instead of the
// empty-state path, which would otherwise misrepresent a network/auth/server
// failure as "you have no data." Contractors bail fast when the app is
// ambiguous about its own state, so the copy is deliberately specific:
// "we hit an error," not "something went wrong."
//
// `onRetry` should call the query's `refetch()` so the user can recover
// without bouncing out and back in. When `onRetry` is omitted we just hide
// the button (rare — most callers should pass it).

interface QueryErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  /** Optional error object, used only for copy enrichment when message is present. */
  error?: unknown;
}

export function QueryErrorState({
  title = "Couldn't load this data",
  description = "We hit an error reaching the server. Check your connection and try again.",
  onRetry,
  error,
}: QueryErrorStateProps) {
  // Surface the raw message when it's likely user-actionable (network, auth,
  // timeout). Generic stack traces are hidden — those belong in dev tools.
  const errMsg =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message || '')
      : '';
  const showMessage = errMsg && errMsg.length < 200 && !errMsg.includes('\n');

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4 dark:bg-red-500/10">
        <AlertCircle className="w-6 h-6 text-red-500" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm text-center leading-relaxed dark:text-gray-400">
        {description}
      </p>
      {showMessage && (
        <p className="mt-2 text-xs text-gray-400 font-mono max-w-md text-center dark:text-gray-500">
          {errMsg}
        </p>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      )}
    </div>
  );
}
