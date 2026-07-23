import { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Action } from '@boxing-coach/core';
import { ScreenShell } from '../components/ScreenShell';
import { TactilePressable } from '../components/TactilePressable';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { formatClock } from '../lib/time';
import { colors } from '../theme';

interface Props {
  currentRound: number;
  totalRounds: number;
  roundDuration: number;
  timeRemaining: number;
  currentAction: Action | null;
  intensity: 'normal' | 'building' | 'intense';
  isPaused: boolean;
  isFreestyle: boolean;
  actionKey: number;
  comboInstructionsEnabled: boolean;
  muted: boolean;
  masterVolume: number;
  onToggleMute: () => void;
  onVolumePercentChange: (percent: number) => void;
  onPause: () => void;
  onResume: () => void;
  onSkipRound: () => void;
  onStop: () => void;
}

function actionBadge(type: string, isFreestyle: boolean) {
  if (isFreestyle) return 'FINISH STRONG';
  if (type === 'movement') return 'MOVEMENT';
  if (type === 'defense') return 'DEFENSE';
  return 'COMBO';
}

function normalizeComboLabel(action: Action | null) {
  if (!action) return '1 - 2 - 3';
  return action.label.replace(/-/g, ' - ');
}

const equalizerBars = [26, 42, 31, 19, 44, 36, 52];
const TIMER_RING_TICK_COUNT = 120;

function PauseIcon() {
  return (
    <View style={styles.pauseIcon} accessibilityElementsHidden>
      <View style={styles.pauseIconBar} />
      <View style={styles.pauseIconBar} />
    </View>
  );
}

function PlayIcon() {
  return <View style={styles.playIcon} accessibilityElementsHidden />;
}

function SkipIcon() {
  return (
    <View style={styles.skipIcon} accessibilityElementsHidden>
      <View style={styles.skipTriangle} />
      <View style={styles.skipTriangle} />
      <View style={styles.skipStem} />
    </View>
  );
}

function StopIcon() {
  return <View style={styles.stopIcon} accessibilityElementsHidden />;
}

interface VolumeModalProps {
  visible: boolean;
  muted: boolean;
  volumePercent: number;
  onChange: (percent: number) => void;
  onClose: () => void;
}

function VolumeModal({
  visible,
  muted,
  volumePercent,
  onChange,
  onClose,
}: VolumeModalProps) {
  const trackRef = useRef<View | null>(null);
  const trackHeightRef = useRef(0);
  const trackPageYRef = useRef(0);
  const lastEmittedRef = useRef(Math.round(volumePercent));
  const isDraggingRef = useRef(false);
  const hasPendingChangeRef = useRef(false);
  const displayPercent = muted ? 0 : Math.round(volumePercent);
  const animatedVolume = useRef(new Animated.Value(displayPercent)).current;
  const fillHeight = animatedVolume.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });
  const fillColor = animatedVolume.interpolate({
    inputRange: [0, 70, 100],
    outputRange: [colors.peach, colors.peach, colors.accent],
  });

  useEffect(() => {
    lastEmittedRef.current = Math.round(volumePercent);
  }, [volumePercent]);

  useEffect(() => {
    if (isDraggingRef.current) {
      return;
    }
    const animation = Animated.timing(animatedVolume, {
      toValue: displayPercent,
      duration: 180,
      useNativeDriver: false,
    });
    animation.start();
    return animation.stop;
  }, [animatedVolume, displayPercent]);

  const measureTrack = (afterMeasure?: () => void) => {
    trackRef.current?.measureInWindow((_x, y, _width, height) => {
      trackPageYRef.current = y;
      trackHeightRef.current = height;
      afterMeasure?.();
    });
  };

  const updateFromPageY = (pageY: number) => {
    if (trackHeightRef.current <= 0) {
      return;
    }

    const localY = pageY - trackPageYRef.current;
    const ratio = Math.max(0, Math.min(1, 1 - localY / trackHeightRef.current));
    const nextValue = Math.max(0, Math.min(100, Math.round(ratio * 100)));

    if (nextValue === lastEmittedRef.current) {
      return;
    }

    lastEmittedRef.current = nextValue;
    hasPendingChangeRef.current = true;
    animatedVolume.setValue(nextValue);
  };

  const commitPendingVolume = () => {
    isDraggingRef.current = false;
    if (!hasPendingChangeRef.current) {
      return;
    }

    hasPendingChangeRef.current = false;
    onChange(lastEmittedRef.current);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: event => {
          isDraggingRef.current = true;
          hasPendingChangeRef.current = false;
          measureTrack(() => {
            updateFromPageY(event.nativeEvent.pageY);
          });
        },
        onPanResponderMove: event => {
          updateFromPageY(event.nativeEvent.pageY);
        },
        onPanResponderRelease: commitPendingVolume,
        onPanResponderTerminate: commitPendingVolume,
      }),
    [onChange],
  );

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    trackHeightRef.current = event.nativeEvent.layout.height;
    measureTrack();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.volumeModalRoot}>
        <BlurView intensity={34} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={styles.volumeModalDim} />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          accessibilityLabel="Close volume"
        />
        <View style={styles.volumeSheet} pointerEvents="box-none">
          <View
            ref={trackRef}
            style={styles.volumeTrack}
            onLayout={handleTrackLayout}
            {...panResponder.panHandlers}
            accessibilityRole="adjustable"
            accessibilityLabel="Workout volume"
            accessibilityValue={{ min: 0, max: 100, now: displayPercent }}
          >
            <Animated.View style={[styles.volumeFill, { height: fillHeight, backgroundColor: fillColor }]} />
            <Ionicons
              name={muted ? 'volume-mute-outline' : 'volume-high-outline'}
              size={31}
              color={colors.text}
              style={styles.volumeTrackIcon}
              accessibilityElementsHidden
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function StopWorkoutModal({
  visible,
  onContinue,
  onStop,
}: {
  visible: boolean;
  onContinue: () => void;
  onStop: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinue}>
      <View style={styles.stopModalRoot}>
        <BlurView intensity={34} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={styles.stopModalDim} />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onContinue}
          accessibilityLabel="Keep training"
        />
        <View style={[styles.stopSheet, { marginBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.stopSheetKickerRow}>
            <View style={styles.stopSheetKickerMark} />
            <Text style={styles.stopSheetKicker} allowFontScaling={false}>SESSION CONTROL</Text>
          </View>
          <Text style={styles.stopSheetTitle} allowFontScaling={false}>END THIS{`\n`}SESSION?</Text>
          <Text style={styles.stopSheetCopy} allowFontScaling={false}>
            This workout will not appear in your training log.
          </Text>
          <TactilePressable
            accessibilityRole="button"
            accessibilityLabel="Keep training"
            onPress={onContinue}
            haptic="light"
            pressedScale={0.98}
            style={styles.keepTrainingButton}
          >
            <Text style={styles.keepTrainingButtonText} allowFontScaling={false}>KEEP TRAINING</Text>
          </TactilePressable>
          <TactilePressable
            accessibilityRole="button"
            accessibilityLabel="End workout without saving"
            onPress={onStop}
            haptic="medium"
            pressedScale={0.98}
            style={styles.confirmStopButton}
          >
            <Text style={styles.confirmStopButtonText} allowFontScaling={false}>END WORKOUT</Text>
          </TactilePressable>
        </View>
      </View>
    </Modal>
  );
}

export function WorkoutScreen({
  currentRound,
  roundDuration,
  timeRemaining,
  currentAction,
  intensity,
  isPaused,
  isFreestyle,
  actionKey,
  comboInstructionsEnabled,
  muted,
  masterVolume,
  onToggleMute,
  onVolumePercentChange,
  onPause,
  onResume,
  onSkipRound,
  onStop,
}: Props) {
  const { height } = useWindowDimensions();
  const actionAnim = useRef(new Animated.Value(1)).current;
  const voiceAnim = useRef(equalizerBars.map(() => new Animated.Value(0))).current;
  const reduceMotion = useReducedMotion();
  const ringTicks = useMemo(
    () => Array.from({ length: TIMER_RING_TICK_COUNT }, (_, index) => index),
    [],
  );
  const roundProgress = Math.max(0, Math.min(1, timeRemaining / Math.max(1, roundDuration)));
  const elapsedRoundProgress = 1 - roundProgress;
  const animatedElapsedRoundProgress = useRef(new Animated.Value(elapsedRoundProgress)).current;
  const comboLabel = normalizeComboLabel(currentAction);
  const comboDescription = currentAction?.description ?? 'JAB - CROSS - LEAD HOOK';
  const isHot = intensity === 'intense' || isFreestyle;
  const isDoubleDigitRound = currentRound >= 10;
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [stopConfirmOpen, setStopConfirmOpen] = useState(false);
  const volumePercent = Math.round(masterVolume * 100);
  const isMuted = muted || volumePercent === 0;
  const redHeaderHeight = 0;
  const timerBandTop = Math.round(height * 0.292);
  const timerBandHeight = Math.round(height * 0.072);
  const timerWrapHeight = Math.max(timerBandHeight + 20, 112);
  const timerWrapTop = timerBandTop - Math.round((timerWrapHeight - timerBandHeight) / 2);
  const timerRingSize = Math.min(280, Math.max(250, Math.round(height * 0.315)));
  const timerRingRadius = timerRingSize / 2 - 9;
  const timerOnlyTop = Math.round(height * 0.3);
  const comboTop = Math.round(height * 0.418);
  const comboHeight = Math.round(height * 0.165);
  const equalizerTop = Math.round(height * 0.626);
  const isFinalTenSeconds = Math.ceil(timeRemaining) <= 10;

  useEffect(() => {
    Animated.timing(animatedElapsedRoundProgress, {
      toValue: elapsedRoundProgress,
      duration: reduceMotion ? 0 : 350,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [animatedElapsedRoundProgress, elapsedRoundProgress, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      actionAnim.setValue(1);
      return;
    }
    actionAnim.setValue(0.86);
    Animated.spring(actionAnim, {
      toValue: 1,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [actionAnim, actionKey, isPaused, reduceMotion]);

  useEffect(() => {
    if (!comboInstructionsEnabled || isPaused || reduceMotion) {
      const settle = Animated.parallel(
        voiceAnim.map(value =>
          Animated.timing(value, {
            toValue: 0,
            duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }),
        ),
      );
      settle.start();

      return () => settle.stop();
    }

    const animations = voiceAnim.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 70),
          Animated.timing(value, {
            toValue: 1,
            duration: 260 + index * 35,
            useNativeDriver: false,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 240 + index * 25,
            useNativeDriver: false,
          }),
        ]),
      ),
    );

    animations.forEach(animation => animation.start());

    return () => {
      animations.forEach(animation => animation.stop());
    };
  }, [comboInstructionsEnabled, isPaused, reduceMotion, voiceAnim]);

  return (
    <ScreenShell>
      <View style={styles.container}>
        <View style={[styles.redPanel, { height: redHeaderHeight }]} />
        <View
          style={[
            styles.timerBand,
            {
              top: timerBandTop,
              height: timerBandHeight,
            },
          ]}
        />
        <View style={styles.header}>
          <View style={styles.sessionType}>
            <Ionicons name="flame-outline" size={26} color={colors.peach} accessibilityElementsHidden />
            <Text style={styles.headerTitle} allowFontScaling={false}>HEAVY BAG</Text>
          </View>

          <TactilePressable
            onPress={() => setVolumeOpen(true)}
            onLongPress={onToggleMute}
            accessibilityRole="button"
            haptic="selection"
            pressedScale={0.9}
            style={styles.soundButton}
            accessibilityLabel="Open volume"
          >
            <Ionicons
              name={isMuted ? 'volume-mute-outline' : 'volume-high-outline'}
              size={25}
              color={colors.text}
              accessibilityElementsHidden
            />
          </TactilePressable>
        </View>

        <View
          style={[
            styles.roundBlock,
            { top: Math.round(height * (comboInstructionsEnabled ? 0.12 : 0.145)) },
          ]}
        >
          <Text style={styles.roundLabel} allowFontScaling={false}>ROUND</Text>
          <Text
            style={[
              styles.roundNumber,
              isDoubleDigitRound && styles.roundNumberCompact,
              isHot && styles.hotRoundNumber,
            ]}
            allowFontScaling={false}
          >
            {currentRound}
          </Text>
        </View>

        {comboInstructionsEnabled ? (
          <View
            style={[
              styles.timerWrap,
              {
                top: timerWrapTop,
                height: timerWrapHeight,
              },
            ]}
          >
            <Text style={styles.timer} allowFontScaling={false}>
              {formatClock(timeRemaining)}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.timerRing,
              {
                top: timerOnlyTop,
                width: timerRingSize,
                height: timerRingSize,
                borderRadius: timerRingSize / 2,
                marginLeft: -timerRingSize / 2,
              },
            ]}
          >
            <View style={styles.timerRingTickLayer} pointerEvents="none" accessibilityElementsHidden>
              {ringTicks.map((index) => {
                const tickOpacity = animatedElapsedRoundProgress.interpolate({
                  inputRange: [index / TIMER_RING_TICK_COUNT, (index + 1) / TIMER_RING_TICK_COUNT],
                  outputRange: [1, 0],
                  extrapolate: 'clamp',
                });

                return (
                  <View key={index} style={styles.timerRingTickSlot}>
                    <View
                      style={[
                        styles.timerRingTick,
                        styles.timerRingTickInactive,
                        {
                          transform: [
                            { rotate: `${(index / TIMER_RING_TICK_COUNT) * 360}deg` },
                            { translateY: -timerRingRadius },
                          ],
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.timerRingTick,
                        styles.timerRingTickActive,
                        isFinalTenSeconds && styles.timerRingTickFinal,
                        {
                          opacity: tickOpacity,
                          transform: [
                            { rotate: `${(index / TIMER_RING_TICK_COUNT) * 360}deg` },
                            { translateY: -timerRingRadius },
                          ],
                        },
                      ]}
                    />
                  </View>
                );
              })}
            </View>
            <Text style={[styles.timer, styles.timerOnly]} allowFontScaling={false}>
              {formatClock(timeRemaining)}
            </Text>
          </View>
        )}

        {comboInstructionsEnabled ? (
          <View style={[styles.comboPanel, { top: comboTop, height: comboHeight }]}>
            {isPaused ? (
              <View style={styles.comboTextWrap}>
                <Text style={styles.comboLabel} allowFontScaling={false}>WORKOUT PAUSED</Text>
                <Text
                  style={styles.comboPausedValue}
                  allowFontScaling={false}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                >
                  {formatClock(timeRemaining)}
                </Text>
                <Text style={styles.comboDescription} allowFontScaling={false}>
                  TAP RESUME WHEN READY
                </Text>
              </View>
            ) : (
              <Animated.View
                key={actionKey}
                style={[
                  styles.comboTextWrap,
                  { transform: [{ scale: actionAnim }], opacity: actionAnim },
                ]}
              >
                <Text style={styles.comboLabel} allowFontScaling={false}>
                  {actionBadge(currentAction?.type ?? 'combo', isFreestyle)}
                </Text>
                <Text
                  style={styles.comboValue}
                  allowFontScaling={false}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.58}
                >
                  {comboLabel}
                </Text>
                <Text
                  style={styles.comboDescription}
                  allowFontScaling={false}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {comboDescription}
                </Text>
              </Animated.View>
            )}
          </View>
        ) : null}

        {comboInstructionsEnabled ? (
          <View style={[styles.equalizer, { top: equalizerTop }]} accessibilityElementsHidden>
            {equalizerBars.map((barHeight, index) => {
              const idleHeight = isPaused || reduceMotion
                ? Math.max(7, Math.round(barHeight * 0.18))
                : Math.max(18, barHeight * 0.48);
              const animatedHeight = voiceAnim[index].interpolate({
                inputRange: [0, 1],
                outputRange: [idleHeight, barHeight],
              });

              return (
                <Animated.View
                  key={`${barHeight}-${index}`}
                  style={[styles.equalizerBar, { height: animatedHeight }]}
                />
              );
            })}
          </View>
        ) : null}

        <View style={styles.controlRow}>
          <TactilePressable
            onPress={isPaused ? onResume : onPause}
            accessibilityRole="button"
            accessibilityLabel={isPaused ? 'Resume workout' : 'Pause workout'}
            haptic="medium"
            pressedScale={0.965}
            style={styles.controlButton}
          >
            {isPaused ? <PlayIcon /> : <PauseIcon />}
            <Text style={styles.controlButtonText} allowFontScaling={false}>
              {isPaused ? 'RESUME' : 'PAUSE'}
            </Text>
          </TactilePressable>

          <TactilePressable
            onPress={onSkipRound}
            accessibilityRole="button"
            haptic="light"
            pressedScale={0.965}
            style={styles.controlButton}
            accessibilityLabel="Skip round"
          >
            <SkipIcon />
            <Text style={styles.controlButtonText} allowFontScaling={false}>SKIP</Text>
          </TactilePressable>
        </View>

        <TactilePressable
          onPress={() => setStopConfirmOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="End workout"
          accessibilityHint="Asks for confirmation before ending your session"
          haptic="selection"
          pressedScale={0.98}
          style={styles.stopButton}
        >
          <StopIcon />
          <Text style={styles.stopButtonText} allowFontScaling={false}>STOP WORKOUT</Text>
        </TactilePressable>

        <VolumeModal
          visible={volumeOpen}
          muted={isMuted}
          volumePercent={volumePercent}
          onChange={onVolumePercentChange}
          onClose={() => setVolumeOpen(false)}
        />
        <StopWorkoutModal
          visible={stopConfirmOpen}
          onContinue={() => setStopConfirmOpen(false)}
          onStop={onStop}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  redPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  timerBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  header: {
    position: 'absolute',
    top: 26,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  headerTitle: {
    color: colors.text,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 1.2,
  },
  soundButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  roundLabel: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 7,
  },
  roundNumber: {
    color: colors.peach,
    fontFamily: 'Anton',
    fontSize: 76,
    lineHeight: 104,
    marginTop: 3,
  },
  roundNumberCompact: {
    fontSize: 58,
    lineHeight: 82,
    marginTop: 2,
  },
  hotRoundNumber: {
    color: colors.peach,
  },
  timerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    width: '100%',
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 86,
    lineHeight: 108,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  timerOnly: {
    fontSize: 112,
    lineHeight: 157,
  },
  timerRing: {
    position: 'absolute',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerRingTickLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerRingTickSlot: {
    position: 'absolute',
  },
  timerRingTick: {
    position: 'absolute',
    width: 2,
    height: 12,
    borderRadius: 1,
  },
  timerRingTickInactive: {
    backgroundColor: colors.accentSoft,
  },
  timerRingTickActive: {
    backgroundColor: colors.accent,
  },
  timerRingTickFinal: {
    width: 3,
    backgroundColor: colors.accentGlow,
  },
  comboPanel: {
    position: 'absolute',
    left: 30,
    right: 29,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  comboTextWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  comboLabel: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 5,
  },
  comboValue: {
    color: colors.text,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 44,
    lineHeight: 52,
    letterSpacing: 9,
    marginTop: 8,
    maxWidth: '92%',
  },
  comboPausedValue: {
    color: colors.text,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 44,
    lineHeight: 52,
    letterSpacing: 10,
    marginTop: 8,
    maxWidth: '92%',
  },
  comboDescription: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensed',
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: 2.6,
    marginTop: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
    maxWidth: '92%',
  },
  equalizer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  equalizerBar: {
    width: 9,
    backgroundColor: colors.peach,
  },
  controlRow: {
    position: 'absolute',
    left: 30,
    right: 30,
    bottom: 92,
    flexDirection: 'row',
    gap: 18,
  },
  controlButton: {
    flex: 1,
    height: 70,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  pauseIcon: {
    width: 22,
    height: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pauseIconBar: {
    width: 7,
    height: 28,
    backgroundColor: colors.text,
  },
  playIcon: {
    width: 0,
    height: 0,
    borderTopWidth: 14,
    borderBottomWidth: 14,
    borderLeftWidth: 22,
    borderTopColor: colors.transparent,
    borderBottomColor: colors.transparent,
    borderLeftColor: colors.text,
    marginLeft: 2,
  },
  skipIcon: {
    width: 31,
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 11,
    borderBottomWidth: 11,
    borderLeftWidth: 13,
    borderTopColor: colors.transparent,
    borderBottomColor: colors.transparent,
    borderLeftColor: colors.text,
    marginRight: 1,
  },
  skipStem: {
    width: 5,
    height: 24,
    backgroundColor: colors.text,
  },
  buttonPrefix: {
    color: colors.text,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.5,
    transform: [{ translateY: -1 }],
  },
  controlButtonText: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: 0,
    transform: [{ translateY: 2 }],
  },
  stopButton: {
    position: 'absolute',
    left: 30,
    right: 30,
    bottom: 18,
    height: 54,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  stopIcon: {
    width: 11,
    height: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
  },
  stopButtonText: {
    color: colors.text,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 2.5,
  },
  volumeModalRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeModalDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  volumeSheet: {
    width: 132,
    height: 384,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeTrack: {
    width: 88,
    height: '100%',
    borderRadius: 0,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  volumeFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  volumeTrackIcon: {
    zIndex: 1,
  },
  stopModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  stopModalDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.62)',
  },
  stopSheet: {
    padding: 22,
    borderWidth: 1,
    borderTopWidth: 3,
    borderColor: 'rgba(249,189,173,0.32)',
    borderTopColor: colors.accent,
    backgroundColor: '#171717',
  },
  stopSheetKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopSheetKickerMark: {
    width: 8,
    height: 8,
    backgroundColor: colors.accent,
  },
  stopSheetKicker: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.8,
  },
  stopSheetTitle: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 44,
    lineHeight: 62,
    marginTop: 13,
  },
  stopSheetCopy: {
    maxWidth: 280,
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 19,
    lineHeight: 23,
    marginTop: 9,
  },
  keepTrainingButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    backgroundColor: colors.text,
  },
  keepTrainingButtonText: {
    color: '#4a1113',
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 1.75,
  },
  confirmStopButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,20,20,0.72)',
  },
  confirmStopButtonText: {
    color: colors.accentGlow,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.75,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.96 }],
  },
});
