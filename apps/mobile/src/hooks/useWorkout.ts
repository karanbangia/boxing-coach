import { useCallback, useEffect, useRef, useState } from 'react';
import { Vibration } from 'react-native';
import {
  WorkoutController,
  countActionPunches,
  getInitialWorkoutViewState,
  type EngineConfig,
} from '@boxing-coach/core';

export function useWorkout(config: EngineConfig | null) {
  const controllerRef = useRef<WorkoutController | null>(null);
  const [state, setState] = useState(getInitialWorkoutViewState);
  const [punchesThrown, setPunchesThrown] = useState(0);

  useEffect(() => {
    if (!config) {
      return;
    }

    setPunchesThrown(0);

    const controller = new WorkoutController(config, {
      onAction: action => {
        setPunchesThrown(total => total + countActionPunches(action));
        Vibration.vibrate(action.type === 'combo' ? 50 : 30);
      },
    });
    controllerRef.current = controller;

    const unsubscribe = controller.onStateChange(setState);
    setState(controller.getState());

    return () => {
      unsubscribe();
      controller.destroy();
      controllerRef.current = null;
    };
  }, [config]);

  const start = useCallback(() => {
    controllerRef.current?.start();
  }, []);

  const pause = useCallback(() => {
    controllerRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    controllerRef.current?.resume();
  }, []);

  const skipRest = useCallback(() => {
    controllerRef.current?.skipRest();
  }, []);

  const skipRound = useCallback(() => {
    controllerRef.current?.skipRound();
  }, []);

  const stop = useCallback(() => {
    controllerRef.current?.stop();
  }, []);

  return { ...state, punchesThrown, start, pause, resume, skipRest, skipRound, stop };
}
