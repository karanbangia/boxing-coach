import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { Animated, Easing, Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { EngineConfig } from '@boxing-coach/core';
import { calculateWorkoutPerformance, resolvePrepCountdownSeconds } from '@boxing-coach/core';
import type { SetupSettings } from './config';
import { MainTabShell } from './components/MainTabShell';
import type { AppTab } from './components/BottomTabBar';
import { ScreenShell } from './components/ScreenShell';
import { useStoredSettings } from './hooks/useStoredSettings';
import { useSounds } from './hooks/useSounds';
import { useCoachVoice } from './hooks/useCoachVoice';
import { useSessionAudio } from './hooks/useSessionAudio';
import { useStoredTuning } from './hooks/useStoredTuning';
import { useWakeLock } from './hooks/useWakeLock';
import { useWorkout } from './hooks/useWorkout';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useOnboardingLifecycle } from './hooks/useOnboardingLifecycle';
import { useProgressSeedDeepLink } from './hooks/useProgressSeedDeepLink';
import { clearLocalAppData } from './lib/appData';
import { saveWorkoutToHistory } from './lib/workoutHistory';
import { CompleteScreen } from './screens/CompleteScreen';
import { DevScreen } from './screens/DevScreen';
import { RestScreen } from './screens/RestScreen';
import { PrepScreen } from './screens/PrepScreen';
import { SetupScreen } from './screens/SetupScreen';
import { WorkoutScreen } from './screens/WorkoutScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { useAuth } from './providers/AuthProvider';
import { useWorkoutHistory } from './providers/WorkoutHistoryProvider';
import { colors } from './theme';

const PREP_ENTRANCE_DURATION = 260;
const START_REVEAL_DIAMETER = 96;
const START_REVEAL_DURATION = 440;
const START_REVEAL_FADE_DURATION = 180;
const ROUND_START_BELL_LEAD_SECONDS = 3;
const SAVE_TRAINING_BACKGROUND = require('../assets/onboarding/save-training-glove.jpg');

type StartRevealOrigin = { x: number; y: number };

export function App() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [fontsLoaded] = useFonts({
    Anton: require('../assets/fonts/Anton-Regular.ttf'),
    ArchivoNarrow: require('../assets/fonts/ArchivoNarrow-Regular.ttf'),
    ArchivoNarrowBold: require('../assets/fonts/ArchivoNarrow-Bold.ttf'),
    BarlowSemiCondensed: require('../assets/fonts/BarlowSemiCondensed-Regular.ttf'),
    BarlowSemiCondensedSemiBold: require('../assets/fonts/BarlowSemiCondensed-SemiBold.ttf'),
  });
  const [activeTab, setActiveTab] = useState<AppTab>('timer');
  const { settings, updateSettings, isReady: settingsReady } = useStoredSettings();
  const { tuning, setTuning, isReady: tuningReady } = useStoredTuning();
  const [config, setConfig] = useState<EngineConfig | null>(null);
  const [prepSecondsLeft, setPrepSecondsLeft] = useState<number | null>(null);
  const [showDevScreen, setShowDevScreen] = useState(false);
  const [audioCuesEnabled, setAudioCuesEnabled] = useState(settings.audioCuesEnabled);
  const [isEnteringPrep, setIsEnteringPrep] = useState(false);
  const [startRevealOrigin, setStartRevealOrigin] = useState<StartRevealOrigin | null>(null);
  const { signOut, syncWorkout, user } = useAuth();
  const onboarding = useOnboardingLifecycle();
  const { refreshHistory } = useWorkoutHistory();
  useProgressSeedDeepLink(user?.uid ?? null, refreshHistory);
  const workout = useWorkout(config);
  const workoutIdRef = useRef('');
  const savedWorkoutIdRef = useRef('');
  const prepEntrance = useRef(new Animated.Value(0)).current;
  const setupExit = useRef(new Animated.Value(1)).current;
  const startReveal = useRef(new Animated.Value(0)).current;
  const startRevealOpacity = useRef(new Animated.Value(1)).current;
  const pendingStartRef = useRef<SetupSettings | null>(null);

  const session = useSessionAudio();
  const reduceMotion = useReducedMotion();

  const sounds = useSounds(session.effectiveVolume);
  const coach = useCoachVoice(session.effectiveVolume, audioCuesEnabled);

  useEffect(() => {
    const uri = Image.resolveAssetSource(SAVE_TRAINING_BACKGROUND)?.uri;
    if (uri) void Image.prefetch(uri).catch(() => undefined);
  }, []);

  const isReady = settingsReady && tuningReady && session.ready && fontsLoaded;

  const inPrep =
    Boolean(config && prepSecondsLeft !== null && prepSecondsLeft > 0 && workout.phase === 'idle');
  const isActive = workout.phase === 'round' || workout.phase === 'rest';
  useWakeLock(isActive || inPrep);

  const prevPhaseRef = useRef(workout.phase);
  const prevFreestyleRef = useRef(workout.isFreestyle);
  const prevTimeRef = useRef(workout.timeRemaining);
  const lastCoachActionKeyRef = useRef(-1);
  const coachWasPausedRef = useRef(false);
  const lastPrepTickSecondRef = useRef<number | null>(null);
  const prepBellPlayedRef = useRef(false);

  useLayoutEffect(() => {
    if (!isEnteringPrep) return;

    prepEntrance.stopAnimation();
    setupExit.stopAnimation();

    if (reduceMotion) {
      prepEntrance.setValue(1);
      setupExit.setValue(0);
      setIsEnteringPrep(false);
      return;
    }

    const entrance = Animated.parallel([
      Animated.timing(prepEntrance, {
        toValue: 1,
        duration: PREP_ENTRANCE_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(setupExit, {
        toValue: 0,
        duration: PREP_ENTRANCE_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    entrance.start(({ finished }) => {
      if (finished) setIsEnteringPrep(false);
    });

    return () => entrance.stop();
  }, [isEnteringPrep, prepEntrance, reduceMotion, setupExit]);

  useEffect(() => {
    setAudioCuesEnabled(settings.audioCuesEnabled);
  }, [settings.audioCuesEnabled]);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    const prevFreestyle = prevFreestyleRef.current;
    const prevTimeRemaining = prevTimeRef.current;

    if (workout.phase === 'round' && prevPhase !== 'round') {
      // The bell starts during prep/rest and must be fully stopped before the
      // first coach action is allowed to play.
      sounds.stopPrepTick();
      sounds.stopRoundStart();
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
      workout.phase === 'rest' &&
      !workout.isPaused &&
      Math.ceil(prevTimeRemaining) > ROUND_START_BELL_LEAD_SECONDS &&
      Math.ceil(workout.timeRemaining) <= ROUND_START_BELL_LEAD_SECONDS
    ) {
      sounds.roundStart();
    }

    prevPhaseRef.current = workout.phase;
    prevFreestyleRef.current = workout.isFreestyle;
    prevTimeRef.current = workout.timeRemaining;
  }, [
    sounds,
    workout.isFreestyle,
    workout.isPaused,
    workout.phase,
    workout.timeRemaining,
  ]);

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
    const completedWorkout = {
      id: workoutId,
      completedAt: new Date().toISOString(),
      difficulty: config.difficulty,
      totalRounds: config.totalRounds,
      roundDuration: config.roundDuration,
      ...performance,
    };
    void saveWorkoutToHistory(completedWorkout).then(async () => {
      await refreshHistory();
      await syncWorkout(completedWorkout);
    });
  }, [config, refreshHistory, syncWorkout, workout.phase, workout.punchesThrown]);

  useEffect(() => {
    if (workout.phase !== 'round') {
      lastCoachActionKeyRef.current = -1;
      coachWasPausedRef.current = false;
      coach.stopCoachAudio();
      return;
    }
    if (workout.isPaused) {
      coachWasPausedRef.current = true;
      coach.pauseCoachAudio();
    } else if (coachWasPausedRef.current) {
      coachWasPausedRef.current = false;
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

  const beginPrep = useCallback(
    (s: SetupSettings) => {
      lastPrepTickSecondRef.current = null;
      prepBellPlayedRef.current = false;
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
      workoutIdRef.current = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      savedWorkoutIdRef.current = '';
      prepEntrance.stopAnimation();
      setupExit.stopAnimation();
      prepEntrance.setValue(0);
      setupExit.setValue(1);
      setIsEnteringPrep(true);
      setConfig(engine);
      setPrepSecondsLeft(resolvePrepCountdownSeconds(engine.tuning));
    },
    [prepEntrance, setupExit, tuning],
  );

  const handleStart = useCallback(
    (s: SetupSettings, origin: StartRevealOrigin) => {
      if (pendingStartRef.current) return;

      if (reduceMotion) {
        beginPrep(s);
        return;
      }

      pendingStartRef.current = s;
      startReveal.stopAnimation();
      startRevealOpacity.stopAnimation();
      startReveal.setValue(0);
      startRevealOpacity.setValue(1);
      setStartRevealOrigin(origin);
    },
    [beginPrep, reduceMotion, startReveal, startRevealOpacity],
  );

  useLayoutEffect(() => {
    if (!startRevealOrigin) return;

    const revealAnimation = Animated.timing(startReveal, {
      toValue: 1,
      duration: START_REVEAL_DURATION,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });

    revealAnimation.start(({ finished }) => {
      const pendingStart = pendingStartRef.current;
      if (!finished || !pendingStart) return;

      beginPrep(pendingStart);
      Animated.timing(startRevealOpacity, {
        toValue: 0,
        duration: START_REVEAL_FADE_DURATION,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        pendingStartRef.current = null;
        setStartRevealOrigin(null);
        startReveal.setValue(0);
        startRevealOpacity.setValue(1);
      });
    });

    return () => revealAnimation.stop();
  }, [beginPrep, startReveal, startRevealOpacity, startRevealOrigin]);

  useEffect(() => {
    if (!config) setPrepSecondsLeft(null);
  }, [config]);

  useEffect(() => {
    if (prepSecondsLeft === null || prepSecondsLeft <= 0) return;
    const timer = setTimeout(() => {
      setPrepSecondsLeft(seconds => (seconds === null || seconds <= 1 ? 0 : seconds - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [prepSecondsLeft]);

  useEffect(() => {
    if (
      !config ||
      workout.phase !== 'idle' ||
      prepSecondsLeft === null ||
      prepSecondsLeft <= ROUND_START_BELL_LEAD_SECONDS ||
      lastPrepTickSecondRef.current === prepSecondsLeft
    ) {
      return;
    }

    lastPrepTickSecondRef.current = prepSecondsLeft;
    sounds.prepTick();
  }, [config, prepSecondsLeft, sounds, workout.phase]);

  useEffect(() => {
    if (!config) {
      sounds.stopPrepTick();
      lastPrepTickSecondRef.current = null;
      prepBellPlayedRef.current = false;
      return;
    }
    if (
      workout.phase !== 'idle' ||
      prepSecondsLeft === null ||
      prepSecondsLeft <= 0 ||
      prepSecondsLeft > ROUND_START_BELL_LEAD_SECONDS ||
      prepBellPlayedRef.current
    ) {
      return;
    }

    prepBellPlayedRef.current = true;
    sounds.stopPrepTick();
    sounds.roundStart();
  }, [config, prepSecondsLeft, sounds, workout.phase]);

  useLayoutEffect(() => {
    if (!config || workout.phase !== 'idle') return;
    if (prepSecondsLeft === null || prepSecondsLeft > 0) return;
    workout.start();
  }, [config, workout.phase, prepSecondsLeft, workout.start]);

  const handleSkipPrep = useCallback(() => {
    sounds.stopPrepTick();
    sounds.stopRoundStart();
    setPrepSecondsLeft(0);
  }, [sounds]);

  const handleSkipRest = useCallback(() => {
    sounds.stopRoundStart();
    workout.skipRest();
  }, [sounds, workout.skipRest]);

  const handleRestart = useCallback(() => {
    sounds.stopPrepTick();
    sounds.stopRoundStart();
    lastPrepTickSecondRef.current = null;
    prepBellPlayedRef.current = false;
    lastCoachActionKeyRef.current = -1;
    prepEntrance.stopAnimation();
    setupExit.stopAnimation();
    prepEntrance.setValue(0);
    setupExit.setValue(1);
    setIsEnteringPrep(false);
    coach.stopCoachAudio();
    workout.stop();
    setConfig(null);
    setActiveTab('timer');
  }, [coach, prepEntrance, setupExit, sounds, workout]);

  const handleStop = useCallback(() => {
    sounds.stopPrepTick();
    sounds.stopRoundStart();
    lastPrepTickSecondRef.current = null;
    prepBellPlayedRef.current = false;
    lastCoachActionKeyRef.current = -1;
    prepEntrance.stopAnimation();
    setupExit.stopAnimation();
    prepEntrance.setValue(0);
    setupExit.setValue(1);
    setIsEnteringPrep(false);
    coach.stopCoachAudio();
    workout.stop();
    setConfig(null);
    setActiveTab('timer');
  }, [coach, prepEntrance, setupExit, sounds, workout]);

  const handleResetAsyncStorage = useCallback(async () => {
    if (user) {
      await signOut();
    } else {
      await clearLocalAppData();
    }
    setShowDevScreen(false);
    setActiveTab('timer');
  }, [signOut, user]);

  if (!fontsLoaded || !onboarding.isReady) {
    return (
      <ScreenShell>
        <StatusBar style="light" />
      </ScreenShell>
    );
  }

  if (onboarding.shouldShow) {
    return (
      <View style={styles.app}>
        <StatusBar style="light" />
        <OnboardingScreen
          initialRecord={onboarding.initialRecord}
          onProgress={onboarding.saveProgress}
          onComplete={onboarding.complete}
        />
      </View>
    );
  }

  const isPrepScreenVisible = Boolean(
    config && workout.phase === 'idle' && prepSecondsLeft !== null && prepSecondsLeft > 0,
  );
  return (
    <View style={styles.app}>
      <StatusBar style="light" />

      {!config || isEnteringPrep ? (
        showDevScreen ? (
          <DevScreen
            tuning={tuning}
            onChange={setTuning}
            onBack={() => setShowDevScreen(false)}
            onResetAsyncStorage={handleResetAsyncStorage}
          />
        ) : (
          <Animated.View
            pointerEvents={isEnteringPrep ? 'none' : 'auto'}
            style={[
              styles.fullScreenLayer,
              { opacity: setupExit },
            ]}
          >
            <MainTabShell activeTab={activeTab} onTabChange={setActiveTab}>
              {activeTab === 'timer' ? (
                <SetupScreen
                  settings={settings}
                  isReady={isReady}
                  onChange={updateSettings}
                  onStart={handleStart}
                  onOpenDev={() => setShowDevScreen(true)}
                />
              ) : activeTab === 'workout' ? (
                <ProgressScreen />
              ) : (
                <ProfileScreen
                  onEnterGym={() => setActiveTab('timer')}
                  fighterProfile={onboarding.fighterProfile}
                  cloudSyncPending={onboarding.cloudSyncPending}
                  onSaveFighterProfile={onboarding.saveFighterProfile}
                  onPromoteGuestProfile={onboarding.promoteGuestProfile}
                />
              )}
            </MainTabShell>
          </Animated.View>
        )
      ) : null}

      {isPrepScreenVisible && config ? (
        <Animated.View
          pointerEvents={isEnteringPrep ? 'none' : 'auto'}
          style={[
            styles.fullScreenLayer,
            { opacity: prepEntrance },
          ]}
        >
          <PrepScreen
            secondsLeft={prepSecondsLeft ?? 0}
            totalSeconds={resolvePrepCountdownSeconds(config.tuning)}
            onSkip={handleSkipPrep}
            onCancel={handleStop}
          />
        </Animated.View>
      ) : config && workout.phase === 'idle' ? (
        <ScreenShell />
      ) : config && workout.phase === 'complete' ? (
        <CompleteScreen
          performance={calculateWorkoutPerformance({
            punches: workout.punchesThrown,
            difficulty: config.difficulty,
            totalRounds: config.totalRounds,
            roundDuration: config.roundDuration,
          })}
          onReturnToGym={handleRestart}
        />
      ) : config && workout.phase === 'rest' ? (
        <RestScreen
          currentRound={workout.currentRound}
          totalRounds={config.totalRounds}
          timeRemaining={workout.timeRemaining}
          totalSeconds={config.restDuration}
          onSkipRest={handleSkipRest}
        />
      ) : config ? (
        <WorkoutScreen
          currentRound={workout.currentRound}
          totalRounds={config.totalRounds}
          roundDuration={config.roundDuration}
          timeRemaining={workout.timeRemaining}
          currentAction={workout.currentAction}
          intensity={workout.intensity}
          isPaused={workout.isPaused}
          isFreestyle={workout.isFreestyle}
          actionKey={workout.actionKey}
          comboInstructionsEnabled={settings.comboInstructionsEnabled}
          muted={session.muted}
          masterVolume={session.masterVolume}
          onToggleMute={session.toggleMute}
          onVolumePercentChange={session.setVolumePercent}
          onPause={workout.pause}
          onResume={workout.resume}
          onSkipRound={workout.skipRound}
          onStop={handleStop}
        />
      ) : null}

      {startRevealOrigin ? (
        <Animated.View
          pointerEvents="auto"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.startReveal,
            {
              left: startRevealOrigin.x - START_REVEAL_DIAMETER / 2,
              top: startRevealOrigin.y - START_REVEAL_DIAMETER / 2,
              opacity: startRevealOpacity,
              transform: [
                {
                  scale: startReveal.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.08, Math.max(
                      Math.hypot(startRevealOrigin.x, startRevealOrigin.y),
                      Math.hypot(windowWidth - startRevealOrigin.x, startRevealOrigin.y),
                      Math.hypot(startRevealOrigin.x, windowHeight - startRevealOrigin.y),
                      Math.hypot(
                        windowWidth - startRevealOrigin.x,
                        windowHeight - startRevealOrigin.y,
                      ),
                    ) * 2 / START_REVEAL_DIAMETER],
                  }),
                },
              ],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullScreenLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  startReveal: {
    position: 'absolute',
    width: START_REVEAL_DIAMETER,
    height: START_REVEAL_DIAMETER,
    borderRadius: START_REVEAL_DIAMETER / 2,
    backgroundColor: colors.accent,
    zIndex: 100,
  },
});
