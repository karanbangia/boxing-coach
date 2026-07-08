import { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  DIFFICULTIES,
  REST_DURATIONS,
  ROUND_DURATIONS,
  type SetupSettings,
} from '../config';
import { ScreenShell } from '../components/ScreenShell';
import { colors } from '../theme';

const DEV_TAP_THRESHOLD = 3;
const DEV_TAP_WINDOW_MS = 3500;
const MIN_ROUNDS = 1;
const MAX_ROUNDS = 12;

interface Props {
  settings: SetupSettings;
  isReady: boolean;
  onChange: (patch: Partial<SetupSettings>) => void;
  onStart: (settings: SetupSettings) => void;
  onOpenDev: () => void;
}

function OptionGroup<T extends string | number>({
  label,
  options,
  value,
  onSelect,
  variant = 'tile',
}: {
  label: string;
  options: { value: T; label: string; desc?: string }[];
  value: T;
  onSelect: (value: T) => void;
  variant?: 'tile' | 'segment';
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={variant === 'tile' ? styles.tileGrid : styles.segmentGrid}>
        {options.map(option => {
          const selected = option.value === value;

          return (
            <Pressable
              key={String(option.value)}
              onPress={() => onSelect(option.value)}
              style={({ pressed }) => [
                variant === 'tile' ? styles.tileButton : styles.segmentButton,
                variant === 'tile' && selected && styles.tileButtonSelected,
                variant === 'segment' && selected && styles.segmentButtonSelected,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text
                style={[
                  variant === 'tile' ? styles.tileLabel : styles.segmentLabel,
                  selected && styles.selectedLabel,
                ]}
              >
                {option.label}
              </Text>
              {option.desc ? (
                <Text style={styles.tileDesc} numberOfLines={2}>
                  {option.desc}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function AudioIcon() {
  return (
    <View style={styles.audioIcon}>
      <View style={styles.audioHead} />
      <View style={styles.audioBody} />
      <View style={styles.audioWaveSmall} />
      <View style={styles.audioWaveLarge} />
    </View>
  );
}

export function SetupScreen({ settings, isReady, onChange, onStart, onOpenDev }: Props) {
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }
    };
  }, []);

  const handleHeroPress = () => {
    tapCountRef.current += 1;

    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    if (tapCountRef.current >= DEV_TAP_THRESHOLD) {
      tapCountRef.current = 0;
      onOpenDev();
      return;
    }

    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
      tapTimerRef.current = null;
    }, DEV_TAP_WINDOW_MS);
  };

  return (
    <ScreenShell>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={handleHeroPress} style={({ pressed }) => [pressed && styles.heroPressed]}>
          <View style={styles.heroPanel}>
            <Text style={styles.title}>SETUP YOUR</Text>
            <Text style={[styles.title, styles.titleAccent]}>WORKOUT</Text>
          </View>
        </Pressable>

        {!isReady ? (
          <View style={styles.loadingPanel}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.loadingText}>Loading your last session...</Text>
          </View>
        ) : (
          <>
            <OptionGroup
              label="Difficulty"
              options={DIFFICULTIES}
              value={settings.difficulty}
              onSelect={difficulty => onChange({ difficulty })}
            />
            <OptionGroup
              label="Round Duration"
              options={ROUND_DURATIONS}
              value={settings.roundDuration}
              onSelect={roundDuration => onChange({ roundDuration })}
              variant="segment"
            />

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Rounds</Text>
              <View style={styles.roundStepper}>
                <Pressable
                  accessibilityLabel="Decrease rounds"
                  disabled={settings.totalRounds <= MIN_ROUNDS}
                  onPress={() => onChange({ totalRounds: Math.max(MIN_ROUNDS, settings.totalRounds - 1) })}
                  style={({ pressed }) => [
                    styles.stepperButton,
                    settings.totalRounds <= MIN_ROUNDS && styles.stepperButtonDisabled,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.stepperSymbol}>-</Text>
                </Pressable>
                <Text style={styles.roundValue}>{settings.totalRounds}</Text>
                <Pressable
                  accessibilityLabel="Increase rounds"
                  disabled={settings.totalRounds >= MAX_ROUNDS}
                  onPress={() => onChange({ totalRounds: Math.min(MAX_ROUNDS, settings.totalRounds + 1) })}
                  style={({ pressed }) => [
                    styles.stepperButton,
                    settings.totalRounds >= MAX_ROUNDS && styles.stepperButtonDisabled,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.stepperSymbol}>+</Text>
                </Pressable>
              </View>
            </View>

            <OptionGroup
              label="Rest Period"
              options={REST_DURATIONS}
              value={settings.restDuration}
              onSelect={restDuration => onChange({ restDuration })}
              variant="segment"
            />

            <Pressable
              onPress={() => onChange({ audioCuesEnabled: !settings.audioCuesEnabled })}
              style={({ pressed }) => [
                styles.audioCueRow,
                pressed && styles.buttonPressed,
              ]}
            >
              <View style={styles.audioLabelWrap}>
                <AudioIcon />
                <Text style={styles.audioCueLabel}>Voice + Bell</Text>
              </View>
              <View
                style={[
                  styles.toggleTrack,
                  settings.audioCuesEnabled && styles.toggleTrackOn,
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    settings.audioCuesEnabled && styles.toggleThumbOn,
                  ]}
                />
              </View>
            </Pressable>

            <Pressable
              onPress={() => onStart(settings)}
              style={({ pressed }) => [
                styles.startButton,
                pressed && styles.startButtonPressed,
              ]}
            >
              <View style={styles.playTriangle} />
              <Text style={styles.startButtonText}>START WORKOUT</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 42,
    gap: 24,
  },
  heroPanel: {
    paddingBottom: 24,
  },
  heroPressed: {
    opacity: 0.98,
    transform: [{ scale: 0.995 }],
  },
  title: {
    color: colors.peach,
    fontSize: 58,
    lineHeight: 60,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  titleAccent: {
    color: colors.accent,
  },
  loadingPanel: {
    padding: 20,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    color: colors.peach,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  segmentGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  tileButton: {
    width: '49.4%',
    minHeight: 86,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  tileButtonSelected: {
    borderColor: colors.accent,
  },
  segmentButton: {
    flex: 1,
    minHeight: 58,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  segmentButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  buttonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  tileLabel: {
    color: colors.textMuted,
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  tileDesc: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 19,
  },
  segmentLabel: {
    color: colors.textMuted,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    letterSpacing: 0,
  },
  selectedLabel: {
    color: colors.text,
  },
  roundStepper: {
    minHeight: 88,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.35,
  },
  stepperSymbol: {
    color: colors.peach,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '400',
  },
  roundValue: {
    color: colors.peach,
    fontSize: 58,
    lineHeight: 64,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  audioCueRow: {
    minHeight: 54,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  audioCueLabel: {
    color: colors.peach,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  audioIcon: {
    width: 22,
    height: 20,
  },
  audioHead: {
    position: 'absolute',
    left: 1,
    top: 4,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  audioBody: {
    position: 'absolute',
    left: 0,
    bottom: 1,
    width: 10,
    height: 7,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: colors.accent,
  },
  audioWaveSmall: {
    position: 'absolute',
    left: 12,
    top: 7,
    width: 6,
    height: 6,
    borderRightWidth: 2,
    borderColor: colors.accent,
    borderRadius: 6,
  },
  audioWaveLarge: {
    position: 'absolute',
    left: 15,
    top: 3,
    width: 8,
    height: 14,
    borderRightWidth: 2,
    borderColor: colors.accent,
    borderRadius: 8,
  },
  toggleTrack: {
    width: 48,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.border,
    padding: 4,
  },
  toggleTrackOn: {
    backgroundColor: colors.accent,
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: colors.text,
  },
  toggleThumbOn: {
    transform: [{ translateX: 24 }],
  },
  startButton: {
    marginTop: 22,
    minHeight: 74,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  startButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderLeftWidth: 11,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.text,
  },
  startButtonText: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
});
