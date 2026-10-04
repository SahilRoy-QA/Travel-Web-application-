import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { ThemePreference } from '../types';
import { applyBrandThemeVariables } from '../styles/tokens';

interface ThemeContextType {
  theme: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  isDark: boolean;
  setTheme: (mode: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'travelly_theme';
const LEGACY_STORAGE_KEY = 'illusion_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage (or 'system' default)
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    if (typeof window !== 'undefined') {
      const saved = (localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)) as ThemePreference | null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    }
    return 'system';
  });

  // Track system OS preference dynamically
  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // 2. Listen to live OS theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Compute resolvedTheme
  const resolvedTheme: 'light' | 'dark' =
    theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
  const isDark = resolvedTheme === 'dark';

  // 3. Synchronize HTML class, color-scheme, and meta theme-color
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    // Update <meta name="theme-color"> at runtime
    const metaLight = document.getElementById('meta-theme-color-light') as HTMLMetaElement | null;
    const metaDark = document.getElementById('meta-theme-color-dark') as HTMLMetaElement | null;
    const targetColor = isDark ? '#0b1120' : '#ffffff';

    if (metaLight && theme !== 'system') {
      metaLight.removeAttribute('media');
      metaLight.setAttribute('content', targetColor);
    }
    if (metaDark && theme !== 'system') {
      metaDark.removeAttribute('media');
      metaDark.setAttribute('content', targetColor);
    }

    // Apply tokens
    applyBrandThemeVariables(isDark);
  }, [isDark, theme]);

  // 4. Theme Setter: Persists to localStorage and Firestore for logged-in users
  const setTheme = async (mode: ThemePreference) => {
    setThemeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode);
      localStorage.setItem(LEGACY_STORAGE_KEY, mode);
    }

    // If user is authenticated, sync to users/{uid}.preferences.theme in Firestore
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(
          userRef,
          {
            preferences: {
              theme: mode,
            },
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Failed to sync theme to Firestore:', err);
      }
    }
  };

  // Toggle between light and dark
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
