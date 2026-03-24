import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { EngineConfig } from '@boxing-coach/core';
import type { StartWorkoutPayload } from './screens/SetupScreen';
import { useWorkout } from './hooks/useWorkout';
import { useWakeLock } from './hooks/useWakeLock';
import { useSounds } from './hooks/useSounds';
import { useCoachVoice } from './hooks/useCoachVoice';
import { useAudioSession } from './hooks/useAudioSession';
import { unlockHtmlAudioForCoach } from './lib/unlockHtmlAudio';
import { alog } from './lib/audioLog';
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
  const [audioCuesEnabled, setAudioCuesEnabled] = useState(true);
  const workout = useWorkout(config);

  const sessionVolumeRef = useRef(1);
  const audioCuesRef = useRef(true);
  const session = useAudioSession();
  sessionVolumeRef.current = session.effectiveVolume;
  audioCuesRef.current = audioCuesEnabled;

  const sounds = useSounds(sessionVolumeRef);
  const coach = useCoachVoice(sessionVolumeRef, audioCuesRef);

  const isActive = workout.phase === 'round' || workout.phase === 'rest';
  useWakeLock(isActive);

  const prevPhaseRef = useRef(workout.phase);
  const prevRoundRef = useRef(workout.currentRound);
  const prevFreestyleRef = useRef(workout.isFreestyle);
  const lastCoachActionKeyRef = useRef(-1);

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

  useEffect(() => {
    const ctx = {
      phase: workout.phase,
      isPaused: workout.isPaused,
      actionKey: workout.actionKey,
      actionId: workout.currentAction?.id ?? null,
      actionType: workout.currentAction?.type ?? null,
      round: workout.currentRound,
      totalRounds: workout.totalRounds,
      effectiveVol: sessionVolumeRef.current,
      cuesEnabled: audioCuesRef.current,
      lastKey: lastCoachActionKeyRef.current,
    };

    if (workout.phase !== 'round') {
      alog('effect:stop', ctx);
      lastCoachActionKeyRef.current = -1;
      coach.stopCoachAudio();
      return;
    }
    if (workout.isPaused) {
      alog('effect:pause', ctx);
      coach.pauseCoachAudio();
      return;
    }
    if (!workout.currentAction) {
      alog('effect:no-action', ctx);
      return;
    }
    if (lastCoachActionKeyRef.current === workout.actionKey) {
      alog('effect:resume', ctx);
      coach.resumeOrReplayCoachAudio(
        workout.currentAction,
        workout.currentRound,
        workout.totalRounds,
      );
      return;
    }
    alog('effect:play-new', ctx);
    lastCoachActionKeyRef.current = workout.actionKey;
    coach.playAction(workout.currentAction, workout.currentRound, workout.totalRounds);
  }, [
    workout.phase,
    workout.isPaused,
    workout.actionKey,
    workout.currentAction,
    workout.currentRound,
    workout.totalRounds,
    coach,
  ]);

  const handleStart = useCallback((payload: StartWorkoutPayload) => {
    unlockHtmlAudioForCoach();
    lastCoachActionKeyRef.current = -1;
    const { audioCuesEnabled: cues, ...engine } = payload;
    alog('workout:start', {
      difficulty: engine.difficulty,
      rounds: engine.totalRounds,
      roundDuration: engine.roundDuration,
      restDuration: engine.restDuration,
      audioCues: cues,
    });
    setAudioCuesEnabled(cues);
    setConfig(engine);
  }, []);

  useEffect(() => {
    if (config && workout.phase === 'idle') {
      workout.start();
    }
  }, [config]);

  const handleRestart = useCallback(() => {
    lastCoachActionKeyRef.current = -1;
    coach.stopCoachAudio();
    workout.stop();
    setConfig(null);
  }, [workout, coach]);

  const handleStop = useCallback(() => {
    lastCoachActionKeyRef.current = -1;
    coach.stopCoachAudio();
    workout.stop();
    setConfig(null);
  }, [workout, coach]);

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
      muted={session.muted}
      volumePercent={Math.round(session.masterVolume * 100)}
      onVolumePercentChange={session.setVolumePercent}
      onPause={workout.pause}
      onResume={workout.resume}
      onSkipRound={workout.skipRound}
      onStop={handleStop}
    />
  );
}
