import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { settingsApi } from '../api/client';
import { useAuth } from './AuthContext';
import { useSubscription } from './SubscriptionContext';
import { UserSettings } from '../types';
import { DIARY_FONT_OPTIONS } from '../design-system-v3';
import type { DiaryFontKey } from '../design-system-v3';

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
  /** 일기 작성용 폰트 (fontFamily name) */
  diaryFontFamily: string;
  diaryFontKey: DiaryFontKey;
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
  diaryFontFamily: DIARY_FONT_OPTIONS[0].font,
  diaryFontKey: 'default',
};

interface ThemeContextType {
  theme: Theme;
  updateAppearance: (updates: Partial<Pick<UserSettings, 'backgroundTheme' | 'fontFamily' | 'fontSize' | 'diaryFont'>>) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_THEME,
  updateAppearance: async () => {},
});

type AppearanceSettings = Pick<UserSettings, 'backgroundTheme' | 'fontFamily' | 'fontSize'> & { diaryFont?: string };

function buildTheme(settings: AppearanceSettings, canUsePremiumFonts: boolean): Theme {
  const diaryFontKey = (settings.diaryFont || 'default') as DiaryFontKey;
  let diaryOption = DIARY_FONT_OPTIONS.find(o => o.key === diaryFontKey) || DIARY_FONT_OPTIONS[0];
  // 프리미엄 폰트인데 권한이 없으면(구독 해지 등) 기본 폰트로 폴백.
  // 저장된 diaryFont 설정 자체는 유지하므로 재구독 시 자동으로 다시 적용된다.
  if (diaryOption.premium && !canUsePremiumFonts) {
    diaryOption = DIARY_FONT_OPTIONS[0];
  }
  return {
    colors: THEME_MAP[settings.backgroundTheme] ?? WARM_THEME,
    fontFamily: settings.fontFamily === 'serif' ? 'NanumMyeongjo_400Regular' : undefined,
    fontScale: FONT_SCALE_MAP[settings.fontSize] ?? 1.0,
    isDark: settings.backgroundTheme === 'dark',
    diaryFontFamily: diaryOption.font,
    diaryFontKey: diaryOption.key,
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { entitlements } = useSubscription();
  const [appearance, setAppearance] = useState<AppearanceSettings>({
    backgroundTheme: 'warm',
    fontFamily: 'system',
    fontSize: 'medium',
    diaryFont: 'default',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setAppearance({ backgroundTheme: 'warm', fontFamily: 'system', fontSize: 'medium', diaryFont: 'default' });
      return;
    }

    settingsApi.get()
      .then((data) => {
        setAppearance({
          backgroundTheme: data.backgroundTheme ?? 'warm',
          fontFamily: data.fontFamily ?? 'system',
          fontSize: data.fontSize ?? 'medium',
          diaryFont: (data as any).diaryFont ?? 'default',
        });
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const theme = useMemo(
    () => buildTheme(appearance, entitlements.canUsePremiumFonts),
    [appearance, entitlements.canUsePremiumFonts],
  );

  const updateAppearance = useCallback(async (
    updates: Partial<Pick<UserSettings, 'backgroundTheme' | 'fontFamily' | 'fontSize' | 'diaryFont'>>
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
