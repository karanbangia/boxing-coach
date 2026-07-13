import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { EngineConfig } from '@boxing-coach/core';
import { calculateWorkoutPerformance, resolvePrepCountdownSeconds } from '@boxing-coach/core';
import type { StartWorkoutPayload } from './screens/SetupScreen';
import { MainTabShell } from './components/MainTabShell';
import type { AppTab } from './components/BottomTabBar';
import { useWorkout } from './hooks/useWorkout';
import { useWakeLock } from './hooks/useWakeLock';
import { useSounds } from './hooks/useSounds';
import { useCoachVoice } from './hooks/useCoachVoice';
import { useAudioSession } from './hooks/useAudioSession';
import { unlockHtmlAudioForCoach } from './lib/unlockHtmlAudio';
import { alog } from './lib/audioLog';
import { saveWorkoutToHistory } from './lib/workoutHistory';
import { SetupScreen } from './screens/SetupScreen';
import { WorkoutScreen } from './screens/WorkoutScreen';
import { RestScreen } from './screens/RestScreen';
import { CompleteScreen } from './screens/CompleteScreen';
import { DevScreen } from './screens/DevScreen';
import { PrepScreen } from './screens/PrepScreen';
import { WorkoutHomeScreen } from './screens/WorkoutHomeScreen';
import { PlanScreen } from './screens/PlanScreen';
import { ProfileScreen } from './screens/ProfileScreen';

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
  const [activeTab, setActiveTab] = useState<AppTab>('timer');
  const [config, setConfig] = useState<EngineConfig | null>(null);
  const [prepSecondsLeft, setPrepSecondsLeft] = useState<number | null>(null);
  const [audioCuesEnabled, setAudioCuesEnabled] = useState(true);
  const [isPersonalBest, setIsPersonalBest] = useState(false);
  const workout = useWorkout(config);
  const workoutIdRef = useRef('');
  const savedWorkoutIdRef = useRef('');

  const sessionVolumeRef = useRef(1);
  const audioCuesRef = useRef(true);
  const session = useAudioSession();
  sessionVolumeRef.current = session.effectiveVolume as number;
  audioCuesRef.current = audioCuesEnabled;

  const sounds = useSounds(sessionVolumeRef);
  const coach = useCoachVoice(sessionVolumeRef, audioCuesRef);

  const inPrep =
    Boolean(config && prepSecondsLeft !== null && prepSecondsLeft > 0 && workout.phase === 'idle');
  const isActive = workout.phase === 'round' || workout.phase === 'rest';
  useWakeLock(isActive || inPrep);

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
    const workoutId = workoutIdRef.current;
    if (!config || workout.phase !== 'complete' || !workoutId || savedWorkoutIdRef.current === workoutId) return;

    savedWorkoutIdRef.current = workoutId;
    const performance = calculateWorkoutPerformance({
      punches: workout.punchesThrown,
      difficulty: config.difficulty,
      totalRounds: config.totalRounds,
      roundDuration: config.roundDuration,
    });
    setIsPersonalBest(saveWorkoutToHistory({
      id: workoutId,
      completedAt: new Date().toISOString(),
      difficulty: config.difficulty,
      totalRounds: config.totalRounds,
      roundDuration: config.roundDuration,
      ...performance,
    }));
  }, [config, workout.phase, workout.punchesThrown]);

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

    if (workout.phase !== 'round' || !config) {
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
    config,
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
    workoutIdRef.current = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    savedWorkoutIdRef.current = '';
    setIsPersonalBest(false);
    alog('workout:start', {
      difficulty: engine.difficulty,
      rounds: engine.totalRounds,
      roundDuration: engine.roundDuration,
      restDuration: engine.restDuration,
      audioCues: cues,
    });
    setAudioCuesEnabled(cues);
    setConfig(engine);
    setPrepSecondsLeft(resolvePrepCountdownSeconds(engine.tuning));
    setActiveTab('workout');
  }, []);

  useEffect(() => {
    if (!config) setPrepSecondsLeft(null);
  }, [config]);

  useEffect(() => {
    if (prepSecondsLeft === null || prepSecondsLeft <= 0) return;
    const t = window.setTimeout(() => {
      setPrepSecondsLeft((s) => (s === null || s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearTimeout(t);
  }, [prepSecondsLeft]);

  useLayoutEffect(() => {
    if (!config || workout.phase !== 'idle') return;
    if (prepSecondsLeft === null || prepSecondsLeft > 0) return;
    workout.start();
  }, [config, workout.phase, prepSecondsLeft, workout.start]);

  const handleRestart = useCallback(() => {
    lastCoachActionKeyRef.current = -1;
    coach.stopCoachAudio();
    workout.stop();
    setConfig(null);
    setActiveTab('timer');
  }, [workout, coach]);

  const handleStop = useCallback(() => {
    lastCoachActionKeyRef.current = -1;
    coach.stopCoachAudio();
    workout.stop();
    setConfig(null);
    setActiveTab('timer');
  }, [workout, coach]);

  if (!config) {
    return (
      <MainTabShell activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'timer' ? (
          <SetupScreen onStart={handleStart} />
        ) : activeTab === 'workout' ? (
          <WorkoutHomeScreen onOpenTimer={() => setActiveTab('timer')} />
        ) : activeTab === 'plan' ? (
          <PlanScreen />
        ) : (
          <ProfileScreen />
        )}
      </MainTabShell>
    );
  }

  if (workout.phase === 'idle' && prepSecondsLeft !== null && prepSecondsLeft > 0) {
    return (
      <PrepScreen
        secondsLeft={prepSecondsLeft}
        totalSeconds={resolvePrepCountdownSeconds(config.tuning)}
        onSkip={() => setPrepSecondsLeft(0)}
        onCancel={handleStop}
      />
    );
  }

  if (workout.phase === 'idle') {
    return null;
  }

  if (workout.phase === 'complete') {
    const performance = calculateWorkoutPerformance({
      punches: workout.punchesThrown,
      difficulty: config.difficulty,
      totalRounds: config.totalRounds,
      roundDuration: config.roundDuration,
    });
    return (
      <CompleteScreen
        performance={performance}
        isPersonalBest={isPersonalBest}
        onReturnToGym={handleRestart}
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
