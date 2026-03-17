import type { TuningOverrides } from '@boxing-coach/core';

const TUNING_STORAGE_KEY = 'boxing-coach-tuning';

export function loadTuning(): TuningOverrides {
  try {
    const raw = localStorage.getItem(TUNING_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as TuningOverrides;
  } catch {
    return {};
  }
}

export function saveTuning(t: TuningOverrides): void {
  try {
    localStorage.setItem(TUNING_STORAGE_KEY, JSON.stringify(t));
  } catch { /* quota exceeded */ }
}
