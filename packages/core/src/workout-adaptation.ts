import type { Difficulty, EngineConfig } from './types.js';

export type WorkoutFeedback = 'too_easy' | 'just_right' | 'too_hard';

export type AdaptiveWorkoutSettings = Pick<
  EngineConfig,
  'difficulty' | 'roundDuration' | 'totalRounds' | 'restDuration'
>;

export interface AdaptiveWorkoutRecommendation {
  settings: AdaptiveWorkoutSettings;
  title: string;
  detail: string;
  change: 'harder' | 'same' | 'easier';
}

const DIFFICULTY_ORDER: Difficulty[] = [
  'beginner',
  'intermediate',
  'advanced',
  'pro',
];
const REST_OPTIONS = [15, 30, 60, 90] as const;

function nextDifficulty(difficulty: Difficulty, direction: -1 | 1) {
  const currentIndex = DIFFICULTY_ORDER.indexOf(difficulty);
  const nextIndex = Math.max(
    0,
    Math.min(DIFFICULTY_ORDER.length - 1, currentIndex + direction),
  );
  return DIFFICULTY_ORDER[nextIndex];
}

function nextRestDuration(restDuration: number, direction: -1 | 1) {
  const currentIndex = REST_OPTIONS.reduce(
    (closest, candidate, index) =>
      Math.abs(candidate - restDuration) < Math.abs(REST_OPTIONS[closest] - restDuration)
        ? index
        : closest,
    0,
  );
  const nextIndex = Math.max(
    0,
    Math.min(REST_OPTIONS.length - 1, currentIndex + direction),
  );
  return REST_OPTIONS[nextIndex];
}

/**
 * Changes one training variable at a time so feedback produces a useful,
 * explainable next session instead of an unpredictable intensity jump.
 */
export function adaptNextWorkout(
  current: AdaptiveWorkoutSettings,
  feedback: WorkoutFeedback,
): AdaptiveWorkoutRecommendation {
  const settings = { ...current };

  if (feedback === 'just_right') {
    return {
      settings,
      title: 'REPEAT THE WIN',
      detail: 'Keep the same rounds, pace, and recovery to build consistency.',
      change: 'same',
    };
  }

  if (feedback === 'too_easy') {
    if (settings.totalRounds < 12) {
      settings.totalRounds += 1;
      return {
        settings,
        title: 'ADD ONE ROUND',
        detail: `${settings.totalRounds} rounds next time. Everything else stays familiar.`,
        change: 'harder',
      };
    }

    if (settings.roundDuration < 180) {
      settings.roundDuration = 180;
      return {
        settings,
        title: 'EXTEND THE ROUNDS',
        detail: 'Move to three-minute rounds while keeping your current recovery.',
        change: 'harder',
      };
    }

    if (settings.restDuration > REST_OPTIONS[0]) {
      settings.restDuration = nextRestDuration(settings.restDuration, -1);
      return {
        settings,
        title: 'TIGHTEN RECOVERY',
        detail: `${settings.restDuration} seconds of rest next time. The work stays unchanged.`,
        change: 'harder',
      };
    }

    const harderDifficulty = nextDifficulty(settings.difficulty, 1);
    settings.difficulty = harderDifficulty;
    return {
      settings,
      title: harderDifficulty === current.difficulty ? 'HOLD THIS PEAK' : 'RAISE THE PACE',
      detail: harderDifficulty === current.difficulty
        ? 'You are already at the highest session settings. Repeat it with sharper execution.'
        : `Move to ${harderDifficulty.toUpperCase()} coaching pace with the same round structure.`,
      change: harderDifficulty === current.difficulty ? 'same' : 'harder',
    };
  }

  if (settings.totalRounds > 3) {
    settings.totalRounds -= 1;
    return {
      settings,
      title: 'DROP ONE ROUND',
      detail: `${settings.totalRounds} rounds next time. Pace and recovery stay the same.`,
      change: 'easier',
    };
  }

  if (settings.restDuration < REST_OPTIONS[REST_OPTIONS.length - 1]) {
    settings.restDuration = nextRestDuration(settings.restDuration, 1);
    return {
      settings,
      title: 'TAKE MORE RECOVERY',
      detail: `${settings.restDuration} seconds of rest next time without lowering the coaching level.`,
      change: 'easier',
    };
  }

  if (settings.roundDuration > 120) {
    settings.roundDuration = 120;
    return {
      settings,
      title: 'SHORTEN THE ROUNDS',
      detail: 'Use two-minute rounds next time and keep the same coaching pace.',
      change: 'easier',
    };
  }

  const easierDifficulty = nextDifficulty(settings.difficulty, -1);
  settings.difficulty = easierDifficulty;
  return {
    settings,
    title: easierDifficulty === current.difficulty ? 'BUILD THE BASE' : 'RESET THE PACE',
    detail: easierDifficulty === current.difficulty
      ? 'Repeat this foundation session and focus on clean, relaxed movement.'
      : `Use ${easierDifficulty.toUpperCase()} coaching pace with the same round structure.`,
    change: easierDifficulty === current.difficulty ? 'same' : 'easier',
  };
}
