import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { NanumMyeongjo_400Regular, NanumMyeongjo_700Bold } from '@expo-google-fonts/nanum-myeongjo';
import { AuthProvider } from './src/contexts/AuthContext';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import Navigation from './src/navigation';

export default function App() {
  const [fontsLoaded] = useFonts({
    NanumMyeongjo_400Regular,
    NanumMyeongjo_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SubscriptionProvider>
          <ThemeProvider>
            <StatusBar style="auto" />
            <Navigation />
          </ThemeProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
