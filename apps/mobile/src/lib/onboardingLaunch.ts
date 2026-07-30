export type OnboardingLaunchDestination =
  | 'account_setup'
  | 'dashboard'
  | 'welcome'
  | 'resume';

export type AccountProfileResolution = 'complete' | 'missing' | 'error';

interface LaunchState {
  userId: string | null;
  accountProfileResolution: AccountProfileResolution | null;
  record: {
    status: 'in_progress' | 'completed';
    step: number;
    skipped: boolean;
    cloudOwnerUid: string | null;
  } | null;
}

export function resolveOnboardingLaunchDestination({
  userId,
  accountProfileResolution,
  record,
}: LaunchState): OnboardingLaunchDestination {
  if (userId) {
    if (
      accountProfileResolution === 'complete'
      || accountProfileResolution === 'error'
    ) {
      return 'dashboard';
    }

    const reusableCompletedProfile = Boolean(
      record?.status === 'completed'
      && !record.skipped
      && (record.cloudOwnerUid === null || record.cloudOwnerUid === userId),
    );
    return reusableCompletedProfile ? 'dashboard' : 'account_setup';
  }

  if (record?.status === 'completed') return 'dashboard';
  if (record && record.step > 0) return 'resume';
  return 'welcome';
}

export function nicknameFromDisplayName(displayName: string | null | undefined) {
  return displayName?.trim().split(/\s+/)[0] ?? '';
}
