export const ONBOARDING_VERSION = 7;
export const ONBOARDING_COMPLETED_STEP = 8;

export function migrateOnboardingStep(
  version: number,
  status: 'in_progress' | 'completed',
  value: number,
) {
  if (status === 'completed') return ONBOARDING_COMPLETED_STEP;

  const rawStep = Math.max(
    0,
    Math.round(Number.isFinite(value) ? value : 0),
  );
  if (version === ONBOARDING_VERSION) {
    return Math.min(ONBOARDING_COMPLETED_STEP, rawStep);
  }

  // Versions 1–4 used the original eight-page onboarding. Versions 5 and 6
  // shortened or combined those pages, so unfinished records restart at the
  // restored gender page while retaining any answers already captured.
  if (version <= 4) {
    const legacyStep = version === 2 && rawStep > 0 ? rawStep + 1 : rawStep;
    return Math.min(ONBOARDING_COMPLETED_STEP, legacyStep);
  }
  return 0;
}
