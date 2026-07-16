import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { App as MobileApp } from './src/App';
import { AuthProvider } from './src/providers/AuthProvider';

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <MobileApp />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
