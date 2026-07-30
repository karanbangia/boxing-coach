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

export const premiumBackgroundGradient = {
  colors: ['#310508', '#1b0406', '#0b0708', '#030303'] as const,
  locations: [0, 0.32, 0.7, 1] as const,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};

export const glass = {
  surface: 'rgba(255, 255, 255, 0.055)',
  surfaceStrong: 'rgba(255, 255, 255, 0.09)',
  sheet: 'rgba(18, 18, 18, 0.82)',
  border: 'rgba(255, 255, 255, 0.18)',
  borderStrong: 'rgba(249, 189, 173, 0.38)',
  accentSurface: 'rgba(255, 20, 20, 0.14)',
  accentSurfaceStrong: 'rgba(255, 20, 20, 0.56)',
  accentHighlight: 'rgba(255, 119, 107, 0.34)',
  intensityLow: 'rgba(85, 26, 26, 0.58)',
  intensityMedium: 'rgba(140, 39, 37, 0.62)',
  intensityHigh: 'rgba(201, 54, 48, 0.68)',
  intensityMax: 'rgba(255, 85, 64, 0.78)',
} as const;

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
