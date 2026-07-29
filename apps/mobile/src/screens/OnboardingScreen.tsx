import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recommendFirstWorkout } from '@boxing-coach/core';
import { ScreenShell } from '../components/ScreenShell';
import { TactilePressable } from '../components/TactilePressable';
import { AccountSignInActions } from '../components/AccountSignInActions';
import {
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  SESSION_DURATIONS,
  STANCE_OPTIONS,
  TRAINING_DAYS,
  equipmentForTrainingMode,
  trainingModeFromEquipment,
  type FighterProfile,
  type SessionDuration,
  type TrainingDay,
  type TrainingMode,
} from '../features/profile/types';
import { EXTERNAL_LINKS, openExternalLink } from '../lib/externalLinks';
import type { OnboardingRecord } from '../lib/onboarding';
import { trackEvent } from '../lib/observability';
import { useAuth } from '../providers/AuthProvider';
import { colors, textLineHeight } from '../theme';

const DATA_STEP_COUNT = 5;
const LAST_STEP = 5;
const ONBOARDING_STEP_KEYS = [
  'nickname',
  'experience',
  'goal',
  'training_mode',
  'routine',
] as const;
type OnboardingView = 'welcome' | 'form' | 'recommendation' | 'signup' | 'signin';
const DAY_LABELS: Record<TrainingDay, string> = {
  monday: 'MON',
  tuesday: 'TUE',
  wednesday: 'WED',
  thursday: 'THU',
  friday: 'FRI',
  saturday: 'SAT',
};

const TITLES = [
  'WHAT SHOULD WE CALL YOU?',
  "WHAT'S YOUR FITNESS LEVEL?",
  "WHAT'S YOUR TRAINING GOAL?",
  'HOW WILL YOU TRAIN?',
  "WHAT'S YOUR ROUTINE",
] as const;

interface Props {
  initialRecord: OnboardingRecord;
  onProgress: (record: OnboardingRecord) => Promise<void>;
  onComplete: (
    record: OnboardingRecord,
    options?: { skipped?: boolean; cloudSyncPending?: boolean },
  ) => Promise<void>;
}

function copyRecord(
  record: OnboardingRecord,
  changes: Partial<OnboardingRecord> & { profile?: FighterProfile },
): OnboardingRecord {
  return { ...record, ...changes, profile: changes.profile ?? record.profile };
}

function WhiteTriangle() {
  return <View style={styles.whiteTriangle} accessibilityElementsHidden />;
}

function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <TactilePressable
      onPress={onPress}
      disabled={disabled || loading}
      haptic="medium"
      pressedScale={0.985}
      style={[styles.primaryButton, (disabled || loading) && styles.disabled]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <View style={styles.primaryButtonContent}>
          <WhiteTriangle />
          <Text style={styles.primaryButtonText} allowFontScaling={false}>{label}</Text>
        </View>
      )}
    </TactilePressable>
  );
}

function SecondaryButton({ label, onPress, disabled = false }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TactilePressable
      onPress={onPress}
      disabled={disabled}
      haptic="light"
      style={[styles.secondaryButton, disabled && styles.disabled]}
    >
      <Text style={styles.secondaryButtonText} allowFontScaling={false}>{label}</Text>
    </TactilePressable>
  );
}

function Header({ step, onBack }: {
  step: number;
  onBack: () => void;
}) {
  return (
    <View>
      <View style={styles.headerRow}>
        <View style={styles.headerStart}>
          <TactilePressable
            onPress={onBack}
            haptic="light"
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TactilePressable>
          {/*<Text style={styles.kicker} allowFontScaling={false}>GETTING STARTED</Text>*/}
        </View>
        <Text style={styles.stepLabel} allowFontScaling={false}>
          STEP {step + 1} OF {DATA_STEP_COUNT}
        </Text>
      </View>
      <Text style={styles.title} allowFontScaling={false}>{TITLES[step]}</Text>
      <View style={styles.progressRow} accessibilityRole="progressbar">
        {Array.from({ length: DATA_STEP_COUNT }, (_, index) => (
          <View key={index} style={[styles.progressSegment, index <= step && styles.progressSegmentActive]} />
        ))}
      </View>
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel} allowFontScaling={false}>{children}</Text>;
}

function ChoiceCard({
  title,
  subtitle,
  selected,
  onPress,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <TactilePressable
      onPress={onPress}
      haptic="selection"
      pressedScale={0.98}
      style={[
        styles.choiceCard,
        compact && styles.choiceCardCompact,
        selected && styles.choiceCardSelected,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <View style={styles.choiceCopy}>
        <Text style={[styles.choiceTitle, selected && styles.choiceTitleSelected]} allowFontScaling={false}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.choiceSubtitle}>{subtitle}</Text> : null}
      </View>
    </TactilePressable>
  );
}

function WelcomeScreen({
  onGetStarted,
  onExistingAccount,
  onEnterGym,
}: {
  onGetStarted: () => void;
  onExistingAccount: () => void;
  onEnterGym: () => void;
}) {
  const insets = useSafeAreaInsets();
  const player = useVideoPlayer(
    require('../../assets/onboarding/welcome-boxer.m4v'),
    videoPlayer => {
      videoPlayer.loop = true;
      videoPlayer.muted = true;
      videoPlayer.audioMixingMode = 'mixWithOthers';
      videoPlayer.play();
    },
  );

  return (
    <View style={styles.welcomeBackground}>
      <VideoView
        player={player}
        contentFit="cover"
        nativeControls={false}
        fullscreenOptions={{ enable: false }}
        allowsPictureInPicture={false}
        surfaceType="textureView"
        style={styles.welcomeVideo}
        pointerEvents="none"
        accessible={false}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.16)', 'rgba(0,0,0,0.04)', 'rgba(5,0,0,0.94)']}
        locations={[0, 0.48, 1]}
        style={styles.welcomeOverlay}
      >
        <View
          style={[
            styles.welcomeContent,
            {
              paddingTop: insets.top + 18,
              paddingBottom: insets.bottom + 24,
            },
          ]}
        >
          <View style={styles.welcomeBrand}>
            <View style={styles.welcomeBrandMark} />
            <Text style={styles.welcomeBrandText} allowFontScaling={false}>BOXING COACH</Text>
          </View>

          <View style={styles.welcomeBottom}>
            <View>
              <Text style={styles.welcomeKicker} allowFontScaling={false}>YOUR CORNER STARTS HERE</Text>
              <Text style={styles.welcomeTitle} allowFontScaling={false}>LET'S GET{`\n`}STARTED</Text>
              <Text style={styles.welcomeCopy}>
                Build your profile and make every round count.
              </Text>
            </View>

            <View style={styles.welcomeActions}>
              <PrimaryButton label="LET'S GET STARTED" onPress={onGetStarted} />
              <TactilePressable
                onPress={onExistingAccount}
                haptic="light"
                pressedScale={0.985}
                style={styles.welcomeAccountButton}
                accessibilityRole="button"
              >
                <Text style={styles.welcomeAccountText} allowFontScaling={false}>
                  ALREADY HAVE AN ACCOUNT? <Text style={styles.welcomeAccountAccent}>SIGN IN</Text>
                </Text>
              </TactilePressable>
              <TactilePressable
                onPress={onEnterGym}
                haptic="medium"
                pressedScale={0.985}
                style={styles.welcomeEnterGymButton}
                accessibilityRole="button"
              >
                <Text style={styles.welcomeEnterGymText} allowFontScaling={false}>ENTER THE GYM</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.text} />
              </TactilePressable>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function SignupStep({
  record,
  onBack,
  onComplete,
  existingAccount = false,
  onContinueAsGuest,
}: {
  record: OnboardingRecord;
  onBack: () => void;
  onComplete: Props['onComplete'];
  existingAccount?: boolean;
  onContinueAsGuest?: () => void;
}) {
  const { isBusy } = useAuth();
  const insets = useSafeAreaInsets();

  const content = (
    <ScrollView contentContainerStyle={styles.signupContent} showsVerticalScrollIndicator={false}>
        <View>
          <View style={styles.signupHeader}>
            <TactilePressable onPress={onBack} haptic="light" style={styles.backButton} accessibilityLabel="Go back">
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </TactilePressable>
            <Text style={styles.kicker} allowFontScaling={false}>
              {existingAccount ? 'WELCOME BACK TO YOUR CORNER.' : 'YOUR CORNER. EVERYWHERE.'}
            </Text>
          </View>
          <Text style={[styles.signupTitle, styles.signupTitlePeach]} allowFontScaling={false}>
            {existingAccount ? 'SIGN IN TO' : 'SAVE YOUR'}
          </Text>
          <Text style={[styles.signupTitle, styles.signupTitleRed]} allowFontScaling={false}>
            {existingAccount ? 'YOUR CORNER' : 'TRAINING'}
          </Text>
          <Text style={styles.leadCopy}>
            {existingAccount
              ? 'Pick the provider connected to your account to recover your fighter profile.'
              : 'Protect your fighter profile and recover it after reinstalling.'}
          </Text>
        </View>

        <View style={styles.signupActions}>
          <AccountSignInActions
            onSignedIn={async () => {
              if (!existingAccount) {
                await onComplete(record, { cloudSyncPending: true });
              }
            }}
          />
          <SecondaryButton
            label="CONTINUE AS GUEST"
            onPress={() => {
              if (existingAccount) onContinueAsGuest?.();
              else void onComplete(record);
            }}
            disabled={isBusy}
          />
          <Text style={styles.signupFootnote}>
            {existingAccount
              ? 'Use the same provider you chose when creating your account.'
              : `Sign in to protect your fighter profile and any future Premium purchase.\nFree training never requires an account.`}
          </Text>
          <View style={styles.legalLinks}>
            <Text
              style={styles.legalText}
              onPress={() => void openExternalLink(EXTERNAL_LINKS.terms, 'Terms of Use')}
              accessibilityRole="link"
            >
              TERMS OF USE
            </Text>
            <Text style={styles.legalDivider} accessibilityElementsHidden>·</Text>
            <Text
              style={styles.legalText}
              onPress={() => void openExternalLink(EXTERNAL_LINKS.privacy, 'Privacy Policy')}
              accessibilityRole="link"
            >
              PRIVACY POLICY
            </Text>
          </View>
        </View>
    </ScrollView>
  );

  if (existingAccount) return <ScreenShell>{content}</ScreenShell>;

  return (
    <ImageBackground
      source={require('../../assets/onboarding/save-training-glove.jpg')}
      resizeMode="cover"
      style={styles.signupBackground}
      accessible={false}
    >
      <LinearGradient
        colors={['rgba(5,0,0,0.38)', 'rgba(5,0,0,0.67)', 'rgba(5,0,0,0.96)']}
        locations={[0, 0.43, 1]}
        style={styles.signupOverlay}
      >
        <View
          style={[
            styles.signupSafeArea,
            {
              paddingTop: insets.top,
              paddingRight: insets.right,
              paddingBottom: insets.bottom,
              paddingLeft: insets.left,
            },
          ]}
        >
          {content}
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

function RecommendationScreen({
  record,
  onBack,
  onUseWorkout,
  onSaveFirst,
}: {
  record: OnboardingRecord;
  onBack: () => void;
  onUseWorkout: () => void;
  onSaveFirst: () => void;
}) {
  const recommendation = recommendFirstWorkout(record.profile);
  const trainingMode = trainingModeFromEquipment(record.profile.equipment);
  const difficultyLabel = {
    beginner: 'BASIC',
    intermediate: 'MEDIUM',
    advanced: 'ADVANCED',
    pro: 'PRO',
  }[recommendation.difficulty];
  const sessionMinutes = Math.round(
    (
      recommendation.totalRounds * recommendation.roundDuration
      + (recommendation.totalRounds - 1) * recommendation.restDuration
    ) / 60,
  );

  return (
    <ScreenShell>
      <ScrollView
        contentContainerStyle={styles.recommendationContent}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <View style={styles.recommendationHeader}>
            <TactilePressable
              onPress={onBack}
              haptic="light"
              style={styles.backButton}
              accessibilityLabel="Back to routine"
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </TactilePressable>
            <Text style={styles.kicker} allowFontScaling={false}>BUILT FROM YOUR ANSWERS</Text>
          </View>
          <Text style={styles.recommendationTitle} allowFontScaling={false}>
            YOUR FIRST{`\n`}WORKOUT
          </Text>
          <Text style={styles.recommendationLead}>
            Start with a session you can finish strong. You can adjust every setting before the bell.
          </Text>
        </View>

        <View style={styles.recommendationCard}>
          <View style={styles.recommendationCardTop}>
            <View style={styles.recommendationModeIcon}>
              <Ionicons
                name={trainingMode === 'heavy_bag' ? 'fitness-outline' : 'body-outline'}
                size={25}
                color={colors.peach}
              />
            </View>
            <View style={styles.recommendationCardCopy}>
              <Text style={styles.recommendationEyebrow} allowFontScaling={false}>
                {trainingMode === 'heavy_bag' ? 'HEAVY BAG' : 'SHADOWBOXING'}
              </Text>
              <Text style={styles.recommendationCardTitle} allowFontScaling={false}>
                {difficultyLabel} STARTER
              </Text>
            </View>
          </View>

          <View style={styles.recommendationMetrics}>
            <View style={styles.recommendationMetric}>
              <Text style={styles.recommendationMetricValue} allowFontScaling={false}>
                {recommendation.totalRounds}
              </Text>
              <Text style={styles.recommendationMetricLabel} allowFontScaling={false}>ROUNDS</Text>
            </View>
            <View style={styles.recommendationMetric}>
              <Text style={styles.recommendationMetricValue} allowFontScaling={false}>
                {recommendation.roundDuration / 60}M
              </Text>
              <Text style={styles.recommendationMetricLabel} allowFontScaling={false}>EACH</Text>
            </View>
            <View style={styles.recommendationMetric}>
              <Text style={styles.recommendationMetricValue} allowFontScaling={false}>
                {recommendation.restDuration}S
              </Text>
              <Text style={styles.recommendationMetricLabel} allowFontScaling={false}>REST</Text>
            </View>
          </View>

          <View style={styles.recommendationSummary}>
            <Ionicons name="time-outline" size={18} color={colors.textMuted} />
            <Text style={styles.recommendationSummaryText}>
              About {sessionMinutes} minutes · Coach audio and visual combos included
            </Text>
          </View>
        </View>

        <View style={styles.recommendationActions}>
          <PrimaryButton label="USE THIS WORKOUT" onPress={onUseWorkout} />
          <SecondaryButton label="SAVE & SYNC FIRST" onPress={onSaveFirst} />
          <Text style={styles.recommendationFootnote}>
            No account is required to train. Saving lets you recover your fighter profile;
            workout history stays on this device.
          </Text>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

export function OnboardingScreen({ initialRecord, onProgress, onComplete }: Props) {
  const [record, setRecord] = useState(initialRecord);
  const [view, setView] = useState<OnboardingView>(
    initialRecord.step === 0 ? 'welcome' : 'form',
  );
  const [nicknameFocused, setNicknameFocused] = useState(false);
  const onboardingStartedTrackedRef = useRef(false);
  const recommendationShownTrackedRef = useRef(false);
  const step = record.step;
  const profile = record.profile;
  const trainingMode = trainingModeFromEquipment(profile.equipment);
  const recommendation = recommendFirstWorkout(profile);

  const trackOnboardingStarted = (entry: 'new' | 'resumed') => {
    if (onboardingStartedTrackedRef.current) return;
    onboardingStartedTrackedRef.current = true;
    trackEvent('onboarding_started', { entry });
  };

  useEffect(() => {
    if (initialRecord.step > 0) {
      trackOnboardingStarted('resumed');
    }
  }, [initialRecord.step]);

  useEffect(() => {
    if (
      recommendationShownTrackedRef.current
      || (view !== 'recommendation' && step !== LAST_STEP)
    ) {
      return;
    }

    recommendationShownTrackedRef.current = true;
    trackEvent('recommended_workout_shown', {
      difficulty: recommendation.difficulty,
      training_mode: trainingMode,
      total_rounds: recommendation.totalRounds,
      round_duration_seconds: recommendation.roundDuration,
      rest_duration_seconds: recommendation.restDuration,
    });
  }, [recommendation, step, trainingMode, view]);

  const updateProfile = (changes: Partial<FighterProfile>) => {
    setRecord(current => copyRecord(current, { profile: { ...current.profile, ...changes } }));
  };

  const goBack = () => {
    if (view === 'signin' || step <= 0) {
      setView('welcome');
      return;
    }
    if (view === 'signup') {
      setView('recommendation');
      return;
    }
    if (view === 'recommendation' || step === LAST_STEP) {
      const previous = copyRecord(record, { step: LAST_STEP - 1 });
      setRecord(previous);
      setView('form');
      void onProgress(previous).catch(() => undefined);
      return;
    }
    const previous = copyRecord(record, { step: step - 1 });
    setRecord(previous);
    void onProgress(previous).catch(() => undefined);
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => subscription.remove();
  });

  const next = async () => {
    const nextRecord = copyRecord(record, { step: Math.min(LAST_STEP, step + 1) });
    setRecord(nextRecord);
    await onProgress(nextRecord);
    const stepKey = ONBOARDING_STEP_KEYS[step];
    if (stepKey) {
      trackEvent('onboarding_step_completed', {
        step: (step + 1) as 1 | 2 | 3 | 4 | 5,
        step_key: stepKey,
      });
    }
  };

  const toggleDay = (day: TrainingDay) => {
    const selected = profile.trainingDays.includes(day);
    const trainingDays = selected
      ? profile.trainingDays.filter(item => item !== day)
      : TRAINING_DAYS.filter(item => item === day || profile.trainingDays.includes(item));
    updateProfile({ trainingDays, targetDaysPerWeek: trainingDays.length });
  };

  const selectTrainingMode = (nextTrainingMode: TrainingMode) => {
    updateProfile({
      equipment: equipmentForTrainingMode(nextTrainingMode, profile.equipment),
    });
  };

  if (view === 'welcome') {
    return (
      <WelcomeScreen
        onGetStarted={() => {
          trackOnboardingStarted('new');
          setView('form');
        }}
        onExistingAccount={() => setView('signin')}
        onEnterGym={() => void onComplete(record, { skipped: true })}
      />
    );
  }

  if (view === 'signin') {
    return (
      <SignupStep
        record={record}
        onBack={goBack}
        onComplete={onComplete}
        existingAccount
        onContinueAsGuest={() => {
          trackOnboardingStarted('new');
          setView('form');
        }}
      />
    );
  }

  if (view === 'signup') {
    return (
      <SignupStep
        record={record}
        onBack={goBack}
        onComplete={onComplete}
      />
    );
  }

  if (view === 'recommendation' || step === LAST_STEP) {
    return (
      <RecommendationScreen
        record={record}
        onBack={goBack}
        onUseWorkout={() => void onComplete(record)}
        onSaveFirst={() => setView('signup')}
      />
    );
  }

  return (
    <ScreenShell>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.screenContent}
          directionalLockEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Header
            step={step}
            onBack={goBack}
          />

          <View style={styles.stepBody}>
            {step === 0 ? (
              <>
                <SectionLabel>NICKNAME</SectionLabel>
                <TextInput
                  value={profile.displayName}
                  onChangeText={displayName => updateProfile({ displayName })}
                  onFocus={() => setNicknameFocused(true)}
                  onBlur={() => setNicknameFocused(false)}
                  onSubmitEditing={() => {
                    if (profile.displayName.trim()) void next().catch(() => undefined);
                  }}
                  style={[
                    styles.nicknameInput,
                    profile.displayName.length > 0 && styles.nicknameInputValue,
                    nicknameFocused && styles.nicknameInputFocused,
                  ]}
                  placeholder="ENTER YOUR NICKNAME"
                  placeholderTextColor={colors.textMuted}
                  selectionColor={colors.red}
                  autoCapitalize="words"
                  autoCorrect={false}
                  enterKeyHint="next"
                  returnKeyType="next"
                  textContentType="nickname"
                  maxLength={30}
                  accessibilityLabel="Boxing nickname"
                />

              </>
            ) : null}

            {step === 1 ? (
              <>
                <Text style={styles.leadCopy}>Choose the level that best matches your current activity.</Text>
                <SectionLabel>FITNESS LEVEL</SectionLabel>
                <View style={styles.twoColumnGrid}>
                  {EXPERIENCE_OPTIONS.map(option => (
                    <ChoiceCard
                      key={option.value}
                      title={option.label.toUpperCase()}
                      subtitle={{
                        beginner: 'New or returning',
                        intermediate: 'Exercise 1–2 days/week',
                        advanced: 'Exercise 3–4 days/week',
                        professional: 'Exercise 5+ days/week',
                      }[option.value]}
                      selected={profile.experience === option.value}
                      onPress={() => updateProfile({ experience: option.value })}
                    />
                  ))}
                </View>

              </>
            ) : null}

            {step === 2 ? (
              <>
                <Text style={styles.leadCopy}>Pick the result you want coaching to prioritize.</Text>
                <SectionLabel>PRIMARY GOAL</SectionLabel>
                <View style={styles.twoColumnGrid}>
                  {GOAL_OPTIONS.map(option => (
                    <ChoiceCard
                      key={option.value}
                      title={{
                        fundamentals: 'BASICS',
                        fitness: 'FITNESS',
                        heavy_bag: 'HEAVY BAG',
                        competition: 'COMPETE',
                      }[option.value]}
                      subtitle={{
                        fundamentals: 'Technique first',
                        fitness: 'Conditioning + rhythm',
                        heavy_bag: 'Sharper work rounds',
                        competition: 'Train with purpose',
                      }[option.value]}
                      selected={profile.goal === option.value}
                      onPress={() => updateProfile({ goal: option.value })}
                    />
                  ))}
                </View>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <Text style={styles.leadCopy}>
                  Choose where you will train and the stance that best matches you.
                </Text>
                <SectionLabel>TRAINING MODE</SectionLabel>
                <View style={styles.twoColumnGrid}>
                  <ChoiceCard
                    title="SHADOWBOXING"
                    subtitle="No bag needed"
                    selected={trainingMode === 'shadowboxing'}
                    onPress={() => selectTrainingMode('shadowboxing')}
                    compact
                  />
                  <ChoiceCard
                    title="HEAVY BAG"
                    subtitle="Bag-focused rounds"
                    selected={trainingMode === 'heavy_bag'}
                    onPress={() => selectTrainingMode('heavy_bag')}
                    compact
                  />
                </View>
                <SectionLabel>STANCE</SectionLabel>
                <View style={styles.threeColumnGrid}>
                  {STANCE_OPTIONS.map(option => (
                    <ChoiceCard
                      key={option.value}
                      title={option.label.toUpperCase()}
                      selected={profile.stance === option.value}
                      onPress={() => updateProfile({ stance: option.value })}
                      compact
                    />
                  ))}
                </View>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <Text style={styles.leadCopy}>
                  Choose the days you want to train. We will use them for workout reminders.
                </Text>
                <SectionLabel>TRAINING DAYS</SectionLabel>
                <View style={styles.dayGrid}>
                  {TRAINING_DAYS.map(day => {
                    const selected = profile.trainingDays.includes(day);
                    return (
                      <TactilePressable
                        key={day}
                        onPress={() => toggleDay(day)}
                        haptic="selection"
                        style={[styles.dayButton, selected && styles.dayButtonSelected]}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                      >
                        <Text style={[styles.dayText, selected && styles.dayTextSelected]} allowFontScaling={false}>
                          {DAY_LABELS[day]}
                        </Text>
                      </TactilePressable>
                    );
                  })}
                </View>

                <SectionLabel>PREFERRED WORKOUT DURATION</SectionLabel>
                <View style={styles.durationGrid}>
                  {SESSION_DURATIONS.map(duration => {
                    const selected = profile.preferredSessionMinutes === duration;
                    return (
                      <TactilePressable
                        key={duration}
                        onPress={() => updateProfile({ preferredSessionMinutes: duration as SessionDuration })}
                        haptic="selection"
                        style={[styles.durationCard, selected && styles.durationCardSelected]}
                      >
                        <Text style={[styles.durationValue, selected && styles.durationValueSelected]} allowFontScaling={false}>
                          {duration}
                        </Text>
                        <Text style={[styles.durationUnit, selected && styles.durationUnitSelected]} allowFontScaling={false}>
                          MIN
                        </Text>
                      </TactilePressable>
                    );
                  })}
                </View>

              </>
            ) : null}

          </View>

          <View style={styles.bottomAction}>
            <PrimaryButton
              label={step === 4 ? 'SAVE & CONTINUE' : 'NEXT'}
              onPress={() => void next().catch(() => undefined)}
              disabled={step === 0 && !profile.displayName.trim()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  welcomeBackground: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  welcomeVideo: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.18 }],
  },
  welcomeOverlay: { flex: 1 },
  welcomeContent: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  welcomeBrand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  welcomeBrandMark: {
    width: 5,
    height: 24,
    backgroundColor: colors.text,
    transform: [{ skewX: '-14deg' }],
  },
  welcomeBrandText: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 17,
    lineHeight: textLineHeight(17),
    letterSpacing: 1.1,
  },
  welcomeBottom: { gap: 28 },
  welcomeKicker: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 12,
    lineHeight: textLineHeight(12),
    letterSpacing: 1.7,
  },
  welcomeTitle: {
    marginTop: 7,
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 60,
    lineHeight: textLineHeight(60),
    letterSpacing: 0.3,
  },
  welcomeCopy: {
    maxWidth: 320,
    marginTop: 8,
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 17,
    lineHeight: textLineHeight(17),
  },
  welcomeActions: { gap: 12 },
  welcomeAccountButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,240,239,0.48)',
    backgroundColor: 'rgba(19,19,19,0.38)',
  },
  welcomeAccountText: {
    color: colors.text,
    textAlign: 'center',
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 13,
    lineHeight: textLineHeight(13),
    letterSpacing: 0.8,
  },
  welcomeAccountAccent: { color: colors.peach },
  welcomeEnterGymButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  welcomeEnterGymText: {
    color: colors.text,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 14,
    lineHeight: textLineHeight(14),
    letterSpacing: 1.1,
  },
  screenContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 22,
  },
  headerRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerStart: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  backButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  kicker: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 12,
    lineHeight: textLineHeight(12),
    letterSpacing: 1.5,
  },
  stepLabel: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 11,
    lineHeight: textLineHeight(11),
    letterSpacing: 1.2,
  },
  title: {
    marginTop: 12,
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 42,
    lineHeight: 51,
    letterSpacing: 0.2,
  },
  progressRow: { marginTop: 7, flexDirection: 'row', gap: 6 },
  progressSegment: { flex: 1, height: 3, backgroundColor: colors.border },
  progressSegmentActive: { backgroundColor: colors.red },
  stepBody: { marginTop: 18, gap: 16 },
  leadCopy: {
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 16,
    lineHeight: textLineHeight(16),
  },
  nicknameInput: {
    height: 64,
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: Platform.OS === 'ios' ? 6 : 0,
    textAlignVertical: 'center',
    color: colors.text,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 22,
    lineHeight: textLineHeight(22),
    letterSpacing: 0.5,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  nicknameInputFocused: {
    borderWidth: 2,
    borderColor: colors.red,
  },
  nicknameInputValue: {
    fontFamily: 'ArchivoNarrow',
    fontSize: 20,
    lineHeight: textLineHeight(20),
    letterSpacing: 0,
  },
  sectionLabel: {
    marginTop: 5,
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 13,
    lineHeight: textLineHeight(13),
    letterSpacing: 1.3,
  },
  twoColumnGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  threeColumnGrid: { flexDirection: 'row', gap: 8 },
  choiceCard: {
    width: '48.8%',
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  choiceCardCompact: {
    flex: 1,
    width: 'auto',
    minWidth: 0,
    minHeight: 58,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceCardSelected: { borderWidth: 2, borderColor: colors.red, backgroundColor: '#211b1b' },
  choiceCopy: { flex: 1, minWidth: 0 },
  choiceTitle: {
    color: colors.textMuted,
    fontFamily: 'Anton',
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  choiceTitleSelected: { color: colors.peach },
  choiceSubtitle: {
    marginTop: 6,
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 15,
    lineHeight: textLineHeight(15),
  },
  dayGrid: { flexDirection: 'row', gap: 6 },
  dayButton: {
    flex: 1,
    minWidth: 0,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dayButtonSelected: { backgroundColor: colors.red, borderColor: colors.red },
  dayText: {
    color: colors.textMuted,
    fontFamily: 'Anton',
    fontSize: 15,
    lineHeight: 20,
  },
  dayTextSelected: { color: colors.text },
  durationGrid: { flexDirection: 'row', gap: 7 },
  durationCard: {
    flex: 1,
    minWidth: 0,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  durationCardSelected: { borderWidth: 2, borderColor: colors.red },
  durationValue: { color: colors.text, fontFamily: 'Anton', fontSize: 23, lineHeight: 29 },
  durationValueSelected: { color: colors.red },
  durationUnit: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1,
  },
  durationUnitSelected: { color: colors.peach },
  bottomAction: { flex: 1, minHeight: 82, justifyContent: 'flex-end', paddingTop: 24 },
  primaryButton: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red,
  },
  primaryButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  primaryButtonText: {
    color: colors.text,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 15,
    lineHeight: textLineHeight(15),
    letterSpacing: 1.1,
    transform: [{ translateY: -2 }],
  },
  whiteTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderLeftWidth: 11,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.text,
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.textMuted,
    textAlign: 'center',
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 14,
    lineHeight: textLineHeight(14),
    letterSpacing: 1,
  },
  recommendationContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 28,
  },
  recommendationHeader: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recommendationTitle: {
    marginTop: 24,
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 54,
    lineHeight: textLineHeight(54),
    letterSpacing: 0.2,
  },
  recommendationLead: {
    maxWidth: 360,
    marginTop: 10,
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 17,
    lineHeight: textLineHeight(17),
  },
  recommendationCard: {
    padding: 18,
    borderWidth: 1,
    borderColor: colors.red,
    backgroundColor: '#211b1b',
  },
  recommendationCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  recommendationModeIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red,
  },
  recommendationCardCopy: { flex: 1 },
  recommendationEyebrow: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 11,
    lineHeight: textLineHeight(11),
    letterSpacing: 1.4,
  },
  recommendationCardTitle: {
    marginTop: 3,
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 28,
    lineHeight: textLineHeight(28),
    letterSpacing: 0.4,
  },
  recommendationMetrics: {
    marginTop: 20,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  recommendationMetric: {
    flex: 1,
    minHeight: 86,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  recommendationMetricValue: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 31,
    lineHeight: textLineHeight(31),
  },
  recommendationMetricLabel: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 9,
    lineHeight: textLineHeight(9),
    letterSpacing: 1.2,
  },
  recommendationSummary: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recommendationSummaryText: {
    flex: 1,
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 14,
    lineHeight: textLineHeight(14),
  },
  recommendationActions: { gap: 10 },
  recommendationFootnote: {
    marginTop: 2,
    paddingHorizontal: 12,
    color: colors.textMuted,
    textAlign: 'center',
    fontFamily: 'ArchivoNarrow',
    fontSize: 13,
    lineHeight: textLineHeight(13),
  },
  disabled: { opacity: 0.48 },
  signupBackground: { flex: 1, backgroundColor: colors.background },
  signupOverlay: { flex: 1 },
  signupSafeArea: { flex: 1 },
  signupContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 38,
  },
  signupHeader: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 12 },
  signupTitle: {
    fontFamily: 'Anton',
    fontSize: 56,
    lineHeight: textLineHeight(56),
  },
  signupTitlePeach: { marginTop: 38, color: colors.peach },
  signupTitleRed: { color: colors.red },
  signupActions: { gap: 15 },
  providerButton: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
    backgroundColor: colors.text,
  },
  providerButtonDark: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  providerButtonText: {
    color: colors.background,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 15,
    lineHeight: textLineHeight(15),
    letterSpacing: 0.35,
  },
  providerButtonTextDark: { color: colors.text },
  signupFootnote: {
    color: colors.textMuted,
    textAlign: 'center',
    fontFamily: 'ArchivoNarrow',
    fontSize: 13,
    lineHeight: textLineHeight(13),
  },
  legalLinks: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  legalText: {
    color: '#8b8989',
    textAlign: 'center',
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 10,
    lineHeight: textLineHeight(10),
    letterSpacing: 0.7,
    textDecorationLine: 'underline',
  },
  legalDivider: {
    color: '#8b8989',
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 10,
    lineHeight: textLineHeight(10),
  },
  errorBanner: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.red,
    backgroundColor: '#211b1b',
  },
  errorText: {
    flex: 1,
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 14,
    lineHeight: textLineHeight(14),
  },
});
