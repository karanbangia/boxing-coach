import { useRef, useState } from 'react';
import {
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { CannonConfetti, PIConfetti } from 'react-native-fast-confetti';
import type { WorkoutFeedback, WorkoutPerformance } from '@boxing-coach/core';
import type { SetupSettings } from '../config';
import type { ProgramSession } from '../features/programs/programs';
import { ScreenShell } from '../components/ScreenShell';
import { TactilePressable } from '../components/TactilePressable';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { colors } from '../theme';

export interface NextWorkoutRecommendation {
  title: string;
  detail: string;
  buttonLabel: string;
  settings: SetupSettings | null;
  programSession?: ProgramSession | null;
}

interface Props {
  performance: WorkoutPerformance;
  totalRounds: number;
  roundDuration: number;
  onReturnToGym: () => void;
  onSubmitFeedback: (feedback: WorkoutFeedback) => NextWorkoutRecommendation;
  onLoadNextWorkout: (recommendation: NextWorkoutRecommendation) => void;
  canEnableReminders: boolean;
  onEnableReminders: () => Promise<void>;
  initialFeedback?: WorkoutFeedback;
}

const APP_NAME = 'Boxing Coach';
const DOWNLOAD_LINK = '';
const FEEDBACK_OPTIONS: {
  value: WorkoutFeedback;
  label: string;
  accessibilityLabel: string;
}[] = [
  { value: 'too_easy', label: 'TOO EASY', accessibilityLabel: 'Workout felt too easy' },
  { value: 'just_right', label: 'JUST RIGHT', accessibilityLabel: 'Workout felt just right' },
  { value: 'too_hard', label: 'TOO HARD', accessibilityLabel: 'Workout felt too hard' },
];

function formatTrainingTime(totalRounds: number, roundDuration: number) {
  const totalMinutes = Math.round((totalRounds * roundDuration) / 60);
  return `${totalMinutes}`;
}

export function CompleteScreen({
  performance,
  totalRounds,
  roundDuration,
  onReturnToGym,
  onSubmitFeedback,
  onLoadNextWorkout,
  canEnableReminders,
  onEnableReminders,
  initialFeedback,
}: Props) {
  const cardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const [burstKey, setBurstKey] = useState(0);
  const [reminderBusy, setReminderBusy] = useState(false);
  const [feedback, setFeedback] = useState<WorkoutFeedback | null>(initialFeedback ?? null);
  const [recommendation, setRecommendation] = useState<NextWorkoutRecommendation | null>(() =>
    initialFeedback ? onSubmitFeedback(initialFeedback) : null);
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

  const handleEnableReminders = async () => {
    if (reminderBusy) return;
    setReminderBusy(true);
    try {
      await onEnableReminders();
    } finally {
      setReminderBusy(false);
    }
  };

  const handleFeedback = (value: WorkoutFeedback) => {
    if (feedback) return;
    setFeedback(value);
    setRecommendation(onSubmitFeedback(value));
  };

  return (
    <ScreenShell>
      <View style={styles.container}>
        {!reduceMotion ? (
          <View style={styles.confettiLayer} pointerEvents="none" accessibilityElementsHidden>
            <CannonConfetti autoplay gravity={3} containerStyle={styles.confettiCanvas}>
              <CannonConfetti.Origin position="bottom-left" count={120} initialSpeed={3}>
                <CannonConfetti.Flake size={10} radius={5} />
              </CannonConfetti.Origin>
              <CannonConfetti.Origin position="bottom-right" count={120} initialSpeed={3}>
                <CannonConfetti.Flake size={10} />
              </CannonConfetti.Origin>
            </CannonConfetti>

            {burstKey > 0 ? (
              <PIConfetti key={burstKey} autoplay containerStyle={styles.confettiCanvas}>
                <PIConfetti.Origin blastPosition="center" count={160}>
                  <PIConfetti.Flake size={10} />
                </PIConfetti.Origin>
              </PIConfetti>
            ) : null}
          </View>
        ) : null}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
              <Text style={styles.punchLabel} allowFontScaling={false}>PUNCHES CALLED</Text>
            </View>

            <View style={styles.secondaryMetrics}>
              <View style={styles.secondaryMetric}>
                <Text style={styles.smallLabel} allowFontScaling={false}>ROUNDS</Text>
                <View style={styles.valueRow}>
                  <Text style={styles.secondaryValue} allowFontScaling={false}>{totalRounds}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.secondaryMetric}>
                <Text style={styles.smallLabel} allowFontScaling={false}>TRAINING TIME</Text>
                <View style={styles.valueRow}>
                  <Text style={styles.secondaryValue} allowFontScaling={false}>
                    {formatTrainingTime(totalRounds, roundDuration)}
                  </Text>
                  <Text style={styles.unit} allowFontScaling={false}>MIN</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.secondaryMetric}>
                <Text style={styles.smallLabel} allowFontScaling={false}>EST. CALORIES</Text>
                <View style={styles.valueRow}>
                  <Text style={styles.secondaryValue} allowFontScaling={false}>
                    {performance.caloriesBurned}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackEyebrow} allowFontScaling={false}>TUNE YOUR NEXT SESSION</Text>
            <Text style={styles.feedbackTitle} allowFontScaling={false}>HOW DID THAT FEEL?</Text>
            <View
              accessibilityRole="radiogroup"
              style={styles.feedbackOptions}
            >
              {FEEDBACK_OPTIONS.map(option => {
                const selected = feedback === option.value;
                return (
                  <TactilePressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityLabel={option.accessibilityLabel}
                    accessibilityState={{ selected, disabled: Boolean(feedback) && !selected }}
                    disabled={Boolean(feedback)}
                    onPress={() => handleFeedback(option.value)}
                    haptic="selection"
                    pressedScale={0.97}
                    style={[
                      styles.feedbackButton,
                      selected && styles.feedbackButtonSelected,
                      feedback && !selected && styles.feedbackButtonMuted,
                    ]}
                  >
                    <Text
                      style={[
                        styles.feedbackButtonText,
                        selected && styles.feedbackButtonTextSelected,
                      ]}
                      allowFontScaling={false}
                    >
                      {option.label}
                    </Text>
                  </TactilePressable>
                );
              })}
            </View>

            {recommendation ? (
              <View style={styles.recommendation} accessibilityLiveRegion="polite">
                <Text style={styles.recommendationLabel} allowFontScaling={false}>YOUR NEXT WORKOUT</Text>
                <Text style={styles.recommendationTitle} allowFontScaling={false}>
                  {recommendation.title}
                </Text>
                <Text style={styles.recommendationDetail}>{recommendation.detail}</Text>
                {recommendation.settings ? (
                  <TactilePressable
                    accessibilityRole="button"
                    accessibilityLabel={recommendation.buttonLabel}
                    onPress={() => onLoadNextWorkout(recommendation)}
                    haptic="medium"
                    pressedScale={0.975}
                    style={styles.loadNextButton}
                  >
                    <Text style={styles.loadNextButtonText} allowFontScaling={false}>
                      {recommendation.buttonLabel}
                    </Text>
                  </TactilePressable>
                ) : null}
              </View>
            ) : null}
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
            {canEnableReminders ? (
              <TactilePressable
                accessibilityRole="button"
                accessibilityLabel="Set training reminders"
                disabled={reminderBusy}
                onPress={() => void handleEnableReminders()}
                haptic="light"
                pressedScale={0.98}
                style={styles.reminderButton}
              >
                <Text style={styles.reminderButtonText} allowFontScaling={false}>
                  {reminderBusy ? 'CHECKING PERMISSION...' : 'SET TRAINING REMINDERS'}
                </Text>
              </TactilePressable>
            ) : null}
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
        </ScrollView>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
    zIndex: 3,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
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
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 22,
    backgroundColor: colors.background,
  },
  titleBlock: {
    alignItems: 'center',
  },
  titleTop: {
    color: colors.peach,
    fontFamily: 'Anton',
    fontSize: 46,
    lineHeight: 58,
    paddingTop: 4,
    includeFontPadding: true,
  },
  titleBottom: {
    color: colors.accent,
    fontFamily: 'Anton',
    fontSize: 54,
    lineHeight: 68,
    marginTop: -11,
    paddingTop: 4,
    includeFontPadding: true,
  },
  primaryMetric: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  metricLabel: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 1.2,
    includeFontPadding: true,
  },
  punchValue: {
    width: '100%',
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 72,
    lineHeight: 88,
    textAlign: 'center',
    paddingTop: 10,
    includeFontPadding: true,
  },
  punchLabel: {
    color: colors.accent,
    fontFamily: 'Anton',
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: 2.4,
    includeFontPadding: true,
  },
  secondaryMetrics: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 24,
  },
  secondaryMetric: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
  },
  smallLabel: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 0.8,
    textAlign: 'center',
    includeFontPadding: true,
  },
  valueRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  secondaryValue: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 34,
    lineHeight: 44,
    includeFontPadding: true,
  },
  unit: {
    color: colors.peach,
    fontFamily: 'Anton',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 3,
    marginTop: 10,
    includeFontPadding: true,
  },
  feedbackCard: {
    width: '100%',
    maxWidth: 400,
    marginTop: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(26,26,26,0.9)',
  },
  feedbackEyebrow: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.6,
  },
  feedbackTitle: {
    marginTop: 3,
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 27,
    lineHeight: 38,
    letterSpacing: 0.7,
  },
  feedbackOptions: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 12,
  },
  feedbackButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  feedbackButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  feedbackButtonMuted: {
    opacity: 0.45,
  },
  feedbackButtonText: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.6,
  },
  feedbackButtonTextSelected: {
    color: colors.text,
  },
  recommendation: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  recommendationLabel: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1.5,
  },
  recommendationTitle: {
    marginTop: 3,
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 25,
    lineHeight: 35,
    letterSpacing: 0.6,
  },
  recommendationDetail: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensed',
    fontSize: 15,
    lineHeight: 21,
  },
  loadNextButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    backgroundColor: colors.accent,
  },
  loadNextButtonText: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 21,
    lineHeight: 30,
    letterSpacing: 0.8,
  },
  actions: {
    width: '100%',
    maxWidth: 400,
    marginTop: 16,
  },
  primaryButton: {
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryButtonText: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 22,
    lineHeight: 32,
    letterSpacing: 1,
  },
  secondaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(26,26,26,0.64)',
  },
  reminderButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.peach,
    backgroundColor: 'rgba(26,26,26,0.64)',
  },
  reminderButtonText: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 1.6,
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: 2.5,
  },
});
