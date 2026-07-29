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

export function hasPremiumAccess({
  firebaseUid,
  revenueCatAppUserId,
  entitlementActive,
}: {
  firebaseUid: string | null;
  revenueCatAppUserId: string | null;
  entitlementActive: boolean;
}) {
  return Boolean(
    firebaseUid
    && revenueCatAppUserId === firebaseUid
    && entitlementActive,
  );
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
  if (identityState !== 'identified') {
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
