/**
 * MamuriApp Design System v2 — Theme Context
 *
 * Provides theme access throughout the app via React context.
 * Supports light/dark mode toggle and font scaling.
 */

import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { Theme, lightTheme, darkTheme, createTheme } from './theme';
import { FontScaleKey } from './typography';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
  setFontScale: (scale: FontScaleKey) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
  setThemeMode: () => {},
  setFontScale: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: 'light' | 'dark';
  initialFontScale?: FontScaleKey;
}

export function ThemeProviderV2({
  children,
  initialMode = 'light',
  initialFontScale = 'medium',
}: ThemeProviderProps) {
  const [mode, setMode] = useState<'light' | 'dark'>(initialMode);
  const [fontScale, setFontScaleState] = useState<FontScaleKey>(initialFontScale);

  const value = useMemo<ThemeContextValue>(() => ({
    theme: createTheme(mode, fontScale),
    isDark: mode === 'dark',
    toggleTheme: () => setMode(prev => prev === 'light' ? 'dark' : 'light'),
    setThemeMode: setMode,
    setFontScale: setFontScaleState,
  }), [mode, fontScale]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeV2(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeV2 must be used within a ThemeProviderV2');
  }
  return context;
}

export { ThemeContext };
