import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Back-navigation that doesn't dump the user out of the app.
 *
 * `navigate(-1)` alone is dangerous when the user arrives via deep-link (SMS,
 * email, QR code, refresh) because there's no history to go back to — the
 * browser navigates to the referrer, which is often outside the app.
 *
 * This hook prefers history-back when it's safe, and falls back to an explicit
 * route otherwise. The react-router location carries a `key` that is `"default"`
 * only when this is the very first entry for this tab's session, which is the
 * reliable signal that there's no history to pop.
 */
export function useSafeBack(fallback: string = '/dashboard') {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    if (location.key === 'default') {
      navigate(fallback, { replace: true });
    } else {
      navigate(-1);
    }
  }, [navigate, location.key, fallback]);
}
