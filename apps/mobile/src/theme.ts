export const colors = {
  background: '#131313',
  backgroundAlt: '#131313',
  surface: '#1a1a1a',
  surfaceStrong: '#1a1a1a',
  surfaceMuted: '#202020',
  border: '#333333',
  text: '#f5f0ef',
  textMuted: '#d1cfcf',
  peach: '#f9bdad',
  accent: '#ff1414',
  accentGlow: '#ff5a4f',
  accentSoft: 'rgba(239, 68, 68, 0.18)',
  workoutIntensity1: '#551a1a',
  workoutIntensity2: '#8c2725',
  workoutIntensity3: '#c93630',
  workoutIntensity4: '#ff5540',
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ff1414',
  blue: '#60a5fa',
  amber: '#fbbf24',
  transparent: 'transparent',
  overlay: 'rgba(10, 10, 10, 0.58)',
};

export const TEXT_LINE_HEIGHT_MULTIPLIER = 1.4;

export function textLineHeight(fontSize: number) {
  return fontSize * TEXT_LINE_HEIGHT_MULTIPLIER;
}

export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.28,
  shadowRadius: 24,
  shadowOffset: {
    width: 0,
    height: 12,
  },
  elevation: 16,
} as const;
