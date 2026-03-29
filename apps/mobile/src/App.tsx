import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import type { EngineConfig } from '@boxing-coach/core';
import { resolvePrepCountdownSeconds } from '@boxing-coach/core';
import type { SetupSettings } from './config';
import { useStoredSettings } from './hooks/useStoredSettings';
import { useSounds } from './hooks/useSounds';
import { useCoachVoice } from './hooks/useCoachVoice';
import { useSessionAudio } from './hooks/useSessionAudio';
import { useStoredTuning } from './hooks/useStoredTuning';
import { useWakeLock } from './hooks/useWakeLock';
import { useWorkout } from './hooks/useWorkout';
import { CompleteScreen } from './screens/CompleteScreen';
import { DevScreen } from './screens/DevScreen';
import { RestScreen } from './screens/RestScreen';
import { PrepScreen } from './screens/PrepScreen';
import { SetupScreen } from './screens/SetupScreen';
import { WorkoutScreen } from './screens/WorkoutScreen';

export function App() {
  const { settings, updateSettings, isReady: settingsReady } = useStoredSettings();
  const { tuning, setTuning, isReady: tuningReady } = useStoredTuning();
  const [config, setConfig] = useState<EngineConfig | null>(null);
  const [prepSecondsLeft, setPrepSecondsLeft] = useState<number | null>(null);
  const [showDevScreen, setShowDevScreen] = useState(false);
  const [audioCuesEnabled, setAudioCuesEnabled] = useState(settings.audioCuesEnabled);
  const workout = useWorkout(config);

  const sessionVolumeRef = useRef(1);
  const audioCuesRef = useRef(true);
  const session = useSessionAudio();
  sessionVolumeRef.current = session.effectiveVolume;
  audioCuesRef.current = audioCuesEnabled;

  const sounds = useSounds(sessionVolumeRef);
  const coach = useCoachVoice(sessionVolumeRef, audioCuesRef);

  const isReady = settingsReady && tuningReady && session.ready;

  const inPrep =
    Boolean(config && prepSecondsLeft !== null && prepSecondsLeft > 0 && workout.phase === 'idle');
  const isActive = workout.phase === 'round' || workout.phase === 'rest';
  useWakeLock(isActive || inPrep);

  const prevPhaseRef = useRef(workout.phase);
  const prevRoundRef = useRef(workout.currentRound);
  const prevFreestyleRef = useRef(workout.isFreestyle);
  const prevTimeRef = useRef(workout.timeRemaining);
  const lastCoachActionKeyRef = useRef(-1);

  useEffect(() => {
    setAudioCuesEnabled(settings.audioCuesEnabled);
  }, [settings.audioCuesEnabled]);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    const prevRound = prevRoundRef.current;
    const prevFreestyle = prevFreestyleRef.current;
    const prevTimeRemaining = prevTimeRef.current;

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

    if (
      workout.phase === 'round' &&
      !workout.isPaused &&
      !workout.isFreestyle &&
      Math.ceil(prevTimeRemaining) > 10 &&
      Math.ceil(workout.timeRemaining) <= 10
    ) {
      sounds.tenSecondWarning();
    }

    prevPhaseRef.current = workout.phase;
    prevRoundRef.current = workout.currentRound;
    prevFreestyleRef.current = workout.isFreestyle;
    prevTimeRef.current = workout.timeRemaining;
  }, [
    sounds,
    workout.currentRound,
    workout.isFreestyle,
    workout.isPaused,
    workout.phase,
    workout.timeRemaining,
  ]);

  useEffect(() => {
    if (workout.phase !== 'round') {
      lastCoachActionKeyRef.current = -1;
      coach.stopCoachAudio();
      return;
    }
    if (workout.isPaused) {
      coach.pauseCoachAudio();
    } else {
      coach.resumeCoachAudio();
    }
  }, [workout.phase, workout.isPaused, coach]);

  useEffect(() => {
    if (workout.phase !== 'round' || !config) {
      lastCoachActionKeyRef.current = -1;
      return;
    }
    if (workout.isPaused || !workout.currentAction) return;
    if (lastCoachActionKeyRef.current === workout.actionKey) return;
    lastCoachActionKeyRef.current = workout.actionKey;
    coach.playAction(workout.currentAction, workout.currentRound, workout.totalRounds);
  }, [
    coach,
    config,
    workout.actionKey,
    workout.currentAction,
    workout.currentRound,
    workout.isPaused,
    workout.phase,
    workout.totalRounds,
  ]);

  const handleStart = useCallback(
    (s: SetupSettings) => {
      lastCoachActionKeyRef.current = -1;
      setAudioCuesEnabled(s.audioCuesEnabled);
      const hasOverrides = Object.values(tuning).some(value => value !== undefined);
      const engine: EngineConfig = {
        difficulty: s.difficulty,
        roundDuration: s.roundDuration,
        totalRounds: s.totalRounds,
        restDuration: s.restDuration,
        ...(hasOverrides ? { tuning } : {}),
      };
      setConfig(engine);
      setPrepSecondsLeft(resolvePrepCountdownSeconds(engine.tuning));
    },
    [tuning],
  );

  useEffect(() => {
    if (!config) setPrepSecondsLeft(null);
  }, [config]);

  useEffect(() => {
    if (prepSecondsLeft === null || prepSecondsLeft <= 0) return;
    const t = setTimeout(() => {
      setPrepSecondsLeft(s => (s === null || s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearTimeout(t);
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
  }, [coach, workout]);

  const handleStop = useCallback(() => {
    lastCoachActionKeyRef.current = -1;
    coach.stopCoachAudio();
    workout.stop();
    setConfig(null);
  }, [coach, workout]);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />

      {!config ? (
        showDevScreen ? (
          <DevScreen
            tuning={tuning}
            onChange={setTuning}
            onBack={() => setShowDevScreen(false)}
          />
        ) : (
          <SetupScreen
            settings={settings}
            isReady={isReady}
            onChange={updateSettings}
            onStart={handleStart}
            onOpenDev={() => setShowDevScreen(true)}
          />
        )
      ) : workout.phase === 'idle' && prepSecondsLeft !== null && prepSecondsLeft > 0 ? (
        <PrepScreen
          secondsLeft={prepSecondsLeft}
          totalRounds={config.totalRounds}
          onSkip={() => setPrepSecondsLeft(0)}
          onCancel={handleStop}
        />
      ) : workout.phase === 'idle' ? (
        <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />
      ) : workout.phase === 'complete' ? (
        <CompleteScreen
          totalRounds={config.totalRounds}
          roundDuration={config.roundDuration}
          onRestart={handleRestart}
        />
      ) : workout.phase === 'rest' ? (
        <RestScreen
          currentRound={workout.currentRound}
          totalRounds={config.totalRounds}
          timeRemaining={workout.timeRemaining}
          onSkipRest={workout.skipRest}
        />
      ) : (
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
          onToggleMute={session.toggleMute}
          onVolumeDown={session.volumeDown}
          onVolumeUp={session.volumeUp}
          onPause={workout.pause}
          onResume={workout.resume}
          onSkipRound={workout.skipRound}
          onStop={handleStop}
        />
      )}
    </View>
  );
}
