import { useCallback, useEffect, useRef, useState } from 'react';
import { Vibration } from 'react-native';
import {
  ComboEngine,
  RoundManager,
  type Action,
  type EngineConfig,
  type WorkoutEvent,
  type WorkoutPhase,
} from '@boxing-coach/core';

interface WorkoutHookState {
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

const INITIAL_STATE: WorkoutHookState = {
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

export function useWorkout(config: EngineConfig | null) {
  const managerRef = useRef<RoundManager | null>(null);
  const engineRef = useRef<ComboEngine | null>(null);
  const [state, setState] = useState(INITIAL_STATE);

  useEffect(() => {
    if (!config) {
      return;
    }

    const manager = new RoundManager(config);
    const engine = new ComboEngine(config);
    managerRef.current = manager;
    engineRef.current = engine;

    const unsubscribe = manager.onEvent((event: WorkoutEvent) => {
      switch (event.type) {
        case 'roundStart':
          setState(prev => ({
            ...prev,
            phase: 'round',
            currentRound: event.round,
            totalRounds: config.totalRounds,
            intensity: engine.getIntensity(event.round),
            isFreestyle: false,
            isPaused: false,
          }));
          break;
        case 'freestyleStart':
          setState(prev => ({ ...prev, isFreestyle: true }));
          break;
        case 'roundEnd':
          setState(prev => ({ ...prev, currentAction: null }));
          break;
        case 'restStart':
          setState(prev => ({
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
          setState(prev => ({
            ...prev,
            currentAction: event.action,
            actionKey: prev.actionKey + 1,
          }));
          Vibration.vibrate(event.action.type === 'combo' ? 50 : 30);
          break;
        case 'tick':
          setState(prev => ({
            ...prev,
            timeRemaining: event.timeRemaining,
          }));
          break;
        case 'workoutComplete':
          setState(prev => ({
            ...prev,
            phase: 'complete',
            currentAction: null,
            timeRemaining: 0,
            isPaused: false,
          }));
          break;
      }
    });

    return () => {
      unsubscribe();
      manager.stop();
      managerRef.current = null;
      engineRef.current = null;
    };
  }, [config]);

  const start = useCallback(() => {
    managerRef.current?.start();
  }, []);

  const pause = useCallback(() => {
    managerRef.current?.pause();
    setState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    managerRef.current?.resume();
    setState(prev => ({ ...prev, isPaused: false }));
  }, []);

  const skipRest = useCallback(() => {
    managerRef.current?.skipRest();
  }, []);

  const stop = useCallback(() => {
    managerRef.current?.stop();
    setState(INITIAL_STATE);
  }, []);

  return { ...state, start, pause, resume, skipRest, stop };
}
