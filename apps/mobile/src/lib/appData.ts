import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import { cancelTrainingReminders } from './trainingReminders';

const APP_STORAGE_KEY_PREFIX = 'boxing-coach';
const PERFORMANCE_SHARE_FILE = 'boxing-coach-performance.png';

type ResetListener = () => void;
const resetListeners = new Set<ResetListener>();

export async function clearLocalAppData(): Promise<void> {
  await cancelTrainingReminders().catch(() => undefined);
  const keys = (await AsyncStorage.getAllKeys())
    .filter(key => key.startsWith(APP_STORAGE_KEY_PREFIX));

  if (keys.length) await AsyncStorage.multiRemove(keys);
  try {
    const performanceShare = new File(Paths.cache, PERFORMANCE_SHARE_FILE);
    if (performanceShare.exists) performanceShare.delete();
  } catch {
    // Cache cleanup is best effort; persisted account data has still been cleared.
  }
  resetListeners.forEach(listener => listener());
}

export function subscribeToLocalAppDataReset(listener: ResetListener) {
  resetListeners.add(listener);
  return () => {
    resetListeners.delete(listener);
  };
}
