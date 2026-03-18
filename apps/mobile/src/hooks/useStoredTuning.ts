import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TuningOverrides } from '@boxing-coach/core';

const STORAGE_KEY = 'boxing-coach-mobile-tuning';

function sanitizeTuning(raw: unknown): TuningOverrides {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  return raw as TuningOverrides;
}

export function useStoredTuning() {
  const [tuning, setTuning] = useState<TuningOverrides>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!active || !raw) {
          return;
        }

        setTuning(sanitizeTuning(JSON.parse(raw)));
      } catch {
        // Ignore invalid storage and keep defaults.
      } finally {
        if (active) {
          setIsReady(true);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tuning)).catch(() => {
      // Persistence is best-effort only.
    });
  }, [isReady, tuning]);

  return { tuning, setTuning, isReady };
}
