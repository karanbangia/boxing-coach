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

export function loadWorkoutHistory(): WorkoutHistoryItem[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as WorkoutHistoryItem[]) : [];
  } catch {
    return [];
  }
}

export function saveWorkoutToHistory(item: WorkoutHistoryItem): void {
  const previous = loadWorkoutHistory();
  const next = [item, ...previous.filter(workout => workout.id !== item.id)].slice(0, MAX_HISTORY_ITEMS);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // The summary remains usable when storage is unavailable.
  }
}
