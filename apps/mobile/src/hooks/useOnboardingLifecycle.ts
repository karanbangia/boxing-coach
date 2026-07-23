import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_FIGHTER_PROFILE,
  type FighterProfile,
} from '../features/profile/types';
import {
  createOnboardingRecord,
  loadOnboardingRecord,
  saveOnboardingRecord,
  subscribeToOnboardingReset,
  type OnboardingRecord,
} from '../lib/onboarding';
import { resolveOnboardingLaunchDestination } from '../lib/onboardingLaunch';
import {
  cancelTrainingReminders,
  scheduleTrainingReminders,
} from '../lib/trainingReminders';
import { useAuth } from '../providers/AuthProvider';

const LEGACY_FORCE_ONBOARDING =
  __DEV__ && process.env.EXPO_PUBLIC_IS_ONBOARDING === 'true';
const ONBOARDING_TEST_SCENARIO = __DEV__
  ? process.env.EXPO_PUBLIC_ONBOARDING_TEST_SCENARIO?.trim().toLowerCase() ?? 'fresh'
  : 'normal';
const RESUME_TEST_MATCH = /^resume-([2-8])$/.exec(ONBOARDING_TEST_SCENARIO);
const RESUME_TEST_STEP = RESUME_TEST_MATCH ? Number(RESUME_TEST_MATCH[1]) - 1 : null;
const FORCE_ONBOARDING_AT_LAUNCH = LEGACY_FORCE_ONBOARDING
  || ONBOARDING_TEST_SCENARIO === 'fresh'
  || ONBOARDING_TEST_SCENARIO === 'signup'
  || RESUME_TEST_STEP !== null;
const FORCE_GUEST_DASHBOARD =
  __DEV__ && ONBOARDING_TEST_SCENARIO === 'guest-complete';

function profilesMatch(left: FighterProfile, right: FighterProfile) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function mergeOnboardingProfile(
  onboardingProfile: FighterProfile,
  cloudProfile: FighterProfile | null,
): FighterProfile {
  return {
    ...(cloudProfile ?? onboardingProfile),
    displayName: onboardingProfile.displayName,
    gender: onboardingProfile.gender,
    experience: onboardingProfile.experience,
    stance: onboardingProfile.stance,
    goal: onboardingProfile.goal,
    trainingDays: onboardingProfile.trainingDays,
    targetDaysPerWeek: onboardingProfile.trainingDays.length,
    preferredSessionMinutes: onboardingProfile.preferredSessionMinutes,
    weightKg: onboardingProfile.weightKg,
    weightUnit: onboardingProfile.weightUnit,
    heightCm: onboardingProfile.heightCm,
    heightUnit: onboardingProfile.heightUnit,
    photoUrl: cloudProfile?.photoUrl ?? onboardingProfile.photoUrl,
    equipment: cloudProfile?.equipment ?? onboardingProfile.equipment,
  };
}

export function useOnboardingLifecycle() {
  const { user, profile, isReady: authReady, saveProfile } = useAuth();
  const [record, setRecord] = useState<OnboardingRecord | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [forcedOnboardingFinished, setForcedOnboardingFinished] = useState(false);
  const cloudSyncAttemptedFor = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    void loadOnboardingRecord().then(saved => {
      if (!active) return;
      setRecord(saved);
      setStorageReady(true);
    });
    const unsubscribe = subscribeToOnboardingReset(() => {
      if (!active) return;
      cloudSyncAttemptedFor.current = null;
      setRecord(null);
      setStorageReady(true);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Mirror the authenticated cloud profile locally unless an unsynced guest
  // profile is deliberately waiting to be promoted.
  useEffect(() => {
    if (
      !storageReady
      || !authReady
      || !user
      || !profile
      || record?.cloudSyncPending
    ) return;
    const protectsUnsyncedGuestProfile = Boolean(
      record
      && !record.skipped
      && record.cloudOwnerUid === null
      && (record.status === 'completed' || record.step > 0),
    );
    if (protectsUnsyncedGuestProfile) return;
    if (
      record?.status === 'completed'
      && record.cloudOwnerUid === user.uid
      && profilesMatch(record.profile, profile)
    ) return;
    const recovered: OnboardingRecord = {
      ...createOnboardingRecord(profile),
      status: 'completed',
      step: 8,
      cloudOwnerUid: user.uid,
      completedAt: new Date().toISOString(),
    };
    setRecord(recovered);
    void saveOnboardingRecord(recovered).catch(() => undefined);
  }, [authReady, profile, record, storageReady, user]);

  // Persist locally first, then make one best-effort cloud attempt per launch.
  // A failed write stays pending and is retried after the next launch.
  useEffect(() => {
    if (
      !storageReady
      || !authReady
      || !user
      || !record?.cloudSyncPending
      || record.status !== 'completed'
      || cloudSyncAttemptedFor.current === user.uid
    ) return;

    const belongsToAnotherAccount = record.cloudOwnerUid !== null
      && record.cloudOwnerUid !== user.uid;
    if (record.skipped || belongsToAnotherAccount) {
      const resolved = profile
        ? {
            ...createOnboardingRecord(profile),
            status: 'completed' as const,
            step: 8,
            cloudOwnerUid: user.uid,
            completedAt: new Date().toISOString(),
          }
        : {
            ...record,
            cloudSyncPending: false,
            cloudSyncMode: null,
            cloudOwnerUid: null,
          };
      setRecord(resolved);
      void saveOnboardingRecord(resolved).catch(() => undefined);
      return;
    }

    cloudSyncAttemptedFor.current = user.uid;
    const localProfileForSync = {
      ...record.profile,
      displayName: record.profile.displayName.trim() || user.displayName?.trim() || 'Boxer',
      targetDaysPerWeek: record.profile.trainingDays.length,
    };
    const profileForSync = record.cloudSyncMode === 'full_profile'
      ? localProfileForSync
      : mergeOnboardingProfile(localProfileForSync, profile);
    void saveProfile(profileForSync)
      .then(() => {
        setRecord(current => {
          if (!current) return current;
          const synced = {
            ...current,
            profile: profileForSync,
            cloudSyncPending: false,
            cloudSyncMode: null,
            cloudOwnerUid: user.uid,
          };
          void saveOnboardingRecord(synced).catch(() => undefined);
          return synced;
        });
      })
      .catch(() => undefined);
  }, [authReady, profile, record, saveProfile, storageReady, user]);

  const saveProgress = useCallback(async (next: OnboardingRecord) => {
    if (FORCE_ONBOARDING_AT_LAUNCH && !forcedOnboardingFinished) return;
    setRecord(next);
    await saveOnboardingRecord(next);
  }, [forcedOnboardingFinished]);

  const complete = useCallback(async (
    next: OnboardingRecord,
    options: { skipped?: boolean; cloudSyncPending?: boolean } = {},
  ) => {
    if (FORCE_ONBOARDING_AT_LAUNCH) {
      setForcedOnboardingFinished(true);
      return;
    }
    const completed: OnboardingRecord = {
      ...next,
      status: 'completed',
      step: 8,
      skipped: options.skipped ?? false,
      cloudSyncPending: options.cloudSyncPending ?? false,
      cloudSyncMode: options.cloudSyncPending ? 'onboarding_merge' : null,
      cloudOwnerUid: null,
      completedAt: new Date().toISOString(),
    };
    setRecord(completed);
    await saveOnboardingRecord(completed);
  }, []);

  const saveFighterProfile = useCallback(async (nextProfile: FighterProfile) => {
    const normalizedProfile = {
      ...nextProfile,
      displayName: nextProfile.displayName.trim(),
      targetDaysPerWeek: nextProfile.trainingDays.length,
    };
    const nextRecord: OnboardingRecord = {
      ...(record ?? createOnboardingRecord(normalizedProfile)),
      status: 'completed',
      step: 8,
      profile: normalizedProfile,
      skipped: false,
      cloudSyncPending: Boolean(user),
      cloudSyncMode: user ? 'full_profile' : null,
      cloudOwnerUid: user?.uid ?? null,
      completedAt: record?.completedAt ?? new Date().toISOString(),
    };
    cloudSyncAttemptedFor.current = null;
    setRecord(nextRecord);
    await saveOnboardingRecord(nextRecord);
    if (nextRecord.reminderPermission === 'granted') {
      await scheduleTrainingReminders(
        normalizedProfile.trainingDays,
        normalizedProfile.preferredSessionMinutes,
      ).catch(() => undefined);
    } else if (!normalizedProfile.trainingDays.length) {
      await cancelTrainingReminders().catch(() => undefined);
    }
  }, [record, user]);

  const promoteGuestProfile = useCallback(async () => {
    if (!record || record.status !== 'completed') return;
    const pending: OnboardingRecord = {
      ...record,
      cloudSyncPending: true,
      cloudSyncMode: 'onboarding_merge',
    };
    cloudSyncAttemptedFor.current = null;
    setRecord(pending);
    await saveOnboardingRecord(pending);
  }, [record]);

  const freshRecord = createOnboardingRecord({
    ...DEFAULT_FIGHTER_PROFILE,
    displayName: user?.displayName?.trim() || '',
  });
  const guestPreviewRecord: OnboardingRecord | null = FORCE_GUEST_DASHBOARD
    ? {
        ...createOnboardingRecord({
          ...DEFAULT_FIGHTER_PROFILE,
          displayName: 'Riya “Counter” Singh',
          gender: 'female',
          experience: 'advanced',
          stance: 'southpaw',
          goal: 'fitness',
          trainingDays: ['tuesday', 'thursday', 'saturday'],
          targetDaysPerWeek: 3,
          preferredSessionMinutes: 30,
          weightKg: 61,
          heightCm: 168,
        }),
        status: 'completed',
        step: 8,
        completedAt: '2026-01-01T00:00:00.000Z',
      }
    : null;
  const testRecord = {
    ...freshRecord,
    step: ONBOARDING_TEST_SCENARIO === 'signup'
      ? 8
      : RESUME_TEST_STEP ?? 0,
  };
  const initialRecord = FORCE_ONBOARDING_AT_LAUNCH && !forcedOnboardingFinished
    ? testRecord
    : record ?? guestPreviewRecord ?? freshRecord;
  const isReady = storageReady && authReady;
  const launchDestination = resolveOnboardingLaunchDestination({
    signedIn: Boolean(user),
    record,
  });
  const shouldShowFromSavedState = launchDestination !== 'dashboard';
  const shouldShow = isReady && !forcedOnboardingFinished && (
    FORCE_ONBOARDING_AT_LAUNCH
    || (!FORCE_GUEST_DASHBOARD && shouldShowFromSavedState)
  );
  const localProfile = record?.status === 'completed'
    ? record.profile
    : initialRecord.profile;
  const effectiveProfile = !user
    ? localProfile
    : record?.cloudSyncPending
      && !record.skipped
      && (record.cloudOwnerUid === null || record.cloudOwnerUid === user.uid)
      ? record.profile
      : profile
        ?? (
          record?.status === 'completed' && record.cloudOwnerUid === user.uid
            ? record.profile
            : null
        );

  return {
    isReady,
    shouldShow,
    initialRecord,
    saveProgress,
    complete,
    fighterProfile: effectiveProfile,
    profileIsSkipped: record?.skipped ?? false,
    cloudSyncPending: record?.cloudSyncPending ?? false,
    saveFighterProfile,
    promoteGuestProfile,
  };
}
