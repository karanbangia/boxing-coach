import type {
  Action,
  EngineConfig,
  WorkoutEvent,
  WorkoutPhase,
} from './types.js';
import { ComboEngine } from './engine/combo-engine.js';
import { RoundManager } from './engine/round-manager.js';

export interface WorkoutViewState {
  phase: WorkoutPhase;
  currentRound: number;
  totalRounds: number;
  currentAction: Action | null;
  timeRemaining: number;
  intensity: 'normal' | 'building' | 'intense';
  isPaused: boolean;
  isFreestyle: boolean;
  actionKey: number;
}

export type WorkoutStateHandler = (state: WorkoutViewState) => void;

export interface WorkoutControllerOptions {
  onEvent?: (event: WorkoutEvent) => void;
  onAction?: (action: Action) => void;
}

export function getInitialWorkoutViewState(): WorkoutViewState {
  return {
    phase: 'idle',
    currentRound: 0,
    totalRounds: 0,
    currentAction: null,
    timeRemaining: 0,
    intensity: 'normal',
    isPaused: false,
    isFreestyle: false,
    actionKey: 0,
  };
}

export class WorkoutController {
  private manager: RoundManager;
  private engine: ComboEngine;
  private handlers: WorkoutStateHandler[] = [];
  private unsubscribeManager: (() => void) | null = null;
  private state = getInitialWorkoutViewState();

  constructor(
    private config: EngineConfig,
    private options: WorkoutControllerOptions = {},
  ) {
    this.manager = new RoundManager(config);
    this.engine = new ComboEngine(config);
    this.unsubscribeManager = this.manager.onEvent(this.handleEvent);
  }

  getState(): WorkoutViewState {
    return this.state;
  }

  onStateChange(handler: WorkoutStateHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }

  start(): void {
    this.manager.start();
  }

  pause(): void {
    this.manager.pause();
    this.setState(prev => ({ ...prev, isPaused: true }));
  }

  resume(): void {
    this.manager.resume();
    this.setState(prev => ({ ...prev, isPaused: false }));
  }

  skipRest(): void {
    this.manager.skipRest();
  }

  skipRound(): void {
    this.manager.skipRound();
    this.setState(prev => ({ ...prev, isPaused: false }));
  }

  stop(): void {
    this.manager.stop();
    this.setState(getInitialWorkoutViewState());
  }

  destroy(): void {
    this.unsubscribeManager?.();
    this.unsubscribeManager = null;
    this.manager.stop();
    this.handlers = [];
  }

  private handleEvent = (event: WorkoutEvent): void => {
    this.options.onEvent?.(event);

    switch (event.type) {
      case 'roundStart':
        this.setState(prev => ({
          ...prev,
          phase: 'round',
          currentRound: event.round,
          totalRounds: this.config.totalRounds,
          intensity: this.engine.getIntensity(event.round),
          isFreestyle: false,
          isPaused: false,
        }));
        break;
      case 'freestyleStart':
        this.setState(prev => ({ ...prev, isFreestyle: true }));
        break;
      case 'roundEnd':
        this.setState(prev => ({ ...prev, currentAction: null }));
        break;
      case 'restStart':
        this.setState(prev => ({
          ...prev,
          phase: 'rest',
          timeRemaining: event.duration,
          currentAction: null,
          isPaused: false,
        }));
        break;
      case 'restEnd':
        break;
      case 'action':
        this.setState(prev => ({
          ...prev,
          currentAction: event.action,
          actionKey: prev.actionKey + 1,
        }));
        this.options.onAction?.(event.action);
        break;
      case 'tick':
        this.setState(prev => ({
          ...prev,
          timeRemaining: event.timeRemaining,
        }));
        break;
      case 'workoutComplete':
        this.setState(prev => ({
          ...prev,
          phase: 'complete',
          currentAction: null,
          timeRemaining: 0,
          isPaused: false,
        }));
        break;
    }
  };

  private setState(
    next:
      | WorkoutViewState
      | ((prev: WorkoutViewState) => WorkoutViewState),
  ): void {
    this.state = typeof next === 'function' ? next(this.state) : next;
    for (const handler of this.handlers) {
      handler(this.state);
    }
  }
}
