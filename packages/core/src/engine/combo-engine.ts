import type { Action, DifficultyProfile, EngineConfig, TuningOverrides } from '../types.js';
import { getProfile } from '../combos/profiles.js';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const DEFAULT_HISTORY_SIZE = 4;
const DEFAULT_JITTER_MS = 500;
const DEFAULT_FREESTYLE_INTERVAL_MS = 1000;
const DEFAULT_ACTION_DURATION_MS = 1500;

/** ~15s coach clips for the round finisher; one is chosen at random each round. */
export const FREESTYLE_FINISHER_ACTIONS: readonly Action[] = [
  {
    id: 'fs-finisher-jab-cross',
    type: 'combo',
    label: 'FINISH — 1-2',
    description: 'Nonstop jab–cross — empty the tank.',
    difficulty: 'beginner',
    durationMs: 15_000,
  },
  {
    id: 'fs-finisher-hooks',
    type: 'combo',
    label: 'FINISH — HOOKS',
    description: 'Body and head hooks — fast to the bell.',
    difficulty: 'beginner',
    durationMs: 15_000,
  },
  {
    id: 'fs-finisher-body-hook',
    type: 'combo',
    label: 'FINISH — BODY-HOOK',
    description: 'Body hook — finish the round strong.',
    difficulty: 'beginner',
    durationMs: 15_000,
  },
];

const FINISHER_IDS = new Set(FREESTYLE_FINISHER_ACTIONS.map((a) => a.id));

export function isFreestyleFinisherId(id: string): boolean {
  return FINISHER_IDS.has(id);
}

export class ComboEngine {
  private profile: DifficultyProfile;
  private config: EngineConfig;
  private tuning: TuningOverrides;
  private actionCounter = 0;
  private history: string[] = [];

  constructor(config: EngineConfig) {
    this.config = config;
    this.tuning = config.tuning ?? {};
    this.profile = getProfile(config.difficulty);
    this.applyTuningToProfile();
    this.shufflePools();
  }

  reset(): void {
    this.actionCounter = 0;
    this.history = [];
    this.profile = getProfile(this.config.difficulty);
    this.applyTuningToProfile();
    this.shufflePools();
  }

  private applyTuningToProfile(): void {
    const t = this.tuning;
    if (t.intervalBase !== undefined) this.profile.interval.base = t.intervalBase;
    if (t.intervalMin !== undefined) this.profile.interval.min = t.intervalMin;
    if (t.tightenPerRound !== undefined) this.profile.interval.tightenPerRound = t.tightenPerRound;
    if (t.movementEveryN !== undefined) this.profile.actionMix.movementEveryN = t.movementEveryN;
    if (t.defenseEveryN !== undefined) this.profile.actionMix.defenseEveryN = t.defenseEveryN;
    if (t.tightenAtMidpoint !== undefined) this.profile.actionMix.tightenAtMidpoint = t.tightenAtMidpoint;
  }

  private shufflePools(): void {
    const p = this.profile;
    this.profile = {
      ...p,
      comboPools: {
        initial: shuffle(p.comboPools.initial),
        mid: shuffle(p.comboPools.mid),
        late: shuffle(p.comboPools.late),
      },
      movementPools: {
        initial: shuffle(p.movementPools.initial),
        mid: shuffle(p.movementPools.mid),
      },
      defensePools: {
        initial: shuffle(p.defensePools.initial),
        mid: shuffle(p.defensePools.mid),
      },
    };
  }

  getNextAction(currentRound: number): Action {
    this.actionCounter++;

    const { movementEveryN, defenseEveryN } = this.getActionMix(currentRound);

    let type: 'combo' | 'movement' | 'defense';
    if (this.actionCounter % defenseEveryN === 0) {
      type = 'defense';
    } else if (this.actionCounter % movementEveryN === 0) {
      type = 'movement';
    } else {
      type = 'combo';
    }

    const pool = this.buildPool(type, currentRound);
    const filtered = pool.filter(a => !this.history.includes(a.id));
    const candidates = filtered.length > 0 ? filtered : pool;

    const picked = candidates[Math.floor(Math.random() * candidates.length)];

    this.history.push(picked.id);
    if (this.history.length > DEFAULT_HISTORY_SIZE) {
      this.history.shift();
    }

    return picked;
  }

  getInterval(currentRound: number, freestyle = false, action?: Action): number {
    const actionDuration = action?.durationMs ?? DEFAULT_ACTION_DURATION_MS;
    if (freestyle) return actionDuration + (this.tuning.freestyleIntervalMs ?? DEFAULT_FREESTYLE_INTERVAL_MS);
    const { base, min, tightenPerRound } = this.profile.interval;
    const rawGap = base - (currentRound - 1) * tightenPerRound;
    const recoveryGap = Math.max(rawGap, min);
    const jitterMs = this.tuning.jitterMs ?? DEFAULT_JITTER_MS;
    const jitter = (Math.random() - 0.5) * 2 * jitterMs;
    return Math.max(actionDuration + recoveryGap + jitter, actionDuration + min);
  }

  getFreestyleAction(): Action {
    const pool = FREESTYLE_FINISHER_ACTIONS;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  getFreestyleThreshold(): number {
    if (this.tuning.freestyleThreshold != null) {
      return this.tuning.freestyleThreshold;
    }
    return 15;
  }

  getIntensity(currentRound: number): 'normal' | 'building' | 'intense' {
    const progress = currentRound / this.config.totalRounds;
    if (progress <= 0.33) return 'normal';
    if (progress <= 0.66) return 'building';
    return 'intense';
  }

  private getActionMix(currentRound: number) {
    let { movementEveryN, defenseEveryN } = this.profile.actionMix;

    if (this.profile.actionMix.tightenAtMidpoint) {
      const midpoint = Math.ceil(this.config.totalRounds / 2);
      if (currentRound >= midpoint) {
        movementEveryN = Math.max(2, movementEveryN - 1);
        defenseEveryN = Math.max(3, defenseEveryN - 1);
      }
    }

    return { movementEveryN, defenseEveryN };
  }

  private buildPool(type: 'combo' | 'movement' | 'defense', currentRound: number): Action[] {
    const { totalRounds } = this.config;
    const roundFraction = currentRound / totalRounds;

    if (type === 'combo') {
      const pool = [...this.profile.comboPools.initial];
      if (roundFraction > 0.33) pool.push(...this.profile.comboPools.mid);
      if (roundFraction > 0.66) pool.push(...this.profile.comboPools.late);
      return pool;
    }

    if (type === 'movement') {
      const pool = [...this.profile.movementPools.initial];
      if (roundFraction > 0.33) pool.push(...this.profile.movementPools.mid);
      return pool;
    }

    const pool = [...this.profile.defensePools.initial];
    if (roundFraction > 0.33) pool.push(...this.profile.defensePools.mid);
    return pool;
  }
}
