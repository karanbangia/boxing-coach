export type OnboardingLaunchDestination = 'dashboard' | 'welcome' | 'resume';

interface LaunchState {
  signedIn: boolean;
  record: {
    status: 'in_progress' | 'completed';
    step: number;
  } | null;
}

export function resolveOnboardingLaunchDestination({
  signedIn,
  record,
}: LaunchState): OnboardingLaunchDestination {
  if (signedIn || record?.status === 'completed') return 'dashboard';
  if (record && record.step > 0) return 'resume';
  return 'welcome';
}
