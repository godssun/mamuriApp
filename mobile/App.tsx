import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import Navigation from './src/navigation';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SubscriptionProvider>
          <StatusBar style="dark" />
          <Navigation />
        </SubscriptionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
