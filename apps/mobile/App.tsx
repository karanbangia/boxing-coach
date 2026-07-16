import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { App as MobileApp } from './src/App';
import { AuthProvider } from './src/providers/AuthProvider';
import { WorkoutHistoryProvider } from './src/providers/WorkoutHistoryProvider';

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <WorkoutHistoryProvider>
          <MobileApp />
        </WorkoutHistoryProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
