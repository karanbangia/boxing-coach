import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenShell } from '../components/ScreenShell';
import { TactilePressable } from '../components/TactilePressable';
import {
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  SESSION_DURATIONS,
  STANCE_OPTIONS,
  TRAINING_DAYS,
  type FighterProfile,
  type HeightUnit,
  type SessionDuration,
  type TrainingDay,
  type WeightUnit,
} from '../features/profile/types';
import {
  MAX_HEIGHT_CM,
  MAX_HEIGHT_INCHES,
  MIN_HEIGHT_CM,
  MIN_HEIGHT_INCHES,
  centimetresToRoundedInches,
  formatFeetAndInches,
  formatFeetAndInchesAccessible,
  inchesToCentimetres,
} from '../features/profile/height';
import type { OnboardingRecord, ReminderPermission } from '../lib/onboarding';
import {
  cancelTrainingReminders,
  requestTrainingReminderPermission,
  scheduleTrainingReminders,
} from '../lib/trainingReminders';
import { useAuth } from '../providers/AuthProvider';
import { colors, textLineHeight } from '../theme';

const DATA_STEP_COUNT = 8;
const LAST_STEP = 8;
const MALE_BOXER_SOURCE = require('../../assets/onboarding/male-boxer.png');
const FEMALE_BOXER_SOURCE = require('../../assets/onboarding/female-boxer.png');
const GENDER_ART_SOURCES = [MALE_BOXER_SOURCE, FEMALE_BOXER_SOURCE];
type OnboardingView = 'welcome' | 'form' | 'account';
const DAY_LABELS: Record<TrainingDay, string> = {
  monday: 'MON',
  tuesday: 'TUE',
  wednesday: 'WED',
  thursday: 'THU',
  friday: 'FRI',
  saturday: 'SAT',
};

const TITLES = [
  "WHAT'S YOUR GENDER?",
  'WHAT SHOULD WE CALL YOU?',
  "WHAT'S YOUR FITNESS LEVEL?",
  "WHAT'S YOUR TRAINING GOAL?",
  "WHAT'S YOUR BOXING STANCE?",
  "WHAT'S YOUR ROUTINE",
  "WHAT'S YOUR WEIGHT?",
  "WHAT'S YOUR HEIGHT?",
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

function GenderCard({
  label,
  female,
  selected,
  onPress,
}: {
  label: string;
  female: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TactilePressable
      onPress={onPress}
      haptic="selection"
      pressedScale={0.98}
      style={[styles.genderCard, selected && styles.genderCardSelected]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      {selected ? (
        <View style={styles.genderCheck}>
          <Ionicons name="checkmark" size={13} color={colors.text} />
        </View>
      ) : null}
      <View style={styles.genderArt}>
        <Image
          source={female ? FEMALE_BOXER_SOURCE : MALE_BOXER_SOURCE}
          resizeMode="contain"
          style={styles.genderImage}
          accessibilityIgnoresInvertColors
        />
      </View>
      <Text style={[styles.genderLabel, selected && styles.choiceTitleSelected]} allowFontScaling={false}>
        {label}
      </Text>
    </TactilePressable>
  );
}

function InfoNote({ label, children, accent = false }: {
  label: string;
  children: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.infoNote, accent && styles.infoNoteAccent]}>
      <Text style={styles.infoNoteLabel} allowFontScaling={false}>{label}</Text>
      <Text style={styles.infoNoteText}>{children}</Text>
    </View>
  );
}

function UnitToggle<T extends string>({
  left,
  right,
  value,
  onChange,
}: {
  left: { label: string; value: T };
  right: { label: string; value: T };
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.unitToggle}>
      {[left, right].map(option => {
        const selected = value === option.value;
        return (
          <TactilePressable
            key={option.value}
            onPress={() => onChange(option.value)}
            haptic="selection"
            style={[styles.unitOption, selected && styles.unitOptionSelected]}
          >
            <Text style={[styles.unitOptionText, selected && styles.unitOptionTextSelected]} allowFontScaling={false}>
              {option.label}
            </Text>
          </TactilePressable>
        );
      })}
    </View>
  );
}

function Ruler({
  value,
  unit,
  min,
  max,
  onChange,
  onDragStateChange,
  formatValue = nextValue => String(nextValue),
  formatAccessibilityValue,
}: {
  value: number;
  unit: string;
  min: number;
  max: number;
  onChange: (value: number) => void;
  onDragStateChange: (dragging: boolean) => void;
  formatValue?: (value: number) => string;
  formatAccessibilityValue?: (value: number) => string;
}) {
  const valueRef = useRef(value);
  const minRef = useRef(min);
  const maxRef = useRef(max);
  const onChangeRef = useRef(onChange);
  const onDragStateChangeRef = useRef(onDragStateChange);
  const startValue = useRef(value);
  const lastDragValue = useRef(value);
  valueRef.current = value;
  minRef.current = min;
  maxRef.current = max;
  onChangeRef.current = onChange;
  onDragStateChangeRef.current = onDragStateChange;

  const responder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => (
        Math.abs(gesture.dx) > 2 && Math.abs(gesture.dx) > Math.abs(gesture.dy)
      ),
      onMoveShouldSetPanResponderCapture: (_, gesture) => (
        Math.abs(gesture.dx) > 2 && Math.abs(gesture.dx) > Math.abs(gesture.dy)
      ),
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        startValue.current = valueRef.current;
        lastDragValue.current = valueRef.current;
        onDragStateChangeRef.current(true);
      },
      onPanResponderMove: (_, gesture) => {
        const nextValue = Math.max(
          minRef.current,
          Math.min(
            maxRef.current,
            Math.round(startValue.current - gesture.dx / 6),
          ),
        );
        if (nextValue === lastDragValue.current) return;
        lastDragValue.current = nextValue;
        void Haptics.selectionAsync();
        onChangeRef.current(nextValue);
      },
      onPanResponderRelease: () => onDragStateChangeRef.current(false),
      onPanResponderTerminate: () => onDragStateChangeRef.current(false),
    }),
    [],
  );
  const labels = Array.from({ length: 7 }, (_, index) => (
    Math.max(min, Math.min(max, value + (index - 3) * 5))
  ));

  return (
    <View
      style={styles.ruler}
      {...responder.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityValue={{
        min,
        max,
        now: value,
        text: formatAccessibilityValue?.(value) ?? `${formatValue(value)} ${unit}`,
      }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={event => {
        const amount = event.nativeEvent.actionName === 'increment' ? 1 : -1;
        onChange(Math.max(min, Math.min(max, value + amount)));
      }}
    >
      <Text style={styles.rulerValue} allowFontScaling={false}>{formatValue(value)}</Text>
      <Text style={styles.rulerUnit} allowFontScaling={false}>{unit}</Text>
      <View style={styles.rulerLabels}>
        {labels.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.rulerLabel} allowFontScaling={false}>
            {formatValue(label)}
          </Text>
        ))}
      </View>
      <View style={styles.tickRow}>
        {Array.from({ length: 31 }, (_, index) => {
          const center = index === 15;
          const major = index % 5 === 0;
          return (
            <View
              key={index}
              style={[
                styles.tick,
                major && styles.tickMajor,
                center && styles.tickCenter,
              ]}
            />
          );
        })}
      </View>
      <Text style={styles.dragHint} allowFontScaling={false}>DRAG THE SCALE TO ADJUST</Text>
    </View>
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

  useEffect(() => {
    void Promise.all(
      GENDER_ART_SOURCES.map(source => (
        Image.prefetch(Image.resolveAssetSource(source).uri)
      )),
    ).catch(() => undefined);
  }, []);

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
  const {
    signInWithApple,
    signInWithGoogle,
    appleSignInEnabled,
    isBusy,
    errorMessage,
    clearError,
  } = useAuth();
  const [activeProvider, setActiveProvider] = useState<'apple' | 'google' | null>(null);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const insets = useSafeAreaInsets();

  const signIn = async (provider: 'apple' | 'google') => {
    if (activeProvider || isBusy) return;
    clearError();
    setActiveProvider(provider);
    try {
      const signedIn = provider === 'apple'
        ? await signInWithApple()
        : await signInWithGoogle();
      if (signedIn && !existingAccount) {
        await onComplete(record, { cloudSyncPending: true });
      }
    } finally {
      setActiveProvider(null);
    }
  };

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
              ? 'Pick the provider connected to your account to recover your profile and training.'
              : 'Protect your profile, sync your progress, and recover everything after reinstalling.'}
          </Text>
        </View>

        <View style={styles.signupActions}>
          {errorMessage ? (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Ionicons name="alert-circle-outline" size={20} color={colors.peach} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}
          {Platform.OS === 'ios' ? (
            <TactilePressable
              onPress={() => void signIn('apple')}
              disabled={isBusy || Boolean(activeProvider) || !appleSignInEnabled}
              haptic="medium"
              style={[styles.providerButton, (!appleSignInEnabled || isBusy) && styles.disabled]}
            >
              {activeProvider === 'apple' ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={22} color={colors.background} />
                  <Text style={styles.providerButtonText} allowFontScaling={false}>CONTINUE WITH APPLE</Text>
                </>
              )}
            </TactilePressable>
          ) : null}
          <TactilePressable
            onPress={() => void signIn('google')}
            disabled={isBusy || Boolean(activeProvider)}
            haptic="medium"
            style={[styles.providerButton, styles.providerButtonDark, isBusy && styles.disabled]}
          >
            {activeProvider === 'google' ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <Ionicons name="logo-google" size={21} color={colors.text} />
                <Text style={[styles.providerButtonText, styles.providerButtonTextDark]} allowFontScaling={false}>
                  CONTINUE WITH GOOGLE
                </Text>
              </>
            )}
          </TactilePressable>
          <SecondaryButton
            label="CONTINUE AS GUEST"
            onPress={() => {
              if (existingAccount) onContinueAsGuest?.();
              else void onComplete(record);
            }}
            disabled={isBusy || Boolean(activeProvider)}
          />
          <Text style={styles.signupFootnote}>
            {existingAccount
              ? 'Use the same provider you chose when creating your account.'
              : `Sign in to sync across devices.\nContinue as guest to keep answers on this device.`}
          </Text>
          <Text style={styles.legalText} allowFontScaling={false}>TERMS OF SERVICE  ·  PRIVACY POLICY</Text>
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
      onLoad={() => setBackgroundLoaded(true)}
    >
      <LinearGradient
        colors={['rgba(5,0,0,0.38)', 'rgba(5,0,0,0.67)', 'rgba(5,0,0,0.96)']}
        locations={[0, 0.43, 1]}
        style={[styles.signupOverlay, !backgroundLoaded && styles.backgroundContentHidden]}
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

export function OnboardingScreen({ initialRecord, onProgress, onComplete }: Props) {
  const [record, setRecord] = useState(initialRecord);
  const [view, setView] = useState<OnboardingView>(
    initialRecord.step === 0 ? 'welcome' : 'form',
  );
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [nicknameFocused, setNicknameFocused] = useState(false);
  const [rulerDragging, setRulerDragging] = useState(false);
  const step = record.step;
  const profile = record.profile;

  const updateProfile = (changes: Partial<FighterProfile>) => {
    setRecord(current => copyRecord(current, { profile: { ...current.profile, ...changes } }));
  };

  const goBack = () => {
    if (view === 'account' || step <= 0) {
      setView('welcome');
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
    let nextRecord = record;
    if (step === 5) {
      setPermissionBusy(true);
      try {
        let reminderPermission = record.reminderPermission;
        if (profile.trainingDays.length && reminderPermission === 'not_requested') {
          reminderPermission = await requestTrainingReminderPermission();
          nextRecord = copyRecord(nextRecord, { reminderPermission });
        }
        if (profile.trainingDays.length && reminderPermission === 'granted') {
          await scheduleTrainingReminders(
            profile.trainingDays,
            profile.preferredSessionMinutes,
          ).catch(() => undefined);
        } else if (!profile.trainingDays.length) {
          await cancelTrainingReminders().catch(() => undefined);
        }
      } finally {
        setPermissionBusy(false);
      }
    }

    nextRecord = copyRecord(nextRecord, { step: Math.min(LAST_STEP, step + 1) });
    setRecord(nextRecord);
    await onProgress(nextRecord);
  };

  const toggleDay = (day: TrainingDay) => {
    const selected = profile.trainingDays.includes(day);
    const trainingDays = selected
      ? profile.trainingDays.filter(item => item !== day)
      : TRAINING_DAYS.filter(item => item === day || profile.trainingDays.includes(item));
    updateProfile({ trainingDays, targetDaysPerWeek: trainingDays.length });
  };

  if (view === 'welcome') {
    return (
      <WelcomeScreen
        onGetStarted={() => setView('form')}
        onExistingAccount={() => setView('account')}
        onEnterGym={() => void onComplete(record, { skipped: true })}
      />
    );
  }

  if (view === 'account') {
    return (
      <SignupStep
        record={record}
        onBack={goBack}
        onComplete={onComplete}
        existingAccount
        onContinueAsGuest={() => setView('form')}
      />
    );
  }

  if (step === LAST_STEP) {
    return <SignupStep record={record} onBack={goBack} onComplete={onComplete} />;
  }

  const weightValue = profile.weightUnit === 'kg'
    ? Math.round(profile.weightKg)
    : Math.round(profile.weightKg * 2.2046226218);
  const heightValue = profile.heightUnit === 'cm'
    ? Math.round(profile.heightCm)
    : centimetresToRoundedInches(profile.heightCm);
  const routineSummary = profile.trainingDays.length
    ? `${profile.trainingDays.map(day => DAY_LABELS[day]).join(' · ')}  /  ${profile.preferredSessionMinutes} MIN`
    : `NO REMINDER DAYS  /  ${profile.preferredSessionMinutes} MIN`;

  return (
    <ScreenShell>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.screenContent}
          directionalLockEnabled
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!rulerDragging}
          showsVerticalScrollIndicator={false}
        >
          <Header
            step={step}
            onBack={goBack}
          />

          <View style={styles.stepBody}>
            {step === 0 ? (
              <>
                <SectionLabel>SELECT ONE</SectionLabel>
                <View style={styles.genderGrid}>
                  <GenderCard
                    label="MALE"
                    female={false}
                    selected={profile.gender === 'male'}
                    onPress={() => updateProfile({ gender: 'male' })}
                  />
                  <GenderCard
                    label="FEMALE"
                    female
                    selected={profile.gender === 'female'}
                    onPress={() => updateProfile({ gender: 'female' })}
                  />
                </View>
              </>
            ) : null}

            {step === 1 ? (
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

            {step === 2 ? (
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

            {step === 3 ? (
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

            {step === 4 ? (
              <>
                {/*<SectionLabel>STANCE</SectionLabel>*/}
                <Text style={styles.leadCopy}>We will tailor stance cues and footwork to you. Choose Not Sure if you are still learning.</Text>
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

            {step === 5 ? (
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

            {step === 6 ? (
              <>
                <Text style={styles.leadCopy}>
                  Choose kilograms or pounds, then drag the ruler. This can be changed any time in your profile.
                </Text>
                <SectionLabel>UNIT</SectionLabel>
                <UnitToggle<WeightUnit>
                  left={{ label: 'KG', value: 'kg' }}
                  right={{ label: 'LBS', value: 'lb' }}
                  value={profile.weightUnit}
                  onChange={weightUnit => updateProfile({ weightUnit })}
                />
                <Ruler
                  value={weightValue}
                  unit={profile.weightUnit.toUpperCase()}
                  min={profile.weightUnit === 'kg' ? 35 : 77}
                  max={profile.weightUnit === 'kg' ? 200 : 440}
                  onChange={value => updateProfile({
                    weightKg: profile.weightUnit === 'kg' ? value : value / 2.2046226218,
                  })}
                  onDragStateChange={setRulerDragging}
                />
              </>
            ) : null}

            {step === 7 ? (
              <>
                <Text style={styles.leadCopy}>
                  Choose centimetres or feet and inches, then drag the ruler. This can be changed any time in your profile.
                </Text>
                <SectionLabel>UNIT</SectionLabel>
                <UnitToggle<HeightUnit>
                  left={{ label: 'CM', value: 'cm' }}
                  right={{ label: 'FT + IN', value: 'in' }}
                  value={profile.heightUnit}
                  onChange={heightUnit => updateProfile({ heightUnit })}
                />
                <Ruler
                  value={heightValue}
                  unit={profile.heightUnit === 'cm' ? 'CM' : 'FT + IN'}
                  min={profile.heightUnit === 'cm' ? MIN_HEIGHT_CM : MIN_HEIGHT_INCHES}
                  max={profile.heightUnit === 'cm' ? MAX_HEIGHT_CM : MAX_HEIGHT_INCHES}
                  formatValue={profile.heightUnit === 'cm' ? undefined : formatFeetAndInches}
                  formatAccessibilityValue={
                    profile.heightUnit === 'cm'
                      ? undefined
                      : formatFeetAndInchesAccessible
                  }
                  onChange={value => updateProfile({
                    heightCm: profile.heightUnit === 'cm'
                      ? value
                      : inchesToCentimetres(value),
                  })}
                  onDragStateChange={setRulerDragging}
                />
              </>
            ) : null}
          </View>

          <View style={styles.bottomAction}>
            <PrimaryButton
              label={step === 7 ? 'SAVE & CONTINUE' : 'NEXT'}
              onPress={() => void next().catch(() => undefined)}
              loading={permissionBusy}
              disabled={step === 1 && !profile.displayName.trim()}
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
  genderGrid: { flexDirection: 'row', gap: 8 },
  genderCard: {
    flex: 1,
    minWidth: 0,
    height: 232,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
  },
  genderCardSelected: {
    borderWidth: 2,
    borderColor: colors.red,
    backgroundColor: colors.transparent,
  },
  genderCheck: {
    position: 'absolute',
    zIndex: 2,
    top: 12,
    right: 12,
    width: 19,
    height: 19,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.red,
  },
  genderArt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingTop: 10,
  },
  genderImage: { width: '100%', height: '100%' },
  genderLabel: {
    paddingVertical: 10,
    color: colors.text,
    textAlign: 'center',
    fontFamily: 'Anton',
    fontSize: 23,
    lineHeight: textLineHeight(23),
    letterSpacing: 0.5,
  },
  infoNote: {
    minHeight: 72,
    paddingHorizontal: 17,
    paddingVertical: 12,
    justifyContent: 'center',
    backgroundColor: '#221e1d',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  infoNoteAccent: { backgroundColor: '#211b1b', borderColor: colors.red },
  infoNoteLabel: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 11,
    lineHeight: textLineHeight(11),
    letterSpacing: 1,
  },
  infoNoteText: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 14,
    lineHeight: textLineHeight(14),
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
  unitToggle: {
    height: 56,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  unitOption: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  unitOptionSelected: { backgroundColor: colors.red },
  unitOptionText: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 17,
    lineHeight: textLineHeight(17),
    letterSpacing: 1.1,
  },
  unitOptionTextSelected: { color: colors.text },
  ruler: {
    minHeight: 250,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rulerValue: {
    color: colors.red,
    fontFamily: 'Anton',
    fontSize: 68,
    lineHeight: textLineHeight(68),
  },
  rulerUnit: {
    marginTop: -7,
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 12,
    lineHeight: textLineHeight(12),
    letterSpacing: 1.2,
  },
  rulerLabels: { width: '100%', marginTop: 18, flexDirection: 'row', justifyContent: 'space-between' },
  rulerLabel: { color: colors.textMuted, fontFamily: 'ArchivoNarrow', fontSize: 13 },
  tickRow: {
    width: '100%',
    height: 40,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tick: { width: 1, height: 13, backgroundColor: '#696666' },
  tickMajor: { height: 25, backgroundColor: colors.text },
  tickCenter: { width: 3, height: 38, backgroundColor: colors.red },
  dragHint: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 10,
    lineHeight: textLineHeight(10),
    letterSpacing: 1.1,
  },
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
  disabled: { opacity: 0.48 },
  signupBackground: { flex: 1, backgroundColor: colors.background },
  signupOverlay: { flex: 1 },
  backgroundContentHidden: { opacity: 0 },
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
  legalText: {
    marginTop: 4,
    color: '#8b8989',
    textAlign: 'center',
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 10,
    lineHeight: textLineHeight(10),
    letterSpacing: 0.7,
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
