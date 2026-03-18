import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Action } from '@boxing-coach/core';
import { ScreenShell } from '../components/ScreenShell';
import { formatClock } from '../lib/time';
import { colors, shadow } from '../theme';

interface Props {
  currentRound: number;
  totalRounds: number;
  timeRemaining: number;
  currentAction: Action | null;
  intensity: 'normal' | 'building' | 'intense';
  isPaused: boolean;
  isFreestyle: boolean;
  actionKey: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

function intensityColor(intensity: 'normal' | 'building' | 'intense', isFreestyle: boolean) {
  if (isFreestyle) return colors.red;

  switch (intensity) {
    case 'normal':
      return colors.green;
    case 'building':
      return colors.yellow;
    case 'intense':
      return colors.red;
  }
}

function actionColor(type: string, isFreestyle: boolean) {
  if (isFreestyle) return colors.accent;

  switch (type) {
    case 'movement':
      return colors.blue;
    case 'defense':
      return colors.amber;
    default:
      return colors.text;
  }
}

function actionBadge(type: string, isFreestyle: boolean) {
  if (isFreestyle) return 'FINISH STRONG';
  if (type === 'movement') return 'MOVEMENT';
  if (type === 'defense') return 'DEFENSE';
  return null;
}

export function WorkoutScreen({
  currentRound,
  totalRounds,
  timeRemaining,
  currentAction,
  intensity,
  isPaused,
  isFreestyle,
  actionKey,
  onPause,
  onResume,
  onStop,
}: Props) {
  const color = intensityColor(intensity, isFreestyle);
  const actionAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    actionAnim.setValue(0.86);
    Animated.spring(actionAnim, {
      toValue: 1,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [actionAnim, actionKey, isPaused]);

  return (
    <ScreenShell>
      <View style={styles.container}>
        <View style={[styles.intensityBar, { backgroundColor: color }]} />

        <View style={styles.header}>
          <View style={styles.metricPanel}>
            <Text style={styles.metricLabel}>Round</Text>
            <Text style={styles.metricValue}>
              {currentRound}
              <Text style={styles.metricMuted}>/{totalRounds}</Text>
            </Text>
          </View>

          <View style={[styles.metricPanel, styles.metricPanelRight]}>
            <Text style={styles.metricLabel}>{isFreestyle ? 'Finish' : 'Time'}</Text>
            <Text style={[styles.metricValue, styles.metricTimer, { color }]}>
              {formatClock(timeRemaining)}
            </Text>
          </View>
        </View>

        <View style={styles.centerStage}>
          {isPaused ? (
            <View style={styles.pausedWrap}>
              <Text style={styles.pausedTitle}>PAUSED</Text>
              <Text style={styles.pausedTime}>{formatClock(timeRemaining)} remaining</Text>
            </View>
          ) : currentAction ? (
            <Animated.View
              key={actionKey}
              style={[
                styles.actionCard,
                {
                  transform: [{ scale: actionAnim }],
                  opacity: actionAnim,
                },
              ]}
            >
              {actionBadge(currentAction.type, isFreestyle) ? (
                <Text style={[styles.actionBadge, { color: actionColor(currentAction.type, isFreestyle) }]}>
                  {actionBadge(currentAction.type, isFreestyle)}
                </Text>
              ) : null}

              <Text style={[styles.actionLabel, { color: actionColor(currentAction.type, isFreestyle) }]}>
                {currentAction.label}
              </Text>
              <Text style={styles.actionDescription}>{currentAction.description}</Text>
            </Animated.View>
          ) : (
            <View style={styles.readyWrap}>
              <Text style={styles.readyLabel}>GET READY</Text>
            </View>
          )}
        </View>

        <View style={styles.controlRow}>
          <Pressable
            onPress={onStop}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>END</Text>
          </Pressable>

          <Pressable
            onPress={isPaused ? onResume : onPause}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>{isPaused ? 'GO' : 'PAUSE'}</Text>
          </Pressable>

          <View style={styles.secondaryButtonSpacer} />
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  intensityBar: {
    height: 6,
    borderRadius: 999,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  metricPanel: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    minWidth: 124,
  },
  metricPanelRight: {
    alignItems: 'flex-end',
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  metricValue: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  metricMuted: {
    color: colors.textMuted,
  },
  metricTimer: {
    fontVariant: ['tabular-nums'],
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
  },
  actionCard: {
    paddingHorizontal: 22,
    paddingVertical: 30,
    alignItems: 'center',
  },
  actionBadge: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 3.2,
    marginBottom: 16,
  },
  actionLabel: {
    textAlign: 'center',
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '900',
    letterSpacing: 1,
  },
  actionDescription: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 16,
  },
  pausedWrap: {
    alignItems: 'center',
  },
  pausedTitle: {
    color: colors.textMuted,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 3,
  },
  pausedTime: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: 12,
  },
  readyWrap: {
    alignItems: 'center',
  },
  readyLabel: {
    color: colors.textMuted,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 3,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
  },
  secondaryButton: {
    width: 68,
    height: 68,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  primaryButton: {
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  primaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2,
  },
  secondaryButtonSpacer: {
    width: 68,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.96 }],
  },
});
