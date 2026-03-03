'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

type Theme = 'daylight' | 'midnight';
type ThemePreference = 'daylight' | 'midnight' | 'system';

interface ThemeContextType {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'daylight';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'midnight' : 'daylight';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [theme, setThemeState] = useState<Theme>('daylight');
  const [mounted, setMounted] = useState(false);

  // Resolve actual theme from preference
  const resolveTheme = useCallback((pref: ThemePreference): Theme => {
    if (pref === 'system') return getSystemTheme();
    return pref;
  }, []);

  // Initial load
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme-preference') as ThemePreference | null;

    // Migrate old 'theme' key to new 'theme-preference'
    if (!stored) {
      const oldStored = localStorage.getItem('theme') as Theme | null;
      if (oldStored) {
        setPreferenceState(oldStored);
        setThemeState(oldStored);
        localStorage.setItem('theme-preference', oldStored);
        localStorage.removeItem('theme');
        return;
      }
    }

    const pref = stored || 'system';
    setPreferenceState(pref);
    setThemeState(resolveTheme(pref));
  }, [resolveTheme]);

  // Listen for system theme changes (only matters when preference is 'system')
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (preference === 'system') {
        setThemeState(getSystemTheme());
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mounted, preference]);

  // Apply theme to DOM
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    if (theme === 'midnight') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, mounted]);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    setThemeState(pref === 'system' ? getSystemTheme() : pref);
    localStorage.setItem('theme-preference', pref);
  }, []);

  // Legacy setTheme — sets an explicit preference
  const setTheme = useCallback((t: Theme) => {
    setPreference(t);
  }, [setPreference]);

  // Toggle cycles: daylight → midnight → system → daylight
  const toggleTheme = useCallback(() => {
    setPreference(
      preference === 'daylight' ? 'midnight'
        : preference === 'midnight' ? 'system'
          : 'daylight'
    );
  }, [preference, setPreference]);

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
