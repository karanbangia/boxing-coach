import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { colors } from '../theme';

interface Props {
  secondsLeft: number;
  totalSeconds: number;
  onSkip: () => void;
  onCancel: () => void;
}

const RING_TICK_COUNT = 120;

export function PrepScreen({ secondsLeft, totalSeconds, onSkip, onCancel }: Props) {
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
      <View style={styles.container}>
        <View style={styles.redGlow} pointerEvents="none" />

        <View style={styles.hero}>
          <View style={styles.titleWrap}>
            <Text style={styles.titleTop} allowFontScaling={false}>GET</Text>
            <Text style={styles.titleBottom} allowFontScaling={false}>READY!</Text>
          </View>

          <Text style={styles.microCopy} allowFontScaling={false}>
            Round starts in
          </Text>

          <View style={styles.timerRing}>
            <View style={styles.progressTickLayer} pointerEvents="none">
              {ringTicks.map((index) => {
                const opacity = animatedProgress.interpolate({
                  inputRange: [index / RING_TICK_COUNT, (index + 1) / RING_TICK_COUNT],
                  outputRange: [0, 1],
                  extrapolate: 'clamp',
                });

                return (
                  <View key={index} style={styles.progressTickSlot}>
                    <View
                      style={[
                        styles.progressTick,
                        styles.progressTickInactive,
                        {
                          transform: [
                            { rotate: `${(index / RING_TICK_COUNT) * 360}deg` },
                            { translateY: -83 },
                          ],
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.progressTick,
                        styles.progressTickActive,
                        {
                          opacity,
                          transform: [
                            { rotate: `${(index / RING_TICK_COUNT) * 360}deg` },
                            { translateY: -83 },
                          ],
                        },
                      ]}
                    />
                  </View>
                );
              })}
            </View>
            <View style={styles.innerRing} />
            <Text style={styles.timer} allowFontScaling={false}>{secondsLeft}</Text>
          </View>

          <Text style={styles.subtitle} allowFontScaling={false}>
            Gloves up. Find{'\n'}your stance.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start now"
            onPress={onSkip}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
          >
            <View style={styles.playTriangle} />
            <Text style={styles.primaryBtnText} allowFontScaling={false}>START NOW</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel workout"
            onPress={onCancel}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
          >
            <View style={styles.cancelIcon} accessibilityElementsHidden>
              <View style={[styles.cancelIconBar, styles.cancelIconBarForward]} />
              <View style={[styles.cancelIconBar, styles.cancelIconBarBack]} />
            </View>
            <Text style={styles.secondaryBtnText} allowFontScaling={false}>CANCEL WORKOUT</Text>
          </Pressable>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 42,
    overflow: 'hidden',
  },
  redGlow: {
    position: 'absolute',
    top: 128,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 20, 20, 0.05)',
  },
  hero: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  titleWrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 2,
  },
  titleTop: {
    color: colors.peach,
    fontFamily: 'Anton',
    fontSize: 46,
    lineHeight: 56,
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  titleBottom: {
    color: colors.accent,
    fontFamily: 'Anton',
    fontSize: 52,
    lineHeight: 64,
    letterSpacing: 0,
    textTransform: 'uppercase',
    marginTop: -10,
  },
  microCopy: {
    color: colors.textMuted,
    fontFamily: 'SpaceGroteskBold',
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    marginTop: 27,
    marginBottom: 15,
  },
  timerRing: {
    width: 178,
    height: 178,
    borderRadius: 89,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
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
  innerRing: {
    position: 'absolute',
    width: 142,
    height: 142,
    borderRadius: 71,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  timer: {
    color: colors.peach,
    fontFamily: 'Anton',
    fontSize: 72,
    lineHeight: 94,
    letterSpacing: 0,
    fontVariant: ['tabular-nums'],
    transform: [{ translateY: 6 }],
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrowBold',
    fontSize: 26,
    lineHeight: 29,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    maxWidth: 336,
  },
  primaryBtn: {
    minHeight: 58,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  primaryBtnText: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: 0,
    textTransform: 'uppercase',
    transform: [{ translateY: 2 }],
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.text,
  },
  secondaryBtn: {
    minHeight: 56,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26,26,26,0.64)',
  },
  cancelIcon: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelIconBar: {
    position: 'absolute',
    width: 12,
    height: 2,
    borderRadius: 999,
    backgroundColor: colors.textMuted,
  },
  cancelIconBarForward: {
    transform: [{ rotate: '45deg' }],
  },
  cancelIconBarBack: {
    transform: [{ rotate: '-45deg' }],
  },
  secondaryBtnText: {
    color: colors.textMuted,
    fontFamily: 'SpaceGroteskBold',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
