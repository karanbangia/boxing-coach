import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  optionLabel,
  type Equipment,
  type FighterProfile,
} from '../features/profile/types';
import { profilePhotoUploadsEnabled } from '../lib/firebase';
import { loadWorkoutHistoryForScope, type WorkoutHistoryItem } from '../lib/workoutHistory';
import { useAuth } from '../providers/AuthProvider';
import { colors, textLineHeight } from '../theme';

type ProfileView = 'profile' | 'edit' | 'account';
type ConfirmAction = 'signout' | 'delete' | null;
type IoniconName = ComponentProps<typeof Ionicons>['name'];

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

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TactilePressable onPress={onPress} haptic="light" style={styles.secondaryButton}>
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
                style={[styles.choiceText, selected && styles.choiceTextSelected]}
                allowFontScaling={false}
              >
                {option.label}
              </Text>
              <Ionicons
                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={selected ? colors.red : colors.textMuted}
              />
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

function AuthScreen() {
  const {
    signInWithApple,
    signInWithGoogle,
    isBusy,
    errorMessage,
    clearError,
  } = useAuth();
  const [activeProvider, setActiveProvider] = useState<'apple' | 'google' | null>(null);
  const authenticationBusy = isBusy || activeProvider !== null;

  const authenticate = async (provider: 'apple' | 'google') => {
    if (authenticationBusy) return;
    setActiveProvider(provider);
    try {
      if (provider === 'apple') await signInWithApple();
      else await signInWithGoogle();
    } finally {
      setActiveProvider(null);
    }
  };

  return (
    <ScreenShell>
      <ScrollView
        contentContainerStyle={[styles.pageContent, styles.authContent]}
        showsVerticalScrollIndicator={false}
      >
        <View>
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
              disabled={authenticationBusy}
              haptic="medium"
              style={[styles.providerButton, authenticationBusy && styles.buttonDisabled]}
            >
              {activeProvider === 'apple' ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={22} color={colors.background} />
                  <Text style={styles.providerButtonText}>Continue with Apple</Text>
                </>
              )}
            </TactilePressable>
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
    </ScreenShell>
  );
}

function PhotoPicker({ profile, onChange }: { profile: FighterProfile; onChange: (uri: string) => void }) {
  const choosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.82,
    });
    if (!result.canceled && result.assets[0]?.uri) onChange(result.assets[0].uri);
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
          <TactilePressable onPress={() => void choosePhoto()} style={styles.photoButton}>
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
        <SectionLabel>Training days per week</SectionLabel>
        <View style={styles.dayGrid}>
          {Array.from({ length: 7 }, (_, index) => index + 1).map(day => {
            const selected = day === value.targetDaysPerWeek;
            return (
              <TactilePressable
                key={day}
                onPress={() => onChange({ ...value, targetDaysPerWeek: day })}
                haptic="selection"
                style={[styles.dayButton, selected && styles.dayButtonSelected]}
              >
                <Text style={[styles.dayButtonText, selected && styles.dayButtonTextSelected]}>{day}</Text>
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

function FighterSetup({ userName, userPhoto }: { userName: string | null; userPhoto: string | null }) {
  const { saveProfile, isBusy, errorMessage, clearError } = useAuth();
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
                onPress={() => void saveProfile(draft).catch(() => undefined)}
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
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, accent && styles.metricValueAccent]} numberOfLines={1}>
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

function ProfileOverview({ onEdit, onAccount }: { onEdit: () => void; onAccount: () => void }) {
  const { profile, syncStatus, user } = useAuth();
  const [history, setHistory] = useState<WorkoutHistoryItem[]>([]);

  useEffect(() => {
    void loadWorkoutHistoryForScope(user?.uid ?? null).then(setHistory);
  }, [profile, syncStatus, user?.uid]);

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

  if (!profile) return null;
  const equipment = profile.equipment.length
    ? profile.equipment.map(item => optionLabel(EQUIPMENT_OPTIONS, item)).join(', ')
    : 'No equipment selected';

  return (
    <ScreenShell>
      <ScrollView contentContainerStyle={styles.profileContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            {profile.photoUrl ? (
              <Image source={{ uri: profile.photoUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.profileAvatarText}>{initials(profile.displayName)}</Text>
            )}
          </View>
          <View style={styles.profileHeaderCopy}>
            <Text style={styles.kicker}>FIGHTER PROFILE</Text>
            <Text style={styles.profileName} numberOfLines={1}>{profile.displayName}</Text>
            <Text style={styles.profileMeta}>
              {optionLabel(EXPERIENCE_OPTIONS, profile.experience).toUpperCase()} · {optionLabel(STANCE_OPTIONS, profile.stance).toUpperCase()}
            </Text>
          </View>
          <TactilePressable onPress={onEdit} haptic="light" style={styles.editIconButton}>
            <Ionicons name="pencil" size={19} color={colors.text} />
          </TactilePressable>
        </View>

        <View style={styles.syncPill}>
          {syncStatus === 'syncing' ? (
            <ActivityIndicator size="small" color={colors.peach} />
          ) : (
            <Ionicons
              name={syncStatus === 'error' ? 'cloud-offline-outline' : 'cloud-done-outline'}
              size={17}
              color={syncStatus === 'error' ? colors.red : colors.peach}
            />
          )}
          <Text style={styles.syncPillText}>
            {syncStatus === 'syncing'
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
            <DetailRow icon="calendar-outline" label="WEEKLY TARGET" value={`${profile.targetDaysPerWeek} training days`} />
            <DetailRow icon="timer-outline" label="SESSION LENGTH" value={`${profile.preferredSessionMinutes} minutes`} />
          </View>
        </View>

        <TactilePressable onPress={onAccount} haptic="light" style={styles.accountRow}>
          <View style={styles.accountIconBox}>
            <Ionicons name="person-circle-outline" size={25} color={colors.peach} />
          </View>
          <View style={styles.accountRowCopy}>
            <Text style={styles.accountRowTitle}>ACCOUNT & DATA</Text>
            <Text style={styles.accountRowSubtitle}>Sign-in, sync, membership and privacy</Text>
          </View>
          <Ionicons name="chevron-forward" size={21} color={colors.textMuted} />
        </TactilePressable>
      </ScrollView>
    </ScreenShell>
  );
}

function EditProfile({ onDone }: { onDone: () => void }) {
  const { profile, saveProfile, isBusy, errorMessage, clearError } = useAuth();
  const [draft, setDraft] = useState<FighterProfile>(profile ?? DEFAULT_FIGHTER_PROFILE);

  useEffect(() => {
    if (profile) setDraft(profile);
  }, [profile]);

  const save = async () => {
    await saveProfile(draft);
    onDone();
  };

  return (
    <ScreenShell>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
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
          <View style={styles.formActions}>
            <PrimaryButton
              label="SAVE CHANGES"
              onPress={() => void save().catch(() => undefined)}
              loading={isBusy}
              icon="checkmark"
            />
            <SecondaryButton label="CANCEL" onPress={onDone} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

function ConfirmSheet({
  action,
  onClose,
  onConfirm,
  loading,
}: {
  action: ConfirmAction;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!action) return null;
  const deleting = action === 'delete';
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <TactilePressable onPress={onClose} haptic="none" style={styles.modalDismissArea}>
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
              ? 'This permanently removes your fighter profile and synced workouts. This cannot be undone.'
              : 'Your account data stays protected online. Guest mode will not show this account’s synced workouts.'}
          </Text>
          <PrimaryButton
            label={deleting ? 'DELETE MY ACCOUNT' : 'SIGN OUT'}
            onPress={onConfirm}
            loading={loading}
            icon={deleting ? 'trash-outline' : 'log-out-outline'}
          />
          <SecondaryButton label="CANCEL" onPress={onClose} />
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
          <TactilePressable onPress={() => setConfirmAction('signout')} style={styles.accountAction}>
            <Ionicons name="log-out-outline" size={21} color={colors.text} />
            <Text style={styles.accountActionText}>SIGN OUT</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TactilePressable>
          <TactilePressable onPress={() => setConfirmAction('delete')} style={styles.accountAction}>
            <Ionicons name="trash-outline" size={21} color={colors.red} />
            <Text style={[styles.accountActionText, styles.dangerText]}>DELETE ACCOUNT</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TactilePressable>
        </View>
      </ScrollView>
      <ConfirmSheet
        action={confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => void confirm().catch(() => undefined)}
        loading={isBusy}
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

export function ProfileScreen() {
  const { user, profile, isReady } = useAuth();
  const [view, setView] = useState<ProfileView>('profile');

  useEffect(() => {
    if (!user) setView('profile');
  }, [user]);

  if (!isReady) return <ProfileSkeleton />;

  if (!user) return <AuthScreen />;
  if (!profile) return <FighterSetup userName={user.displayName} userPhoto={user.photoURL} />;
  if (view === 'edit') return <EditProfile onDone={() => setView('profile')} />;
  if (view === 'account') return <AccountData onBack={() => setView('profile')} />;
  return <ProfileOverview onEdit={() => setView('edit')} onAccount={() => setView('account')} />;
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
    fontSize: 62,
    lineHeight: textLineHeight(62),
    letterSpacing: 0.2,
  },
  pageTitleAccent: { color: colors.red },
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
  choiceTextSelected: { color: colors.peach },
  checkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
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
  primaryButton: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.red },
  primaryButtonText: { color: colors.text, fontFamily: 'BarlowSemiCondensedSemiBold', fontSize: 15, lineHeight: textLineHeight(15), letterSpacing: 1.2 },
  secondaryButton: { height: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { color: colors.textMuted, fontFamily: 'BarlowSemiCondensedSemiBold', fontSize: 14, lineHeight: textLineHeight(14), letterSpacing: 1.1 },
  profileContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 42, gap: 22 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileAvatar: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.text },
  profileAvatarText: { color: colors.background, fontFamily: 'Anton', fontSize: 27, lineHeight: textLineHeight(27) },
  profileHeaderCopy: { flex: 1 },
  profileName: { marginTop: 4, color: colors.text, fontFamily: 'Anton', fontSize: 30, lineHeight: textLineHeight(30) },
  profileMeta: { marginTop: 3, color: colors.textMuted, fontFamily: 'BarlowSemiCondensedSemiBold', fontSize: 11, lineHeight: textLineHeight(11), letterSpacing: 1.2 },
  editIconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  syncPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  syncPillText: { color: colors.textMuted, fontFamily: 'BarlowSemiCondensedSemiBold', fontSize: 10, lineHeight: textLineHeight(10), letterSpacing: 1.1 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricCard: { flexBasis: '47%', flexGrow: 1, minHeight: 116, padding: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'space-between' },
  metricLabel: { color: colors.peach, fontFamily: 'BarlowSemiCondensedSemiBold', fontSize: 11, lineHeight: textLineHeight(11), letterSpacing: 1.1 },
  metricValue: { color: colors.text, fontFamily: 'Anton', fontSize: 38, lineHeight: textLineHeight(38) },
  metricValueAccent: { color: colors.red },
  profileSection: { gap: 10 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profileSectionTitle: { color: colors.text, fontFamily: 'Anton', fontSize: 28, lineHeight: textLineHeight(28), letterSpacing: 0.4 },
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
  skeletonMetricLabel: { width: '64%', height: 10 },
  skeletonMetricValue: { width: '56%', height: 42 },
  skeletonSectionTitle: { width: 154, height: 30 },
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
