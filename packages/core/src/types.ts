export type Punch = 1 | 2 | 3 | 4 | 5 | 6;

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'pro';

export type ActionType = 'combo' | 'movement' | 'defense';

export interface Action {
  id: string;
  type: ActionType;
  label: string;
  description: string;
  difficulty: Difficulty;
  /** How long this action takes to execute (ms). Used to scale the gap before the next callout. */
  durationMs?: number;
  /** Optional coach clip URL path (web). If omitted, clients may fall back to `/audio/coach/<id>.mp3`. */
  audioSrc?: string;
}

export interface DifficultyProfile {
  difficulty: Difficulty;
  comboPools: {
    initial: Action[];
    mid: Action[];
    late: Action[];
  };
  movementPools: {
    initial: Action[];
    mid: Action[];
  };
  defensePools: {
    initial: Action[];
    mid: Action[];
  };
  interval: {
    base: number;
    min: number;
    tightenPerRound: number;
  };
  actionMix: {
    movementEveryN: number;
    defenseEveryN: number;
    tightenAtMidpoint: boolean;
  };
}

export interface TuningOverrides {
  intervalBase?: number;
  intervalMin?: number;
  tightenPerRound?: number;
  movementEveryN?: number;
  defenseEveryN?: number;
  tightenAtMidpoint?: boolean;
  freestyleThreshold?: number;
  freestyleIntervalMs?: number;
  jitterMs?: number;
  /** Countdown after Start before round 1 (e.g. gloves). 0 = skip. Default when unset: 10s. */
  prepCountdownSeconds?: number;
}

/** Default glove-prep countdown when `prepCountdownSeconds` is not set in tuning. */
export const DEFAULT_PREP_COUNTDOWN_SECONDS = 10;

export function resolvePrepCountdownSeconds(tuning?: TuningOverrides): number {
  const v = tuning?.prepCountdownSeconds;
  if (v === undefined) return DEFAULT_PREP_COUNTDOWN_SECONDS;
  return Math.max(0, Math.floor(v));
}

export interface EngineConfig {
  difficulty: Difficulty;
  roundDuration: number;
  restDuration: number;
  totalRounds: number;
  tuning?: TuningOverrides;
}

export type WorkoutPhase = 'idle' | 'round' | 'rest' | 'complete';

export interface WorkoutState {
  phase: WorkoutPhase;
  currentRound: number;
  totalRounds: number;
  currentAction: Action | null;
  timeRemaining: number;
  elapsed: number;
  intensity: 'normal' | 'building' | 'intense';
}

export type WorkoutEvent =
  | { type: 'action'; action: Action }
  | { type: 'roundStart'; round: number }
  | { type: 'roundEnd'; round: number }
  | { type: 'restStart'; duration: number }
  | { type: 'restEnd' }
  | { type: 'workoutComplete' }
  | { type: 'tick'; timeRemaining: number }
  | { type: 'freestyleStart' };

export type WorkoutEventHandler = (event: WorkoutEvent) => void;
