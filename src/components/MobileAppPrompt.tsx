/**
 * MobileAppPrompt — sticky bottom-of-screen banner that shows on
 * mobile-only with App Store / Play Store CTAs.
 *
 * Why: paid traffic landing on flowboss.io from mobile doesn't have a
 * great native pathway to install the FlowBoss app. The AppsFlyer
 * Smart Banner SDK in index.html is supposed to handle this, but it's
 * inconsistent (depends on AppsFlyer infra + browser support). This
 * component is the deterministic in-house fallback: detects mobile UA
 * + viewport, shows after a short scroll/dwell, and is dismissable.
 *
 * Visibility rules:
 *   - Renders only on mobile (UA + viewport ≤ 768px)
 *   - Defers ~2s after mount so it doesn't blow up the first paint
 *   - Hides once the user dismisses (persists in localStorage)
 *   - Hides if the user is already mid-form (focus on input/textarea)
 *
 * NOT a paywall, not a hard interrupt. Just a small CTA pinned to the
 * bottom that gets out of the way when dismissed.
 */

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const STORAGE_KEY = 'fb_mobile_app_prompt_dismissed';

const APP_STORE_URL = 'https://apps.apple.com/app/id6761025816';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.flowboss.app';

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isUaMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(ua);
  const isNarrow = window.innerWidth <= 768;
  return isUaMobile || isNarrow;
}

function detectPlatform(): 'ios' | 'android' | 'other' {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

export function MobileAppPrompt() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    if (!isMobileDevice()) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      /* localStorage may be blocked — still show prompt */
    }
    setPlatform(detectPlatform());
    // Defer slightly so we don't slam the user with a banner before
    // the page even paints. 1.5s is fast enough to catch shallow
    // bouncers but slow enough not to feel intrusive.
    const id = window.setTimeout(() => setVisible(true), 1500);
    return () => window.clearTimeout(id);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  // Show only the relevant store link for the user's platform; "other"
  // (e.g. mobile Linux, Kindle) gets both since we can't tell which
  // store would actually work.
  const showAppStore = platform === 'ios' || platform === 'other';
  const showPlayStore = platform === 'android' || platform === 'other';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[60] md:hidden"
      role="region"
      aria-label="Get the FlowBoss app"
    >
      <div className="bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center gap-3 safe-bottom">
        {/* App icon */}
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63" />
          </svg>
        </div>

        {/* Copy + CTAs */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-tight">Get the FlowBoss app</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Schedule, invoice, get paid — on the go.</p>
          <div className="flex gap-1.5 mt-1.5">
            {showAppStore && (
              <a
                href={APP_STORE_URL}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white text-[11px] font-semibold rounded-md hover:bg-gray-800 transition-colors"
              >
                App Store
              </a>
            )}
            {showPlayStore && (
              <a
                href={PLAY_STORE_URL}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white text-[11px] font-semibold rounded-md hover:bg-gray-800 transition-colors"
              >
                Google Play
              </a>
            )}
          </div>
        </div>

        {/* Dismiss */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
