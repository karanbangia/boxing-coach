import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { DIFFICULTIES } from '@boxing-coach/core';
import { BlurView } from 'expo-blur';
import { type ComponentProps, useEffect, useMemo, useState } from 'react';
import {
  InteractionManager,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenShell } from '../components/ScreenShell';
import { SkeletonBlock } from '../components/SkeletonBlock';
import { TactilePressable } from '../components/TactilePressable';
import type { WorkoutHistoryItem } from '../lib/workoutHistory';
import { useWorkoutHistory } from '../providers/WorkoutHistoryProvider';
import { colors } from '../theme';

const LINE_HEIGHT_RATIO = 1.4;
const PUNCH_GRAPH_HEIGHT = 132;

function lineHeight(fontSize: number) {
  return fontSize * LINE_HEIGHT_RATIO;
}

type WorkoutIntensity = 0 | 1 | 2 | 3 | 4;
type IoniconName = ComponentProps<typeof Ionicons>['name'];
type SummaryPeriod = 'week' | 'month' | 'year';

const SUMMARY_PERIODS: SummaryPeriod[] = ['week', 'month', 'year'];

interface CalendarDay {
  key: string;
  day: number;
  isCurrentMonth: boolean;
}

interface PunchTrendPoint {
  key: string;
  punches: number;
}

interface WorkoutHistoryGroup {
  key: string;
  label: string;
  workouts: WorkoutHistoryItem[];
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

function getSummaryPeriodStart(period: SummaryPeriod, date: Date) {
  if (period === 'week') {
    const mondayOffset = (date.getDay() + 6) % 7;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - mondayOffset);
  }

  if (period === 'month') return new Date(date.getFullYear(), date.getMonth(), 1);
  return new Date(date.getFullYear(), 0, 1);
}

function getNextSummaryPeriodStart(period: SummaryPeriod, start: Date) {
  if (period === 'week') {
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  }

  if (period === 'month') return new Date(start.getFullYear(), start.getMonth() + 1, 1);
  return new Date(start.getFullYear() + 1, 0, 1);
}

function shiftSummaryPeriod(period: SummaryPeriod, date: Date, direction: -1 | 1) {
  const start = getSummaryPeriodStart(period, date);
  if (period === 'week') {
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + direction * 7);
  }

  if (period === 'month') return new Date(start.getFullYear(), start.getMonth() + direction, 1);
  return new Date(start.getFullYear() + direction, 0, 1);
}

function getSummaryPeriodLabel(period: SummaryPeriod, date: Date, now = new Date()) {
  const start = getSummaryPeriodStart(period, date);

  if (period === 'month') {
    return start
      .toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      .toUpperCase();
  }

  if (period === 'year') return String(start.getFullYear());

  const currentWeek = getSummaryPeriodStart('week', now);
  const currentWeekUtc = Date.UTC(
    currentWeek.getFullYear(),
    currentWeek.getMonth(),
    currentWeek.getDate(),
  );
  const selectedWeekUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const weeksAgo = Math.round((currentWeekUtc - selectedWeekUtc) / (7 * 24 * 60 * 60 * 1000));

  if (weeksAgo === 0) return 'THIS WEEK';
  if (weeksAgo === 1) return 'LAST WEEK';
  return `${weeksAgo} WEEKS AGO`;
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

function groupWorkoutHistory(history: WorkoutHistoryItem[]): WorkoutHistoryGroup[] {
  const groups: WorkoutHistoryGroup[] = [];

  for (const workout of sortNewestFirst(history)) {
    const dateKey = getHistoryDateKey(workout);
    const key = dateKey ?? `recent-${workout.id}`;
    const existing = groups.find(group => group.key === key);

    if (existing) {
      existing.workouts.push(workout);
      continue;
    }

    groups.push({
      key,
      label: formatHistoryDate(workout.completedAt),
      workouts: [workout],
    });
  }

  return groups;
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

function ProgressSkeletonBody() {
  return (
    <>
      <View style={styles.metricGrid}>
        {[0, 1, 2, 3].map(item => (
          <View key={item} style={styles.metricCard}>
            <SkeletonBlock style={styles.skeletonMetricLabel} />
            <SkeletonBlock style={styles.skeletonMetricValue} />
          </View>
        ))}
      </View>

      <View style={styles.calendarSection}>
        <View style={styles.sectionHeader}>
          <SkeletonBlock style={styles.skeletonSectionTitle} />
          <SkeletonBlock style={styles.skeletonSectionMeta} />
        </View>
        <SkeletonBlock style={styles.skeletonCalendar} />
      </View>

      <View style={styles.trendSection}>
        <View style={styles.sectionHeader}>
          <SkeletonBlock style={styles.skeletonTrendTitle} />
        </View>
        <SkeletonBlock style={styles.skeletonChart} />
      </View>

      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <SkeletonBlock style={styles.skeletonHistoryTitle} />
        </View>
        <View style={styles.skeletonHistoryList}>
          {[0, 1, 2].map(item => (
            <SkeletonBlock key={item} style={styles.skeletonHistoryCard} />
          ))}
        </View>
      </View>
    </>
  );
}

export function ProgressScreen() {
  const { history, isReady } = useWorkoutHistory();
  const [contentReady, setContentReady] = useState(false);
  const [summaryPeriod, setSummaryPeriod] = useState<SummaryPeriod>('week');
  const [summaryPeriodDate, setSummaryPeriodDate] = useState(() => new Date());
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) {
      setContentReady(false);
      return;
    }

    let revealTimer: ReturnType<typeof setTimeout> | null = null;
    const interaction = InteractionManager.runAfterInteractions(() => {
      revealTimer = setTimeout(() => setContentReady(true), 80);
    });

    return () => {
      interaction.cancel();
      if (revealTimer) clearTimeout(revealTimer);
    };
  }, [isReady]);

  const isLoading = !isReady || !contentReady;

  const visibleHistory = history;
  const orderedHistory = useMemo(() => sortNewestFirst(visibleHistory), [visibleHistory]);
  const groupedHistory = useMemo(() => groupWorkoutHistory(visibleHistory), [visibleHistory]);
  const summaryPeriodStart = useMemo(
    () => getSummaryPeriodStart(summaryPeriod, summaryPeriodDate),
    [summaryPeriod, summaryPeriodDate],
  );
  const summaryPeriodEnd = useMemo(
    () => getNextSummaryPeriodStart(summaryPeriod, summaryPeriodStart),
    [summaryPeriod, summaryPeriodStart],
  );
  const summaryHistory = useMemo(
    () => orderedHistory.filter(workout => {
      const completedAt = new Date(workout.completedAt).getTime();
      return !Number.isNaN(completedAt)
        && completedAt >= summaryPeriodStart.getTime()
        && completedAt < summaryPeriodEnd.getTime();
    }),
    [orderedHistory, summaryPeriodEnd, summaryPeriodStart],
  );

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
    const totalRounds = summaryHistory.reduce((total, workout) => total + workout.totalRounds, 0);
    const totalSeconds = summaryHistory.reduce(
      (total, workout) => total + workout.totalRounds * workout.roundDuration,
      0,
    );
    const totalPunches = summaryHistory.reduce((total, workout) => total + workout.punches, 0);

    return {
      totalRounds,
      totalSeconds,
      totalPunches,
      totalSessions: summaryHistory.length,
    };
  }, [summaryHistory]);

  const punchTrend = useMemo(() => buildPunchTrend(orderedHistory), [orderedHistory]);
  const calendarDays = useMemo(() => buildCalendarDays(displayedMonth), [displayedMonth]);
  const selectedSessions = selectedDateKey ? historyByDay.get(selectedDateKey) ?? [] : [];
  const selectedWorkout = selectedWorkoutId
    ? orderedHistory.find(workout => workout.id === selectedWorkoutId) ?? null
    : null;
  const todayKey = toDateKey(new Date());
  const summaryPeriodLabel = getSummaryPeriodLabel(summaryPeriod, summaryPeriodDate);
  const isCurrentSummaryPeriod = summaryPeriodStart.getTime()
    === getSummaryPeriodStart(summaryPeriod, new Date()).getTime();

  const selectSummaryPeriod = (period: SummaryPeriod) => {
    setSummaryPeriod(period);
    setSummaryPeriodDate(new Date());
  };

  const changeSummaryPeriod = (direction: -1 | 1) => {
    setSummaryPeriodDate(current => shiftSummaryPeriod(summaryPeriod, current, direction));
  };

  const changeMonth = (direction: -1 | 1) => {
    setDisplayedMonth(current => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    setSelectedDateKey(null);
    setSelectedWorkoutId(null);
  };

  return (
    <>
      <ScreenShell>
        <ScrollView
          accessible={isLoading}
          accessibilityRole={isLoading ? 'progressbar' : undefined}
          accessibilityLabel={isLoading ? 'Loading training progress' : undefined}
          contentContainerStyle={styles.pageContent}
          showsVerticalScrollIndicator={false}
        >
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

          <View style={styles.summaryTabs}>
            {SUMMARY_PERIODS.map(period => {
              const selected = summaryPeriod === period;
              return (
                <TactilePressable
                  key={period}
                  accessibilityRole="tab"
                  accessibilityLabel={`${period} summary`}
                  accessibilityState={{ selected }}
                  onPress={() => selectSummaryPeriod(period)}
                  haptic="selection"
                  pressedScale={0.96}
                  style={styles.summaryTab}
                >
                  <Text
                    style={[styles.summaryTabText, selected && styles.summaryTabTextActive]}
                    allowFontScaling={false}
                  >
                    {period.toUpperCase()}
                  </Text>
                  {selected ? <View style={styles.summaryTabIndicator} /> : null}
                </TactilePressable>
              );
            })}
          </View>

          <View style={styles.summaryPeriodControls}>
            <TactilePressable
              accessibilityRole="button"
              accessibilityLabel={`Previous ${summaryPeriod}`}
              onPress={() => changeSummaryPeriod(-1)}
              haptic="selection"
              pressedScale={0.9}
              style={styles.summaryPeriodButton}
            >
              <Ionicons name="chevron-back" size={18} color={colors.peach} />
            </TactilePressable>
            <Text style={styles.summaryPeriodLabel} allowFontScaling={false}>
              {summaryPeriodLabel}
            </Text>
            <TactilePressable
              accessibilityRole="button"
              accessibilityLabel={`Next ${summaryPeriod}`}
              accessibilityState={{ disabled: isCurrentSummaryPeriod }}
              disabled={isCurrentSummaryPeriod}
              onPress={() => changeSummaryPeriod(1)}
              haptic="selection"
              pressedScale={0.9}
              style={[
                styles.summaryPeriodButton,
                isCurrentSummaryPeriod && styles.summaryPeriodButtonDisabled,
              ]}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.peach} />
            </TactilePressable>
          </View>

          {isLoading ? (
            <ProgressSkeletonBody />
          ) : (
            <>
              <View style={styles.metricGrid}>
                <MetricCard value={String(summary.totalRounds)} label="TOTAL ROUNDS" />
                <MetricCard value={formatTotalTime(summary.totalSeconds)} label="TOTAL TIME" />
                <MetricCard value={String(summary.totalSessions)} label="TOTAL SESSIONS" />
                <MetricCard
                  value={formatPunches(summary.totalPunches)}
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
                    <Text style={styles.monthLabel} allowFontScaling={false}>
                      {formatMonth(displayedMonth)}
                    </Text>
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
                    <Text key={`${day}-${index}`} style={styles.weekday} allowFontScaling={false}>
                      {day}
                    </Text>
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
                      style={[
                        styles.legendSwatch,
                        { backgroundColor: getIntensityColor(level as WorkoutIntensity) },
                      ]}
                    />
                  ))}
                  <Text style={styles.legendLabel} allowFontScaling={false}>HIGH</Text>
                </View>
              </View>

              <PunchTrend points={punchTrend} isLoading={false} />

              <View style={styles.historySection}>
                <View style={styles.historyHeader}>
                  <Text style={styles.sectionTitle} allowFontScaling={false}>HISTORY</Text>
                </View>

                {orderedHistory.length > 0 ? (
                  <View style={styles.historyList}>
                    {groupedHistory.map((group, groupIndex) => (
                      <HistoryGroup
                        key={group.key}
                        group={group}
                        isLatest={groupIndex === 0}
                        isLast={groupIndex === groupedHistory.length - 1}
                        onWorkoutPress={workout => {
                          setSelectedDateKey(null);
                          setSelectedWorkoutId(workout.id);
                        }}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    {/*<Text style={styles.emptyTitle} allowFontScaling={false}>NO HISTORY YET.</Text>*/}
                    <Text style={styles.emptyCopy} allowFontScaling={false}>
                      Complete a workout to start your progress timeline.
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
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
          <View style={styles.emptyState}>
            <Text style={styles.emptyCopy} allowFontScaling={false}>
              Complete a workout to start your progress timeline.
            </Text>
          </View>
      )}
    </View>
  );
}

function HistoryGroup({
  group,
  isLatest,
  isLast,
  onWorkoutPress,
}: {
  group: WorkoutHistoryGroup;
  isLatest: boolean;
  isLast: boolean;
  onWorkoutPress: (workout: WorkoutHistoryItem) => void;
}) {
  return (
    <View style={[styles.historyGroup, isLast && styles.historyGroupLast]}>
      <View style={styles.historyRail} pointerEvents="none">
        {!isLast ? <View style={styles.historyLine} /> : null}
        <View style={[styles.historyMarker, isLatest && styles.historyMarkerActive]}>
          <MaterialCommunityIcons
            name="boxing-glove"
            size={16}
            color={isLatest ? colors.accentGlow : colors.peach}
          />
        </View>
      </View>

      <View style={styles.historyGroupContent}>
        <View style={styles.historyGroupHeader}>
          <Text
            style={[styles.historyGroupDate, isLatest && styles.historyGroupDateActive]}
            allowFontScaling={false}
          >
            {group.label}
          </Text>
          {isLatest ? (
            <View style={styles.latestBadge}>
              <Text style={styles.latestBadgeText} allowFontScaling={false}>LATEST</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.historyGroupCards}>
          {group.workouts.map((workout, index) => (
            <HistoryCard
              key={workout.id}
              workout={workout}
              isLatest={isLatest && index === 0}
              onPress={() => onWorkoutPress(workout)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function HistoryCard({
  workout,
  isLatest,
  onPress,
}: {
  workout: WorkoutHistoryItem;
  isLatest: boolean;
  onPress: () => void;
}) {
  const difficultyName = getDifficultyName(workout.difficulty);
  const time = formatTimelineTime(workout.completedAt);
  const duration = formatTotalTime(workout.totalRounds * workout.roundDuration);

  return (
    <TactilePressable
      accessibilityRole="button"
      accessibilityLabel={`${isLatest ? 'Latest workout, ' : ''}${difficultyName}, ${formatHistoryDate(workout.completedAt)} at ${time}, ${workout.totalRounds} ${workout.totalRounds === 1 ? 'round' : 'rounds'}, ${duration}, ${workout.punches} punches`}
      accessibilityHint="Opens this workout summary"
      onPress={onPress}
      haptic="light"
      pressedScale={0.985}
      style={[styles.historyCard, isLatest && styles.historyCardLatest]}
    >
      <View style={styles.historyCopy}>
        <View style={styles.historyCardHeader}>
          <Text
            style={styles.historyTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.84}
            allowFontScaling={false}
          >
            {difficultyName}
          </Text>
          <Text style={styles.historyTime} allowFontScaling={false}>{time}</Text>
        </View>
        <Text style={styles.historyMeta} numberOfLines={1} allowFontScaling={false}>
          {formatRounds(workout.totalRounds)} • {duration} • {formatPunches(workout.punches)} {workout.punches === 1 ? 'PUNCH' : 'PUNCHES'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TactilePressable>
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
    marginTop: 58 - lineHeight(58),
  },
  summaryTabs: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  summaryTabText: {
    color: colors.peach,
    fontFamily: 'Anton',
    fontSize: 20,
    lineHeight: lineHeight(20),
    letterSpacing: 0.5,
  },
  summaryTabTextActive: {
    color: colors.accentGlow,
  },
  summaryTabIndicator: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: -1,
    height: 2,
    backgroundColor: colors.accentGlow,
  },
  summaryPeriodControls: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  summaryPeriodButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryPeriodButtonDisabled: {
    opacity: 0.28,
  },
  summaryPeriodLabel: {
    minWidth: 132,
    color: colors.accentGlow,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 12,
    lineHeight: lineHeight(12),
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 12,
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
  skeletonMetricLabel: { width: '66%', height: 12 },
  skeletonMetricValue: { width: '58%', height: 48 },
  skeletonSectionTitle: { width: 154, height: 28, marginBottom: 5 },
  skeletonSectionMeta: { width: 82, height: 10, marginBottom: 10 },
  skeletonCalendar: { width: '100%', height: 268, marginTop: 14 },
  skeletonTrendTitle: { width: 216, height: 28, marginBottom: 5 },
  skeletonChart: { width: '100%', height: 188, marginTop: 18 },
  skeletonHistoryTitle: { width: 112, height: 28 },
  skeletonHistoryList: { gap: 8, marginTop: 14 },
  skeletonHistoryCard: { width: '100%', height: 84 },
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
    fontSize: 12,
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
  historyGroup: {
    flexDirection: 'row',
    paddingBottom: 22,
  },
  historyGroupLast: {
    paddingBottom: 0,
  },
  historyRail: {
    width: 32,
    alignItems: 'center',
  },
  historyMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    zIndex: 2,
  },
  historyMarkerActive: {
    borderWidth: 2,
    borderColor: colors.accentGlow,
    backgroundColor: colors.accentSoft,
    shadowColor: colors.accentGlow,
    shadowOpacity: 0.28,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  historyLine: {
    position: 'absolute',
    top: 32,
    bottom: -22,
    width: 1,
    backgroundColor: colors.border,
  },
  historyGroupContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  historyGroupHeader: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  historyGroupDate: {
    color: colors.peach,
    fontFamily: 'Anton',
    fontSize: 18,
    lineHeight: lineHeight(18),
    letterSpacing: 0.3,
  },
  historyGroupDateActive: {
    color: colors.accentGlow,
  },
  latestBadge: {
    minHeight: 20,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accentGlow,
    backgroundColor: colors.accentSoft,
  },
  latestBadgeText: {
    color: colors.accentGlow,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 9,
    lineHeight: lineHeight(9),
    letterSpacing: 1.1,
  },
  historyGroupCards: {
    gap: 8,
  },
  historyCard: {
    width: '100%',
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  historyCardLatest: {
    borderColor: colors.accentSoft,
  },
  historyCopy: {
    flex: 1,
    minWidth: 0,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  historyTitle: {
    color: colors.text,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 14,
    lineHeight: lineHeight(14),
    letterSpacing: 1,
  },
  historyTime: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 11,
    lineHeight: lineHeight(11),
    letterSpacing: 0.7,
  },
  historyMeta: {
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 14,
    lineHeight: lineHeight(14),
    marginTop: 3,
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
  },
  empty1State: {
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
