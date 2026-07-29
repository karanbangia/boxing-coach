import { useEffect, useState } from 'react';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { App as MobileApp } from './src/App';
import { subscribeToLocalAppDataReset } from './src/lib/appData';
import {
  initializeObservability,
  withErrorMonitoring,
} from './src/lib/observability';
import { AuthProvider } from './src/providers/AuthProvider';
import { PremiumProvider } from './src/providers/PremiumProvider';
import { WorkoutHistoryProvider } from './src/providers/WorkoutHistoryProvider';

initializeObservability();

function App() {
  const [dataEpoch, setDataEpoch] = useState(0);

  useEffect(
    () => subscribeToLocalAppDataReset(() => setDataEpoch(current => current + 1)),
    [],
  );

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <PremiumProvider>
          <WorkoutHistoryProvider key={dataEpoch}>
            <MobileApp />
          </WorkoutHistoryProvider>
        </PremiumProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default withErrorMonitoring(App);
