import type { Difficulty, EngineConfig } from './types.js';

export type CoachingExperience =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'professional';

export type TrainingGoal =
  | 'fundamentals'
  | 'fitness'
  | 'heavy_bag'
  | 'competition';

export interface FirstWorkoutProfile {
  experience: CoachingExperience;
  goal: TrainingGoal;
  preferredSessionMinutes: number;
}

export type FirstWorkoutRecommendation = Pick<
  EngineConfig,
  'difficulty' | 'roundDuration' | 'totalRounds' | 'restDuration'
>;

const difficultyByExperience: Record<CoachingExperience, Difficulty> = {
  beginner: 'beginner',
  intermediate: 'intermediate',
  advanced: 'advanced',
  professional: 'pro',
};

const firstWorkoutRoundCap: Record<Difficulty, number> = {
  beginner: 3,
  intermediate: 4,
  advanced: 5,
  pro: 5,
};

/**
 * Builds a deliberately approachable first session from onboarding answers.
 * The first workout is capped below a full training-day target so a new boxer
 * can experience the coaching loop before committing to a long session.
 */
export function recommendFirstWorkout(
  profile: FirstWorkoutProfile,
): FirstWorkoutRecommendation {
  const difficulty = difficultyByExperience[profile.experience];
  const preferredMinutes = Math.max(
    10,
    Math.min(60, Math.round(profile.preferredSessionMinutes)),
  );
  const roundDuration =
    preferredMinutes === 10 || difficulty === 'beginner' || difficulty === 'intermediate'
      ? 120
      : 180;
  const restDuration = profile.goal === 'fitness' ? 30 : 60;
  const targetSeconds = preferredMinutes * 60;
  const roundsForTarget = Math.floor(
    (targetSeconds + restDuration) / (roundDuration + restDuration),
  );
  const totalRounds = Math.max(
    3,
    Math.min(firstWorkoutRoundCap[difficulty], roundsForTarget),
  );

  return {
    difficulty,
    roundDuration,
    totalRounds,
    restDuration,
  };
}
