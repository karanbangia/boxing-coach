import type { Difficulty, EngineConfig } from '@boxing-coach/core';

export type SetupSettings = Pick<
  EngineConfig,
  'difficulty' | 'roundDuration' | 'totalRounds' | 'restDuration'
> & {
  /** When false, coach clips are not played (registry entries only). */
  audioCuesEnabled: boolean;
};

export const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'beginner', label: 'BEGINNER', desc: 'Jabs & crosses, slow pace' },
  { value: 'intermediate', label: 'INTERMEDIATE', desc: 'Adds hooks, moderate build' },
  { value: 'advanced', label: 'ADVANCED', desc: 'All punches, fast ramp up' },
  { value: 'pro', label: 'PROFESSIONAL', desc: 'Counters, feints, advanced combos' },
];

export const ROUND_DURATIONS = [
  { value: 120, label: '2 MIN' },
  { value: 180, label: '3 MIN' },
];

export const TOTAL_ROUNDS = [
  { value: 3, label: '3' },
  { value: 6, label: '6' },
  { value: 9, label: '9' },
  { value: 12, label: '12' },
];

export const REST_DURATIONS = [
    { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
  { value: 90, label: '90s' },
];

export const DEFAULT_SETTINGS: SetupSettings = {
  difficulty: 'beginner',
  roundDuration: 120,
  totalRounds: 3,
  restDuration: 30,
  audioCuesEnabled: true,
};
