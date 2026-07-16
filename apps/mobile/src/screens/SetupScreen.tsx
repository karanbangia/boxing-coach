import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  DIFFICULTIES,
  REST_DURATIONS,
  ROUND_DURATIONS,
  type SetupSettings,
} from '../config';
import { ScreenShell } from '../components/ScreenShell';
import { TactilePressable } from '../components/TactilePressable';
import { colors } from '../theme';

const DEV_TAP_THRESHOLD = 3;
const DEV_TAP_WINDOW_MS = 3500;
const MIN_ROUNDS = 1;
const MAX_ROUNDS = 12;
const displayFont = 'Anton';
const bodyFont = 'ArchivoNarrow';
const labelFont = 'BarlowSemiCondensedSemiBold';

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
      <Text style={styles.sectionLabel} allowFontScaling={false}>{label}</Text>
      <View style={variant === 'tile' ? styles.tileGrid : styles.segmentGrid}>
        {options.map(option => {
          const selected = option.value === value;

          return (
            <TactilePressable
              key={String(option.value)}
              onPress={() => onSelect(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              haptic="selection"
              pressedScale={0.985}
              style={[
                variant === 'tile' ? styles.tileButton : styles.segmentButton,
                variant === 'tile' && selected && styles.tileButtonSelected,
                variant === 'segment' && selected && styles.segmentButtonSelected,
              ]}
            >
              <Text
                style={[
                  variant === 'tile' ? styles.tileLabel : styles.segmentLabel,
                  selected && styles.selectedLabel,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.74}
                allowFontScaling={false}
              >
                {option.label}
              </Text>
              {option.desc ? (
                <Text style={styles.tileDesc} numberOfLines={2} allowFontScaling={false}>
                  {option.desc}
                </Text>
              ) : null}
            </TactilePressable>
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
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroller}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <TactilePressable
            onPress={handleHeroPress}
            haptic="none"
            pressedScale={0.995}
          >
            <View style={styles.heroPanel}>
              <Text
                style={styles.title}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                allowFontScaling={false}
              >
                SETUP YOUR
              </Text>
              <Text
                style={[styles.title, styles.titleAccent]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                allowFontScaling={false}
              >
                WORKOUT
              </Text>
            </View>
          </TactilePressable>

          {!isReady ? (
            <View style={styles.loadingPanel}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.loadingText} allowFontScaling={false}>Loading your last session...</Text>
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
                <Text style={styles.sectionLabel} allowFontScaling={false}>Rounds</Text>
                <View style={styles.roundStepper}>
                  <TactilePressable
                    accessibilityRole="button"
                    accessibilityLabel="Decrease rounds"
                    disabled={settings.totalRounds <= MIN_ROUNDS}
                    onPress={() => onChange({ totalRounds: Math.max(MIN_ROUNDS, settings.totalRounds - 1) })}
                    haptic="selection"
                    pressedScale={0.9}
                    style={[
                      styles.stepperButton,
                      settings.totalRounds <= MIN_ROUNDS && styles.stepperButtonDisabled,
                    ]}
                  >
                    <Text style={styles.stepperSymbol} allowFontScaling={false}>-</Text>
                  </TactilePressable>
                  <Text style={styles.roundValue} allowFontScaling={false}>{settings.totalRounds}</Text>
                  <TactilePressable
                    accessibilityRole="button"
                    accessibilityLabel="Increase rounds"
                    disabled={settings.totalRounds >= MAX_ROUNDS}
                    onPress={() => onChange({ totalRounds: Math.min(MAX_ROUNDS, settings.totalRounds + 1) })}
                    haptic="selection"
                    pressedScale={0.9}
                    style={[
                      styles.stepperButton,
                      settings.totalRounds >= MAX_ROUNDS && styles.stepperButtonDisabled,
                    ]}
                  >
                    <Text style={styles.stepperSymbol} allowFontScaling={false}>+</Text>
                  </TactilePressable>
                </View>
              </View>

              <OptionGroup
                label="Rest Period"
                options={REST_DURATIONS}
                value={settings.restDuration}
                onSelect={restDuration => onChange({ restDuration })}
                variant="segment"
              />

              <TactilePressable
                accessibilityRole="switch"
                accessibilityLabel="Audio cues"
                accessibilityHint="Plays coach instructions"
                accessibilityState={{ checked: settings.audioCuesEnabled }}
                onPress={() => onChange({ audioCuesEnabled: !settings.audioCuesEnabled })}
                haptic="selection"
                pressedScale={0.985}
                style={styles.audioCueRow}
              >
                <View style={styles.audioLabelWrap}>
                  <AudioIcon />
                  <View style={styles.audioCueCopy}>
                    <Text style={styles.audioCueLabel} allowFontScaling={false}>Audio Cues</Text>
                    <Text style={styles.audioCueHint} allowFontScaling={false}>
                      Coach instructions
                    </Text>
                  </View>
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
              </TactilePressable>
            </>
          )}
        </ScrollView>

        {isReady ? (
          <View style={styles.floatingCta}>
            <TactilePressable
              accessibilityRole="button"
              accessibilityLabel="Start workout"
              onPress={() => onStart(settings)}
              haptic="medium"
              pressedScale={0.98}
              style={styles.startButton}
            >
              <View style={styles.playTriangle} />
              <Text style={styles.startButtonText} allowFontScaling={false}>START WORKOUT</Text>
            </TactilePressable>
          </View>
        ) : null}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroller: {
    marginBottom: 0,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 137,
    gap: 20,
  },
  heroPanel: {
    paddingTop: 6,
    paddingBottom: 0,
  },
  heroPressed: {
    opacity: 0.98,
    transform: [{ scale: 0.995 }],
  },
  title: {
    color: colors.peach,
    fontFamily: displayFont,
    fontSize: 58,
    lineHeight: 72,
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
    fontFamily: labelFont,
    fontSize: 14,
    lineHeight: 16,
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
    minHeight: 96,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
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
    fontFamily: displayFont,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: 0.48,
    textTransform: 'uppercase',
  },
  tileDesc: {
    color: colors.textMuted,
    fontFamily: bodyFont,
    fontSize: 16,
    lineHeight: 20,
  },
  segmentLabel: {
    color: colors.textMuted,
    fontFamily: displayFont,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: 0,
    transform: [{ translateY: 4 }],
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
    fontFamily: labelFont,
    fontSize: 34,
    lineHeight: 38,
    transform: [{ translateY: 3 }],
  },
  roundValue: {
    color: colors.text,
    fontFamily: displayFont,
    fontSize: 64,
    lineHeight: 78,
    fontVariant: ['tabular-nums'],
    transform: [{ translateY: 6 }],
  },
  audioCueRow: {
    minHeight: 64,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioLabelWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  audioCueCopy: {
    flex: 1,
    gap: 2,
  },
  audioCueLabel: {
    color: colors.peach,
    fontFamily: labelFont,
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  audioCueHint: {
    color: colors.textMuted,
    fontFamily: bodyFont,
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 1.6,
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
  floatingCta: {
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
  startButton: {
    minHeight: 84,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
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
    fontFamily: displayFont,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
});
