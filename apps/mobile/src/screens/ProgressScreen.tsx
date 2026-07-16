import { Ionicons } from '@expo/vector-icons';
import { DIFFICULTIES } from '@boxing-coach/core';
import { BlurView } from 'expo-blur';
import { type ComponentProps, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenShell } from '../components/ScreenShell';
import { TactilePressable } from '../components/TactilePressable';
import { loadWorkoutHistoryForScope, type WorkoutHistoryItem } from '../lib/workoutHistory';
import { useAuth } from '../providers/AuthProvider';
import { colors } from '../theme';

const LINE_HEIGHT_RATIO = 1.4;
const PUNCH_GRAPH_HEIGHT = 132;

function lineHeight(fontSize: number) {
  return fontSize * LINE_HEIGHT_RATIO;
}

type WorkoutIntensity = 0 | 1 | 2 | 3 | 4;
type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface CalendarDay {
  key: string;
  day: number;
  isCurrentMonth: boolean;
}

interface PunchTrendPoint {
  key: string;
  punches: number;
}

const workoutPresentation: Record<
  WorkoutHistoryItem['difficulty'],
  {
    intensity: string;
    icon: IoniconName;
    colorLevel: Exclude<WorkoutIntensity, 0>;
  }
> = {
  beginner: {
    intensity: 'LOW',
    icon: 'fitness-outline',
    colorLevel: 1,
  },
  intermediate: {
    intensity: 'MED',
    icon: 'flash-outline',
    colorLevel: 2,
  },
  advanced: {
    intensity: 'HIGH',
    icon: 'barbell-outline',
    colorLevel: 3,
  },
  pro: {
    intensity: 'MAX',
    icon: 'flame-outline',
    colorLevel: 4,
  },
};

function getDifficultyName(difficulty: WorkoutHistoryItem['difficulty']) {
  return DIFFICULTIES.find(option => option.value === difficulty)?.label ?? difficulty.toUpperCase();
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getHistoryDateKey(workout: WorkoutHistoryItem) {
  const date = new Date(workout.completedAt);
  return Number.isNaN(date.getTime()) ? null : toDateKey(date);
}

function buildCalendarDays(month: Date): CalendarDay[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const visibleDays = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;
  const firstVisibleDay = new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset);

  return Array.from({ length: visibleDays }, (_, index) => {
    const date = new Date(
      firstVisibleDay.getFullYear(),
      firstVisibleDay.getMonth(),
      firstVisibleDay.getDate() + index,
    );
    return {
      key: toDateKey(date),
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month.getMonth(),
    };
  });
}

function getWorkoutIntensity(workouts: WorkoutHistoryItem[]): WorkoutIntensity {
  return workouts.reduce<WorkoutIntensity>(
    (highest, workout) =>
      Math.max(highest, workoutPresentation[workout.difficulty].colorLevel) as WorkoutIntensity,
    0,
  );
}

function getIntensityColor(intensity: WorkoutIntensity) {
  switch (intensity) {
    case 1:
      return colors.workoutIntensity1;
    case 2:
      return colors.workoutIntensity2;
    case 3:
      return colors.workoutIntensity3;
    case 4:
      return colors.workoutIntensity4;
    default:
      return colors.transparent;
  }
}

function formatTotalTime(seconds: number) {
  const totalMinutes = Math.max(0, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}M`;
  return minutes === 0 ? `${hours}H` : `${hours}H ${minutes}M`;
}

function formatPunches(punches: number) {
  if (punches < 1000) return String(punches);

  const abbreviated = punches / 1000;
  return `${abbreviated % 1 === 0 ? abbreviated.toFixed(0) : abbreviated.toFixed(1)}K`;
}

function formatMonth(month: Date) {
  return month.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }).toUpperCase();
}

function dateFromKey(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`);
}

function formatDayForAccessibility(dateKey: string) {
  return dateFromKey(dateKey)
    .toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    .toUpperCase();
}

function formatDaySummaryTitle(dateKey: string) {
  return dateFromKey(dateKey)
    .toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    .toUpperCase();
}

function formatTimelineTime(isoDate: string) {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).toUpperCase();
}

function formatWorkoutSummaryDate(isoDate: string) {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime())
    ? 'RECENT WORKOUT'
    : date
        .toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
        .toUpperCase();
}

function formatHistoryDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'RECENT';

  const dateKey = toDateKey(date);
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

  if (dateKey === toDateKey(today)) return 'TODAY';
  if (dateKey === toDateKey(yesterday)) return 'YEST.';

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase();
}

function formatTrendLabel(dateKey: string) {
  const date = dateFromKey(dateKey);
  const day = date.toLocaleDateString(undefined, { day: 'numeric' });
  const month = date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
  return `${day}\n${month}`;
}

function formatRounds(rounds: number) {
  return `${rounds} ${rounds === 1 ? 'RND' : 'RNDS'}`;
}

function sortNewestFirst(history: WorkoutHistoryItem[]) {
  return [...history].sort((left, right) => {
    const leftTime = new Date(left.completedAt).getTime();
    const rightTime = new Date(right.completedAt).getTime();
    return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
  });
}

function buildPunchTrend(history: WorkoutHistoryItem[]): PunchTrendPoint[] {
  const punchesByDay = new Map<string, number>();

  for (const workout of history) {
    const dayKey = getHistoryDateKey(workout);
    if (!dayKey) continue;
    punchesByDay.set(dayKey, (punchesByDay.get(dayKey) ?? 0) + workout.punches);
  }

  return [...punchesByDay.entries()]
    .map(([key, punches]) => ({ key, punches }))
    .sort((left, right) => left.key.localeCompare(right.key))
    .slice(-7);
}

export function ProgressScreen() {
  const { user, syncStatus } = useAuth();
  const [history, setHistory] = useState<WorkoutHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    void loadWorkoutHistoryForScope(user?.uid ?? null).then(items => {
      if (!isMounted) return;
      setHistory(Array.isArray(items) ? items : []);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [syncStatus, user?.uid]);

  const orderedHistory = useMemo(() => sortNewestFirst(history), [history]);

  const historyByDay = useMemo(() => {
    const sessions = new Map<string, WorkoutHistoryItem[]>();
    for (const workout of orderedHistory) {
      const dayKey = getHistoryDateKey(workout);
      if (!dayKey) continue;
      sessions.set(dayKey, [...(sessions.get(dayKey) ?? []), workout]);
    }
    return sessions;
  }, [orderedHistory]);

  const summary = useMemo(() => {
    const totalRounds = orderedHistory.reduce((total, workout) => total + workout.totalRounds, 0);
    const totalSeconds = orderedHistory.reduce(
      (total, workout) => total + workout.totalRounds * workout.roundDuration,
      0,
    );
    const totalPunches = orderedHistory.reduce((total, workout) => total + workout.punches, 0);

    return {
      totalRounds,
      totalSeconds,
      totalPunches,
      totalSessions: orderedHistory.length,
    };
  }, [orderedHistory]);

  const punchTrend = useMemo(() => buildPunchTrend(orderedHistory), [orderedHistory]);
  const calendarDays = useMemo(() => buildCalendarDays(displayedMonth), [displayedMonth]);
  const selectedSessions = selectedDateKey ? historyByDay.get(selectedDateKey) ?? [] : [];
  const selectedWorkout = selectedWorkoutId
    ? orderedHistory.find(workout => workout.id === selectedWorkoutId) ?? null
    : null;
  const todayKey = toDateKey(new Date());

  const changeMonth = (direction: -1 | 1) => {
    setDisplayedMonth(current => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    setSelectedDateKey(null);
    setSelectedWorkoutId(null);
  };

  return (
    <>
      <ScreenShell>
        <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
          <View style={styles.pageHeader}>
            <Text
              style={styles.pageTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              allowFontScaling={false}
            >
              PROGRESS
            </Text>
            <Text
              style={[styles.pageTitle, styles.pageTitleAccent]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
              allowFontScaling={false}
            >
              OVERVIEW
            </Text>
          </View>

          <View style={styles.metricGrid}>
            <MetricCard value={isLoading ? '—' : String(summary.totalRounds)} label="TOTAL ROUNDS" />
            <MetricCard value={isLoading ? '—' : formatTotalTime(summary.totalSeconds)} label="TOTAL TIME" />
            <MetricCard value={isLoading ? '—' : String(summary.totalSessions)} label="TOTAL SESSIONS" />
            <MetricCard
              value={isLoading ? '—' : formatPunches(summary.totalPunches)}
              label="PUNCHES THROWN"
              accent
            />
          </View>

          <View style={styles.calendarSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle} allowFontScaling={false}>TRAINING LOG</Text>
              <View style={styles.monthControls}>
                <TactilePressable
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                  onPress={() => changeMonth(-1)}
                  haptic="selection"
                  pressedScale={0.9}
                  style={styles.monthButton}
                >
                  <Ionicons name="chevron-back" size={16} color={colors.peach} />
                </TactilePressable>
                <Text style={styles.monthLabel} allowFontScaling={false}>{formatMonth(displayedMonth)}</Text>
                <TactilePressable
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                  onPress={() => changeMonth(1)}
                  haptic="selection"
                  pressedScale={0.9}
                  style={styles.monthButton}
                >
                  <Ionicons name="chevron-forward" size={16} color={colors.peach} />
                </TactilePressable>
              </View>
            </View>

            <View style={styles.weekdayRow}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                <Text key={`${day}-${index}`} style={styles.weekday} allowFontScaling={false}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map(day => {
                const sessions = historyByDay.get(day.key) ?? [];
                const intensity = sessions.length ? getWorkoutIntensity(sessions) : 0;
                const selected = day.key === selectedDateKey;
                const hasSessions = sessions.length > 0;
                const isToday = day.key === todayKey;

                return (
                  <TactilePressable
                    key={day.key}
                    accessibilityRole={hasSessions ? 'button' : undefined}
                    accessibilityLabel={
                      hasSessions
                        ? `${formatDayForAccessibility(day.key)}, ${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'}`
                        : `${formatDayForAccessibility(day.key)}, no workout`
                    }
                    accessibilityHint={hasSessions ? 'Opens the day summary' : undefined}
                    accessibilityState={hasSessions ? { selected } : undefined}
                    disabled={!hasSessions}
                    onPress={() => {
                      setSelectedWorkoutId(null);
                      setSelectedDateKey(day.key);
                    }}
                    haptic="selection"
                    pressedScale={0.94}
                    style={[
                      styles.calendarDay,
                      !day.isCurrentMonth && styles.calendarDayOutsideMonth,
                      hasSessions && {
                        backgroundColor: getIntensityColor(intensity),
                        borderColor: getIntensityColor(intensity),
                      },
                      selected && styles.calendarDaySelected,
                      isToday && !selected && styles.calendarDayToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        !day.isCurrentMonth && styles.calendarDayTextOutsideMonth,
                        hasSessions && styles.calendarDayTextActive,
                      ]}
                      allowFontScaling={false}
                    >
                      {day.day}
                    </Text>
                  </TactilePressable>
                );
              })}
            </View>

            <View
              style={styles.legendRow}
              accessible
              accessibilityRole="text"
              accessibilityLabel="Workout intensity from dark red for low intensity to bright red for maximum intensity"
            >
              <Text style={styles.legendLabel} allowFontScaling={false}>LOW</Text>
              {[1, 2, 3, 4].map(level => (
                <View
                  key={level}
                  style={[styles.legendSwatch, { backgroundColor: getIntensityColor(level as WorkoutIntensity) }]}
                />
              ))}
              <Text style={styles.legendLabel} allowFontScaling={false}>HIGH</Text>
            </View>
          </View>

          <PunchTrend points={punchTrend} isLoading={isLoading} />

          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle} allowFontScaling={false}>HISTORY</Text>
            </View>

            {isLoading ? (
              <Text style={styles.statusCopy} allowFontScaling={false}>LOADING YOUR SESSIONS…</Text>
            ) : orderedHistory.length > 0 ? (
              <View style={styles.historyList}>
                {orderedHistory.map((workout, index) => {
                  return (
                    <HistoryCard
                      key={workout.id}
                      workout={workout}
                      isLatest={index === 0}
                      isLast={index === orderedHistory.length - 1}
                      onPress={() => {
                        setSelectedDateKey(null);
                        setSelectedWorkoutId(workout.id);
                      }}
                    />
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle} allowFontScaling={false}>NO HISTORY YET.</Text>
                <Text style={styles.emptyCopy} allowFontScaling={false}>
                  Complete a workout to start your progress timeline.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </ScreenShell>

      <DaySummarySheet
        dateKey={selectedDateKey}
        sessions={selectedSessions}
        onClose={() => setSelectedDateKey(null)}
      />
      <WorkoutSummarySheet
        workout={selectedWorkout}
        onClose={() => setSelectedWorkoutId(null)}
      />
    </>
  );
}

function MetricCard({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel} allowFontScaling={false}>{label}</Text>
      <Text
        style={[styles.metricValue, accent && styles.metricValueAccent]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.64}
        allowFontScaling={false}
      >
        {value}
      </Text>
    </View>
  );
}

function PunchTrend({ points, isLoading }: { points: PunchTrendPoint[]; isLoading: boolean }) {
  const maxPunches = Math.max(1, ...points.map(point => point.punches));

  return (
    <View style={styles.trendSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} allowFontScaling={false}>PUNCHES OVER TIME</Text>
        {!isLoading && points.length > 0 ? (
          <Text style={styles.sectionMeta} allowFontScaling={false}>DAILY TOTAL</Text>
        ) : null}
      </View>

      {isLoading ? (
        <Text style={styles.statusCopy} allowFontScaling={false}>BUILDING YOUR TREND…</Text>
      ) : points.length > 0 ? (
        <View
          style={styles.chart}
          accessible
          accessibilityRole="image"
          accessibilityLabel={`Daily punches over time. ${points
            .map(point => `${formatDayForAccessibility(point.key)}: ${point.punches} punches`)
            .join('. ')}`}
        >
          <View style={styles.chartBody}>
            <View style={styles.chartYAxis}>
              <Text style={styles.chartAxisValue} allowFontScaling={false}>{maxPunches}</Text>
              <Text style={styles.chartAxisValue} allowFontScaling={false}>0</Text>
            </View>
            <View style={styles.chartPlot}>
              <View style={[styles.chartGridLine, styles.chartGridLineTop]} />
              <View style={[styles.chartGridLine, styles.chartGridLineMiddle]} />
              <View style={[styles.chartGridLine, styles.chartGridLineBottom]} />
              <View style={styles.chartBars}>
                {points.map(point => {
                  const height = Math.max(8, Math.round((point.punches / maxPunches) * PUNCH_GRAPH_HEIGHT));
                  return (
                    <View key={point.key} style={styles.chartColumn}>
                      <Text style={styles.chartBarValue} allowFontScaling={false}>{formatPunches(point.punches)}</Text>
                      <View style={[styles.chartBar, { height }]} />
                      <Text style={styles.chartDate} allowFontScaling={false}>{formatTrendLabel(point.key)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      ) : (
        <Text style={styles.statusCopy} allowFontScaling={false}>
          COMPLETE A WORKOUT TO START THE GRAPH.
        </Text>
      )}
    </View>
  );
}

function HistoryCard({
  workout,
  isLatest,
  isLast,
  onPress,
}: {
  workout: WorkoutHistoryItem;
  isLatest: boolean;
  isLast: boolean;
  onPress: () => void;
}) {
  const presentation = workoutPresentation[workout.difficulty];
  const difficultyName = getDifficultyName(workout.difficulty);

  return (
    <View style={styles.historyRow}>
      <View style={styles.historyRail} pointerEvents="none">
        {!isLast ? <View style={styles.historyLine} /> : null}
        <View style={[styles.historyMarker, isLatest && styles.historyMarkerActive]}>
          <Ionicons
            name={presentation.icon}
            size={15}
            color={isLatest ? colors.accentGlow : colors.peach}
          />
        </View>
      </View>

      <TactilePressable
        accessibilityRole="button"
        accessibilityLabel={`${difficultyName}, ${formatHistoryDate(workout.completedAt)}, ${workout.totalRounds} ${workout.totalRounds === 1 ? 'round' : 'rounds'}, ${workout.punches} punches`}
        accessibilityHint="Opens this workout summary"
        onPress={onPress}
        haptic="light"
        pressedScale={0.985}
        style={styles.historyCard}
      >
        <View style={styles.historyIconTile}>
          <Ionicons name={presentation.icon} size={22} color={colors.peach} />
        </View>
        <View style={styles.historyCopy}>
          <Text
            style={styles.historyTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.78}
            allowFontScaling={false}
          >
            {difficultyName}
          </Text>
          <Text style={styles.historyMeta} numberOfLines={2} allowFontScaling={false}>
            {formatRounds(workout.totalRounds)} • {presentation.intensity}
          </Text>
        </View>
        <Text
          style={[styles.historyDate, isLatest && styles.historyDateActive]}
          allowFontScaling={false}
        >
          {formatHistoryDate(workout.completedAt)}
        </Text>
      </TactilePressable>
    </View>
  );
}

function DaySummarySheet({
  dateKey,
  sessions,
  onClose,
}: {
  dateKey: string | null;
  sessions: WorkoutHistoryItem[];
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const summary = useMemo(() => {
    return sessions.reduce(
      (totals, workout) => ({
        rounds: totals.rounds + workout.totalRounds,
        seconds: totals.seconds + workout.totalRounds * workout.roundDuration,
        punches: totals.punches + workout.punches,
      }),
      { rounds: 0, seconds: 0, punches: 0 },
    );
  }, [sessions]);

  const visible = Boolean(dateKey && sessions.length > 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.dayModalRoot} accessibilityViewIsModal>
        <BlurView intensity={34} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={styles.dayModalDim} />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          accessibilityLabel="Close day summary"
        />

        <View style={[styles.daySheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <ScrollView
            contentContainerStyle={styles.daySheetContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.daySheetKickerRow}>
              <View style={styles.daySheetKickerMark} />
              <Text style={styles.daySheetKicker} allowFontScaling={false}>DAY SUMMARY</Text>
            </View>
            <Text style={styles.daySheetTitle} allowFontScaling={false}>
              {dateKey ? formatDaySummaryTitle(dateKey) : ''}
            </Text>

            <View style={styles.dayMetricGrid}>
              <DayMetric value={String(sessions.length)} label="SESSIONS" />
              <DayMetric value={String(summary.rounds)} label="ROUNDS" />
              <DayMetric value={formatTotalTime(summary.seconds)} label="TIME" />
              <DayMetric value={formatPunches(summary.punches)} label="PUNCHES" accent />
            </View>

            <Text style={styles.daySessionsLabel} allowFontScaling={false}>WORKOUTS</Text>
            <View style={styles.daySessionList}>
              {sessions.map(workout => {
                const presentation = workoutPresentation[workout.difficulty];
                return (
                  <View key={workout.id} style={styles.daySessionRow}>
                    <View style={styles.daySessionIcon}>
                      <Ionicons name={presentation.icon} size={18} color={colors.peach} />
                    </View>
                    <View style={styles.daySessionCopy}>
                      <Text style={styles.daySessionTitle} allowFontScaling={false}>
                        {getDifficultyName(workout.difficulty)}
                      </Text>
                      <Text style={styles.daySessionMeta} allowFontScaling={false}>
                        {formatRounds(workout.totalRounds)} • {workout.punches} PUNCHES
                      </Text>
                    </View>
                    <Text style={styles.daySessionTime} allowFontScaling={false}>
                      {formatTimelineTime(workout.completedAt)}
                    </Text>
                  </View>
                );
              })}
            </View>

            <TactilePressable
              accessibilityRole="button"
              accessibilityLabel="Close day summary"
              onPress={onClose}
              haptic="light"
              pressedScale={0.98}
              style={styles.dayCloseButton}
            >
              <Text style={styles.dayCloseButtonText} allowFontScaling={false}>DONE</Text>
            </TactilePressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function WorkoutSummarySheet({
  workout,
  onClose,
}: {
  workout: WorkoutHistoryItem | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const presentation = workout ? workoutPresentation[workout.difficulty] : null;

  return (
    <Modal visible={Boolean(workout)} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.dayModalRoot} accessibilityViewIsModal>
        <BlurView intensity={34} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={styles.dayModalDim} />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          accessibilityLabel="Close workout summary"
        />

        <View style={[styles.daySheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {workout && presentation ? (
            <View style={styles.daySheetContent}>
              <View style={styles.daySheetKickerRow}>
                <View style={styles.daySheetKickerMark} />
                <Text style={styles.daySheetKicker} allowFontScaling={false}>WORKOUT SUMMARY</Text>
              </View>
              <Text style={styles.daySheetTitle} allowFontScaling={false}>
                {getDifficultyName(workout.difficulty)}
              </Text>
              <Text style={styles.workoutSheetDate} allowFontScaling={false}>
                {formatWorkoutSummaryDate(workout.completedAt)} • {presentation.intensity}
              </Text>

              <View style={styles.dayMetricGrid}>
                <DayMetric value={String(workout.totalRounds)} label="ROUNDS" />
                <DayMetric
                  value={formatTotalTime(workout.totalRounds * workout.roundDuration)}
                  label="TIME"
                />
                <DayMetric value={formatPunches(workout.punches)} label="PUNCHES" accent />
                <DayMetric value={String(workout.caloriesBurned)} label="CALORIES" />
              </View>

              <TactilePressable
                accessibilityRole="button"
                accessibilityLabel="Close workout summary"
                onPress={onClose}
                haptic="light"
                pressedScale={0.98}
                style={styles.dayCloseButton}
              >
                <Text style={styles.dayCloseButtonText} allowFontScaling={false}>DONE</Text>
              </TactilePressable>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function DayMetric({
  value,
  label,
  accent = false,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.dayMetric}>
      <Text style={[styles.dayMetricValue, accent && styles.dayMetricValueAccent]} allowFontScaling={false}>
        {value}
      </Text>
      <Text style={styles.dayMetricLabel} allowFontScaling={false}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 52,
  },
  pageHeader: {
    width: '100%',
  },
  pageTitle: {
    color: colors.peach,
    fontFamily: 'Anton',
    fontSize: 58,
    lineHeight: lineHeight(58),
    letterSpacing: 0,
  },
  pageTitleAccent: {
    color: colors.accent,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 24,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 126,
    paddingHorizontal: 16,
    paddingVertical: 13,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  metricLabel: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 14,
    lineHeight: lineHeight(14),
    letterSpacing: 1.1,
  },
  metricValue: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 48,
    lineHeight: lineHeight(48),
  },
  metricValueAccent: {
    color: colors.accentGlow,
  },
  calendarSection: {
    marginTop: 40,
  },
  sectionHeader: {
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontFamily: 'Anton',
    fontSize: 32,
    lineHeight: lineHeight(32),
    letterSpacing: 0,
  },
  sectionMeta: {
    color: colors.accentGlow,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 9,
    lineHeight: lineHeight(9),
    letterSpacing: 1.2,
    paddingBottom: 5,
  },
  monthControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 3,
  },
  monthButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    minWidth: 88,
    color: colors.accentGlow,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 11,
    lineHeight: lineHeight(11),
    letterSpacing: 1.1,
    textAlign: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 4,
  },
  weekday: {
    flex: 1,
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 10,
    lineHeight: lineHeight(10),
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calendarDay: {
    width: '13.3%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  calendarDayOutsideMonth: {
    opacity: 0.48,
  },
  calendarDayToday: {
    borderColor: colors.peach,
  },
  calendarDaySelected: {
    borderWidth: 2,
    borderColor: colors.peach,
  },
  calendarDayText: {
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 16,
    lineHeight: lineHeight(16),
  },
  calendarDayTextOutsideMonth: {
    color: colors.textMuted,
  },
  calendarDayTextActive: {
    color: colors.text,
    fontFamily: 'ArchivoNarrowBold',
  },
  legendRow: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
    marginTop: 8,
  },
  legendLabel: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 8,
    lineHeight: lineHeight(8),
    letterSpacing: 0.9,
  },
  legendSwatch: {
    width: 11,
    height: 11,
  },
  trendSection: {
    marginTop: 40,
  },
  chart: {
    paddingTop: 18,
    paddingBottom: 12,
  },
  chartBody: {
    flexDirection: 'row',
    minHeight: PUNCH_GRAPH_HEIGHT + 46,
  },
  chartYAxis: {
    width: 31,
    height: PUNCH_GRAPH_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  chartAxisValue: {
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 10,
    lineHeight: lineHeight(10),
  },
  chartPlot: {
    flex: 1,
    height: PUNCH_GRAPH_HEIGHT + 44,
  },
  chartGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
  },
  chartGridLineTop: {
    top: 6,
  },
  chartGridLineMiddle: {
    top: PUNCH_GRAPH_HEIGHT / 2,
    opacity: 0.62,
  },
  chartGridLineBottom: {
    top: PUNCH_GRAPH_HEIGHT,
  },
  chartBars: {
    height: PUNCH_GRAPH_HEIGHT + 44,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  chartColumn: {
    flex: 1,
    height: PUNCH_GRAPH_HEIGHT + 44,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBarValue: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 8,
    lineHeight: lineHeight(8),
    marginBottom: 4,
  },
  chartBar: {
    width: '62%',
    minWidth: 11,
    maxWidth: 30,
    backgroundColor: colors.accent,
    borderTopWidth: 3,
    borderTopColor: colors.accentGlow,
  },
  chartDate: {
    minHeight: 28,
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 8,
    lineHeight: lineHeight(8),
    textAlign: 'center',
    marginTop: 5,
  },
  historySection: {
    marginTop: 40,
  },
  historyHeader: {
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyList: {
    paddingTop: 16,
  },
  historyRow: {
    minHeight: 102,
    flexDirection: 'row',
  },
  historyRail: {
    width: 48,
    alignItems: 'center',
  },
  historyMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    zIndex: 2,
  },
  historyMarkerActive: {
    borderColor: colors.accentGlow,
    shadowColor: colors.accentGlow,
    shadowOpacity: 0.35,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
  },
  historyLine: {
    position: 'absolute',
    top: 40,
    bottom: 0,
    width: 2,
    backgroundColor: colors.border,
  },
  historyCard: {
    flex: 1,
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginLeft: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  historyIconTile: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  historyCopy: {
    flex: 1,
    minWidth: 0,
  },
  historyTitle: {
    color: colors.text,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 12,
    lineHeight: lineHeight(12),
    letterSpacing: 1,
  },
  historyMeta: {
    color: colors.peach,
    fontFamily: 'ArchivoNarrow',
    fontSize: 13,
    lineHeight: lineHeight(13),
    marginTop: 2,
  },
  historyDate: {
    color: colors.peach,
    fontFamily: 'Anton',
    fontSize: 17,
    lineHeight: lineHeight(17),
    textAlign: 'right',
  },
  historyDateActive: {
    color: colors.accentGlow,
  },
  statusCopy: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 10,
    lineHeight: lineHeight(10),
    letterSpacing: 1.1,
    paddingVertical: 24,
  },
  emptyState: {
    minHeight: 120,
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 27,
    lineHeight: lineHeight(27),
  },
  emptyCopy: {
    maxWidth: 290,
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 18,
    lineHeight: lineHeight(18),
    marginTop: 5,
  },
  dayModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  dayModalDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.66)',
  },
  daySheet: {
    maxHeight: '84%',
    borderWidth: 1,
    borderTopWidth: 3,
    borderColor: 'rgba(249,189,173,0.32)',
    borderTopColor: colors.accent,
    backgroundColor: '#171717',
  },
  daySheetContent: {
    paddingHorizontal: 22,
    paddingTop: 22,
  },
  daySheetKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  daySheetKickerMark: {
    width: 8,
    height: 8,
    backgroundColor: colors.accent,
  },
  daySheetKicker: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 10,
    lineHeight: lineHeight(10),
    letterSpacing: 1.8,
  },
  daySheetTitle: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 42,
    lineHeight: lineHeight(42),
    marginTop: 8,
  },
  workoutSheetDate: {
    color: colors.peach,
    fontFamily: 'ArchivoNarrowBold',
    fontSize: 12,
    lineHeight: lineHeight(12),
    letterSpacing: 0.7,
    marginTop: 2,
  },
  dayMetricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 15,
  },
  dayMetric: {
    flexGrow: 1,
    flexBasis: '47%',
    minHeight: 70,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  dayMetricValue: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 28,
    lineHeight: lineHeight(28),
  },
  dayMetricValueAccent: {
    color: colors.accentGlow,
  },
  dayMetricLabel: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 8,
    lineHeight: lineHeight(8),
    letterSpacing: 1,
  },
  daySessionsLabel: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 10,
    lineHeight: lineHeight(10),
    letterSpacing: 1.4,
    marginTop: 20,
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  daySessionList: {
    paddingTop: 4,
  },
  daySessionRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  daySessionIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  daySessionCopy: {
    flex: 1,
    minWidth: 0,
  },
  daySessionTitle: {
    color: colors.text,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 10,
    lineHeight: lineHeight(10),
    letterSpacing: 0.8,
  },
  daySessionMeta: {
    color: colors.peach,
    fontFamily: 'ArchivoNarrow',
    fontSize: 12,
    lineHeight: lineHeight(12),
    marginTop: 1,
  },
  daySessionTime: {
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrowBold',
    fontSize: 11,
    lineHeight: lineHeight(11),
  },
  dayCloseButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: colors.text,
  },
  dayCloseButtonText: {
    color: '#4a1113',
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 12,
    lineHeight: lineHeight(12),
    letterSpacing: 1.75,
  },
});
