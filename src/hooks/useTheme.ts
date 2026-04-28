import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'flowboss-theme';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;

  // Default to light. We used to follow `prefers-color-scheme: dark`, but
  // most field-tradesperson screenshots came back too dark — the product
  // photography (project banners, sub avatars, materials) reads better on
  // a light canvas, and the GC dashboard was designed white-first.
  // Users on dark OS who actually want dark mode can flip the toggle once
  // and it'll stick via STORAGE_KEY.
  return 'light';
}

/**
 * Toggle between light and dark mode.
 * Persists to localStorage and adds/removes the `dark` class on <html>.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Apply class to <html> on mount and changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  return { theme, toggle, setTheme, isDark: theme === 'dark' };
}
