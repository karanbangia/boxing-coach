import type { Action, Difficulty } from './types.js';

export interface WorkoutPerformance {
  punches: number;
  averageHeartRate: number;
  caloriesBurned: number;
}

const heartRateByDifficulty: Record<Difficulty, number> = {
  beginner: 132,
  intermediate: 142,
  advanced: 151,
  pro: 158,
};

const caloriesPerMinuteByDifficulty: Record<Difficulty, number> = {
  beginner: 7.5,
  intermediate: 9,
  advanced: 10.5,
  pro: 12,
};

/** Counts the numbered punches in a combo callout (including body shots such as B3). */
export function countActionPunches(action: Action): number {
  if (action.type !== 'combo') return 0;
  return action.label
    .split('-')
    .filter(token => /^B?[1-6]$/i.test(token.trim()))
    .length;
}

/**
 * Produces consistent estimates until wearable heart-rate and user weight data are available.
 * Punches are measured from issued combo callouts; heart rate and calories are estimates.
 */
export function calculateWorkoutPerformance(input: {
  punches: number;
  difficulty: Difficulty;
  totalRounds: number;
  roundDuration: number;
}): WorkoutPerformance {
  const activeMinutes = (input.totalRounds * input.roundDuration) / 60;
  const paceBonus = Math.min(8, Math.round(input.punches / Math.max(1, activeMinutes * 18)));

  return {
    punches: Math.max(0, Math.round(input.punches)),
    averageHeartRate: heartRateByDifficulty[input.difficulty] + paceBonus,
    caloriesBurned: Math.max(
      1,
      Math.round(activeMinutes * caloriesPerMinuteByDifficulty[input.difficulty] + input.punches * 0.03),
    ),
  };
}
