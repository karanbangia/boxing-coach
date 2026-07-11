import { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import type { Action } from '@boxing-coach/core';
import { ScreenShell } from '../components/ScreenShell';
import { formatClock } from '../lib/time';
import { colors } from '../theme';

interface Props {
  currentRound: number;
  totalRounds: number;
  timeRemaining: number;
  currentAction: Action | null;
  intensity: 'normal' | 'building' | 'intense';
  isPaused: boolean;
  isFreestyle: boolean;
  actionKey: number;
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
            accessibilityLabel="Coach volume"
            accessibilityValue={{ min: 0, max: 100, now: displayPercent }}
          >
            <Animated.View style={[styles.volumeFill, { height: fillHeight, backgroundColor: fillColor }]} />
            <Ionicons
              name={muted ? 'volume-mute-outline' : 'volume-high-outline'}
              size={31}
              color="#ffffff"
              style={styles.volumeTrackIcon}
              accessibilityElementsHidden
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function WorkoutScreen({
  currentRound,
  timeRemaining,
  currentAction,
  intensity,
  isPaused,
  isFreestyle,
  actionKey,
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
  const comboLabel = normalizeComboLabel(currentAction);
  const comboDescription = currentAction?.description ?? 'JAB - CROSS - LEAD HOOK';
  const isHot = intensity === 'intense' || isFreestyle;
  const isDoubleDigitRound = currentRound >= 10;
  const [volumeOpen, setVolumeOpen] = useState(false);
  const volumePercent = Math.round(masterVolume * 100);
  const isMuted = muted || volumePercent === 0;
  const redHeaderHeight = 0;
  const timerBandTop = Math.round(height * 0.292);
  const timerBandHeight = Math.round(height * 0.072);
  const timerWrapHeight = Math.max(timerBandHeight + 20, 112);
  const timerWrapTop = timerBandTop - Math.round((timerWrapHeight - timerBandHeight) / 2);
  const comboTop = Math.round(height * 0.418);
  const comboHeight = Math.round(height * 0.165);
  const equalizerTop = Math.round(height * 0.626);

  useEffect(() => {
    actionAnim.setValue(0.86);
    Animated.spring(actionAnim, {
      toValue: 1,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [actionAnim, actionKey, isPaused]);

  useEffect(() => {
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
  }, [voiceAnim]);

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

          <Pressable
            onPress={() => setVolumeOpen(true)}
            onLongPress={onToggleMute}
            style={({ pressed }) => [styles.soundButton, pressed && styles.buttonPressed]}
            accessibilityLabel="Open volume"
          >
            <Ionicons
              name={isMuted ? 'volume-mute-outline' : 'volume-high-outline'}
              size={25}
              color="#ffffff"
              accessibilityElementsHidden
            />
          </Pressable>
        </View>

        <View style={[styles.roundBlock, { top: Math.round(height * 0.12) }]}>
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

        <View
          style={[
            styles.timerWrap,
            {
              top: timerWrapTop,
              height: timerWrapHeight,
            },
          ]}
        >
          <Text style={styles.timer} allowFontScaling={false}>{formatClock(timeRemaining)}</Text>
        </View>

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
              style={[styles.comboTextWrap, { transform: [{ scale: actionAnim }], opacity: actionAnim }]}
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

        <View style={[styles.equalizer, { top: equalizerTop }]} accessibilityElementsHidden>
          {equalizerBars.map((barHeight, index) => {
            const animatedHeight = voiceAnim[index].interpolate({
              inputRange: [0, 1],
              outputRange: [Math.max(18, barHeight * 0.48), barHeight],
            });

            return (
              <Animated.View
                key={`${barHeight}-${index}`}
                style={[styles.equalizerBar, { height: animatedHeight }]}
              />
            );
          })}
        </View>

        <View style={styles.controlRow}>
          <Pressable
            onPress={isPaused ? onResume : onPause}
            style={({ pressed }) => [
              styles.controlButton,
              pressed && styles.buttonPressed,
            ]}
          >
            {isPaused ? <PlayIcon /> : <PauseIcon />}
            <Text style={styles.controlButtonText} allowFontScaling={false}>
              {isPaused ? 'RESUME' : 'PAUSE'}
            </Text>
          </Pressable>

          <Pressable
            onPress={onSkipRound}
            style={({ pressed }) => [
              styles.controlButton,
              pressed && styles.buttonPressed,
            ]}
            accessibilityLabel="Skip round"
          >
            <SkipIcon />
            <Text style={styles.controlButtonText} allowFontScaling={false}>SKIP</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={onStop}
          style={({ pressed }) => [styles.stopButton, pressed && styles.buttonPressed]}
        >
          <StopIcon />
          <Text style={styles.stopButtonText} allowFontScaling={false}>STOP WORKOUT</Text>
        </Pressable>

        <VolumeModal
          visible={volumeOpen}
          muted={isMuted}
          volumePercent={volumePercent}
          onChange={onVolumePercentChange}
          onClose={() => setVolumeOpen(false)}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    overflow: 'hidden',
  },
  redPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121212',
  },
  timerBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#121212',
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
    color: '#ead9d5',
    fontFamily: 'SpaceGroteskBold',
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
    color: '#d9c1bd',
    fontFamily: 'SpaceGroteskBold',
    fontSize: 11,
    lineHeight: 12,
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
    color: '#ffc0b4',
  },
  timerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    color: '#ffffff',
    fontFamily: 'Anton',
    fontSize: 86,
    lineHeight: 108,
    fontVariant: ['tabular-nums'],
  },
  comboPanel: {
    position: 'absolute',
    left: 30,
    right: 29,
    backgroundColor: '#1a1b1b',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  comboTextWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  comboLabel: {
    color: '#d9c1bd',
    fontFamily: 'SpaceGroteskBold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 5,
  },
  comboValue: {
    color: '#ffffff',
    fontFamily: 'SpaceGroteskBold',
    fontSize: 44,
    lineHeight: 52,
    letterSpacing: 9,
    marginTop: 8,
    maxWidth: '92%',
  },
  comboPausedValue: {
    color: '#ffffff',
    fontFamily: 'SpaceGroteskBold',
    fontSize: 44,
    lineHeight: 52,
    letterSpacing: 10,
    marginTop: 8,
    maxWidth: '92%',
  },
  comboDescription: {
    color: '#c7bdbb',
    fontFamily: 'SpaceGrotesk',
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
    backgroundColor: '#ffffff',
  },
  playIcon: {
    width: 0,
    height: 0,
    borderTopWidth: 14,
    borderBottomWidth: 14,
    borderLeftWidth: 22,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#ffffff',
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
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#ffffff',
    marginRight: 1,
  },
  skipStem: {
    width: 5,
    height: 24,
    backgroundColor: '#ffffff',
  },
  buttonPrefix: {
    color: '#ffffff',
    fontFamily: 'SpaceGroteskBold',
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.5,
    transform: [{ translateY: -1 }],
  },
  controlButtonText: {
    color: '#ffffff',
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
    borderColor: '#9b7a73',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  stopIcon: {
    width: 11,
    height: 11,
    borderWidth: 2,
    borderColor: '#d9c1bd',
  },
  stopButtonText: {
    color: '#d9c1bd',
    fontFamily: 'SpaceGroteskBold',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 5,
  },
  volumeModalRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeModalDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.58)',
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
    backgroundColor: '#252525',
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
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.96 }],
  },
});
