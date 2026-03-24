import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'boxing-coach-mobile-session-audio';

interface Stored {
  masterVolume: number;
  muted: boolean;
}

const DEFAULT: Stored = { masterVolume: 1, muted: false };

export function useSessionAudio() {
  const [masterVolume, setMasterVolumeState] = useState(DEFAULT.masterVolume);
  const [muted, setMutedState] = useState(DEFAULT.muted);
  const preMuteVolume = useRef(DEFAULT.masterVolume);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!active || !raw) {
          if (active) setReady(true);
          return;
        }
        const p = JSON.parse(raw) as Partial<Stored>;
        const mv =
          typeof p.masterVolume === 'number' && p.masterVolume >= 0 && p.masterVolume <= 1
            ? p.masterVolume
            : DEFAULT.masterVolume;
        if (active) {
          setMasterVolumeState(mv);
          setMutedState(Boolean(p.muted));
          preMuteVolume.current = mv;
        }
      } catch {
        /* ignore */
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    void AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ masterVolume, muted } satisfies Stored),
    ).catch(() => {});
  }, [ready, masterVolume, muted]);

  const effectiveVolume = muted ? 0 : masterVolume;

  const toggleMute = useCallback(() => {
    setMutedState(prev => {
      if (prev) {
        setMasterVolumeState(preMuteVolume.current);
        return false;
      }
      preMuteVolume.current = masterVolume;
      return true;
    });
  }, [masterVolume]);

  const volumeDown = useCallback(() => {
    setMutedState(false);
    setMasterVolumeState(v => Math.max(0, Math.round((v - 0.1) * 10) / 10));
  }, []);

  const volumeUp = useCallback(() => {
    setMutedState(false);
    setMasterVolumeState(v => Math.min(1, Math.round((v + 0.1) * 10) / 10));
  }, []);

  return {
    ready,
    masterVolume,
    muted,
    effectiveVolume,
    toggleMute,
    volumeDown,
    volumeUp,
  };
}
