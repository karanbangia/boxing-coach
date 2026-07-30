export type PremiumIdentityState =
  | 'initializing'
  | 'guest'
  | 'syncing'
  | 'identified'
  | 'error';

export type PendingPremiumAction = 'purchase' | 'restore';

export type PremiumActionStatus =
  | 'unlocked'
  | 'cancelled'
  | 'account_required'
  | 'not_found'
  | 'failed';

export type PendingPremiumEffect =
  | 'wait'
  | 'unlock'
  | 'purchase'
  | 'restore';

export interface PendingPremiumResolution {
  pendingAction: PendingPremiumAction | null;
  effect: PendingPremiumEffect;
}

const REVENUECAT_ANONYMOUS_PREFIX = '$RCAnonymousID:';

export function hasPremiumAccess({
  firebaseUid,
  revenueCatAppUserId,
  entitlementActive,
}: {
  firebaseUid: string | null;
  revenueCatAppUserId: string | null;
  entitlementActive: boolean;
}) {
  if (!entitlementActive || !revenueCatAppUserId) return false;
  return firebaseUid
    ? revenueCatAppUserId === firebaseUid
    : revenueCatAppUserId.startsWith(REVENUECAT_ANONYMOUS_PREFIX);
}

export function actionStatusUnlocksPremium(status: PremiumActionStatus) {
  return status === 'unlocked';
}

export function resolvePendingPremiumAction({
  pendingAction,
  identityState,
  isPremium,
}: {
  pendingAction: PendingPremiumAction;
  identityState: PremiumIdentityState;
  isPremium: boolean;
}): PendingPremiumResolution {
  if (identityState !== 'identified' && identityState !== 'guest') {
    return { pendingAction, effect: 'wait' };
  }
  if (isPremium) {
    return { pendingAction: null, effect: 'unlock' };
  }
  return {
    pendingAction: null,
    effect: pendingAction,
  };
}
