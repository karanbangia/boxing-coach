import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS, type SetupSettings } from '../config';

const STORAGE_KEY = 'boxing-coach-mobile-settings';

function sanitizeSettings(raw: unknown): SetupSettings {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_SETTINGS;
  }

  const candidate = raw as Partial<SetupSettings>;

  return {
    difficulty: candidate.difficulty ?? DEFAULT_SETTINGS.difficulty,
    roundDuration: candidate.roundDuration ?? DEFAULT_SETTINGS.roundDuration,
    totalRounds: candidate.totalRounds ?? DEFAULT_SETTINGS.totalRounds,
    restDuration: candidate.restDuration ?? DEFAULT_SETTINGS.restDuration,
  };
}

export function useStoredSettings() {
  const [settings, setSettings] = useState<SetupSettings>(DEFAULT_SETTINGS);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!active || !raw) {
          return;
        }

        setSettings(sanitizeSettings(JSON.parse(raw)));
      } catch {
        // Ignore corrupted storage and keep defaults.
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

    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {
      // Persistence is best-effort only.
    });
  }, [isReady, settings]);

  const updateSettings = (patch: Partial<SetupSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  };

  return { settings, updateSettings, isReady };
}
