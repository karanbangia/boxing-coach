import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Difficulty } from '@boxing-coach/core';

const STORAGE_KEY = 'boxing-coach-workout-history';
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

async function loadWorkoutHistory(): Promise<WorkoutHistoryItem[]> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as WorkoutHistoryItem[]) : [];
  } catch {
    return [];
  }
}

export async function saveWorkoutToHistory(item: WorkoutHistoryItem): Promise<boolean> {
  const previous = await loadWorkoutHistory();
  const previousBest = previous.reduce((best, workout) => Math.max(best, workout.punches), 0);
  const next = [item, ...previous.filter(workout => workout.id !== item.id)].slice(0, MAX_HISTORY_ITEMS);

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // The summary remains usable when storage is unavailable.
  }

  return item.punches > previousBest;
}
