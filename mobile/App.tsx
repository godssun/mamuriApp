import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  '[RevenueCat]', // 시뮬레이터에서 StoreKit 미연결 시 발생하는 정상 경고
]);

import './src/i18n/i18n';
import { applyMockOverrides } from './src/screenshot/mockOverrides';

// ── Screenshot Mode: mock all APIs before anything loads ──
const SCREENSHOT_MODE = false;
if (SCREENSHOT_MODE) {
  applyMockOverrides();
}
// ──────────────────────────────────────────────────────────

import mobileAds from 'react-native-google-mobile-ads';
import { StatusBar } from 'expo-status-bar';

// Google Mobile Ads SDK 초기화
mobileAds().initialize();
import { useFonts } from 'expo-font';
import { NanumMyeongjo_400Regular, NanumMyeongjo_700Bold } from '@expo-google-fonts/nanum-myeongjo';
import { buildFontAssets } from './src/design-system-v3';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { ThemeSyncBridge } from './src/contexts/ThemeSyncBridge';
import { CustomStickerProvider } from './src/contexts/CustomStickerContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import Navigation from './src/navigation';

export default function App() {
  const [fontsLoaded] = useFonts({
    NanumMyeongjo_400Regular,
    NanumMyeongjo_700Bold,
    ...buildFontAssets(),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SubscriptionProvider>
          <ThemeProvider>
            <ThemeSyncBridge>
              <CustomStickerProvider>
                <SafeAreaProvider>
                  <StatusBar style="auto" />
                  <Navigation />
                </SafeAreaProvider>
              </CustomStickerProvider>
            </ThemeSyncBridge>
          </ThemeProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
