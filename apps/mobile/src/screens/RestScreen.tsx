import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { formatSeconds } from '../lib/time';
import { colors, shadow } from '../theme';

interface Props {
  currentRound: number;
  totalRounds: number;
  timeRemaining: number;
  onSkipRest: () => void;
}

export function RestScreen({ currentRound, totalRounds, timeRemaining, onSkipRest }: Props) {
  const pulse = useRef(new Animated.Value(0.9)).current;

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
      <View style={styles.container}>
        <Text style={styles.kicker}>ROUND {currentRound} COMPLETE</Text>
        <Text style={styles.title}>Recover. Breathe. Reset.</Text>
        <Text style={styles.subtitle}>
          Round {Math.min(currentRound + 1, totalRounds)} of {totalRounds} is next.
        </Text>

        <View style={styles.timerWrap}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulse }],
                opacity: pulse,
              },
            ]}
          />
          <View style={styles.timerCard}>
            <Text style={styles.timerText}>{formatSeconds(timeRemaining)}</Text>
            <Text style={styles.timerLabel}>SECONDS</Text>
          </View>
        </View>

        <Pressable
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
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  kicker: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 10,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
    textAlign: 'center',
  },
  timerWrap: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  pulseRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(244, 79, 90, 0.18)',
  },
  timerCard: {
    width: 176,
    height: 176,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: 'rgba(244, 79, 90, 0.35)',
    ...shadow,
  },
  timerText: {
    color: colors.accent,
    fontSize: 64,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.8,
    marginTop: 4,
  },
  button: {
    minWidth: 190,
    minHeight: 58,
    paddingHorizontal: 24,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    ...shadow,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.7,
  },
});
