/**
 * Fires a GA4 page_view event on every React Router navigation.
 *
 * Why this exists: gtag.js auto-fires page_view ONCE on initial page
 * load (when the script in index.html runs gtag('config', GA4_ID)).
 * After that, all navigations in a SPA are client-side route changes —
 * the URL bar updates but no page reload happens, so GA never sees
 * them. Without this, GA shows every visitor "bouncing" on whatever
 * route they landed on, even if they then click around 10 pages.
 *
 * Mounted once at the App root. Returns null — no UI.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pageView } from '../lib/analytics';

export function RouteChangeTracker() {
  const location = useLocation();

  useEffect(() => {
    // Slight defer so document.title has time to update if a child
    // page changed it via useEffect. Without this we'd capture the
    // previous page's title for the new path on the very first paint.
    const id = window.setTimeout(() => {
      pageView(location.pathname + location.search);
    }, 0);
    return () => window.clearTimeout(id);
  }, [location.pathname, location.search]);

  return null;
}
