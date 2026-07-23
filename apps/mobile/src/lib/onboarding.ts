import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_FIGHTER_PROFILE,
  TRAINING_DAYS,
  type FighterProfile,
  type HeightUnit,
  type TrainingDay,
  type WeightUnit,
} from '../features/profile/types';

const STORAGE_KEY = 'boxing-coach-onboarding:v1';
const ONBOARDING_VERSION = 4;

export type ReminderPermission = 'not_requested' | 'granted' | 'denied' | 'unavailable';
export type OnboardingStatus = 'in_progress' | 'completed';
export type OnboardingCloudSyncMode = 'onboarding_merge' | 'full_profile';

export interface OnboardingRecord {
  version: typeof ONBOARDING_VERSION;
  status: OnboardingStatus;
  step: number;
  profile: FighterProfile;
  reminderPermission: ReminderPermission;
  skipped: boolean;
  cloudSyncPending: boolean;
  cloudSyncMode: OnboardingCloudSyncMode | null;
  cloudOwnerUid: string | null;
  completedAt: string | null;
}

type ResetListener = () => void;
const resetListeners = new Set<ResetListener>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function numberOr(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function enumOr<T extends string | number>(value: unknown, allowed: readonly T[], fallback: T): T {
  return (typeof value === 'string' || typeof value === 'number') && allowed.includes(value as T)
    ? value as T
    : fallback;
}

function normalizeProfile(value: unknown): FighterProfile {
  const data = isRecord(value) ? value : {};
  const equipment = Array.isArray(data.equipment)
    ? data.equipment.filter(item => typeof item === 'string') as FighterProfile['equipment']
    : DEFAULT_FIGHTER_PROFILE.equipment;
  const rawTrainingDays = Array.isArray(data.trainingDays) ? data.trainingDays : null;
  const trainingDays = rawTrainingDays
    ? rawTrainingDays.filter(
      (item: unknown): item is TrainingDay => typeof item === 'string' && TRAINING_DAYS.includes(item as TrainingDay),
    )
    : DEFAULT_FIGHTER_PROFILE.trainingDays;

  return {
    displayName: typeof data.displayName === 'string' ? data.displayName : '',
    photoUrl: typeof data.photoUrl === 'string' ? data.photoUrl : null,
    gender: enumOr(data.gender, ['male', 'female'] as const, DEFAULT_FIGHTER_PROFILE.gender),
    experience: enumOr(
      data.experience,
      ['beginner', 'intermediate', 'advanced', 'professional'] as const,
      DEFAULT_FIGHTER_PROFILE.experience,
    ),
    stance: enumOr(
      data.stance,
      ['orthodox', 'southpaw', 'unsure'] as const,
      DEFAULT_FIGHTER_PROFILE.stance,
    ),
    goal: enumOr(
      data.goal,
      ['fundamentals', 'fitness', 'heavy_bag', 'competition'] as const,
      DEFAULT_FIGHTER_PROFILE.goal,
    ),
    equipment: equipment.length ? equipment : DEFAULT_FIGHTER_PROFILE.equipment,
    trainingDays,
    targetDaysPerWeek: rawTrainingDays
      ? trainingDays.length
      : numberOr(data.targetDaysPerWeek, DEFAULT_FIGHTER_PROFILE.targetDaysPerWeek),
    preferredSessionMinutes: enumOr(
      data.preferredSessionMinutes,
      [10, 20, 30, 45, 60] as const,
      DEFAULT_FIGHTER_PROFILE.preferredSessionMinutes,
    ),
    weightKg: numberOr(data.weightKg, DEFAULT_FIGHTER_PROFILE.weightKg),
    weightUnit: enumOr(
      data.weightUnit,
      ['kg', 'lb'] as const satisfies readonly WeightUnit[],
      DEFAULT_FIGHTER_PROFILE.weightUnit,
    ),
    heightCm: numberOr(data.heightCm, DEFAULT_FIGHTER_PROFILE.heightCm),
    heightUnit: enumOr(
      data.heightUnit,
      ['cm', 'in'] as const satisfies readonly HeightUnit[],
      DEFAULT_FIGHTER_PROFILE.heightUnit,
    ),
  };
}

function normalizeRecord(value: unknown): OnboardingRecord | null {
  if (
    !isRecord(value)
    || (
      value.version !== 1
      && value.version !== 2
      && value.version !== 3
      && value.version !== ONBOARDING_VERSION
    )
  ) return null;
  const rawStep = Math.max(0, Math.round(numberOr(value.step, 0)));
  const migratedStep = value.version === 2 && rawStep > 0 ? rawStep + 1 : rawStep;
  return {
    version: ONBOARDING_VERSION,
    status: value.status === 'completed' ? 'completed' : 'in_progress',
    step: Math.min(8, migratedStep),
    profile: normalizeProfile(value.profile),
    reminderPermission: enumOr(
      value.reminderPermission,
      ['not_requested', 'granted', 'denied', 'unavailable'] as const,
      'not_requested',
    ),
    skipped: value.skipped === true,
    cloudSyncPending: value.cloudSyncPending === true,
    cloudSyncMode: value.cloudSyncPending === true
      ? value.cloudSyncMode === 'full_profile'
        ? 'full_profile'
        : 'onboarding_merge'
      : null,
    cloudOwnerUid: typeof value.cloudOwnerUid === 'string' ? value.cloudOwnerUid : null,
    completedAt: typeof value.completedAt === 'string' ? value.completedAt : null,
  };
}

export function createOnboardingRecord(
  profile: FighterProfile = DEFAULT_FIGHTER_PROFILE,
): OnboardingRecord {
  return {
    version: ONBOARDING_VERSION,
    status: 'in_progress',
    step: 0,
    profile: { ...profile },
    reminderPermission: 'not_requested',
    skipped: false,
    cloudSyncPending: false,
    cloudSyncMode: null,
    cloudOwnerUid: null,
    completedAt: null,
  };
}

export async function loadOnboardingRecord(): Promise<OnboardingRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? normalizeRecord(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export async function saveOnboardingRecord(record: OnboardingRecord): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeRecord(record) ?? record));
}

export async function resetOnboardingForAccountDeletion(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
  resetListeners.forEach(listener => listener());
}

export function subscribeToOnboardingReset(listener: ResetListener) {
  resetListeners.add(listener);
  return () => resetListeners.delete(listener);
}
