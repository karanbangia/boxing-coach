import { useRef, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { CannonConfetti, PIConfetti } from 'react-native-fast-confetti';
import type { WorkoutPerformance } from '@boxing-coach/core';
import { ScreenShell } from '../components/ScreenShell';
import { TactilePressable } from '../components/TactilePressable';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { colors } from '../theme';

interface Props {
  performance: WorkoutPerformance;
  onReturnToGym: () => void;
}

const APP_NAME = 'Boxing Coach';
const DOWNLOAD_LINK = '';

export function CompleteScreen({ performance, onReturnToGym }: Props) {
  const cardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const [burstKey, setBurstKey] = useState(0);
  const reduceMotion = useReducedMotion();

  const handleShare = async () => {
    if (!cardRef.current || isSharing) return;
    setIsSharing(true);
    setShareStatus('');

    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      const capturedFile = new File(uri);
      const brandedFile = new File(Paths.cache, 'boxing-coach-performance.png');
      if (brandedFile.exists) brandedFile.delete();
      capturedFile.copy(brandedFile);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(brandedFile.uri, {
          mimeType: 'image/png',
          dialogTitle: `Share ${APP_NAME} performance`,
          UTI: 'public.png',
        });
      } else {
        await Share.share({
          title: `${APP_NAME} performance`,
          message: DOWNLOAD_LINK ? `${APP_NAME}\n${DOWNLOAD_LINK}` : APP_NAME,
        });
      }
    } catch {
      setShareStatus('TRY AGAIN');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <ScreenShell>
      <View style={styles.container}>
        {!reduceMotion ? (
          <View style={styles.confettiLayer} pointerEvents="none" accessibilityElementsHidden>
            <CannonConfetti autoplay gravity={3} containerStyle={styles.confettiCanvas}>
              <CannonConfetti.Origin position="bottom-left" count={150} initialSpeed={3}>
                <CannonConfetti.Flake size={12} radius={6} />
              </CannonConfetti.Origin>
              <CannonConfetti.Origin position="bottom-right" count={150} initialSpeed={3}>
                <CannonConfetti.Flake size={12} />
              </CannonConfetti.Origin>
            </CannonConfetti>

            {burstKey > 0 ? (
              <PIConfetti key={burstKey} autoplay containerStyle={styles.confettiCanvas}>
                <PIConfetti.Origin blastPosition="center" count={200}>
                  <PIConfetti.Flake size={12} />
                </PIConfetti.Origin>
              </PIConfetti>
            ) : null}
          </View>
        ) : null}

        <View ref={cardRef} collapsable={false} style={styles.shareCard}>
          <TactilePressable
            accessibilityRole="button"
            accessibilityLabel="Celebrate session complete"
            hitSlop={10}
            onPress={() => setBurstKey(key => key + 1)}
            haptic="success"
            pressedScale={0.985}
            style={styles.titleBlock}
          >
            <Text style={styles.titleTop} allowFontScaling={false}>SESSION</Text>
            <Text style={styles.titleBottom} allowFontScaling={false}>COMPLETE</Text>
          </TactilePressable>

          <View style={styles.primaryMetric}>
            <Text style={styles.metricLabel} allowFontScaling={false}>TOTAL VOLUME</Text>
            <Text style={styles.punchValue} allowFontScaling={false}>{performance.punches}</Text>
            <Text style={styles.punchLabel} allowFontScaling={false}>PUNCHES</Text>
          </View>

          <View style={styles.secondaryMetrics}>
            <View style={styles.secondaryMetric}>
              <Text style={styles.smallLabel} allowFontScaling={false}>AVG HEART RATE</Text>
              <View style={styles.valueRow}>
                <Text style={styles.secondaryValue} allowFontScaling={false}>{performance.averageHeartRate}</Text>
                <Text style={styles.unit} allowFontScaling={false}>BPM</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.secondaryMetric}>
              <Text style={styles.smallLabel} allowFontScaling={false}>CALORIES BURNED</Text>
              <View style={styles.valueRow}>
                <Text style={styles.secondaryValue} allowFontScaling={false}>{performance.caloriesBurned}</Text>
                <Text style={styles.unit} allowFontScaling={false}>KCAL</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TactilePressable
            accessibilityRole="button"
            accessibilityLabel="Share performance"
            disabled={isSharing}
            onPress={handleShare}
            haptic="medium"
            pressedScale={0.975}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText} allowFontScaling={false}>
              {isSharing ? 'PREPARING...' : shareStatus || 'SHARE PERFORMANCE'}
            </Text>
          </TactilePressable>
          <TactilePressable
            accessibilityRole="button"
            accessibilityLabel="Return to gym"
            onPress={onReturnToGym}
            haptic="light"
            pressedScale={0.98}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText} allowFontScaling={false}>RETURN TO GYM</Text>
          </TactilePressable>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    overflow: 'hidden',
  },
  confettiCanvas: {
    ...StyleSheet.absoluteFillObject,
  },
  shareCard: {
    width: '100%',
    maxWidth: 400,
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
    paddingTop: 20,
    backgroundColor: 'transparent',
    zIndex: 3,
  },
  titleBlock: {
    alignItems: 'center',
  },
  titleTop: {
    color: colors.peach,
    fontFamily: 'Anton',
    fontSize: 56,
    lineHeight: 72,
    paddingTop: 5,
    includeFontPadding: true,
  },
  titleBottom: {
    color: colors.accent,
    fontFamily: 'Anton',
    fontSize: 64,
    lineHeight: 80,
    marginTop: -12,
    paddingTop: 5,
    includeFontPadding: true,
  },
  primaryMetric: {
    width: '100%',
    alignItems: 'center',
    marginTop: 32,
  },
  metricLabel: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 1.1,
    paddingTop: 3,
    includeFontPadding: true,
  },
  punchValue: {
    width: '100%',
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 88,
    lineHeight: 108,
    textAlign: 'center',
    paddingTop: 20,
    includeFontPadding: true,
  },
  punchLabel: {
    color: colors.accent,
    fontFamily: 'Anton',
    fontSize: 24,
    lineHeight: 34,
    letterSpacing: 2.5,
    includeFontPadding: true,
  },
  secondaryMetrics: {
    width: '100%',
    maxWidth: 336,
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 26,
  },
  secondaryMetric: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
  },
  smallLabel: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 1.1,
    paddingTop: 3,
    includeFontPadding: true,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryValue: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 48,
    lineHeight: 62,
    paddingTop: 4,
    includeFontPadding: true,
  },
  unit: {
    color: colors.peach,
    fontFamily: 'Anton',
    fontSize: 24,
    lineHeight: 31,
    marginLeft: 4,
    marginTop: 12,
    paddingTop: 3,
    includeFontPadding: true,
  },
  actions: {
    width: '100%',
    maxWidth: 352,
    marginTop: 44,
    zIndex: 3,
  },
  primaryButton: {
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  primaryButtonText: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 28,
    lineHeight: 42,
    letterSpacing: 1.2,
    paddingTop: 4,
    includeFontPadding: true,
  },
  secondaryButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(26,26,26,0.64)',
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 2.5,
    paddingTop: 3,
    includeFontPadding: true,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
});
