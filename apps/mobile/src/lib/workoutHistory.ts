import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Difficulty } from '@boxing-coach/core';

const LEGACY_STORAGE_KEY = 'boxing-coach-workout-history';
const GUEST_STORAGE_KEY = 'boxing-coach-workout-history:guest';
const ACTIVE_USER_KEY = 'boxing-coach-workout-history:active-user';
const LAST_ACCOUNT_USER_KEY = 'boxing-coach-workout-history:last-account-user';
const USER_STORAGE_KEY_PREFIX = 'boxing-coach-workout-history:user:';
const MAX_HISTORY_ITEMS = 100;

export interface WorkoutHistoryItem {
  id: string;
  completedAt: string;
  difficulty: Difficulty;
  totalRounds: number;
  roundDuration: number;
  punches: number;
  averageHeartRate: number;
  caloriesBurned: number;
}

function storageKeyForScope(userId: string | null) {
  return userId ? `${USER_STORAGE_KEY_PREFIX}${userId}` : GUEST_STORAGE_KEY;
}

function normalizeHistory(items: WorkoutHistoryItem[]) {
  return items
    .filter((item, index, all) => all.findIndex(candidate => candidate.id === item.id) === index)
    .sort((left, right) => Date.parse(right.completedAt) - Date.parse(left.completedAt))
    .slice(0, MAX_HISTORY_ITEMS);
}

async function ensureLegacyGuestHistory() {
  const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacy) return;

  const existingGuest = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
  if (!existingGuest) {
    await AsyncStorage.setItem(GUEST_STORAGE_KEY, legacy);
  }

  // Legacy data is migrated exactly once. Leaving the old key behind can
  // resurrect account workouts as guest history after the guest copy is
  // uploaded and intentionally cleared.
  await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
}

export async function getActiveHistoryUser(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_USER_KEY);
}

export async function setActiveHistoryUser(userId: string | null): Promise<void> {
  if (userId) {
    await AsyncStorage.setItem(ACTIVE_USER_KEY, userId);
  } else {
    await AsyncStorage.removeItem(ACTIVE_USER_KEY);
  }
}

export async function setLastAccountHistoryUser(userId: string | null): Promise<void> {
  if (userId) {
    await AsyncStorage.setItem(LAST_ACCOUNT_USER_KEY, userId);
  } else {
    await AsyncStorage.removeItem(LAST_ACCOUNT_USER_KEY);
  }
}

export async function getLastAccountHistoryUser(): Promise<string | null> {
  const savedUserId = await AsyncStorage.getItem(LAST_ACCOUNT_USER_KEY);
  if (savedUserId) return savedUserId;

  // Older builds did not remember which account was last signed out. Recover
  // the most recently active account from its locally cached workout history.
  const accountKeys = (await AsyncStorage.getAllKeys())
    .filter(key => key.startsWith(USER_STORAGE_KEY_PREFIX));
  let mostRecentUserId: string | null = null;
  let mostRecentWorkoutAt = -Infinity;
  for (const key of accountKeys) {
    const userId = key.slice(USER_STORAGE_KEY_PREFIX.length);
    const history = await loadWorkoutHistoryForScope(userId);
    const newestWorkoutAt = history.reduce(
      (newest, workout) => Math.max(newest, Date.parse(workout.completedAt) || -Infinity),
      -Infinity,
    );
    if (newestWorkoutAt > mostRecentWorkoutAt) {
      mostRecentWorkoutAt = newestWorkoutAt;
      mostRecentUserId = userId;
    }
  }
  if (mostRecentUserId) await setLastAccountHistoryUser(mostRecentUserId);
  return mostRecentUserId;
}

export async function loadWorkoutHistoryForScope(
  userId: string | null,
): Promise<WorkoutHistoryItem[]> {
  try {
    if (!userId) await ensureLegacyGuestHistory();
    const value = await AsyncStorage.getItem(storageKeyForScope(userId));
    return value ? (JSON.parse(value) as WorkoutHistoryItem[]) : [];
  } catch {
    return [];
  }
}

export async function loadVisibleWorkoutHistory(
  userId: string | null,
): Promise<WorkoutHistoryItem[]> {
  if (userId) {
    return loadWorkoutHistoryForScope(userId);
  }

  const lastAccountUserId = await getLastAccountHistoryUser();
  const [guestHistory, accountHistory] = await Promise.all([
    loadWorkoutHistoryForScope(null),
    lastAccountUserId ? loadWorkoutHistoryForScope(lastAccountUserId) : Promise.resolve([]),
  ]);
  return normalizeHistory([...guestHistory, ...accountHistory]);
}

export async function loadWorkoutHistory(): Promise<WorkoutHistoryItem[]> {
  return loadWorkoutHistoryForScope(await getActiveHistoryUser());
}

export async function replaceWorkoutHistoryForScope(
  userId: string | null,
  items: WorkoutHistoryItem[],
): Promise<void> {
  const next = normalizeHistory(items);
  await AsyncStorage.setItem(storageKeyForScope(userId), JSON.stringify(next));
}

export async function clearWorkoutHistoryForScope(userId: string | null): Promise<void> {
  await AsyncStorage.removeItem(storageKeyForScope(userId));
}

export async function saveWorkoutToHistory(item: WorkoutHistoryItem): Promise<void> {
  const previous = await loadWorkoutHistory();
  const next = [item, ...previous.filter(workout => workout.id !== item.id)].slice(0, MAX_HISTORY_ITEMS);

  try {
    const userId = await getActiveHistoryUser();
    await AsyncStorage.setItem(storageKeyForScope(userId), JSON.stringify(next));
  } catch {
    // The summary remains usable when storage is unavailable.
  }
}
