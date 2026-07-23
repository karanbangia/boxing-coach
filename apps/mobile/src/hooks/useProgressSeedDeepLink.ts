import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import {
  buildProgressSeed,
  PROGRESS_SEED_ID_PREFIX,
} from '../dev/progressSeed';
import {
  loadWorkoutHistoryForScope,
  replaceWorkoutHistoryForScope,
} from '../lib/workoutHistory';

const SEED_URL = 'boxingcoach://dev/seed-progress';
const CLEAR_URL = 'boxingcoach://dev/clear-progress';

export function useProgressSeedDeepLink(
  userId: string | null,
  refreshHistory: () => Promise<void>,
) {
  const handledInitialUrl = useRef(false);

  useEffect(() => {
    if (!__DEV__) return undefined;

    const handleUrl = async (url: string | null) => {
      if (!url) return;

      if (url.startsWith(SEED_URL)) {
        const seed = buildProgressSeed();
        const existing = await loadWorkoutHistoryForScope(userId);
        const realHistory = existing.filter(item => !item.id.startsWith(PROGRESS_SEED_ID_PREFIX));
        await replaceWorkoutHistoryForScope(userId, [...seed, ...realHistory]);
        await refreshHistory();
        console.info(`[progress-seed] Added ${seed.length} workouts to ${userId ? 'account' : 'guest'} history.`);
        return;
      }

      if (url.startsWith(CLEAR_URL)) {
        const existing = await loadWorkoutHistoryForScope(userId);
        const realHistory = existing.filter(item => !item.id.startsWith(PROGRESS_SEED_ID_PREFIX));
        await replaceWorkoutHistoryForScope(userId, realHistory);
        await refreshHistory();
        console.info(`[progress-seed] Removed test workouts from ${userId ? 'account' : 'guest'} history.`);
      }
    };

    const subscription = Linking.addEventListener('url', event => {
      void handleUrl(event.url).catch(error => console.warn('[progress-seed]', error));
    });

    if (!handledInitialUrl.current) {
      handledInitialUrl.current = true;
      void Linking.getInitialURL()
        .then(handleUrl)
        .catch(error => console.warn('[progress-seed]', error));
    }

    return () => subscription.remove();
  }, [refreshHistory, userId]);
}
