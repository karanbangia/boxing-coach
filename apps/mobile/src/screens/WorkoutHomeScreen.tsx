import { useEffect, useMemo, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { TactilePressable } from '../components/TactilePressable';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { loadWorkoutHistory, type WorkoutHistoryItem } from '../lib/workoutHistory';
import { colors } from '../theme';

const difficultyNames = {
  beginner: 'BEGINNER',
  intermediate: 'INTERMEDIATE',
  advanced: 'ADVANCED',
  pro: 'PRO',
} as const;

function formatActiveTime(seconds: number) {
  const totalMinutes = Math.max(0, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours}H ${minutes}M` : `${minutes}M`;
}

function formatSessionDate(isoDate: string) {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime())
    ? 'RECENTLY'
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase();
}

function getCurrentStreak(history: WorkoutHistoryItem[]) {
  const completedDays = new Set(
    history.map(workout => {
      const date = new Date(workout.completedAt);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    }),
  );
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  // A streak remains earned through the day after the latest session. Without
  // this, a fighter who trained last night sees a false zero immediately after
  // midnight, before they have had a chance to train again today.
  if (!completedDays.has(cursor.getTime())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (completedDays.has(cursor.getTime())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function WorkoutHomeScreen({ onOpenTimer }: { onOpenTimer: () => void }) {
  const [history, setHistory] = useState<WorkoutHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const loadingPulse = useRef(new Animated.Value(0.42)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let isMounted = true;
    void loadWorkoutHistory().then(items => {
      if (!isMounted) return;
      setHistory(items);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      loadingPulse.stopAnimation();
      return;
    }
    if (reduceMotion) {
      loadingPulse.setValue(0.62);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(loadingPulse, {
          toValue: 0.88,
          duration: 760,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(loadingPulse, {
          toValue: 0.42,
          duration: 760,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [isLoading, loadingPulse, reduceMotion]);

  const summary = useMemo(() => {
    const latest = history[0];
    const rounds = history.reduce((total, workout) => total + workout.totalRounds, 0);
    const activeSeconds = history.reduce(
      (total, workout) => total + workout.totalRounds * workout.roundDuration,
      0,
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const roundsToday = history
      .filter(workout => new Date(workout.completedAt).getTime() >= today.getTime())
      .reduce((total, workout) => total + workout.totalRounds, 0);

    return {
      latest,
      rounds,
      activeSeconds,
      roundsToday,
      streak: getCurrentStreak(history),
      recent: history.slice(0, 3),
    };
  }, [history]);

  const hasHistory = history.length > 0;
  const isEmpty = !isLoading && !hasHistory;

  return (
    <ScreenShell>
      <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headingRow}>
          <View>
            <Text style={styles.eyebrow} allowFontScaling={false}>The corner</Text>
            <Text style={styles.pageTitle} allowFontScaling={false}>TRAINING LOG</Text>
          </View>
          <View
            accessible
            accessibilityRole="text"
            accessibilityLabel={isLoading ? 'Loading training log' : 'Training log up to date'}
            style={styles.liveStatus}
          >
            <View style={[styles.liveDot, isLoading && styles.liveDotLoading]} />
            <Text
              style={[styles.liveStatusText, isLoading && styles.liveStatusTextLoading]}
              allowFontScaling={false}
            >
              {isLoading ? 'SYNCING' : 'SYNCED'}
            </Text>
          </View>
        </View>

        <LinearGradient
          colors={['#ff3326', '#d80b12', '#96090d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroPanel}
        >
          <View style={styles.heroGraphicLarge} pointerEvents="none" />
          <View style={styles.heroGraphicSmall} pointerEvents="none" />
          <Text style={styles.heroKicker} allowFontScaling={false}>
            {isLoading ? 'SYNCING YOUR WORK' : hasHistory ? 'LAST BELL' : 'YOUR NEXT ROUND'}
          </Text>
          <Text style={styles.heroTitle} allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit>
            {isLoading
              ? 'TRAINING LOG'
              : hasHistory && summary.latest
              ? difficultyNames[summary.latest.difficulty]
              : 'MAKE IT COUNT'}
          </Text>
          <Text style={styles.heroDescription} allowFontScaling={false}>
            {isLoading
              ? 'YOUR RECENT SESSIONS WILL APPEAR HERE.'
              : hasHistory && summary.latest
              ? `${summary.latest.totalRounds} ROUNDS  •  ${summary.latest.punches} PUNCHES`
              : 'ONE SESSION IS ALL IT TAKES TO START THE STORY.'}
          </Text>

          <View style={styles.heroDivider} />
          <View style={styles.todayRow}>
            <View>
              <Text style={styles.todayValue} allowFontScaling={false}>
                {isLoading ? '—' : summary.roundsToday}
              </Text>
              <Text style={styles.todayLabel} allowFontScaling={false}>ROUNDS TODAY</Text>
            </View>
            <TactilePressable
              accessibilityRole="button"
              accessibilityLabel="Build a workout"
              onPress={onOpenTimer}
              haptic="medium"
              pressedScale={0.97}
              style={styles.buildButton}
            >
              <Text style={styles.buildButtonText} allowFontScaling={false}>BUILD WORKOUT</Text>
            </TactilePressable>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>YOUR NUMBERS</Text>
          <Text style={styles.sectionMeta} allowFontScaling={false}>ALL TIME</Text>
        </View>
        <View style={styles.statGrid}>
          <MetricCard value={isLoading ? '—' : String(summary.rounds)} label="ROUNDS" accent />
          <MetricCard value={isLoading ? '—' : String(history.length)} label="SESSIONS" />
          <MetricCard value={isLoading ? '—' : formatActiveTime(summary.activeSeconds)} label="BAG TIME" />
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>RECENT WORK</Text>
          {!isLoading && summary.streak > 0 ? (
            <Text style={styles.sectionMeta} allowFontScaling={false}>{summary.streak} DAY STREAK</Text>
          ) : null}
        </View>
        {isLoading ? (
          <LoadingHistoryRows opacity={loadingPulse} />
        ) : hasHistory ? (
          <View style={styles.historyList}>
            {summary.recent.map(workout => (
              <View key={workout.id} style={styles.historyRow}>
                <View style={styles.historyDateBlock}>
                  <Text style={styles.historyDate} allowFontScaling={false}>
                    {formatSessionDate(workout.completedAt)}
                  </Text>
                  <Text style={styles.historyDifficulty} allowFontScaling={false}>
                    {difficultyNames[workout.difficulty]}
                  </Text>
                </View>
                <View style={styles.historyMetric}>
                  <Text style={styles.historyValue} allowFontScaling={false}>{workout.punches}</Text>
                  <Text style={styles.historyLabel} allowFontScaling={false}>PUNCHES</Text>
                </View>
                <View style={styles.historyMetric}>
                  <Text style={styles.historyValue} allowFontScaling={false}>{workout.totalRounds}</Text>
                  <Text style={styles.historyLabel} allowFontScaling={false}>ROUNDS</Text>
                </View>
              </View>
            ))}
          </View>
        ) : isEmpty ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle} allowFontScaling={false}>NO BELL RUNG YET.</Text>
            <Text style={styles.emptyCopy} allowFontScaling={false}>
              Finish a workout and every round and punch will live here.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}

function LoadingHistoryRows({ opacity }: { opacity: Animated.Value }) {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel="Loading recent workouts">
      {[0, 1, 2].map(index => (
        <View key={index} style={styles.historyLoadingRow}>
          <Animated.View style={[styles.historyLoadingDate, { opacity }]} />
          <Animated.View style={[styles.historyLoadingMetric, { opacity }]} />
          <Animated.View style={[styles.historyLoadingMetric, { opacity }]} />
        </View>
      ))}
    </View>
  );
}

function MetricCard({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <View style={[styles.statCard, accent && styles.statCardAccent]}>
      <Text style={[styles.statValue, accent && styles.statValueAccent]} numberOfLines={1} allowFontScaling={false}>
        {value}
      </Text>
      <Text style={styles.statLabel} allowFontScaling={false}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 27,
    paddingBottom: 40,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: colors.peach,
    fontFamily: 'SpaceGroteskBold',
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  pageTitle: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 44,
    lineHeight: 54,
    letterSpacing: 0.3,
    marginTop: 3,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 11,
    backgroundColor: colors.green,
    shadowColor: colors.green,
    shadowOpacity: 0.72,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  liveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 11,
  },
  liveStatusText: {
    color: colors.green,
    fontFamily: 'SpaceGroteskBold',
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.15,
  },
  liveDotLoading: {
    backgroundColor: colors.peach,
    shadowColor: colors.peach,
  },
  liveStatusTextLoading: {
    color: colors.peach,
  },
  heroPanel: {
    minHeight: 286,
    marginTop: 25,
    padding: 22,
    overflow: 'hidden',
  },
  heroGraphicLarge: {
    position: 'absolute',
    width: 194,
    height: 194,
    borderRadius: 97,
    right: -62,
    top: -86,
    borderWidth: 26,
    borderColor: 'rgba(255,255,255,0.11)',
  },
  heroGraphicSmall: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 37,
    right: 31,
    top: 52,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  heroKicker: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'SpaceGroteskBold',
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#fff7f5',
    fontFamily: 'Anton',
    fontSize: 48,
    lineHeight: 58,
    letterSpacing: 0.2,
    marginTop: 6,
    maxWidth: '94%',
  },
  heroDescription: {
    color: '#fff7f5',
    fontFamily: 'SpaceGroteskBold',
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 1.2,
    marginTop: 7,
    maxWidth: '88%',
  },
  heroDivider: {
    height: 1,
    marginTop: 'auto',
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  todayValue: {
    color: '#fff7f5',
    fontFamily: 'Anton',
    fontSize: 32,
    lineHeight: 36,
  },
  todayLabel: {
    color: '#fff7f5',
    fontFamily: 'SpaceGroteskBold',
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.3,
  },
  buildButton: {
    minHeight: 48,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff7f5',
  },
  buildButtonText: {
    color: '#a00b0f',
    fontFamily: 'SpaceGroteskBold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.25,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.peach,
    fontFamily: 'SpaceGroteskBold',
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 2,
  },
  sectionMeta: {
    color: colors.textMuted,
    fontFamily: 'SpaceGroteskBold',
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.4,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 100,
    paddingHorizontal: 15,
    paddingVertical: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statCardAccent: {
    borderColor: 'rgba(255,20,20,0.75)',
  },
  statValue: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 38,
    lineHeight: 43,
  },
  statValueAccent: {
    color: colors.peach,
  },
  statLabel: {
    color: colors.textMuted,
    fontFamily: 'SpaceGroteskBold',
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.4,
    marginTop: 6,
  },
  historyList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyLoadingRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyLoadingDate: {
    width: '37%',
    height: 16,
    backgroundColor: colors.surfaceMuted,
  },
  historyLoadingMetric: {
    flex: 1,
    height: 13,
    backgroundColor: colors.surfaceMuted,
  },
  historyRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyDateBlock: {
    flex: 1.35,
    paddingRight: 8,
  },
  historyDate: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 23,
    lineHeight: 28,
  },
  historyDifficulty: {
    color: colors.textMuted,
    fontFamily: 'SpaceGroteskBold',
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.1,
    marginTop: 2,
  },
  historyMetric: {
    flex: 0.8,
    alignItems: 'flex-end',
  },
  historyValue: {
    color: colors.peach,
    fontFamily: 'Anton',
    fontSize: 29,
    lineHeight: 34,
  },
  historyLabel: {
    color: colors.textMuted,
    fontFamily: 'SpaceGroteskBold',
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 0.9,
  },
  emptyState: {
    minHeight: 118,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 25,
    lineHeight: 31,
  },
  emptyCopy: {
    maxWidth: 295,
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 18,
    lineHeight: 22,
    marginTop: 6,
  },
});
