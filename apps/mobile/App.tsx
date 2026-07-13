import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { App as MobileApp } from './src/App';

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <MobileApp />
    </SafeAreaProvider>
  );
}
