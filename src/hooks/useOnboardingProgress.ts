import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'flowboss-onboarding-progress';

const KNOWN_PAGES = [
  'home',
  'schedule',
  'jobs',
  'customers',
  'invoices',
  'projects',
  'contractors',
  'financials',
  'insights',
  'settings',
] as const;

export interface OnboardingProgress {
  visitedPages: string[];
  dismissedTips: string[];
  completedActions: string[];
  firstVisitAt: string;
}

function getDefaultProgress(): OnboardingProgress {
  return {
    visitedPages: [],
    dismissedTips: [],
    completedActions: [],
    firstVisitAt: new Date().toISOString(),
  };
}

function loadProgress(): OnboardingProgress {
  if (typeof window === 'undefined') return getDefaultProgress();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as OnboardingProgress;
      // Validate shape
      if (
        Array.isArray(parsed.visitedPages) &&
        Array.isArray(parsed.dismissedTips) &&
        Array.isArray(parsed.completedActions) &&
        typeof parsed.firstVisitAt === 'string'
      ) {
        return parsed;
      }
    }
  } catch {
    // Corrupted data — reset
  }

  const fresh = getDefaultProgress();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

function persist(progress: OnboardingProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

/**
 * Tracks onboarding milestones: visited pages, dismissed tips, completed actions.
 * Persists to localStorage under `flowboss-onboarding-progress`.
 */
export function useOnboardingProgress() {
  const [progress, setProgress] = useState<OnboardingProgress>(loadProgress);

  // Sync across tabs
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setProgress(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const update = useCallback((fn: (prev: OnboardingProgress) => OnboardingProgress) => {
    setProgress((prev) => {
      const next = fn(prev);
      persist(next);
      return next;
    });
  }, []);

  // --- Page visits ---

  const hasVisited = useCallback(
    (page: string) => progress.visitedPages.includes(page),
    [progress.visitedPages],
  );

  const markVisited = useCallback(
    (page: string) => {
      update((prev) => {
        if (prev.visitedPages.includes(page)) return prev;
        return { ...prev, visitedPages: [...prev.visitedPages, page] };
      });
    },
    [update],
  );

  // --- Tips ---

  const hasDismissedTip = useCallback(
    (tipId: string) => progress.dismissedTips.includes(tipId),
    [progress.dismissedTips],
  );

  const dismissTip = useCallback(
    (tipId: string) => {
      update((prev) => {
        if (prev.dismissedTips.includes(tipId)) return prev;
        return { ...prev, dismissedTips: [...prev.dismissedTips, tipId] };
      });
    },
    [update],
  );

  // --- Completed actions ---

  const hasCompleted = useCallback(
    (action: string) => progress.completedActions.includes(action),
    [progress.completedActions],
  );

  const markCompleted = useCallback(
    (action: string) => {
      update((prev) => {
        if (prev.completedActions.includes(action)) return prev;
        return { ...prev, completedActions: [...prev.completedActions, action] };
      });
    },
    [update],
  );

  // --- Derived values ---

  const daysSinceSignup = useMemo(() => {
    const first = new Date(progress.firstVisitAt).getTime();
    const now = Date.now();
    return Math.floor((now - first) / (1000 * 60 * 60 * 24));
  }, [progress.firstVisitAt]);

  const isNewUser = daysSinceSignup < 7;

  const unvisitedPages = useMemo(
    () => KNOWN_PAGES.filter((p) => !progress.visitedPages.includes(p)),
    [progress.visitedPages],
  );

  return {
    progress,
    hasVisited,
    markVisited,
    hasDismissedTip,
    dismissTip,
    hasCompleted,
    markCompleted,
    isNewUser,
    daysSinceSignup,
    unvisitedPages,
  };
}
