import type { WorkoutHistoryItem } from '../lib/workoutHistory';

const developmentHistoryDayOffsets = [
  0, 1, 2, 4, 4, 6, 8, 9, 11, 11, 13, 15, 18, 20, 20,
  23, 25, 27, 30, 32, 32, 35, 38, 40, 43, 45, 48, 52, 56, 60,
] as const;

export const PROGRESS_SEED_ID_PREFIX = 'development-history-';

export function buildProgressSeed(now = new Date()): WorkoutHistoryItem[] {
  const difficulties = ['beginner', 'intermediate', 'advanced', 'pro'] as const;
  const roundCounts = [4, 6, 8, 10] as const;
  const roundDurations = [120, 150, 180] as const;

  return developmentHistoryDayOffsets.map((dayOffset, index) => {
    const completedAt = new Date(now);
    completedAt.setDate(completedAt.getDate() - dayOffset);
    completedAt.setHours(19 - (index % 3) * 4, 10 + (index % 5) * 7, 0, 0);

    const difficulty = difficulties[index % difficulties.length];
    const totalRounds = roundCounts[index % roundCounts.length];
    const roundDuration = roundDurations[index % roundDurations.length];

    return {
      id: `${PROGRESS_SEED_ID_PREFIX}${index + 1}`,
      completedAt: completedAt.toISOString(),
      difficulty,
      totalRounds,
      roundDuration,
      punches: 180 + totalRounds * 31 + (index % 6) * 24,
      averageHeartRate: 126 + (index % 7) * 5,
      caloriesBurned: 110 + totalRounds * 18 + (index % 5) * 13,
    };
  });
}
