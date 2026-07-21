import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS, type SetupSettings } from '../config';

const STORAGE_KEY = 'boxing-coach-mobile-settings';

function sanitizeSettings(raw: unknown): SetupSettings {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_SETTINGS;
  }

  const candidate = raw as Partial<SetupSettings>;
  const comboInstructionsEnabled =
    typeof candidate.comboInstructionsEnabled === 'boolean'
      ? candidate.comboInstructionsEnabled
      : DEFAULT_SETTINGS.comboInstructionsEnabled;

  return {
    difficulty: candidate.difficulty ?? DEFAULT_SETTINGS.difficulty,
    roundDuration: candidate.roundDuration ?? DEFAULT_SETTINGS.roundDuration,
    totalRounds: candidate.totalRounds ?? DEFAULT_SETTINGS.totalRounds,
    restDuration: candidate.restDuration ?? DEFAULT_SETTINGS.restDuration,
    comboInstructionsEnabled,
    audioCuesEnabled:
      comboInstructionsEnabled && typeof candidate.audioCuesEnabled === 'boolean'
        ? candidate.audioCuesEnabled
        : comboInstructionsEnabled && DEFAULT_SETTINGS.audioCuesEnabled,
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
    setSettings(prev => {
      const next = { ...prev, ...patch };

      if (!next.comboInstructionsEnabled) {
        next.audioCuesEnabled = false;
      }

      return next;
    });
  };

  return { settings, updateSettings, isReady };
}
