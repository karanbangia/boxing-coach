import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'boxing-coach-audio-session';

interface Stored {
  masterVolume: number;
  muted: boolean;
}

const DEFAULT: Stored = { masterVolume: 1, muted: false };

function load(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      console.log('[audio-session] No stored session, using defaults:', DEFAULT);
      return DEFAULT;
    }
    const p = JSON.parse(raw) as Partial<Stored>;
    const masterVolume =
      typeof p.masterVolume === 'number' && p.masterVolume >= 0 && p.masterVolume <= 1
        ? p.masterVolume
        : DEFAULT.masterVolume;
    const result = { masterVolume, muted: Boolean(p.muted) };
    console.log('[audio-session] Loaded from storage:', result);
    return result;
  } catch {
    console.warn('[audio-session] Failed to parse stored session, using defaults');
    return DEFAULT;
  }
}

function save(s: Stored): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

/** Session volume + mute for bells and coach (persists across reloads). */
export function useAudioSession() {
  // Hydrate from localStorage in initial state. A mount-only load() + save() effect
  // would overwrite storage with defaults before setState from load() applied.
  const initialRef = useRef<Stored | null>(null);
  if (initialRef.current === null) {
    initialRef.current = load();
  }
  const init = initialRef.current;
  const [masterVolume, setMasterVolumeState] = useState(init.masterVolume);
  const [muted, setMutedState] = useState(init.muted);
  const preMuteVolume = useRef(init.masterVolume);

  useEffect(() => {
    save({ masterVolume, muted });
  }, [masterVolume, muted]);

  const effectiveVolume = muted ? 0 : masterVolume;

  const setMuted = useCallback((m: boolean) => {
    setMutedState(prev => {
      if (m && !prev) preMuteVolume.current = masterVolume;
      return m;
    });
  }, [masterVolume]);

  const toggleMute = useCallback(() => {
    setMutedState(prev => {
      const next = !prev;
      console.log('[audio-session] toggleMute:', prev, '→', next);
      if (prev) {
        setMasterVolumeState(preMuteVolume.current);
        return false;
      }
      preMuteVolume.current = masterVolume;
      return true;
    });
  }, [masterVolume]);

  const setVolumePercent = useCallback((percent: number) => {
    const p = Math.max(0, Math.min(100, Math.round(Number(percent))));
    console.log('[audio-session] setVolumePercent:', percent, '→', p / 100);
    setMutedState(false);
    setMasterVolumeState(p / 100);
  }, []);

  return {
    masterVolume,
    muted,
    effectiveVolume,
    toggleMute,
    setVolumePercent,
    setMuted,
  };
}
