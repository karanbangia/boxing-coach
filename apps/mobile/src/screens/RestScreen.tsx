import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { formatClock } from '../lib/time';
import { colors, shadow } from '../theme';

interface Props {
  currentRound: number;
  totalRounds: number;
  timeRemaining: number;
  onSkipRest: () => void;
}

export function RestScreen({ currentRound, totalRounds, timeRemaining, onSkipRest }: Props) {
  const pulse = useRef(new Animated.Value(0.9)).current;
  const nextRound = Math.min(currentRound + 1, totalRounds);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.9,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse]);

  return (
    <ScreenShell>
      <View pointerEvents="none" style={styles.redWash} />
      <View pointerEvents="none" style={styles.redGlow} />
      <View style={styles.container}>
        <View style={styles.topRail}>
          <View style={styles.roundBlock}>
            <Text style={styles.railLabel} allowFontScaling={false}>Round</Text>
            <Text style={styles.railValue} allowFontScaling={false}>
              {currentRound}
              <Text style={styles.railValueMuted}>/{totalRounds}</Text>
            </Text>
          </View>

          <View style={styles.nextBlock}>
            <Text style={styles.railLabel} allowFontScaling={false}>Next up</Text>
            <Text style={styles.nextValue} allowFontScaling={false}>
              {nextRound === currentRound ? 'Final bell' : `Round ${nextRound}`}
            </Text>
          </View>
        </View>

        <View style={styles.stage}>
          <Text style={styles.kicker} allowFontScaling={false}>RESTING</Text>
          <Text style={styles.title} allowFontScaling={false}>CATCH YOUR BREATH</Text>
          <Text style={styles.subtitle} allowFontScaling={false}>
            Shake out your arms. Slow nasal breath. Guard comes back up on the bell.
          </Text>
        </View>

        <View style={styles.timerWrap} accessibilityLabel={`${formatClock(timeRemaining)} rest remaining`}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulse }],
                opacity: pulse,
              },
            ]}
          />
          <View style={styles.outerRing} />
          <View style={styles.timerCard}>
            <Text style={styles.timerText} allowFontScaling={false}>
              {formatClock(timeRemaining)}
            </Text>
            <Text style={styles.timerLabel} allowFontScaling={false}>REST LEFT</Text>
          </View>
        </View>

        <View style={styles.breathPanel}>
          <Text style={styles.breathCue} allowFontScaling={false}>IN 4</Text>
          <View style={styles.breathDivider} />
          <Text style={styles.breathCue} allowFontScaling={false}>OUT 6</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip rest"
          onPress={onSkipRest}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>SKIP REST</Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  redWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 230,
    backgroundColor: 'rgba(255,20,20,0.1)',
  },
  redGlow: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(255,20,20,0.16)',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  topRail: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 16,
  },
  roundBlock: {
    minWidth: 94,
  },
  nextBlock: {
    minWidth: 112,
    alignItems: 'flex-end',
  },
  railLabel: {
    color: colors.textMuted,
    fontFamily: 'SpaceGroteskBold',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  railValue: {
    color: colors.peach,
    fontFamily: 'Anton',
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: 0,
  },
  railValueMuted: {
    color: colors.textMuted,
  },
  nextValue: {
    color: colors.text,
    fontFamily: 'SpaceGroteskBold',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  stage: {
    width: '100%',
    alignItems: 'center',
    marginTop: 44,
  },
  kicker: {
    color: colors.accent,
    fontFamily: 'SpaceGroteskBold',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 2.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: colors.peach,
    fontFamily: 'Anton',
    fontSize: 52,
    lineHeight: 62,
    letterSpacing: 0,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 17,
    lineHeight: 22,
    marginTop: 10,
    textAlign: 'center',
    maxWidth: 322,
  },
  timerWrap: {
    width: 286,
    height: 286,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  pulseRing: {
    position: 'absolute',
    width: 256,
    height: 256,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: 'rgba(255, 20, 20, 0.24)',
  },
  outerRing: {
    position: 'absolute',
    width: 244,
    height: 244,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.border,
  },
  timerCard: {
    width: 202,
    height: 202,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderWidth: 10,
    borderColor: colors.background,
    ...shadow,
  },
  timerText: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 58,
    lineHeight: 70,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
    transform: [{ translateY: 4 }],
  },
  timerLabel: {
    color: colors.text,
    fontFamily: 'SpaceGroteskBold',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  breathPanel: {
    width: '100%',
    maxWidth: 320,
    minHeight: 58,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  breathCue: {
    flex: 1,
    color: colors.peach,
    fontFamily: 'SpaceGroteskBold',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 1.8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  breathDivider: {
    width: 2,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  button: {
    width: '100%',
    maxWidth: 320,
    minHeight: 58,
    marginTop: 14,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: colors.text,
    fontFamily: 'SpaceGroteskBold',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
});
