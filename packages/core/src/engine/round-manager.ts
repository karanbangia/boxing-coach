import type { EngineConfig, WorkoutEvent, WorkoutEventHandler, WorkoutPhase } from '../types.js';
import { ComboEngine } from './combo-engine.js';

export class RoundManager {
  private config: EngineConfig;
  private engine: ComboEngine;
  private handlers: WorkoutEventHandler[] = [];

  private phase: WorkoutPhase = 'idle';
  private currentRound = 0;
  private roundTimerId: ReturnType<typeof setTimeout> | null = null;
  private actionTimerId: ReturnType<typeof setTimeout> | null = null;
  private tickTimerId: ReturnType<typeof setInterval> | null = null;
  private phaseStartTime = 0;
  private phaseDuration = 0;
  private pausedAt: number | null = null;
  private pausedTimeRemaining = 0;
  /** When the next action is scheduled to fire (timestamp). Used to preserve delay on pause/resume. */
  private nextActionAt: number | null = null;
  /** Remaining ms until next action after pause; used on resume so we don't re-emit a new action. */
  private pausedActionDelayMs = 0;
  private inFreestyle = false;

  constructor(config: EngineConfig) {
    this.config = config;
    this.engine = new ComboEngine(config);
  }

  onEvent(handler: WorkoutEventHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }

  start(): void {
    this.engine.reset();
    this.currentRound = 0;
    this.startNextRound();
  }

  pause(): void {
    if (this.phase !== 'round' && this.phase !== 'rest') return;
    if (this.pausedAt !== null) return;

    const elapsed = (Date.now() - this.phaseStartTime) / 1000;
    this.pausedTimeRemaining = Math.max(0, this.phaseDuration - elapsed);
    this.pausedAt = Date.now();

    if (this.phase === 'round' && this.nextActionAt !== null) {
      this.pausedActionDelayMs = Math.max(0, this.nextActionAt - Date.now());
    }

    this.clearTimers();

    this.emit({ type: 'tick', timeRemaining: this.pausedTimeRemaining });
  }

  resume(): void {
    if (this.pausedAt === null) return;
    this.pausedAt = null;

    this.startPhaseTimers(this.pausedTimeRemaining);

    if (this.phase === 'round') {
      this.roundTimerId = setTimeout(() => {
        this.clearActionTimer();
        this.emit({ type: 'roundEnd', round: this.currentRound });
        this.startRest();
      }, this.pausedTimeRemaining * 1000);
      const delayMs = this.pausedActionDelayMs > 0
        ? this.pausedActionDelayMs
        : this.engine.getInterval(this.currentRound, this.inFreestyle);
      this.pausedActionDelayMs = 0;
      this.scheduleNextAction(delayMs);
    } else if (this.phase === 'rest') {
      this.roundTimerId = setTimeout(() => {
        this.emit({ type: 'restEnd' });
        this.startNextRound();
      }, this.pausedTimeRemaining * 1000);
    }
  }

  skipRest(): void {
    if (this.phase !== 'rest') return;
    this.clearTimers();
    this.pausedAt = null;
    this.emit({ type: 'restEnd' });
    this.startNextRound();
  }

  stop(): void {
    this.clearTimers();
    this.phase = 'idle';
    this.currentRound = 0;
    this.pausedAt = null;
  }

  getPhase(): WorkoutPhase {
    return this.phase;
  }

  getCurrentRound(): number {
    return this.currentRound;
  }

  isPaused(): boolean {
    return this.pausedAt !== null;
  }

  getTimeRemaining(): number {
    if (this.pausedAt !== null) return this.pausedTimeRemaining;
    if (this.phase !== 'round' && this.phase !== 'rest') return 0;
    const elapsed = (Date.now() - this.phaseStartTime) / 1000;
    return Math.max(0, this.phaseDuration - elapsed);
  }

  private startNextRound(): void {
    this.currentRound++;
    if (this.currentRound > this.config.totalRounds) {
      this.phase = 'complete';
      this.emit({ type: 'workoutComplete' });
      return;
    }

    this.phase = 'round';
    this.inFreestyle = false;
    this.phaseDuration = this.config.roundDuration;
    this.emit({ type: 'roundStart', round: this.currentRound });

    this.startPhaseTimers(this.config.roundDuration);

    this.roundTimerId = setTimeout(() => {
      this.clearActionTimer();
      this.emit({ type: 'roundEnd', round: this.currentRound });
      this.startRest();
    }, this.config.roundDuration * 1000);

    this.emitNextAction();
  }

  private startRest(): void {
    if (this.currentRound >= this.config.totalRounds) {
      this.phase = 'complete';
      this.emit({ type: 'workoutComplete' });
      return;
    }

    this.phase = 'rest';
    this.phaseDuration = this.config.restDuration;
    this.emit({ type: 'restStart', duration: this.config.restDuration });

    this.startPhaseTimers(this.config.restDuration);

    this.roundTimerId = setTimeout(() => {
      this.emit({ type: 'restEnd' });
      this.startNextRound();
    }, this.config.restDuration * 1000);
  }

  private emitNextAction(): void {
    if (this.phase !== 'round' || this.pausedAt !== null) return;

    const remaining = this.getTimeRemaining();
    const threshold = this.engine.getFreestyleThreshold();
    const shouldFreestyle = remaining <= threshold && remaining > 0;

    if (shouldFreestyle && !this.inFreestyle) {
      this.inFreestyle = true;
      this.emit({ type: 'freestyleStart' });
    }

    const action = this.inFreestyle
      ? this.engine.getFreestyleAction()
      : this.engine.getNextAction(this.currentRound);
    this.emit({ type: 'action', action });

    const interval = this.engine.getInterval(this.currentRound, this.inFreestyle, action);
    this.scheduleNextAction(interval);
  }

  private scheduleNextAction(delayMs: number): void {
    this.clearActionTimer();
    this.nextActionAt = Date.now() + delayMs;
    this.actionTimerId = setTimeout(() => {
      this.nextActionAt = null;
      this.emitNextAction();
    }, delayMs);
  }

  private startPhaseTimers(durationSeconds: number): void {
    this.phaseStartTime = Date.now();
    this.phaseDuration = durationSeconds;

    if (this.tickTimerId) clearInterval(this.tickTimerId);
    this.tickTimerId = setInterval(() => {
      if (this.pausedAt !== null) return;
      this.emit({ type: 'tick', timeRemaining: this.getTimeRemaining() });
    }, 250);
  }

  private clearTimers(): void {
    if (this.roundTimerId) { clearTimeout(this.roundTimerId); this.roundTimerId = null; }
    if (this.tickTimerId) { clearInterval(this.tickTimerId); this.tickTimerId = null; }
    this.clearActionTimer();
  }

  private clearActionTimer(): void {
    if (this.actionTimerId) { clearTimeout(this.actionTimerId); this.actionTimerId = null; }
    this.nextActionAt = null;
  }

  private emit(event: WorkoutEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }
}
