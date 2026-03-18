import { useEffect } from 'react';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const WAKE_LOCK_TAG = 'boxing-coach-workout';

export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) {
      deactivateKeepAwake(WAKE_LOCK_TAG);
      return;
    }

    void activateKeepAwakeAsync(WAKE_LOCK_TAG).catch(() => {
      // Keep-awake is best-effort on unsupported environments.
    });

    return () => {
      deactivateKeepAwake(WAKE_LOCK_TAG);
    };
  }, [active]);
}
