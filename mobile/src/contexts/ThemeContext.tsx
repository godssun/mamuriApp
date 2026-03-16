import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { settingsApi } from '../api/client';
import { useAuth } from './AuthContext';
import { UserSettings } from '../types';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
}

export interface Theme {
  colors: ThemeColors;
  fontFamily: string | undefined;
  fontScale: number;
  isDark: boolean;
}

const WARM_THEME: ThemeColors = {
  background: '#FFF9F5',
  card: '#FFFFFF',
  text: '#2D2D2D',
  textSecondary: '#999999',
  border: '#F0F0F0',
};

const LIGHT_THEME: ThemeColors = {
  background: '#FFFFFF',
  card: '#F5F5F5',
  text: '#2D2D2D',
  textSecondary: '#999999',
  border: '#E5E5E5',
};

const DARK_THEME: ThemeColors = {
  background: '#1A1A2E',
  card: '#16213E',
  text: '#E8E8E8',
  textSecondary: '#8888AA',
  border: '#2A2A4E',
};

const THEME_MAP: Record<string, ThemeColors> = {
  warm: WARM_THEME,
  light: LIGHT_THEME,
  dark: DARK_THEME,
};

const FONT_SCALE_MAP: Record<string, number> = {
  small: 0.9,
  medium: 1.0,
  large: 1.15,
};

const DEFAULT_THEME: Theme = {
  colors: WARM_THEME,
  fontFamily: undefined,
  fontScale: 1.0,
  isDark: false,
};

interface ThemeContextType {
  theme: Theme;
  updateAppearance: (updates: Partial<Pick<UserSettings, 'backgroundTheme' | 'fontFamily' | 'fontSize'>>) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_THEME,
  updateAppearance: async () => {},
});

function buildTheme(settings: Pick<UserSettings, 'backgroundTheme' | 'fontFamily' | 'fontSize'>): Theme {
  return {
    colors: THEME_MAP[settings.backgroundTheme] ?? WARM_THEME,
    fontFamily: settings.fontFamily === 'serif' ? 'NanumMyeongjo_400Regular' : undefined,
    fontScale: FONT_SCALE_MAP[settings.fontSize] ?? 1.0,
    isDark: settings.backgroundTheme === 'dark',
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [appearance, setAppearance] = useState<Pick<UserSettings, 'backgroundTheme' | 'fontFamily' | 'fontSize'>>({
    backgroundTheme: 'warm',
    fontFamily: 'system',
    fontSize: 'medium',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setAppearance({ backgroundTheme: 'warm', fontFamily: 'system', fontSize: 'medium' });
      return;
    }

    settingsApi.get()
      .then((data) => {
        setAppearance({
          backgroundTheme: data.backgroundTheme ?? 'warm',
          fontFamily: data.fontFamily ?? 'system',
          fontSize: data.fontSize ?? 'medium',
        });
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const theme = useMemo(() => buildTheme(appearance), [appearance]);

  const updateAppearance = useCallback(async (
    updates: Partial<Pick<UserSettings, 'backgroundTheme' | 'fontFamily' | 'fontSize'>>
  ) => {
    const prev = appearance;
    const next = { ...appearance, ...updates };
    setAppearance(next);

    try {
      const current = await settingsApi.get();
      await settingsApi.update({ ...current, ...updates });
    } catch {
      setAppearance(prev);
    }
  }, [appearance]);

  const value = useMemo(() => ({ theme, updateAppearance }), [theme, updateAppearance]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
