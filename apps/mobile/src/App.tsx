import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { Animated, Easing, Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { EngineConfig, WorkoutFeedback } from '@boxing-coach/core';
import {
  adaptNextWorkout,
  calculateWorkoutPerformance,
  recommendFirstWorkout,
  resolvePrepCountdownSeconds,
} from '@boxing-coach/core';
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
import { trainingModeFromEquipment } from './features/profile/types';
import {
  getProgram,
  type ProgramId,
  type ProgramSession,
} from './features/programs/programs';
import { clearLocalAppData } from './lib/appData';
import {
  recordCompletedWorkoutForReview,
  requestReviewAfterPositiveFeedback,
} from './lib/appStoreReview';
import type { OnboardingRecord } from './lib/onboarding';
import { reportError, trackEvent } from './lib/observability';
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
import {
  PremiumPaywall,
  type PaywallSource,
} from './screens/PremiumPaywall';
import { useAuth } from './providers/AuthProvider';
import { usePremium } from './providers/PremiumProvider';
import { useWorkoutHistory } from './providers/WorkoutHistoryProvider';
import { colors } from './theme';

const PREP_ENTRANCE_DURATION = 260;
const START_REVEAL_DIAMETER = 96;
const START_REVEAL_DURATION = 440;
const START_REVEAL_FADE_DURATION = 180;
const ROUND_START_BELL_LEAD_SECONDS = 3;
const REST_COUNTDOWN_LEAD_SECONDS = 4;
const SAVE_TRAINING_BACKGROUND = require('../assets/onboarding/save-training-glove.jpg');

type StartRevealOrigin = { x: number; y: number };
type PaywallRequest = {
  source: PaywallSource;
  initialAction?: 'restore';
  intendedDifficulty?: SetupSettings['difficulty'];
  pendingStart?: {
    settings: SetupSettings;
    origin: StartRevealOrigin;
  };
};

interface NextWorkoutRecommendation {
  title: string;
  detail: string;
  buttonLabel: string;
  settings: SetupSettings | null;
  programSession?: ProgramSession | null;
}

function requiresPremium(difficulty: SetupSettings['difficulty']) {
  return difficulty === 'advanced' || difficulty === 'pro';
}

function programAnalyticsId(programId: ProgramId) {
  return programId.replaceAll('-', '_') as
    | 'beginner_fundamentals'
    | 'heavy_bag_conditioning'
    | 'fight_camp';
}

function workoutAnalyticsProperties(
  config: EngineConfig,
  trainingMode: 'shadowboxing' | 'heavy_bag',
) {
  return {
    difficulty: config.difficulty,
    training_mode: trainingMode,
    total_rounds: config.totalRounds,
    round_duration_seconds: config.roundDuration,
    rest_duration_seconds: config.restDuration,
  };
}

export function App() {
  const premiumPreview = __DEV__
    && process.env.EXPO_PUBLIC_PREMIUM_TEST_SCENARIO === 'paywall';
  const progressPreview = __DEV__
    && process.env.EXPO_PUBLIC_PROGRESS_TEST_SCENARIO === 'progress';
  const profilePreview = __DEV__
    && process.env.EXPO_PUBLIC_PROFILE_PREVIEW === 'profile';
  const completionPreview = __DEV__
    && process.env.EXPO_PUBLIC_COMPLETION_TEST_SCENARIO === 'feedback';
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [fontsLoaded] = useFonts({
    Anton: require('../assets/fonts/Anton-Regular.ttf'),
    ArchivoNarrow: require('../assets/fonts/ArchivoNarrow-Regular.ttf'),
    ArchivoNarrowBold: require('../assets/fonts/ArchivoNarrow-Bold.ttf'),
    BarlowSemiCondensed: require('../assets/fonts/BarlowSemiCondensed-Regular.ttf'),
    BarlowSemiCondensedSemiBold: require('../assets/fonts/BarlowSemiCondensed-SemiBold.ttf'),
  });
  const [activeTab, setActiveTab] = useState<AppTab>(
    progressPreview
      ? 'workout'
      : profilePreview
        ? 'profile'
        : 'timer',
  );
  const { settings, updateSettings, isReady: settingsReady } = useStoredSettings();
  const { tuning, setTuning, isReady: tuningReady } = useStoredTuning();
  const [config, setConfig] = useState<EngineConfig | null>(null);
  const [prepSecondsLeft, setPrepSecondsLeft] = useState<number | null>(null);
  const [showDevScreen, setShowDevScreen] = useState(false);
  const [audioCuesEnabled, setAudioCuesEnabled] = useState(settings.audioCuesEnabled);
  const [isEnteringPrep, setIsEnteringPrep] = useState(false);
  const [startRevealOrigin, setStartRevealOrigin] = useState<StartRevealOrigin | null>(null);
  const [paywallRequest, setPaywallRequest] = useState<PaywallRequest | null>(
    premiumPreview ? { source: 'preset' } : null,
  );
  const [loadedProgramSession, setLoadedProgramSession] = useState<ProgramSession | null>(null);
  const { signOut, user } = useAuth();
  const { isPremium } = usePremium();
  const onboarding = useOnboardingLifecycle();
  const { refreshHistory } = useWorkoutHistory();
  useProgressSeedDeepLink(user?.uid ?? null, refreshHistory);
  const workout = useWorkout(config);
  const workoutIdRef = useRef('');
  const savedWorkoutIdRef = useRef('');
  const workoutStartedTrackedRef = useRef(false);
  const firstRoundCompletedTrackedRef = useRef(false);
  const activeProgramSessionRef = useRef<ProgramSession | null>(null);
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
    if (progressPreview) setActiveTab('workout');
    else if (profilePreview) setActiveTab('profile');
  }, [profilePreview, progressPreview]);

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
      // Countdown cues start before the round and must be fully stopped before
      // the first coach action is allowed to play.
      sounds.stopPrepTick();
      sounds.stopRoundStart();
      sounds.stopRestCountdown();

      if (config && !workoutStartedTrackedRef.current) {
        workoutStartedTrackedRef.current = true;
        trackEvent('workout_started', {
          ...workoutAnalyticsProperties(config, settings.trainingMode),
          audio_cues_enabled: audioCuesEnabled,
          combo_instructions_enabled: settings.comboInstructionsEnabled,
        });
      }
    }

    if (workout.phase === 'rest' && prevPhase === 'round') {
      sounds.roundEnd();
    }

    if (workout.phase === 'complete' && prevPhase !== 'complete') {
      sounds.roundEnd();
    }

    if (
      config
      && prevPhase === 'round'
      && (workout.phase === 'rest' || workout.phase === 'complete')
      && workout.currentRound === 1
      && !firstRoundCompletedTrackedRef.current
    ) {
      firstRoundCompletedTrackedRef.current = true;
      trackEvent(
        'first_round_completed',
        workoutAnalyticsProperties(config, settings.trainingMode),
      );
    }

    if (workout.isFreestyle && !prevFreestyle) {
      sounds.freestyleStart();
    }

    if (
      workout.phase === 'rest' &&
      !workout.isPaused &&
      Math.ceil(prevTimeRemaining) > REST_COUNTDOWN_LEAD_SECONDS &&
      Math.ceil(workout.timeRemaining) <= REST_COUNTDOWN_LEAD_SECONDS
    ) {
      sounds.restCountdown();
    }

    prevPhaseRef.current = workout.phase;
    prevFreestyleRef.current = workout.isFreestyle;
    prevTimeRef.current = workout.timeRemaining;
  }, [
    sounds,
    audioCuesEnabled,
    config,
    settings.comboInstructionsEnabled,
    settings.trainingMode,
    workout.currentRound,
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
      ...(activeProgramSessionRef.current
        ? {
          programId: activeProgramSessionRef.current.programId,
          programSessionId: activeProgramSessionRef.current.id,
        }
        : {}),
      ...performance,
    };
    trackEvent('workout_completed', {
      ...workoutAnalyticsProperties(config, settings.trainingMode),
      punches: workout.punchesThrown,
    });
    if (activeProgramSessionRef.current) {
      trackEvent('program_session_completed', {
        program: programAnalyticsId(activeProgramSessionRef.current.programId),
        week: activeProgramSessionRef.current.week,
        session: activeProgramSessionRef.current.sessionInWeek,
      });
    }
    void saveWorkoutToHistory(completedWorkout)
      .then(async () => {
        await refreshHistory();
      })
      .catch(error => {
        reportError(error, 'workout_history', {
          operation: 'save_or_refresh',
        });
      })
      .finally(async () => {
        try {
          await recordCompletedWorkoutForReview();
        } catch (error) {
          reportError(error, 'app_store_review', {
            operation: 'record_completion',
          });
        }
      });
  }, [
    config,
    refreshHistory,
    settings.trainingMode,
    workout.phase,
    workout.punchesThrown,
  ]);

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
      const effectiveTuning = {
        ...tuning,
        ...(activeProgramSessionRef.current?.tuning ?? {}),
      };
      const hasOverrides = Object.values(effectiveTuning).some(value => value !== undefined);
      const engine: EngineConfig = {
        difficulty: s.difficulty,
        roundDuration: s.roundDuration,
        totalRounds: s.totalRounds,
        restDuration: s.restDuration,
        ...(hasOverrides ? { tuning: effectiveTuning } : {}),
      };
      workoutIdRef.current = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      savedWorkoutIdRef.current = '';
      workoutStartedTrackedRef.current = false;
      firstRoundCompletedTrackedRef.current = false;
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
      activeProgramSessionRef.current = loadedProgramSession;
      if (loadedProgramSession && !isPremium) {
        setPaywallRequest({
          source: 'difficulty',
          intendedDifficulty: s.difficulty,
          pendingStart: { settings: s, origin },
        });
        return;
      }
      if (!isPremium && requiresPremium(s.difficulty)) {
        setPaywallRequest({
          source: 'difficulty',
          intendedDifficulty: s.difficulty,
          pendingStart: { settings: s, origin },
        });
        return;
      }

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
    [
      beginPrep,
      isPremium,
      loadedProgramSession,
      reduceMotion,
      startReveal,
      startRevealOpacity,
    ],
  );

  const handlePremiumUnlocked = useCallback(() => {
    const request = paywallRequest;
    setPaywallRequest(null);
    if (!request) return;
    if (request.intendedDifficulty) {
      updateSettings({ difficulty: request.intendedDifficulty });
    }
    if (request.pendingStart) {
      beginPrep(request.pendingStart.settings);
    }
  }, [beginPrep, paywallRequest, updateSettings]);

  useEffect(() => {
    if (!paywallRequest || !isPremium) return;

    // Sign-in can temporarily unmount the paywall while account setup resolves.
    // Resume the original Pro/Advanced request from app-level state once the
    // signed-in RevenueCat identity confirms that Premium is already active.
    handlePremiumUnlocked();
  }, [handlePremiumUnlocked, isPremium, paywallRequest]);

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
    sounds.stopRestCountdown();
    workout.skipRest();
  }, [sounds, workout.skipRest]);

  const handleRestart = useCallback(() => {
    sounds.stopPrepTick();
    sounds.stopRoundStart();
    sounds.stopRestCountdown();
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
    activeProgramSessionRef.current = null;
    setLoadedProgramSession(null);
    setConfig(null);
    setActiveTab('timer');
  }, [coach, prepEntrance, setupExit, sounds, workout]);

  const handleCompletionFeedback = useCallback((
    feedback: WorkoutFeedback,
  ): NextWorkoutRecommendation => {
    trackEvent('completion_rating_submitted', { rating: feedback });

    if (feedback === 'just_right' || feedback === 'too_easy') {
      void requestReviewAfterPositiveFeedback()
        .then(review => {
          if (review.requested) {
            trackEvent('app_store_review_requested', {
              completed_workouts: review.completedWorkouts,
            });
          }
        })
        .catch(error => {
          reportError(error, 'app_store_review', {
            operation: 'request_after_positive_feedback',
          });
        });
    }

    const currentProgramSession = activeProgramSessionRef.current;
    if (currentProgramSession) {
      const program = getProgram(currentProgramSession.programId);
      const currentIndex = program?.sessions.findIndex(
        sessionItem => sessionItem.id === currentProgramSession.id,
      ) ?? -1;
      const nextProgramSession = currentIndex >= 0
        ? program?.sessions[currentIndex + 1] ?? null
        : null;

      if (feedback === 'too_hard') {
        return {
          title: 'REPEAT WITH CONTROL',
          detail: 'Repeat this program session before moving forward. Clean work beats rushed progress.',
          buttonLabel: 'LOAD THIS SESSION AGAIN',
          settings: {
            ...settings,
            ...currentProgramSession.settings,
          },
          programSession: currentProgramSession,
        };
      }

      if (nextProgramSession) {
        return {
          title: `WEEK ${nextProgramSession.week} · SESSION ${nextProgramSession.sessionInWeek}`,
          detail: `${nextProgramSession.title}. ${nextProgramSession.focus}.`,
          buttonLabel: 'LOAD NEXT PROGRAM SESSION',
          settings: {
            ...settings,
            ...nextProgramSession.settings,
          },
          programSession: nextProgramSession,
        };
      }

      return {
        title: 'PROGRAM COMPLETE',
        detail: 'You finished every session in this program. Head back to Programs to choose the next challenge.',
        buttonLabel: 'PROGRAM COMPLETE',
        settings: null,
        programSession: null,
      };
    }

    if (!config) {
      return {
        title: 'SESSION SAVED',
        detail: 'Return to the gym when you are ready to train again.',
        buttonLabel: 'RETURN TO GYM',
        settings: null,
        programSession: null,
      };
    }

    const adaptive = adaptNextWorkout(config, feedback);
    return {
      title: adaptive.title,
      detail: adaptive.detail,
      buttonLabel: 'LOAD NEXT WORKOUT',
      settings: {
        ...settings,
        ...adaptive.settings,
      },
      programSession: null,
    };
  }, [config, settings]);

  const handleLoadNextWorkout = useCallback((
    recommendation: NextWorkoutRecommendation,
  ) => {
    if (!recommendation.settings) return;

    updateSettings(recommendation.settings);
    handleRestart();
    setLoadedProgramSession(recommendation.programSession ?? null);
    trackEvent('next_workout_loaded', {
      source: recommendation.programSession ? 'program' : 'adaptive',
      difficulty: recommendation.settings.difficulty,
      total_rounds: recommendation.settings.totalRounds,
    });
  }, [handleRestart, updateSettings]);

  const handleStop = useCallback(() => {
    if (config && workoutIdRef.current && workout.phase !== 'complete') {
      const phase = workout.phase === 'round' || workout.phase === 'rest'
        ? workout.phase
        : 'prep';
      trackEvent('workout_abandoned', {
        ...workoutAnalyticsProperties(config, settings.trainingMode),
        phase,
        rounds_started: phase === 'prep' ? 0 : workout.currentRound,
      });
    }
    sounds.stopPrepTick();
    sounds.stopRoundStart();
    sounds.stopRestCountdown();
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
    activeProgramSessionRef.current = null;
    setConfig(null);
    setActiveTab('timer');
  }, [coach, config, prepEntrance, settings.trainingMode, setupExit, sounds, workout]);

  const handleResetAsyncStorage = useCallback(async () => {
    if (user) {
      await signOut();
    } else {
      await clearLocalAppData();
    }
    setShowDevScreen(false);
    setActiveTab('timer');
  }, [signOut, user]);

  const handleOnboardingComplete = useCallback(async (
    record: OnboardingRecord,
    options?: { skipped?: boolean; cloudSyncPending?: boolean },
  ) => {
    const completedAccountSetup = onboarding.entryMode === 'account_setup';
    await onboarding.complete(record, options);

    // A user who deliberately skips onboarding keeps any settings already
    // stored on this device. Completed answers only seed the first workout;
    // later manual changes remain authoritative.
    if (!options?.skipped) {
      updateSettings({
        ...recommendFirstWorkout(record.profile),
        trainingMode: trainingModeFromEquipment(record.profile.equipment),
      });
    }
    if (completedAccountSetup) {
      setActiveTab('timer');
    }
    trackEvent('onboarding_completed', {
      path: options?.skipped
        ? 'skipped'
        : options?.cloudSyncPending
          ? 'account'
          : 'guest',
      experience: record.profile.experience,
      goal: record.profile.goal,
      training_mode: trainingModeFromEquipment(record.profile.equipment),
    });
  }, [onboarding.complete, onboarding.entryMode, updateSettings]);

  if (!fontsLoaded || !onboarding.isReady) {
    return (
      <ScreenShell>
        <StatusBar style="light" />
      </ScreenShell>
    );
  }

  if (completionPreview) {
    return (
      <View style={styles.app}>
        <StatusBar style="light" />
        <CompleteScreen
          performance={{
            punches: 186,
            averageHeartRate: 0,
            caloriesBurned: 148,
          }}
          onReturnToGym={() => undefined}
        />
      </View>
    );
  }

  if (onboarding.shouldShow) {
    return (
      <View style={styles.app}>
        <StatusBar style="light" />
        <OnboardingScreen
          entryMode={onboarding.entryMode}
          initialRecord={onboarding.initialRecord}
          onProgress={onboarding.saveProgress}
          onEnableTrainingReminders={async record => {
            try {
              const result = await onboarding.enableTrainingReminders(record);
              trackEvent('training_reminder_permission_resolved', { result });
              return result;
            } catch (error) {
              reportError(error, 'training_reminders', {
                operation: 'request_and_schedule_from_onboarding',
              });
              return 'unavailable';
            }
          }}
          onComplete={handleOnboardingComplete}
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
                  isPremium={isPremium}
                  onChange={updateSettings}
                  onStart={handleStart}
                  onPremiumRequest={difficulty => setPaywallRequest({
                    source: 'difficulty',
                    intendedDifficulty: difficulty,
                  })}
                  programSession={loadedProgramSession}
                  onClearProgramSession={() => {
                    setLoadedProgramSession(null);
                    activeProgramSessionRef.current = null;
                  }}
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
                  onOpenPremium={() => setPaywallRequest({ source: 'preset' })}
                  onRestorePremium={() => setPaywallRequest({
                    source: 'profile',
                    initialAction: 'restore',
                  })}
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
          trainingMode={settings.trainingMode}
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

      <PremiumPaywall
        visible={Boolean(paywallRequest)}
        source={paywallRequest?.source ?? 'difficulty'}
        initialAction={paywallRequest?.initialAction}
        onClose={() => setPaywallRequest(null)}
        onUnlocked={handlePremiumUnlocked}
        onPromoteGuestProfile={onboarding.promoteGuestProfile}
      />
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
