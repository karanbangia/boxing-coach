import { useCallback, useEffect, useRef, useState } from 'react';
import {
  WorkoutController,
  getInitialWorkoutViewState,
  type EngineConfig,
  type WorkoutEvent,
} from '@boxing-coach/core';

export function useWorkout(config: EngineConfig | null) {
  const controllerRef = useRef<WorkoutController | null>(null);
  const [state, setState] = useState(getInitialWorkoutViewState);

  useEffect(() => {
    if (!config) return;

    const controller = new WorkoutController(config, {
      onEvent: (event: WorkoutEvent) => {
        if (event.type !== 'tick') {
          console.log('[workout] event:', event.type, event);
        }
        if (event.type === 'action') {
          console.log(
            '[workout] action →',
            event.action.id,
            event.action.label,
            `(type=${event.action.type}, audioSrc=${event.action.audioSrc ?? 'default'})`,
          );
        }
      },
      onAction: action => {
        if (navigator.vibrate) {
          navigator.vibrate(action.type === 'combo' ? 50 : 30);
        }
      },
    });
    controllerRef.current = controller;

    const unsub = controller.onStateChange(setState);
    setState(controller.getState());

    return () => {
      unsub();
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

  return { ...state, start, pause, resume, skipRest, skipRound, stop };
}
