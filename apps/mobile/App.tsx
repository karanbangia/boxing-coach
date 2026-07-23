import { useEffect, useState } from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { App as MobileApp } from './src/App';
import { subscribeToLocalAppDataReset } from './src/lib/appData';
import { AuthProvider } from './src/providers/AuthProvider';
import { WorkoutHistoryProvider } from './src/providers/WorkoutHistoryProvider';

export default function App() {
  const [dataEpoch, setDataEpoch] = useState(0);

  useEffect(
    () => subscribeToLocalAppDataReset(() => setDataEpoch(current => current + 1)),
    [],
  );

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <WorkoutHistoryProvider key={dataEpoch}>
          <MobileApp />
        </WorkoutHistoryProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
