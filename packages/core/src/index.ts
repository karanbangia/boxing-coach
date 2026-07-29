export type {
  Punch,
  Difficulty,
  ActionType,
  Action,
  DifficultyProfile,
  TuningOverrides,
  EngineConfig,
  WorkoutPhase,
  WorkoutState,
  WorkoutEvent,
  WorkoutEventHandler,
} from './types.js';

export {
  DEFAULT_PREP_COUNTDOWN_SECONDS,
  resolvePrepCountdownSeconds,
} from './types.js';

export {
  ComboEngine,
  FREESTYLE_FINISHER_ACTIONS,
  isFreestyleFinisherId,
} from './engine/combo-engine.js';
export { getCoachPlaybackRate } from './coach-audio.js';
export { RoundManager } from './engine/round-manager.js';
export { Timer } from './timer/timer.js';
export { getProfile } from './combos/profiles.js';
export {
  DEFAULT_SETTINGS,
  DIFFICULTIES,
  REST_DURATIONS,
  ROUND_DURATIONS,
  TOTAL_ROUNDS,
} from './setup.js';
export type { SetupOption, SetupSettings } from './setup.js';
export { calculateWorkoutPerformance, countActionPunches } from './workout-stats.js';
export type { WorkoutPerformance } from './workout-stats.js';
export { PUNCH_NUMBER_GUIDE } from './punch-numbers.js';
export type { PunchNumberDefinition } from './punch-numbers.js';
export { recommendFirstWorkout } from './workout-recommendation.js';
export type {
  CoachingExperience,
  FirstWorkoutProfile,
  FirstWorkoutRecommendation,
  TrainingGoal,
} from './workout-recommendation.js';
export { adaptNextWorkout } from './workout-adaptation.js';
export type {
  AdaptiveWorkoutRecommendation,
  AdaptiveWorkoutSettings,
  WorkoutFeedback,
} from './workout-adaptation.js';
export {
  WorkoutController,
  getInitialWorkoutViewState,
} from './workout-controller.js';
export type {
  WorkoutControllerOptions,
  WorkoutStateHandler,
  WorkoutViewState,
} from './workout-controller.js';
