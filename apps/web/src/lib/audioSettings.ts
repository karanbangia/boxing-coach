const SETTINGS_KEY = 'boxing-coach-settings';

/** Reads coach audio toggle from the same `localStorage` key as SetupScreen (`boxing-coach-settings`). */
export function readAudioCuesEnabled(): boolean {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      console.log('[audio-settings] No stored settings, audioCuesEnabled defaulting to true');
      return true;
    }
    const p = JSON.parse(raw) as { audioCuesEnabled?: boolean };
    const enabled = typeof p.audioCuesEnabled === 'boolean' ? p.audioCuesEnabled : true;
    console.log('[audio-settings] audioCuesEnabled:', enabled);
    return enabled;
  } catch {
    console.warn('[audio-settings] Failed to parse settings, audioCuesEnabled defaulting to true');
    return true;
  }
}
