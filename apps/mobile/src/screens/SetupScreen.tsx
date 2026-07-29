import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  DIFFICULTIES,
  REST_DURATIONS,
  ROUND_DURATIONS,
  type SetupSettings,
} from '../config';
import { ScreenShell } from '../components/ScreenShell';
import { PunchNumberGuideModal } from '../components/PunchNumberGuideModal';
import { TactilePressable } from '../components/TactilePressable';
import type { ProgramSession } from '../features/programs/programs';
import { trackEvent } from '../lib/observability';
import { colors, textLineHeight } from '../theme';

const DEV_TAP_THRESHOLD = 3;
const DEV_TAP_WINDOW_MS = 3500;
const MIN_ROUNDS = 1;
const MAX_ROUNDS = 12;
const displayFont = 'Anton';
const bodyFont = 'ArchivoNarrow';
const labelFont = 'BarlowSemiCondensedSemiBold';
const PREMIUM_DIFFICULTIES = new Set<SetupSettings['difficulty']>(['advanced', 'pro']);

interface Props {
  settings: SetupSettings;
  isReady: boolean;
  onChange: (patch: Partial<SetupSettings>) => void;
  onStart: (settings: SetupSettings, origin: { x: number; y: number }) => void;
  onOpenDev: () => void;
  isPremium: boolean;
  onPremiumRequest: (difficulty: SetupSettings['difficulty']) => void;
  programSession: ProgramSession | null;
  onClearProgramSession: () => void;
}

function OptionGroup<T extends string | number>({
  label,
  options,
  value,
  onSelect,
  lockedValues,
  onLockedSelect,
  variant = 'tile',
  compact = false,
}: {
  label: string;
  options: { value: T; label: string; desc?: string }[];
  value: T;
  onSelect: (value: T) => void;
  lockedValues?: ReadonlySet<T>;
  onLockedSelect?: (value: T) => void;
  variant?: 'tile' | 'segment';
  compact?: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel} allowFontScaling={false}>{label}</Text>
      <View style={variant === 'tile' ? styles.tileGrid : styles.segmentGrid}>
        {options.map(option => {
          const selected = option.value === value;
          const locked = lockedValues?.has(option.value) ?? false;

          return (
            <TactilePressable
              key={String(option.value)}
              onPress={() => locked
                ? onLockedSelect?.(option.value)
                : onSelect(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityHint={locked ? 'Opens Boxing Coach Premium options' : undefined}
              haptic="selection"
              pressedScale={0.985}
              style={[
                variant === 'tile' ? styles.tileButton : styles.segmentButton,
                variant === 'tile' && compact && styles.tileButtonCompact,
                variant === 'segment' && compact && styles.segmentButtonCompact,
                variant === 'tile' && selected && styles.tileButtonSelected,
                variant === 'segment' && selected && styles.segmentButtonSelected,
              ]}
            >
              {locked ? (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText} allowFontScaling={false}>PREMIUM</Text>
                </View>
              ) : null}
              <Text
                style={[
                  variant === 'tile' ? styles.tileLabel : styles.segmentLabel,
                  variant === 'tile' && compact && styles.tileLabelCompact,
                  variant === 'segment' && compact && styles.segmentLabelCompact,
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
                <Text
                  style={[styles.tileDesc, compact && styles.tileDescCompact]}
                  numberOfLines={2}
                  allowFontScaling={false}
                >
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

function ComboIcon() {
  return (
    <View style={styles.comboIcon} accessibilityElementsHidden>
      <Text style={styles.comboIconText} allowFontScaling={false}>1-2</Text>
    </View>
  );
}

export function SetupScreen({
  settings,
  isReady,
  onChange,
  onStart,
  onOpenDev,
  isPremium,
  onPremiumRequest,
  programSession,
  onClearProgramSession,
}: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const compact = windowHeight <= 700;
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [punchGuideVisible, setPunchGuideVisible] = useState(
    __DEV__ && process.env.EXPO_PUBLIC_PUNCH_GUIDE_TEST_SCENARIO === 'guide',
  );

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
  const selectedDifficultyRequiresPremium = !isPremium
    && PREMIUM_DIFFICULTIES.has(settings.difficulty);
  const openPunchGuide = () => {
    trackEvent('punch_guide_opened', { source: 'setup' });
    setPunchGuideVisible(true);
  };

  return (
    <ScreenShell>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroller}
          contentContainerStyle={[styles.container, compact && styles.containerCompact]}
          showsVerticalScrollIndicator={false}
        >
          <TactilePressable
            onPress={handleHeroPress}
            haptic="none"
            pressedScale={0.995}
          >
            <View style={[styles.heroPanel, compact && styles.heroPanelCompact]}>
              <Text
                style={[styles.title, compact && styles.titleCompact]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                allowFontScaling={false}
              >
                SETUP YOUR
              </Text>
              <Text
                style={[
                  styles.title,
                  styles.titleAccent,
                  compact && styles.titleCompact,
                  compact && styles.titleAccentCompact,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                allowFontScaling={false}
              >
                WORKOUT
              </Text>
            </View>
          </TactilePressable>

          <TactilePressable
            accessibilityRole="button"
            accessibilityLabel="Open punch number guide"
            accessibilityHint="Explains boxing punch numbers one through six"
            onPress={openPunchGuide}
            haptic="light"
            pressedScale={0.985}
            style={[styles.guideLink, compact && styles.guideLinkCompact]}
          >
            <View style={styles.guideLinkNumber}>
              <Text style={styles.guideLinkNumberText} allowFontScaling={false}>1–6</Text>
            </View>
            <View style={styles.guideLinkCopy}>
              <Text style={styles.guideLinkTitle} allowFontScaling={false}>NEW TO PUNCH NUMBERS?</Text>
              <Text style={styles.guideLinkHint} allowFontScaling={false}>Open the quick boxing guide</Text>
            </View>
            <Text style={styles.guideLinkArrow} allowFontScaling={false}>→</Text>
          </TactilePressable>

          {!isReady ? (
            <View style={styles.loadingPanel}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.loadingText} allowFontScaling={false}>Loading your last session...</Text>
            </View>
          ) : (
            <>
              {programSession ? (
                <View style={styles.programBanner}>
                  <View style={styles.programBannerCopy}>
                    <Text style={styles.programBannerKicker} allowFontScaling={false}>
                      PROGRAM SESSION LOADED
                    </Text>
                    <Text style={styles.programBannerTitle} allowFontScaling={false}>
                      {programSession.title}
                    </Text>
                    <Text style={styles.programBannerMeta} allowFontScaling={false}>
                      WEEK {programSession.week} · SESSION {programSession.sessionInWeek}
                    </Text>
                  </View>
                  <TactilePressable
                    onPress={onClearProgramSession}
                    haptic="light"
                    accessibilityRole="button"
                    accessibilityLabel="Remove loaded program session"
                    style={styles.programBannerClose}
                  >
                    <Text style={styles.programBannerCloseText} allowFontScaling={false}>×</Text>
                  </TactilePressable>
                </View>
              ) : null}
              <OptionGroup
                label="Difficulty"
                options={DIFFICULTIES}
                value={settings.difficulty}
                onSelect={difficulty => onChange({ difficulty })}
                lockedValues={isPremium ? undefined : PREMIUM_DIFFICULTIES}
                onLockedSelect={onPremiumRequest}
                compact={compact}
              />
              <OptionGroup
                label="Round Duration"
                options={ROUND_DURATIONS}
                value={settings.roundDuration}
                onSelect={roundDuration => onChange({ roundDuration })}
                variant="segment"
                compact={compact}
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
                compact={compact}
              />

              <View style={styles.instructionSettings}>
                <TactilePressable
                  accessibilityRole="switch"
                  accessibilityLabel="Combo instructions"
                  accessibilityHint="Shows combinations during workouts"
                  accessibilityState={{ checked: settings.comboInstructionsEnabled }}
                  onPress={() =>
                    onChange({
                      comboInstructionsEnabled: !settings.comboInstructionsEnabled,
                      ...(settings.comboInstructionsEnabled
                        ? { audioCuesEnabled: false }
                        : {}),
                    })
                  }
                  haptic="selection"
                  pressedScale={0.985}
                  style={styles.audioCueRow}
                >
                  <View style={styles.audioLabelWrap}>
                    <ComboIcon />
                    <View style={styles.audioCueCopy}>
                      <Text style={styles.audioCueLabel} allowFontScaling={false}>
                        Combo Instructions
                      </Text>
                      <Text style={styles.audioCueHint} allowFontScaling={false}>
                        Show combinations
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.toggleTrack,
                      settings.comboInstructionsEnabled && styles.toggleTrackOn,
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        settings.comboInstructionsEnabled && styles.toggleThumbOn,
                      ]}
                    />
                  </View>
                </TactilePressable>

                <TactilePressable
                  accessibilityRole="switch"
                  accessibilityLabel="Audio cues"
                  accessibilityHint="Plays coach instructions"
                  accessibilityState={{
                    checked: settings.audioCuesEnabled,
                    disabled: !settings.comboInstructionsEnabled,
                  }}
                  disabled={!settings.comboInstructionsEnabled}
                  onPress={() => onChange({ audioCuesEnabled: !settings.audioCuesEnabled })}
                  haptic="selection"
                  pressedScale={0.985}
                  style={[
                    styles.audioCueRow,
                    !settings.comboInstructionsEnabled && styles.instructionSettingDisabled,
                  ]}
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
              </View>
            </>
          )}
        </ScrollView>

        {isReady ? (
          <View style={[styles.floatingCta, compact && styles.floatingCtaCompact]}>
            <TactilePressable
              accessibilityRole="button"
              accessibilityLabel={selectedDifficultyRequiresPremium
                ? 'Unlock Premium to start this workout'
                : 'Start workout'}
              onPress={event => onStart(settings, {
                x: event.nativeEvent.pageX,
                y: event.nativeEvent.pageY,
              })}
              haptic="medium"
              pressedScale={0.98}
              style={[styles.startButton, compact && styles.startButtonCompact]}
            >
              <View style={styles.playTriangle} />
              <Text
                style={[styles.startButtonText, compact && styles.startButtonTextCompact]}
                allowFontScaling={false}
              >
                {selectedDifficultyRequiresPremium ? 'UNLOCK PREMIUM' : 'START WORKOUT'}
              </Text>
            </TactilePressable>
          </View>
        ) : null}
      </View>
      <PunchNumberGuideModal
        visible={punchGuideVisible}
        onClose={() => setPunchGuideVisible(false)}
      />
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
  containerCompact: {
    paddingTop: 14,
    paddingBottom: 106,
    gap: 13,
  },
  heroPanel: {
    paddingTop: 6,
    paddingBottom: 0,
  },
  heroPanelCompact: {
    paddingTop: 0,
  },
  heroPressed: {
    opacity: 0.98,
    transform: [{ scale: 0.995 }],
  },
  title: {
    color: colors.peach,
    fontFamily: displayFont,
    fontSize: 58,
    lineHeight: textLineHeight(58),
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  titleAccent: {
    color: colors.accent,
    marginTop: 58 - textLineHeight(58),
  },
  titleCompact: {
    fontSize: 44,
    lineHeight: textLineHeight(44),
  },
  titleAccentCompact: {
    marginTop: 44 - textLineHeight(44),
  },
  guideLink: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(249,189,173,0.06)',
  },
  guideLinkCompact: {
    minHeight: 46,
    paddingVertical: 6,
  },
  guideLinkNumber: {
    width: 48,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.peach,
  },
  guideLinkNumberText: {
    color: colors.peach,
    fontFamily: displayFont,
    fontSize: 18,
    lineHeight: textLineHeight(18),
  },
  guideLinkCopy: { flex: 1 },
  guideLinkTitle: {
    color: colors.text,
    fontFamily: labelFont,
    fontSize: 11,
    lineHeight: textLineHeight(11),
    letterSpacing: 1.2,
  },
  guideLinkHint: {
    color: colors.textMuted,
    fontFamily: bodyFont,
    fontSize: 13,
    lineHeight: textLineHeight(13),
  },
  guideLinkArrow: {
    color: colors.accent,
    fontFamily: displayFont,
    fontSize: 24,
    lineHeight: textLineHeight(24),
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
  programBanner: {
    minHeight: 94,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: colors.peach,
    backgroundColor: 'rgba(249,189,173,0.08)',
  },
  programBannerCopy: { flex: 1, gap: 2 },
  programBannerKicker: {
    color: colors.peach,
    fontFamily: labelFont,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1.2,
  },
  programBannerTitle: {
    color: colors.text,
    fontFamily: displayFont,
    fontSize: 23,
    lineHeight: 28,
    letterSpacing: 0.4,
  },
  programBannerMeta: {
    color: colors.textMuted,
    fontFamily: labelFont,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
  },
  programBannerClose: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  programBannerCloseText: {
    color: colors.text,
    fontFamily: bodyFont,
    fontSize: 32,
    lineHeight: 34,
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
  tileButtonCompact: {
    minHeight: 78,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 3,
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: colors.peach,
  },
  premiumBadgeText: {
    color: colors.background,
    fontFamily: labelFont,
    fontSize: 8,
    lineHeight: 9,
    letterSpacing: 0.8,
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
  segmentButtonCompact: {
    minHeight: 50,
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
  tileLabelCompact: {
    fontSize: 20,
    lineHeight: 24,
  },
  tileDescCompact: {
    fontSize: 13,
    lineHeight: 16,
  },
  segmentLabel: {
    color: colors.textMuted,
    fontFamily: displayFont,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: 0,
    transform: [{ translateY: 4 }],
  },
  segmentLabelCompact: {
    fontSize: 20,
    lineHeight: 25,
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
  instructionSettings: {
    gap: 8,
  },
  instructionSettingDisabled: {
    opacity: 0.45,
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
  comboIcon: {
    width: 22,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comboIconText: {
    color: colors.accent,
    fontFamily: labelFont,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: -0.4,
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
  floatingCtaCompact: {
    height: 94,
    paddingTop: 12,
    paddingBottom: 10,
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
  startButtonCompact: {
    minHeight: 66,
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
  startButtonTextCompact: {
    fontSize: 25,
    lineHeight: 31,
  },
});
