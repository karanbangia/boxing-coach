import { useEffect, useMemo, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { TactilePressable } from '../components/TactilePressable';
import { colors } from '../theme';

interface Props {
  currentRound: number;
  totalRounds: number;
  timeRemaining: number;
  totalSeconds: number;
  onSkipRest: () => void;
}

const RING_TICK_COUNT = 120;

export function RestScreen({
  currentRound,
  totalRounds,
  timeRemaining,
  totalSeconds,
  onSkipRest,
}: Props) {
  const { height } = useWindowDimensions();
  const compact = height < 760;
  const veryCompact = height < 690;
  const nextRound = Math.min(currentRound + 1, totalRounds);
  const secondsLeft = Math.max(0, Math.ceil(timeRemaining));
  const progress = Math.max(0, Math.min(1, secondsLeft / Math.max(1, totalSeconds)));
  const animatedProgress = useRef(new Animated.Value(progress)).current;
  const ringTicks = useMemo(() => Array.from({ length: RING_TICK_COUNT }, (_, index) => index), []);

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [animatedProgress, progress]);

  return (
    <ScreenShell>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          compact && styles.containerCompact,
          veryCompact && styles.containerVeryCompact,
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.topRail}>
          <View style={styles.roundBlock}>
            <Text style={styles.railLabel} allowFontScaling={false}>Round</Text>
            <Text
              style={[
                styles.roundValue,
                compact && styles.roundValueCompact,
                veryCompact && styles.roundValueVeryCompact,
              ]}
              allowFontScaling={false}
            >
              {currentRound}
              <Text style={styles.roundTotal}>/{totalRounds}</Text>
            </Text>
          </View>

          <View style={styles.nextBlock}>
            <Text style={styles.railLabel} allowFontScaling={false}>Next up</Text>
            <Text
              style={[
                styles.nextValue,
                compact && styles.nextValueCompact,
                veryCompact && styles.nextValueVeryCompact,
              ]}
              allowFontScaling={false}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {nextRound === currentRound ? 'Final bell' : `Round ${nextRound}`}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.centeredContent,
            compact && styles.centeredContentCompact,
            veryCompact && styles.centeredContentVeryCompact,
          ]}
        >
          <View style={styles.hero}>
            <Text
              style={[
                styles.title,
                compact && styles.titleCompact,
                veryCompact && styles.titleVeryCompact,
              ]}
              allowFontScaling={false}
            >
              CATCH YOUR BREATH
            </Text>
            <Text
              style={[
                styles.subtitle,
                compact && styles.subtitleCompact,
                veryCompact && styles.subtitleVeryCompact,
              ]}
              allowFontScaling={false}
            >
              Shake out your arms. Slow nasal breath.{`\n`}Guard comes back up on the bell.
            </Text>
          </View>

          <View
            accessible
            accessibilityLabel={`${secondsLeft} seconds rest remaining`}
            style={[
              styles.timerRing,
              compact && styles.timerRingCompact,
              veryCompact && styles.timerRingVeryCompact,
            ]}
          >
            <View style={styles.progressTickLayer} pointerEvents="none">
              {ringTicks.map((index) => {
                const opacity = animatedProgress.interpolate({
                  inputRange: [index / RING_TICK_COUNT, (index + 1) / RING_TICK_COUNT],
                  outputRange: [0, 1],
                  extrapolate: 'clamp',
                });
                const tickOffset = veryCompact ? -79 : compact ? -89 : -105;
                const transform = [
                  { rotate: `${(index / RING_TICK_COUNT) * 360}deg` },
                  { translateY: tickOffset },
                ];

                return (
                  <View key={index} style={styles.progressTickSlot}>
                    <View
                      style={[styles.progressTick, styles.progressTickInactive, { transform }]}
                    />
                    <Animated.View
                      style={[
                        styles.progressTick,
                        styles.progressTickActive,
                        { opacity, transform },
                      ]}
                    />
                  </View>
                );
              })}
            </View>

            <View style={styles.timerValueWrap}>
              <Text
                style={[
                  styles.timer,
                  compact && styles.timerCompact,
                  veryCompact && styles.timerVeryCompact,
                ]}
                allowFontScaling={false}
              >
                {secondsLeft}
              </Text>
              <Text
                style={[styles.timerLabel, veryCompact && styles.timerLabelVeryCompact]}
                allowFontScaling={false}
              >
                REST LEFT
              </Text>
            </View>
          </View>

          <TactilePressable
            accessibilityRole="button"
            accessibilityLabel="Skip rest"
            onPress={onSkipRest}
            haptic="light"
            pressedScale={0.975}
            style={[
              styles.skipButton,
              compact && styles.skipButtonCompact,
            ]}
          >
            <Ionicons
              name="play-skip-forward"
              size={22}
              color={colors.text}
              accessibilityElementsHidden
            />
            <Text style={styles.skipButtonText} allowFontScaling={false}>SKIP REST</Text>
          </TactilePressable>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 42,
  },
  containerCompact: {
    paddingTop: 10,
    paddingBottom: 24,
  },
  containerVeryCompact: {
    paddingTop: 8,
    paddingBottom: 18,
  },
  topRail: {
    width: '100%',
    maxWidth: 336,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roundBlock: {
    minWidth: 94,
  },
  nextBlock: {
    minWidth: 138,
    alignItems: 'flex-end',
  },
  railLabel: {
    color: '#d9c1bd',
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  roundValue: {
    color: colors.peach,
    fontFamily: 'Anton',
    fontSize: 40,
    lineHeight: 52,
  },
  roundValueCompact: {
    fontSize: 36,
    lineHeight: 48,
  },
  roundValueVeryCompact: {
    fontSize: 32,
    lineHeight: 44,
  },
  roundTotal: {
    color: colors.text,
  },
  nextValue: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 40,
    lineHeight: 52,
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  nextValueCompact: {
    fontSize: 36,
    lineHeight: 48,
  },
  nextValueVeryCompact: {
    fontSize: 32,
    lineHeight: 44,
  },
  centeredContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 336,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 38,
  },
  centeredContentCompact: {
    justifyContent: 'flex-start',
    gap: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  centeredContentVeryCompact: {
    gap: 18,
    paddingTop: 14,
    paddingBottom: 18,
  },
  hero: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    color: colors.peach,
    fontFamily: 'Anton',
    fontSize: 48,
    lineHeight: 62,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  titleCompact: {
    fontSize: 42,
    lineHeight: 56,
  },
  titleVeryCompact: {
    fontSize: 36,
    lineHeight: 48,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 18,
    lineHeight: 21,
    marginTop: 12,
    textAlign: 'center',
  },
  subtitleCompact: {
    marginTop: 9,
  },
  subtitleVeryCompact: {
    fontSize: 15,
    lineHeight: 19,
    marginTop: 7,
  },
  timerRing: {
    width: 222,
    height: 222,
    borderRadius: 111,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerRingCompact: {
    width: 190,
    height: 190,
    borderRadius: 95,
  },
  timerRingVeryCompact: {
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  progressTickLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTickSlot: {
    position: 'absolute',
  },
  progressTick: {
    position: 'absolute',
    width: 2,
    height: 10,
    borderRadius: 1,
  },
  progressTickActive: {
    backgroundColor: colors.accent,
  },
  progressTickInactive: {
    backgroundColor: 'rgba(255, 20, 20, 0.18)',
  },
  timerValueWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  timer: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 72,
    lineHeight: 94,
    fontVariant: ['tabular-nums'],
    transform: [{ translateY: 4 }],
  },
  timerCompact: {
    fontSize: 64,
    lineHeight: 86,
  },
  timerVeryCompact: {
    fontSize: 56,
    lineHeight: 76,
  },
  timerLabel: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 3.2,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  timerLabelVeryCompact: {
    marginTop: 5,
  },
  skipButton: {
    width: '100%',
    minHeight: 58,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  skipButtonCompact: {
    minHeight: 56,
  },
  skipButtonText: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 26,
    lineHeight: 36,
    textTransform: 'uppercase',
    transform: [{ translateY: 2 }],
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
