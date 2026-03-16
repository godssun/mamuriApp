/**
 * ThemeSyncBridge
 *
 * v1 ThemeProvider의 isDark 상태를 v2 ThemeProviderV2의 setThemeMode로 동기화.
 * v1 스크린은 useTheme(), v2 스크린은 useThemeV2()를 각각 유지.
 */
import React, { useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { ThemeProviderV2, useThemeV2 } from '../design-system-v2';

function ThemeSyncInner({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const { setThemeMode } = useThemeV2();

  useEffect(() => {
    setThemeMode(theme.isDark ? 'dark' : 'light');
  }, [theme.isDark, setThemeMode]);

  return <>{children}</>;
}

export function ThemeSyncBridge({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProviderV2>
      <ThemeSyncInner>{children}</ThemeSyncInner>
    </ThemeProviderV2>
  );
}
