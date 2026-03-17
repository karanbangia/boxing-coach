import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { EngineConfig } from '@boxing-coach/core';
import { useWorkout } from './hooks/useWorkout';
import { useWakeLock } from './hooks/useWakeLock';
import { useSounds } from './hooks/useSounds';
import { SetupScreen } from './screens/SetupScreen';
import { WorkoutScreen } from './screens/WorkoutScreen';
import { RestScreen } from './screens/RestScreen';
import { CompleteScreen } from './screens/CompleteScreen';
import { DevScreen } from './screens/DevScreen';

function useHash() {
  return useSyncExternalStore(
    (cb) => { window.addEventListener('hashchange', cb); return () => window.removeEventListener('hashchange', cb); },
    () => window.location.hash,
  );
}

export function App() {
  const hash = useHash();

  if (hash === '#/dev') {
    return <DevScreen />;
  }

  return <MainApp />;
}

function MainApp() {
  const [config, setConfig] = useState<EngineConfig | null>(null);
  const workout = useWorkout(config);
  const sounds = useSounds();

  const isActive = workout.phase === 'round' || workout.phase === 'rest';
  useWakeLock(isActive);

  const prevPhaseRef = useRef(workout.phase);
  const prevRoundRef = useRef(workout.currentRound);
  const prevFreestyleRef = useRef(workout.isFreestyle);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    const prevRound = prevRoundRef.current;
    const prevFreestyle = prevFreestyleRef.current;

    if (workout.phase === 'round' && (prevPhase !== 'round' || workout.currentRound !== prevRound)) {
      sounds.roundStart();
    }

    if (workout.phase === 'rest' && prevPhase === 'round') {
      sounds.roundEnd();
    }

    if (workout.phase === 'complete' && prevPhase !== 'complete') {
      sounds.roundEnd();
    }

    if (workout.isFreestyle && !prevFreestyle) {
      sounds.freestyleStart();
    }

    prevPhaseRef.current = workout.phase;
    prevRoundRef.current = workout.currentRound;
    prevFreestyleRef.current = workout.isFreestyle;
  }, [workout.phase, workout.currentRound, workout.isFreestyle, sounds]);

  const handleStart = useCallback((newConfig: EngineConfig) => {
    setConfig(newConfig);
  }, []);

  useEffect(() => {
    if (config && workout.phase === 'idle') {
      workout.start();
    }
  }, [config]);

  const handleRestart = useCallback(() => {
    workout.stop();
    setConfig(null);
  }, [workout]);

  const handleStop = useCallback(() => {
    workout.stop();
    setConfig(null);
  }, [workout]);

  if (!config || workout.phase === 'idle') {
    return <SetupScreen onStart={handleStart} />;
  }

  if (workout.phase === 'complete') {
    return (
      <CompleteScreen
        totalRounds={config.totalRounds}
        roundDuration={config.roundDuration}
        onRestart={handleRestart}
      />
    );
  }

  if (workout.phase === 'rest') {
    return (
      <RestScreen
        currentRound={workout.currentRound}
        totalRounds={config.totalRounds}
        timeRemaining={workout.timeRemaining}
        onSkipRest={workout.skipRest}
      />
    );
  }

  return (
    <WorkoutScreen
      currentRound={workout.currentRound}
      totalRounds={config.totalRounds}
      timeRemaining={workout.timeRemaining}
      currentAction={workout.currentAction}
      intensity={workout.intensity}
      isPaused={workout.isPaused}
      isFreestyle={workout.isFreestyle}
      actionKey={workout.actionKey}
      onPause={workout.pause}
      onResume={workout.resume}
      onStop={handleStop}
    />
  );
}
