import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

const REVIEW_STATE_KEY = 'boxing-coach-app-store-review:v1';
const COMPLETED_WORKOUTS_BEFORE_REVIEW = 2;

interface ReviewState {
  completedWorkouts: number;
  requested: boolean;
}

export interface AppStoreReviewResult {
  completedWorkouts: number;
  requested: boolean;
}

function parseReviewState(value: string | null): ReviewState {
  if (!value) return { completedWorkouts: 0, requested: false };

  try {
    const parsed = JSON.parse(value) as Partial<ReviewState>;
    return {
      completedWorkouts: Number.isFinite(parsed.completedWorkouts)
        ? Math.max(0, Math.floor(parsed.completedWorkouts ?? 0))
        : 0,
      requested: parsed.requested === true,
    };
  } catch {
    return { completedWorkouts: 0, requested: false };
  }
}

export async function recordCompletedWorkoutForReview(): Promise<AppStoreReviewResult> {
  if (Platform.OS !== 'ios') {
    return { completedWorkouts: 0, requested: false };
  }

  const state = parseReviewState(await AsyncStorage.getItem(REVIEW_STATE_KEY));
  const nextState = {
    ...state,
    completedWorkouts: state.completedWorkouts + 1,
  };

  await AsyncStorage.setItem(REVIEW_STATE_KEY, JSON.stringify(nextState));

  return {
    completedWorkouts: nextState.completedWorkouts,
    requested: false,
  };
}

/**
 * Requests a review only after the boxer gives positive completion feedback.
 * This avoids interrupting a difficult or disappointing post-workout moment.
 */
export async function requestReviewAfterPositiveFeedback(): Promise<AppStoreReviewResult> {
  if (Platform.OS !== 'ios') {
    return { completedWorkouts: 0, requested: false };
  }

  const state = parseReviewState(await AsyncStorage.getItem(REVIEW_STATE_KEY));
  if (
    state.requested
    || state.completedWorkouts < COMPLETED_WORKOUTS_BEFORE_REVIEW
    || !(await StoreReview.isAvailableAsync())
  ) {
    return {
      completedWorkouts: state.completedWorkouts,
      requested: false,
    };
  }

  await StoreReview.requestReview();
  await AsyncStorage.setItem(
    REVIEW_STATE_KEY,
    JSON.stringify({ ...state, requested: true }),
  );

  return {
    completedWorkouts: state.completedWorkouts,
    requested: true,
  };
}
