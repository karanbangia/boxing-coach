import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenShell } from '../components/ScreenShell';
import { SkeletonBlock } from '../components/SkeletonBlock';
import { TactilePressable } from '../components/TactilePressable';
import {
  DEFAULT_FIGHTER_PROFILE,
  EQUIPMENT_OPTIONS,
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  SESSION_DURATIONS,
  STANCE_OPTIONS,
  TRAINING_DAYS,
  optionLabel,
  type Equipment,
  type FighterProfile,
  type GenderIdentity,
  type HeightUnit,
  type TrainingDay,
  type WeightUnit,
} from '../features/profile/types';
import {
  MAX_HEIGHT_CM,
  MAX_HEIGHT_INCHES,
  MIN_HEIGHT_CM,
  MIN_HEIGHT_INCHES,
  clampHeightCm,
  clampHeightInches,
  centimetresToRoundedInches,
  formatFeetAndInches,
  inchesToCentimetres,
  splitFeetAndInches,
} from '../features/profile/height';
import { profilePhotoUploadsEnabled } from '../lib/firebase';
import type { WorkoutHistoryItem } from '../lib/workoutHistory';
import { useAuth } from '../providers/AuthProvider';
import { useWorkoutHistory } from '../providers/WorkoutHistoryProvider';
import { colors, textLineHeight } from '../theme';

type ProfileView = 'profile' | 'edit' | 'account' | 'signup';
type ConfirmAction = 'signout' | 'delete' | null;
type IoniconName = ComponentProps<typeof Ionicons>['name'];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
] as const;
const WEIGHT_UNIT_OPTIONS = [
  { value: 'kg', label: 'KG' },
  { value: 'lb', label: 'LB' },
] as const;
const HEIGHT_UNIT_OPTIONS = [
  { value: 'cm', label: 'CM' },
  { value: 'in', label: 'FT + IN' },
] as const;
const DAY_LABELS: Record<TrainingDay, string> = {
  monday: 'MON',
  tuesday: 'TUE',
  wednesday: 'WED',
  thursday: 'THU',
  friday: 'FRI',
  saturday: 'SAT',
};

function initials(name: string) {
  const value = name.trim();
  if (!value) return 'BC';
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function calculateStreak(history: WorkoutHistoryItem[]) {
  const days = new Set(
    history
      .map(item => new Date(item.completedAt))
      .filter(date => !Number.isNaN(date.getTime()))
      .map(dateKey),
  );
  if (!days.size) return 0;

  const cursor = new Date();
  if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function formatTrainingTime(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}M`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}H ${remainder}M` : `${hours}H`;
}

function formatWeight(profile: FighterProfile) {
  const value = profile.weightUnit === 'kg'
    ? profile.weightKg
    : profile.weightKg * 2.2046226218;
  return `${Math.round(value)} ${profile.weightUnit.toUpperCase()}`;
}

function formatHeight(profile: FighterProfile) {
  if (profile.heightUnit === 'cm') return `${Math.round(profile.heightCm)} CM`;
  return formatFeetAndInches(centimetresToRoundedInches(profile.heightCm));
}

function ScreenTitle({ first, accent }: { first: string; accent: string }) {
  return (
    <View style={styles.titleWrap}>
      <Text style={styles.pageTitle} allowFontScaling={false}>{first}</Text>
      <Text style={[styles.pageTitle, styles.pageTitleAccent]} allowFontScaling={false}>{accent}</Text>
    </View>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionLabel} allowFontScaling={false}>{children}</Text>;
}

function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: IoniconName;
}) {
  return (
    <TactilePressable
      onPress={onPress}
      disabled={disabled || loading}
      haptic="medium"
      pressedScale={0.985}
      style={[styles.primaryButton, (disabled || loading) && styles.buttonDisabled]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={20} color={colors.text} /> : null}
          <Text style={styles.primaryButtonText} allowFontScaling={false}>{label}</Text>
        </>
      )}
    </TactilePressable>
  );
}

function SecondaryButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TactilePressable
      onPress={onPress}
      disabled={disabled}
      haptic="light"
      style={[styles.secondaryButton, disabled && styles.buttonDisabled]}
    >
      <Text style={styles.secondaryButtonText} allowFontScaling={false}>{label}</Text>
    </TactilePressable>
  );
}

function ChoiceGrid<T extends string | number>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 3;
}) {
  return (
    <View style={styles.choiceGrid}>
      {options.map(option => {
        const selected = value === option.value;
        return (
          <TactilePressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            haptic="selection"
            pressedScale={0.98}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[
              styles.choiceCard,
              columns === 3 && styles.choiceCardThird,
              selected && styles.choiceCardSelected,
            ]}
          >
            <Text
              style={[styles.choiceText, selected && styles.choiceTextSelected]}
              allowFontScaling={false}
            >
              {option.label}
            </Text>
          </TactilePressable>
        );
      })}
    </View>
  );
}

function EquipmentGrid({
  value,
  onChange,
}: {
  value: Equipment[];
  onChange: (value: Equipment[]) => void;
}) {
  const toggle = (equipment: Equipment) => {
    if (equipment === 'shadowboxing') {
      onChange(value.includes(equipment) ? [] : ['shadowboxing']);
      return;
    }
    const withoutShadowboxing = value.filter(item => item !== 'shadowboxing');
    onChange(
      value.includes(equipment)
        ? withoutShadowboxing.filter(item => item !== equipment)
        : [...withoutShadowboxing, equipment],
    );
  };

  return (
    <View style={styles.choiceGrid}>
      {EQUIPMENT_OPTIONS.map(option => {
        const selected = value.includes(option.value);
        return (
          <TactilePressable
            key={option.value}
            onPress={() => toggle(option.value)}
            haptic="selection"
            pressedScale={0.98}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            style={[styles.choiceCard, selected && styles.choiceCardSelected]}
          >
            <View style={styles.checkRow}>
              <Text
                style={[
                  styles.choiceText,
                  styles.equipmentChoiceText,
                  selected && styles.choiceTextSelected,
                ]}
                allowFontScaling={false}
              >
                {option.label}
              </Text>
              <View style={styles.checkIconWrap}>
                <Ionicons
                  name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={selected ? colors.red : colors.textMuted}
                />
              </View>
            </View>
          </TactilePressable>
        );
      })}
    </View>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  if (!message) return null;
  return (
    <View style={styles.errorBanner} accessibilityRole="alert">
      <Ionicons name="alert-circle-outline" size={20} color={colors.peach} />
      <Text style={styles.errorText}>{message}</Text>
      <TactilePressable onPress={onDismiss} haptic="none" style={styles.errorClose}>
        <Ionicons name="close" size={18} color={colors.textMuted} />
      </TactilePressable>
    </View>
  );
}

function AuthScreen({
  onBack,
  onSignedIn,
}: {
  onBack?: () => void;
  onSignedIn?: () => Promise<void>;
}) {
  const {
    signInWithApple,
    signInWithGoogle,
    isBusy,
    errorMessage,
    clearError,
    appleSignInEnabled,
  } = useAuth();
  const [activeProvider, setActiveProvider] = useState<'apple' | 'google' | null>(null);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const insets = useSafeAreaInsets();
  const authenticationBusy = isBusy || activeProvider !== null;

  const authenticate = async (provider: 'apple' | 'google') => {
    if (authenticationBusy) return;
    setActiveProvider(provider);
    try {
      const signedIn = provider === 'apple'
        ? await signInWithApple()
        : await signInWithGoogle();
      if (signedIn) await onSignedIn?.();
    } finally {
      setActiveProvider(null);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/onboarding/save-training-glove.jpg')}
      resizeMode="cover"
      style={styles.authBackground}
      accessible={false}
      onLoad={() => setBackgroundLoaded(true)}
    >
      <LinearGradient
        colors={['rgba(5,0,0,0.52)', 'rgba(5,0,0,0.72)', 'rgba(5,0,0,0.96)']}
        locations={[0, 0.45, 1]}
        style={[styles.authOverlay, !backgroundLoaded && styles.backgroundContentHidden]}
      >
        <View
          style={[
            styles.authSafeArea,
            {
              paddingTop: insets.top,
              paddingRight: insets.right,
              paddingBottom: insets.bottom,
              paddingLeft: insets.left,
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={[styles.pageContent, styles.authContent]}
            showsVerticalScrollIndicator={false}
          >
            <View>
              {onBack ? (
                <TactilePressable
                  onPress={onBack}
                  haptic="light"
                  style={styles.backIconButton}
                  accessibilityLabel="Back to fighter profile"
                >
                  <Ionicons name="chevron-back" size={23} color={colors.text} />
                </TactilePressable>
              ) : null}
              <Text style={styles.kicker} allowFontScaling={false}>YOUR CORNER. EVERYWHERE.</Text>
              <ScreenTitle first="SAVE YOUR" accent="TRAINING" />
              <Text style={styles.leadCopy}>
                Protect your workout history, sync your progress, and get ready for premium coaching.
              </Text>
            </View>

            <View style={styles.authActions}>
              <ErrorBanner message={errorMessage} onDismiss={clearError} />
              {Platform.OS === 'ios' ? (
                <TactilePressable
                  onPress={() => void authenticate('apple')}
                  disabled={authenticationBusy || !appleSignInEnabled}
                  haptic="medium"
                  accessibilityState={{ disabled: authenticationBusy || !appleSignInEnabled }}
                  style={[
                    styles.providerButton,
                    (authenticationBusy || !appleSignInEnabled) && styles.buttonDisabled,
                  ]}
                >
                  {activeProvider === 'apple' ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <>
                      <Ionicons name="logo-apple" size={22} color={colors.background} />
                      <Text style={styles.providerButtonText}>
                        {appleSignInEnabled ? 'Continue with Apple' : 'Apple Sign-In unavailable'}
                      </Text>
                    </>
                  )}
                </TactilePressable>
              ) : null}
              {Platform.OS === 'ios' && !appleSignInEnabled ? (
                <Text style={styles.providerUnavailableCopy}>
                  Requires an Apple Developer Program build. Google Sign-In remains available for testing.
                </Text>
              ) : null}
              <TactilePressable
                onPress={() => void authenticate('google')}
                disabled={authenticationBusy}
                haptic="medium"
                style={[styles.providerButton, styles.providerButtonDark, authenticationBusy && styles.buttonDisabled]}
              >
                {activeProvider === 'google' ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={21} color={colors.text} />
                    <Text style={[styles.providerButtonText, styles.providerButtonTextDark]}>
                      Continue with Google
                    </Text>
                  </>
                )}
              </TactilePressable>
              <Text style={styles.legalCopy}>
                By continuing, you agree to the Terms of Service and acknowledge the Privacy Policy.
              </Text>
            </View>
          </ScrollView>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

function PhotoPicker({ profile, onChange }: { profile: FighterProfile; onChange: (uri: string) => void }) {
  const chooseFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.82,
    });
    if (!result.canceled && result.assets[0]?.uri) onChange(result.assets[0].uri);
  };

  const capturePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Camera access needed',
        'Allow camera access in Settings to capture your fighter photo.',
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.82,
    });
    if (!result.canceled && result.assets[0]?.uri) onChange(result.assets[0].uri);
  };

  const choosePhoto = () => {
    Alert.alert('Fighter photo', 'Choose a photo source.', [
      { text: 'Take Photo', onPress: () => void capturePhoto() },
      { text: 'Choose from Library', onPress: () => void chooseFromLibrary() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.photoRow}>
      <View style={styles.avatarLarge}>
        {profile.photoUrl ? (
          <Image source={{ uri: profile.photoUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarLargeText}>{initials(profile.displayName)}</Text>
        )}
      </View>
      <View style={styles.photoCopy}>
        <Text style={styles.photoTitle}>FIGHTER PHOTO</Text>
        <Text style={styles.photoHint}>
          {profilePhotoUploadsEnabled
            ? 'Optional. Choose a square photo.'
            : 'Photo uploads are not available yet.'}
        </Text>
        {profilePhotoUploadsEnabled ? (
          <TactilePressable onPress={choosePhoto} style={styles.photoButton}>
            <Ionicons name="camera-outline" size={17} color={colors.peach} />
            <Text style={styles.photoButtonText}>CHOOSE PHOTO</Text>
          </TactilePressable>
        ) : null}
      </View>
    </View>
  );
}

function StepHeader({ step, title }: { step: 1 | 2 | 3; title: string }) {
  return (
    <View>
      <View style={styles.stepTopline}>
        <Text style={styles.kicker}>FIGHTER SETUP</Text>
        <Text style={styles.stepCount}>STEP {step} OF 3</Text>
      </View>
      <Text style={styles.formTitle}>{title}</Text>
      <View style={styles.stepTrack}>
        {[1, 2, 3].map(item => (
          <View key={item} style={[styles.stepSegment, item <= step && styles.stepSegmentActive]} />
        ))}
      </View>
    </View>
  );
}

function IdentityFields({
  value,
  onChange,
}: {
  value: FighterProfile;
  onChange: (value: FighterProfile) => void;
}) {
  return (
    <>
      <PhotoPicker profile={value} onChange={photoUrl => onChange({ ...value, photoUrl })} />
      <View style={styles.fieldGroup}>
        <SectionLabel>Display name or boxing nickname</SectionLabel>
        <TextInput
          value={value.displayName}
          onChangeText={displayName => onChange({ ...value, displayName })}
          placeholder="e.g. Karan"
          placeholderTextColor="#787878"
          autoCapitalize="words"
          maxLength={32}
          style={styles.textInput}
          accessibilityLabel="Display name or boxing nickname"
        />
      </View>
      <View style={styles.fieldGroup}>
        <SectionLabel>Gender</SectionLabel>
        <ChoiceGrid<GenderIdentity>
          options={GENDER_OPTIONS}
          value={value.gender}
          onChange={gender => onChange({ ...value, gender })}
        />
      </View>
      <View style={styles.fieldGroup}>
        <SectionLabel>Experience</SectionLabel>
        <ChoiceGrid
          options={EXPERIENCE_OPTIONS}
          value={value.experience}
          onChange={experience => onChange({ ...value, experience })}
        />
      </View>
      <View style={styles.fieldGroup}>
        <SectionLabel>Stance</SectionLabel>
        <ChoiceGrid
          options={STANCE_OPTIONS}
          value={value.stance}
          onChange={stance => onChange({ ...value, stance })}
          columns={3}
        />
      </View>
    </>
  );
}

function TrainingFields({
  value,
  onChange,
}: {
  value: FighterProfile;
  onChange: (value: FighterProfile) => void;
}) {
  return (
    <>
      <View style={styles.fieldGroup}>
        <SectionLabel>Primary goal</SectionLabel>
        <ChoiceGrid
          options={GOAL_OPTIONS}
          value={value.goal}
          onChange={goal => onChange({ ...value, goal })}
        />
      </View>
      <View style={styles.fieldGroup}>
        <SectionLabel>Available equipment</SectionLabel>
        <Text style={styles.fieldHint}>Select everything you can train with.</Text>
        <EquipmentGrid
          value={value.equipment}
          onChange={equipment => onChange({ ...value, equipment })}
        />
      </View>
    </>
  );
}

function MeasurementField({
  label,
  value,
  unit,
  units,
  onUnitChange,
  onValueChange,
}: {
  label: string;
  value: number;
  unit: WeightUnit | HeightUnit;
  units: typeof WEIGHT_UNIT_OPTIONS | typeof HEIGHT_UNIT_OPTIONS;
  onUnitChange: (unit: WeightUnit | HeightUnit) => void;
  onValueChange: (value: number) => void;
}) {
  const [inputValue, setInputValue] = useState(() => String(Math.round(value)));

  useEffect(() => {
    setInputValue(String(Math.round(value)));
  }, [unit, value]);

  const commitValue = () => {
    const nextValue = Number(inputValue);
    if (Number.isFinite(nextValue) && nextValue > 0) {
      onValueChange(nextValue);
      return;
    }
    setInputValue(String(Math.round(value)));
  };

  return (
    <View style={styles.fieldGroup}>
      <SectionLabel>{label}</SectionLabel>
      <ChoiceGrid
        options={units}
        value={unit}
        onChange={onUnitChange}
      />
      <TextInput
        value={inputValue}
        onChangeText={text => {
          const numericText = text
            .replace(/[^0-9.]/g, '')
            .replace(/(\..*)\./g, '$1');
          setInputValue(numericText);
        }}
        onEndEditing={commitValue}
        keyboardType="decimal-pad"
        inputMode="decimal"
        selectTextOnFocus
        style={styles.textInput}
        accessibilityLabel={`${label} in ${unit}`}
      />
    </View>
  );
}

function HeightMeasurementField({
  valueCm,
  unit,
  onUnitChange,
  onValueChange,
}: {
  valueCm: number;
  unit: HeightUnit;
  onUnitChange: (unit: HeightUnit) => void;
  onValueChange: (valueCm: number) => void;
}) {
  const roundedInches = centimetresToRoundedInches(valueCm);
  const splitHeight = splitFeetAndInches(roundedInches);
  const [cmInput, setCmInput] = useState(() => String(Math.round(valueCm)));
  const [feetInput, setFeetInput] = useState(() => String(splitHeight.feet));
  const [inchesInput, setInchesInput] = useState(() => String(splitHeight.inches));

  useEffect(() => {
    const nextHeight = splitFeetAndInches(centimetresToRoundedInches(valueCm));
    setCmInput(String(Math.round(valueCm)));
    setFeetInput(String(nextHeight.feet));
    setInchesInput(String(nextHeight.inches));
  }, [unit, valueCm]);

  const commitCentimetres = () => {
    const nextValue = Number(cmInput);
    if (!Number.isFinite(nextValue)) {
      setCmInput(String(Math.round(valueCm)));
      return;
    }
    const clampedValue = clampHeightCm(nextValue);
    setCmInput(String(clampedValue));
    onValueChange(clampedValue);
  };

  const commitFeetAndInches = () => {
    const feet = Number(feetInput);
    const inches = Number(inchesInput);
    if (!Number.isFinite(feet) || !Number.isFinite(inches)) {
      const currentHeight = splitFeetAndInches(
        centimetresToRoundedInches(valueCm),
      );
      setFeetInput(String(currentHeight.feet));
      setInchesInput(String(currentHeight.inches));
      return;
    }
    const totalInches = clampHeightInches(feet * 12 + inches);
    const nextHeight = splitFeetAndInches(totalInches);
    setFeetInput(String(nextHeight.feet));
    setInchesInput(String(nextHeight.inches));
    onValueChange(inchesToCentimetres(totalInches));
  };

  return (
    <View style={styles.fieldGroup}>
      <SectionLabel>Height</SectionLabel>
      <ChoiceGrid
        options={HEIGHT_UNIT_OPTIONS}
        value={unit}
        onChange={onUnitChange}
      />
      {unit === 'cm' ? (
        <TextInput
          value={cmInput}
          onChangeText={text => setCmInput(text.replace(/[^0-9]/g, ''))}
          onEndEditing={commitCentimetres}
          keyboardType="number-pad"
          inputMode="numeric"
          selectTextOnFocus
          style={styles.textInput}
          accessibilityLabel="Height in centimetres"
        />
      ) : (
        <View style={styles.heightInputRow}>
          <View style={styles.heightInputGroup}>
            <TextInput
              value={feetInput}
              onChangeText={text => setFeetInput(text.replace(/[^0-9]/g, ''))}
              onEndEditing={commitFeetAndInches}
              keyboardType="number-pad"
              inputMode="numeric"
              selectTextOnFocus
              style={[styles.textInput, styles.heightTextInput]}
              accessibilityLabel="Height in feet"
            />
            <Text style={styles.heightInputUnit}>FT</Text>
          </View>
          <View style={styles.heightInputGroup}>
            <TextInput
              value={inchesInput}
              onChangeText={text => setInchesInput(text.replace(/[^0-9]/g, ''))}
              onEndEditing={commitFeetAndInches}
              keyboardType="number-pad"
              inputMode="numeric"
              selectTextOnFocus
              style={[styles.textInput, styles.heightTextInput]}
              accessibilityLabel="Remaining height in inches"
            />
            <Text style={styles.heightInputUnit}>IN</Text>
          </View>
        </View>
      )}
      <Text style={styles.fieldHint}>
        {unit === 'cm'
          ? `Allowed range: ${MIN_HEIGHT_CM}–${MAX_HEIGHT_CM} cm.`
          : `Allowed range: ${formatFeetAndInches(MIN_HEIGHT_INCHES)}–${formatFeetAndInches(MAX_HEIGHT_INCHES)}.`}
      </Text>
    </View>
  );
}

function RoutineFields({
  value,
  onChange,
}: {
  value: FighterProfile;
  onChange: (value: FighterProfile) => void;
}) {
  return (
    <>
      <View style={styles.fieldGroup}>
        <SectionLabel>Training days</SectionLabel>
        <View style={styles.dayGrid}>
          {TRAINING_DAYS.map(day => {
            const selected = value.trainingDays.includes(day);
            return (
              <TactilePressable
                key={day}
                onPress={() => {
                  const trainingDays = selected
                    ? value.trainingDays.filter(item => item !== day)
                    : TRAINING_DAYS.filter(
                      item => item === day || value.trainingDays.includes(item),
                    );
                  onChange({
                    ...value,
                    trainingDays,
                    targetDaysPerWeek: trainingDays.length,
                  });
                }}
                haptic="selection"
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                style={[styles.dayButton, selected && styles.dayButtonSelected]}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    styles.exactDayButtonText,
                    selected && styles.dayButtonTextSelected,
                  ]}
                >
                  {DAY_LABELS[day]}
                </Text>
              </TactilePressable>
            );
          })}
        </View>
      </View>
      <View style={styles.fieldGroup}>
        <SectionLabel>Preferred workout duration</SectionLabel>
        <View style={styles.durationGrid}>
          {SESSION_DURATIONS.map(duration => {
            const selected = duration === value.preferredSessionMinutes;
            return (
              <TactilePressable
                key={duration}
                onPress={() => onChange({ ...value, preferredSessionMinutes: duration })}
                haptic="selection"
                style={[styles.durationButton, selected && styles.durationButtonSelected]}
              >
                <Text style={[styles.durationValue, selected && styles.durationValueSelected]}>{duration}</Text>
                <Text style={[styles.durationUnit, selected && styles.durationUnitSelected]}>MIN</Text>
              </TactilePressable>
            );
          })}
        </View>
      </View>
      <MeasurementField
        label="Weight"
        value={value.weightUnit === 'kg' ? value.weightKg : value.weightKg * 2.2046226218}
        unit={value.weightUnit}
        units={WEIGHT_UNIT_OPTIONS}
        onUnitChange={unit => onChange({ ...value, weightUnit: unit as WeightUnit })}
        onValueChange={weight => onChange({
          ...value,
          weightKg: value.weightUnit === 'kg' ? weight : weight / 2.2046226218,
        })}
      />
      <HeightMeasurementField
        valueCm={value.heightCm}
        unit={value.heightUnit}
        onUnitChange={heightUnit => onChange({ ...value, heightUnit })}
        onValueChange={heightCm => onChange({
          ...value,
          heightCm,
        })}
      />
    </>
  );
}

function SetupSummary({ value }: { value: FighterProfile }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Ionicons name="shield-checkmark-outline" size={22} color={colors.red} />
        <Text style={styles.summaryTitle}>YOUR FIGHTER</Text>
      </View>
      <SummaryRow label="Name" value={value.displayName || 'Add your name'} />
      <SummaryRow label="Level" value={optionLabel(EXPERIENCE_OPTIONS, value.experience)} />
      <SummaryRow label="Goal" value={optionLabel(GOAL_OPTIONS, value.goal)} />
      <SummaryRow label="Routine" value={`${value.targetDaysPerWeek} days · ${value.preferredSessionMinutes} min`} />
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function FighterSetup({
  userName,
  userPhoto,
  onComplete,
}: {
  userName: string | null;
  userPhoto: string | null;
  onComplete: () => void;
}) {
  const {
    user,
    connectedProvider,
    saveProfile,
    isBusy,
    errorMessage,
    clearError,
  } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [draft, setDraft] = useState<FighterProfile>({
    ...DEFAULT_FIGHTER_PROFILE,
    displayName: userName ?? '',
    photoUrl: userPhoto,
  });

  const next = () => {
    if (step === 1 && !draft.displayName.trim()) return;
    setStep(current => Math.min(3, current + 1) as 1 | 2 | 3);
  };

  const enterGym = async () => {
    await saveProfile(draft);
    onComplete();
  };

  return (
    <ScreenShell>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
          <StepHeader
            step={step}
            title={step === 1 ? 'BUILD YOUR FIGHTER' : step === 2 ? 'YOUR TRAINING' : 'YOUR ROUTINE'}
          />
          <ErrorBanner message={errorMessage} onDismiss={clearError} />
          <View style={styles.sessionCard} accessibilityRole="text">
            <View style={styles.sessionIcon}>
              <Ionicons
                name={connectedProvider === 'apple' ? 'logo-apple' : 'logo-google'}
                size={20}
                color={colors.text}
              />
            </View>
            <View style={styles.sessionCopy}>
              <Text style={styles.sessionLabel} allowFontScaling={false}>
                SIGNED IN WITH {connectedProvider === 'apple' ? 'APPLE' : 'GOOGLE'}
              </Text>
              <Text style={styles.sessionValue} numberOfLines={1} allowFontScaling={false}>
                {user?.email ?? userName ?? 'Private account'}
              </Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={colors.green} />
          </View>

          {step === 1 ? <IdentityFields value={draft} onChange={setDraft} /> : null}
          {step === 2 ? <TrainingFields value={draft} onChange={setDraft} /> : null}
          {step === 3 ? (
            <>
              <RoutineFields value={draft} onChange={setDraft} />
              <SetupSummary value={draft} />
              <View style={styles.syncNote}>
                <Ionicons name="cloud-upload-outline" size={20} color={colors.peach} />
                <Text style={styles.syncNoteText}>
                  We’ll also save the workouts already on this device.
                </Text>
              </View>
            </>
          ) : null}

          <View style={styles.formActions}>
            {step === 3 ? (
              <PrimaryButton
                label="ENTER THE GYM"
                onPress={() => void enterGym().catch(() => undefined)}
                loading={isBusy}
                icon="arrow-forward"
              />
            ) : (
              <PrimaryButton
                label="NEXT"
                onPress={next}
                disabled={step === 1 && !draft.displayName.trim()}
                icon="arrow-forward"
              />
            )}
            {step > 1 ? (
              <SecondaryButton
                label="BACK"
                onPress={() => setStep(current => Math.max(1, current - 1) as 1 | 2 | 3)}
              />
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

function MetricCard({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel} allowFontScaling={false}>{label}</Text>
      <Text
        style={[styles.metricValue, accent && styles.metricValueAccent]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.64}
        allowFontScaling={false}
      >
        {value}
      </Text>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: IoniconName; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={20} color={colors.peach} />
      </View>
      <View style={styles.detailCopy}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function ProfileOverview({
  profile,
  isGuest,
  cloudSyncPending,
  onEdit,
  onAccount,
}: {
  profile: FighterProfile;
  isGuest: boolean;
  cloudSyncPending: boolean;
  onEdit: () => void;
  onAccount: () => void;
}) {
  const { syncStatus } = useAuth();
  const { history } = useWorkoutHistory();

  const metrics = useMemo(() => {
    const rounds = history.reduce((total, workout) => total + workout.totalRounds, 0);
    const seconds = history.reduce(
      (total, workout) => total + workout.totalRounds * workout.roundDuration,
      0,
    );
    return {
      rounds,
      workouts: history.length,
      streak: calculateStreak(history),
      time: formatTrainingTime(seconds),
    };
  }, [history]);

  const equipment = profile.equipment.length
    ? profile.equipment.map(item => optionLabel(EQUIPMENT_OPTIONS, item)).join(', ')
    : 'No equipment selected';
  const trainingDays = profile.trainingDays.length
    ? profile.trainingDays.map(day => DAY_LABELS[day]).join(' · ')
    : 'No reminder days';
  const displayName = profile.displayName.trim() || 'Guest Boxer';

  return (
    <ScreenShell>
      <ScrollView contentContainerStyle={styles.profileContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            {profile.photoUrl ? (
              <Image source={{ uri: profile.photoUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.profileAvatarText}>{initials(displayName)}</Text>
            )}
          </View>
          <View style={styles.profileHeaderCopy}>
            <Text style={styles.kicker}>FIGHTER PROFILE</Text>
            <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.profileMeta}>
              {optionLabel(EXPERIENCE_OPTIONS, profile.experience).toUpperCase()} · {optionLabel(STANCE_OPTIONS, profile.stance).toUpperCase()}
            </Text>
          </View>
          <TactilePressable onPress={onEdit} haptic="light" style={styles.editIconButton}>
            <Ionicons name="pencil" size={19} color={colors.text} />
          </TactilePressable>
        </View>

        <View style={styles.syncPill}>
          {!isGuest && (syncStatus === 'syncing' || cloudSyncPending) ? (
            <ActivityIndicator size="small" color={colors.peach} />
          ) : (
            <Ionicons
              name={isGuest
                ? 'phone-portrait-outline'
                : syncStatus === 'error'
                  ? 'cloud-offline-outline'
                  : 'cloud-done-outline'}
              size={17}
              color={syncStatus === 'error' ? colors.red : colors.peach}
            />
          )}
          <Text style={styles.syncPillText}>
            {isGuest
              ? 'SAVED ON THIS DEVICE'
              : syncStatus === 'syncing' || cloudSyncPending
              ? 'SAVING PROGRESS'
              : syncStatus === 'error'
                ? 'SYNC NEEDS ATTENTION'
                : 'PROGRESS SAVED'}
          </Text>
        </View>

        <View style={styles.metricGrid}>
          <MetricCard value={String(metrics.rounds)} label="TOTAL ROUNDS" />
          <MetricCard value={String(metrics.workouts)} label="WORKOUTS" />
          <MetricCard value={String(metrics.streak)} label="DAY STREAK" />
          <MetricCard value={metrics.time} label="TRAINING TIME" accent />
        </View>

        <View style={styles.profileSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.profileSectionTitle}>YOUR TRAINING</Text>
            <TactilePressable onPress={onEdit} haptic="none" style={styles.textAction}>
              <Text style={styles.textActionLabel}>EDIT</Text>
            </TactilePressable>
          </View>
          <View style={styles.detailCard}>
            <DetailRow icon="flag-outline" label="PRIMARY GOAL" value={optionLabel(GOAL_OPTIONS, profile.goal)} />
            <DetailRow icon="barbell-outline" label="EQUIPMENT" value={equipment} />
            <DetailRow icon="calendar-outline" label="TRAINING DAYS" value={trainingDays} />
            <DetailRow icon="timer-outline" label="SESSION LENGTH" value={`${profile.preferredSessionMinutes} minutes`} />
          </View>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.profileSectionTitle}>FIGHTER DETAILS</Text>
            <TactilePressable onPress={onEdit} haptic="none" style={styles.textAction}>
              <Text style={styles.textActionLabel}>EDIT</Text>
            </TactilePressable>
          </View>
          <View style={styles.detailCard}>
            <DetailRow icon="person-outline" label="GENDER" value={optionLabel(GENDER_OPTIONS, profile.gender)} />
            <DetailRow icon="fitness-outline" label="WEIGHT" value={formatWeight(profile)} />
            <DetailRow icon="resize-outline" label="HEIGHT" value={formatHeight(profile)} />
          </View>
        </View>

        <TactilePressable onPress={onAccount} haptic="light" style={styles.accountRow}>
          <View style={styles.accountIconBox}>
            <Ionicons name="person-circle-outline" size={25} color={colors.peach} />
          </View>
          <View style={styles.accountRowCopy}>
            <Text style={styles.accountRowTitle}>
              {isGuest ? 'SAVE & SYNC PROFILE' : 'ACCOUNT & DATA'}
            </Text>
            <Text style={styles.accountRowSubtitle}>
              {isGuest
                ? 'Sign up to protect this fighter profile'
                : 'Sign-in, sync, membership and privacy'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={21} color={colors.textMuted} />
        </TactilePressable>
      </ScrollView>
    </ScreenShell>
  );
}

function EditProfile({
  profile,
  onSave,
  onDone,
}: {
  profile: FighterProfile;
  onSave: (profile: FighterProfile) => Promise<void>;
  onDone: () => void;
}) {
  const { isBusy, errorMessage, clearError } = useAuth();
  const [draft, setDraft] = useState<FighterProfile>(profile);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(profile);

  const save = async () => {
    await onSave(draft);
    onDone();
  };

  return (
    <ScreenShell>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.formContent, styles.editFormContent]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.editHeader}>
            <TactilePressable onPress={onDone} haptic="light" style={styles.backIconButton}>
              <Ionicons name="chevron-back" size={23} color={colors.text} />
            </TactilePressable>
            <View style={styles.editHeaderCopy}>
              <Text style={styles.kicker}>FIGHTER PROFILE</Text>
              <Text style={styles.editTitle}>EDIT YOUR DETAILS</Text>
            </View>
          </View>
          <ErrorBanner message={errorMessage} onDismiss={clearError} />
          <IdentityFields value={draft} onChange={setDraft} />
          <TrainingFields value={draft} onChange={setDraft} />
          <RoutineFields value={draft} onChange={setDraft} />
        </ScrollView>
        <View style={styles.floatingSaveCta}>
          <TactilePressable
            accessibilityRole="button"
            accessibilityLabel="Save profile changes"
            accessibilityState={{ disabled: !hasChanges || isBusy, busy: isBusy }}
            onPress={() => void save().catch(() => undefined)}
            disabled={!hasChanges || isBusy}
            haptic="medium"
            pressedScale={0.98}
            style={styles.saveChangesButton}
          >
            {isBusy ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <Ionicons name="checkmark" size={27} color={colors.text} />
                <Text style={styles.saveChangesButtonText} allowFontScaling={false}>SAVE CHANGES</Text>
              </>
            )}
          </TactilePressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

function ConfirmSheet({
  action,
  onClose,
  onConfirm,
  loading,
  errorMessage,
  onDismissError,
  connectedProvider,
}: {
  action: ConfirmAction;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  errorMessage: string | null;
  onDismissError: () => void;
  connectedProvider: 'apple' | 'google' | null;
}) {
  if (!action) return null;
  const deleting = action === 'delete';
  return (
    <Modal
      transparent
      animationType="slide"
      visible
      onRequestClose={loading ? () => undefined : onClose}
    >
      <View style={styles.modalBackdrop}>
        <TactilePressable
          onPress={onClose}
          disabled={loading}
          haptic="none"
          style={styles.modalDismissArea}
        >
          <View />
        </TactilePressable>
        <View style={styles.confirmSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetIcon}>
            <Ionicons
              name={deleting ? 'trash-outline' : 'log-out-outline'}
              size={26}
              color={deleting ? colors.red : colors.peach}
            />
          </View>
          <Text style={styles.sheetTitle}>{deleting ? 'DELETE ACCOUNT?' : 'SIGN OUT?'}</Text>
          <Text style={styles.sheetCopy}>
            {deleting
              ? `This permanently removes your fighter profile and synced workouts from your account, then clears all Boxing Coach data from this device. ${connectedProvider === 'apple' ? 'Apple may ask you to confirm your identity' : 'Google confirmation is only shown if your saved session has expired'}. This cannot be undone.`
              : 'This clears your fighter profile, workout history, onboarding progress, and preferences from this device. Synced account data stays protected online.'}
          </Text>
          <ErrorBanner message={errorMessage} onDismiss={onDismissError} />
          <PrimaryButton
            label={deleting ? 'DELETE MY ACCOUNT' : 'SIGN OUT'}
            onPress={onConfirm}
            loading={loading}
            icon={deleting ? 'trash-outline' : 'log-out-outline'}
          />
          <SecondaryButton label="CANCEL" onPress={onClose} disabled={loading} />
        </View>
      </View>
    </Modal>
  );
}

function AccountData({ onBack }: { onBack: () => void }) {
  const {
    user,
    connectedProvider,
    syncStatus,
    signOut,
    deleteAccount,
    isBusy,
    errorMessage,
    clearError,
  } = useAuth();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const openConfirm = (action: Exclude<ConfirmAction, null>) => {
    clearError();
    setConfirmAction(action);
  };

  const closeConfirm = () => {
    if (isBusy) return;
    clearError();
    setConfirmAction(null);
  };

  const confirm = async () => {
    if (confirmAction === 'delete') await deleteAccount();
    else await signOut();
    setConfirmAction(null);
  };

  return (
    <ScreenShell>
      <ScrollView contentContainerStyle={styles.accountContent} showsVerticalScrollIndicator={false}>
        <View style={styles.editHeader}>
          <TactilePressable onPress={onBack} haptic="light" style={styles.backIconButton}>
            <Ionicons name="chevron-back" size={23} color={colors.text} />
          </TactilePressable>
          <View style={styles.editHeaderCopy}>
            <Text style={styles.kicker}>PROFILE</Text>
            <Text style={styles.editTitle}>ACCOUNT & DATA</Text>
          </View>
        </View>
        <ErrorBanner message={errorMessage} onDismiss={clearError} />

        <View style={styles.accountCard}>
          <DetailRow
            icon={connectedProvider === 'apple' ? 'logo-apple' : 'logo-google'}
            label="CONNECTED ACCOUNT"
            value={`${connectedProvider === 'apple' ? 'Apple' : 'Google'} · ${user?.email ?? 'Private email'}`}
          />
          <DetailRow
            icon={syncStatus === 'error' ? 'cloud-offline-outline' : 'cloud-done-outline'}
            label="SYNC STATUS"
            value={syncStatus === 'syncing' ? 'Saving progress' : syncStatus === 'error' ? 'Sync needs attention' : 'Progress saved'}
          />
          <DetailRow icon="diamond-outline" label="MEMBERSHIP" value="Free" />
        </View>

        <View style={styles.accountActionsSection}>
          <SectionLabel>Account actions</SectionLabel>
          <TactilePressable onPress={() => openConfirm('signout')} style={styles.accountAction}>
            <Ionicons name="log-out-outline" size={21} color={colors.text} />
            <Text style={styles.accountActionText}>SIGN OUT</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TactilePressable>
          <TactilePressable onPress={() => openConfirm('delete')} style={styles.accountAction}>
            <Ionicons name="trash-outline" size={21} color={colors.red} />
            <Text style={[styles.accountActionText, styles.dangerText]}>DELETE ACCOUNT</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TactilePressable>
        </View>
      </ScrollView>
      <ConfirmSheet
        action={confirmAction}
        onClose={closeConfirm}
        onConfirm={() => void confirm().catch(() => undefined)}
        loading={isBusy}
        errorMessage={errorMessage}
        onDismissError={clearError}
        connectedProvider={connectedProvider}
      />
    </ScreenShell>
  );
}

function ProfileSkeleton() {
  return (
    <ScreenShell>
      <ScrollView
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Loading fighter profile"
        contentContainerStyle={styles.profileContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.skeletonProfileHeader}>
          <SkeletonBlock style={styles.skeletonAvatar} />
          <View style={styles.skeletonHeaderCopy}>
            <SkeletonBlock style={styles.skeletonKicker} />
            <SkeletonBlock style={styles.skeletonName} />
            <SkeletonBlock style={styles.skeletonMeta} />
          </View>
          <SkeletonBlock style={styles.skeletonEditButton} />
        </View>

        <SkeletonBlock style={styles.skeletonSyncPill} />

        <View style={styles.metricGrid}>
          {[0, 1, 2, 3].map(item => (
            <View key={item} style={styles.metricCard}>
              <SkeletonBlock style={styles.skeletonMetricLabel} />
              <SkeletonBlock style={styles.skeletonMetricValue} />
            </View>
          ))}
        </View>

        <View style={styles.profileSection}>
          <SkeletonBlock style={styles.skeletonSectionTitle} />
          <View style={styles.detailCard}>
            {[0, 1, 2, 3].map(item => (
              <View key={item} style={styles.detailRow}>
                <SkeletonBlock style={styles.skeletonDetailIcon} />
                <View style={styles.detailCopy}>
                  <SkeletonBlock style={styles.skeletonDetailLabel} />
                  <SkeletonBlock style={styles.skeletonDetailValue} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

export function ProfileScreen({
  onEnterGym,
  fighterProfile,
  cloudSyncPending,
  onSaveFighterProfile,
  onPromoteGuestProfile,
}: {
  onEnterGym: () => void;
  fighterProfile: FighterProfile | null;
  cloudSyncPending: boolean;
  onSaveFighterProfile: (profile: FighterProfile) => Promise<void>;
  onPromoteGuestProfile: () => Promise<void>;
}) {
  const { user, isReady } = useAuth();
  const [view, setView] = useState<ProfileView>('profile');

  useEffect(() => {
    if (user && view === 'signup') setView('profile');
  }, [user, view]);

  if (!isReady) return <ProfileSkeleton />;

  if (view === 'signup' && !user) {
    return (
      <AuthScreen
        onBack={() => setView('profile')}
        onSignedIn={async () => {
          await onPromoteGuestProfile();
          setView('profile');
        }}
      />
    );
  }
  if (!fighterProfile && user) {
    return (
      <FighterSetup
        userName={user.displayName}
        userPhoto={user.photoURL}
        onComplete={onEnterGym}
      />
    );
  }
  if (!fighterProfile) return <ProfileSkeleton />;
  if (view === 'edit') {
    return (
      <EditProfile
        profile={fighterProfile}
        onSave={onSaveFighterProfile}
        onDone={() => setView('profile')}
      />
    );
  }
  if (view === 'account' && user) {
    return <AccountData onBack={() => setView('profile')} />;
  }
  return (
    <ProfileOverview
      profile={fighterProfile}
      isGuest={!user}
      cloudSyncPending={cloudSyncPending}
      onEdit={() => setView('edit')}
      onAccount={() => setView(user ? 'account' : 'signup')}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 34,
  },
  authContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: 40,
  },
  authBackground: { flex: 1, backgroundColor: colors.background },
  authOverlay: { flex: 1 },
  backgroundContentHidden: { opacity: 0 },
  authSafeArea: { flex: 1 },
  sessionCard: {
    minHeight: 66,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sessionIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  sessionCopy: {
    flex: 1,
    minWidth: 0,
  },
  sessionLabel: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 10,
    lineHeight: textLineHeight(10),
    letterSpacing: 1,
  },
  sessionValue: {
    marginTop: 2,
    color: colors.text,
    fontFamily: 'ArchivoNarrow',
    fontSize: 15,
    lineHeight: textLineHeight(15),
  },
  kicker: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 12,
    lineHeight: textLineHeight(12),
    letterSpacing: 1.7,
  },
  titleWrap: { marginTop: 18 },
  pageTitle: {
    color: colors.peach,
    fontFamily: 'Anton',
    fontSize: 58,
    lineHeight: textLineHeight(58),
    letterSpacing: 0,
  },
  pageTitleAccent: { color: colors.red, marginTop: 58 - textLineHeight(58) },
  leadCopy: {
    maxWidth: 330,
    marginTop: 22,
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 19,
    lineHeight: textLineHeight(19),
  },
  authActions: { gap: 12 },
  providerButton: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.text,
    borderWidth: 1,
    borderColor: colors.text,
  },
  providerButtonDark: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  providerButtonText: {
    color: colors.background,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 16,
    lineHeight: textLineHeight(16),
    letterSpacing: 0.4,
  },
  providerButtonTextDark: { color: colors.text },
  buttonDisabled: { opacity: 0.58 },
  providerUnavailableCopy: {
    marginTop: -4,
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 13,
    lineHeight: textLineHeight(13),
    textAlign: 'center',
  },
  legalCopy: {
    marginTop: 7,
    paddingHorizontal: 10,
    color: '#8b8989',
    fontFamily: 'ArchivoNarrow',
    fontSize: 13,
    lineHeight: textLineHeight(13),
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#663333',
    backgroundColor: '#281818',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    flex: 1,
    color: colors.text,
    fontFamily: 'ArchivoNarrow',
    fontSize: 15,
    lineHeight: textLineHeight(15),
  },
  errorClose: { padding: 5 },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 44,
    gap: 24,
  },
  editFormContent: { paddingBottom: 137 },
  stepTopline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepCount: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 11,
    lineHeight: textLineHeight(11),
    letterSpacing: 1.3,
  },
  formTitle: {
    marginTop: 9,
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 43,
    lineHeight: textLineHeight(43),
  },
  stepTrack: { flexDirection: 'row', gap: 6, marginTop: 15 },
  stepSegment: { flex: 1, height: 3, backgroundColor: colors.border },
  stepSegmentActive: { backgroundColor: colors.red },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  avatarLarge: {
    width: 78,
    height: 78,
    borderRadius: 39,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarLargeText: { color: colors.background, fontFamily: 'Anton', fontSize: 29, lineHeight: textLineHeight(29) },
  photoCopy: { flex: 1 },
  photoTitle: { color: colors.text, fontFamily: 'BarlowSemiCondensedSemiBold', fontSize: 14, lineHeight: textLineHeight(14), letterSpacing: 1 },
  photoHint: { marginTop: 3, color: colors.textMuted, fontFamily: 'ArchivoNarrow', fontSize: 14, lineHeight: textLineHeight(14) },
  photoButton: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start' },
  photoButtonText: { color: colors.peach, fontFamily: 'BarlowSemiCondensedSemiBold', fontSize: 12, lineHeight: textLineHeight(12), letterSpacing: 0.9 },
  fieldGroup: { gap: 10 },
  sectionLabel: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 13,
    lineHeight: textLineHeight(13),
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  fieldHint: { marginTop: -5, color: colors.textMuted, fontFamily: 'ArchivoNarrow', fontSize: 14, lineHeight: textLineHeight(14) },
  textInput: {
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: 'ArchivoNarrow',
    fontSize: 19,
    lineHeight: textLineHeight(19),
  },
  heightInputRow: { flexDirection: 'row', gap: 8 },
  heightInputGroup: { flex: 1, position: 'relative', justifyContent: 'center' },
  heightTextInput: { paddingRight: 48 },
  heightInputUnit: {
    position: 'absolute',
    right: 16,
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 13,
    lineHeight: textLineHeight(13),
    letterSpacing: 1,
  },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  choiceCardThird: { flexBasis: '30%', paddingHorizontal: 9 },
  choiceCardSelected: { borderColor: colors.red, borderWidth: 2, backgroundColor: '#211b1b' },
  choiceText: { color: colors.text, fontFamily: 'BarlowSemiCondensedSemiBold', fontSize: 14, lineHeight: textLineHeight(14) },
  equipmentChoiceText: { flex: 1, minWidth: 0 },
  choiceTextSelected: { color: colors.peach },
  checkRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkIconWrap: { width: 18, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  dayGrid: { flexDirection: 'row', gap: 6 },
  dayButton: {
    flex: 1,
    aspectRatio: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dayButtonSelected: { backgroundColor: colors.red, borderColor: colors.red },
  dayButtonText: { color: colors.textMuted, fontFamily: 'Anton', fontSize: 19, lineHeight: textLineHeight(19) },
  exactDayButtonText: { fontSize: 13, lineHeight: textLineHeight(13) },
  dayButtonTextSelected: { color: colors.text },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  durationButton: {
    flexGrow: 1,
    flexBasis: '17%',
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  durationButtonSelected: { borderColor: colors.red, borderWidth: 2 },
  durationValue: { color: colors.text, fontFamily: 'Anton', fontSize: 22, lineHeight: textLineHeight(22) },
  durationValueSelected: { color: colors.red },
  durationUnit: { color: colors.textMuted, fontFamily: 'BarlowSemiCondensedSemiBold', fontSize: 9, lineHeight: textLineHeight(9), letterSpacing: 1 },
  durationUnitSelected: { color: colors.peach },
  summaryCard: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  summaryTitle: { color: colors.text, fontFamily: 'Anton', fontSize: 21, lineHeight: textLineHeight(21), letterSpacing: 0.6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 20, paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.border },
  summaryLabel: { color: colors.textMuted, fontFamily: 'ArchivoNarrow', fontSize: 15, lineHeight: textLineHeight(15) },
  summaryValue: { flex: 1, color: colors.text, fontFamily: 'BarlowSemiCondensedSemiBold', fontSize: 14, lineHeight: textLineHeight(14), textAlign: 'right' },
  syncNote: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: '#221e1d' },
  syncNoteText: { flex: 1, color: colors.textMuted, fontFamily: 'ArchivoNarrow', fontSize: 15, lineHeight: textLineHeight(15) },
  formActions: { gap: 10, marginTop: 2 },
  floatingSaveCta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 117,
    paddingHorizontal: 16,
    paddingTop: 17,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  saveChangesButton: { minHeight: 84, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.accent, shadowColor: colors.accent, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  saveChangesButtonText: { color: colors.text, fontFamily: 'Anton', fontSize: 30, lineHeight: textLineHeight(30), letterSpacing: 0, textTransform: 'uppercase' },
  primaryButton: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.red },
  primaryButtonText: { color: colors.text, fontFamily: 'BarlowSemiCondensedSemiBold', fontSize: 15, lineHeight: textLineHeight(15), letterSpacing: 1.2 },
  secondaryButton: { height: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { color: colors.textMuted, fontFamily: 'BarlowSemiCondensedSemiBold', fontSize: 14, lineHeight: textLineHeight(14), letterSpacing: 1.1 },
  profileContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 42, gap: 22 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileAvatar: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.text },
  profileAvatarText: { color: colors.background, fontFamily: 'Anton', fontSize: 27, lineHeight: textLineHeight(27) },
  profileHeaderCopy: { flex: 1 },
  profileName: { marginTop: 4, color: colors.text, fontFamily: 'Anton', fontSize: 32, lineHeight: textLineHeight(32) },
  profileMeta: { marginTop: 3, color: colors.textMuted, fontFamily: 'BarlowSemiCondensedSemiBold', fontSize: 11, lineHeight: textLineHeight(11), letterSpacing: 1.2 },
  editIconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  syncPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  syncPillText: { color: colors.textMuted, fontFamily: 'BarlowSemiCondensedSemiBold', fontSize: 10, lineHeight: textLineHeight(10), letterSpacing: 1.1 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricCard: { flexBasis: '47%', flexGrow: 1, minHeight: 116, padding: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'space-between' },
  metricLabel: { color: colors.peach, fontFamily: 'BarlowSemiCondensedSemiBold', fontSize: 14, lineHeight: textLineHeight(14), letterSpacing: 1.1 },
  metricValue: { color: colors.text, fontFamily: 'Anton', fontSize: 48, lineHeight: textLineHeight(48) },
  metricValueAccent: { color: colors.red },
  profileSection: { gap: 10 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profileSectionTitle: { color: colors.text, fontFamily: 'Anton', fontSize: 32, lineHeight: textLineHeight(32), letterSpacing: 0.4 },
  textAction: { paddingHorizontal: 8, paddingVertical: 6 },
  textActionLabel: { color: colors.peach, fontFamily: 'BarlowSemiCondensedSemiBold', fontSize: 12, lineHeight: textLineHeight(12), letterSpacing: 1.1 },
  detailCard: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 72, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
  detailCopy: { flex: 1 },
  detailLabel: { color: colors.textMuted, fontFamily: 'BarlowSemiCondensedSemiBold', fontSize: 10, lineHeight: textLineHeight(10), letterSpacing: 1.1 },
  detailValue: { marginTop: 3, color: colors.text, fontFamily: 'ArchivoNarrow', fontSize: 17, lineHeight: textLineHeight(17) },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 76, padding: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  accountIconBox: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
  accountRowCopy: { flex: 1 },
  accountRowTitle: { color: colors.text, fontFamily: 'BarlowSemiCondensedSemiBold', fontSize: 14, lineHeight: textLineHeight(14), letterSpacing: 0.9 },
  accountRowSubtitle: { marginTop: 3, color: colors.textMuted, fontFamily: 'ArchivoNarrow', fontSize: 14, lineHeight: textLineHeight(14) },
  editHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backIconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  editHeaderCopy: { flex: 1 },
  editTitle: { marginTop: 3, color: colors.text, fontFamily: 'Anton', fontSize: 31, lineHeight: textLineHeight(31) },
  accountContent: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 44, gap: 24 },
  accountCard: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  accountActionsSection: { gap: 10 },
  accountAction: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  accountActionText: { flex: 1, color: colors.text, fontFamily: 'BarlowSemiCondensedSemiBold', fontSize: 13, lineHeight: textLineHeight(13), letterSpacing: 1 },
  dangerText: { color: colors.red },
  skeletonProfileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  skeletonAvatar: { width: 72, height: 72, borderRadius: 36 },
  skeletonHeaderCopy: { flex: 1, gap: 8 },
  skeletonKicker: { width: 98, height: 10 },
  skeletonName: { width: '82%', height: 32 },
  skeletonMeta: { width: '58%', height: 10 },
  skeletonEditButton: { width: 42, height: 42 },
  skeletonSyncPill: { width: 132, height: 32 },
  skeletonMetricLabel: { width: '64%', height: 12 },
  skeletonMetricValue: { width: '56%', height: 48 },
  skeletonSectionTitle: { width: 154, height: 34 },
  skeletonDetailIcon: { width: 36, height: 36 },
  skeletonDetailLabel: { width: '44%', height: 9 },
  skeletonDetailValue: { width: '72%', height: 17, marginTop: 7 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  modalDismissArea: { flex: 1 },
  confirmSheet: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30, backgroundColor: '#171717', borderTopWidth: 1, borderTopColor: colors.border, gap: 12 },
  sheetHandle: { width: 42, height: 4, alignSelf: 'center', borderRadius: 2, backgroundColor: '#5a5a5a', marginBottom: 7 },
  sheetIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
  sheetTitle: { color: colors.text, fontFamily: 'Anton', fontSize: 31, lineHeight: textLineHeight(31) },
  sheetCopy: { marginBottom: 5, color: colors.textMuted, fontFamily: 'ArchivoNarrow', fontSize: 17, lineHeight: textLineHeight(17) },
});
