import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { TactilePressable } from '../components/TactilePressable';
import {
  BOXING_PROGRAMS,
  type BoxingProgram,
  type ProgramId,
  type ProgramSession,
} from '../features/programs/programs';
import { trackEvent } from '../lib/observability';
import { useWorkoutHistory } from '../providers/WorkoutHistoryProvider';
import { colors, glass, textLineHeight } from '../theme';

function analyticsProgramId(programId: ProgramId) {
  return programId.replaceAll('-', '_') as
    | 'beginner_fundamentals'
    | 'heavy_bag_conditioning'
    | 'fight_camp';
}

function sessionDurationLabel(session: ProgramSession) {
  const minutes = session.settings.roundDuration / 60;
  return `${session.settings.totalRounds} × ${minutes} MIN · ${session.settings.difficulty.toUpperCase()}`;
}

function ProgramCard({
  program,
  selected,
  completed,
  isPremium,
  onPress,
}: {
  program: BoxingProgram;
  selected: boolean;
  completed: number;
  isPremium: boolean;
  onPress: () => void;
}) {
  const total = program.sessions.length;
  return (
    <TactilePressable
      onPress={onPress}
      haptic="selection"
      pressedScale={0.985}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${program.title}, ${program.weeks} weeks, ${completed} of ${total} sessions completed`}
      style={[styles.programCard, selected && styles.programCardSelected]}
    >
      <LinearGradient
        colors={program.accent}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.programCardGradient}
      >
        <View style={styles.programCardTop}>
          <Text style={styles.programCardKicker}>{program.kicker}</Text>
          {!isPremium ? (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={11} color={colors.background} />
              <Text style={styles.lockBadgeText}>PREMIUM</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.programCardTitle}>{program.title}</Text>
        <Text style={styles.programCardAudience}>{program.audience}</Text>
        <View style={styles.programCardFooter}>
          <Text style={styles.programCardMeta}>
            {program.weeks} WEEKS · {program.sessionsPerWeek}× / WEEK
          </Text>
          {completed > 0 ? (
            <Text style={styles.programCardProgress}>{completed}/{total}</Text>
          ) : (
            <Ionicons name="arrow-forward" size={18} color={colors.text} />
          )}
        </View>
      </LinearGradient>
    </TactilePressable>
  );
}

function SessionRow({
  session,
  completed,
  isNext,
  locked,
  isPremium,
  onOpenPremium,
  onLoadSession,
}: {
  session: ProgramSession;
  completed: boolean;
  isNext: boolean;
  locked: boolean;
  isPremium: boolean;
  onOpenPremium: () => void;
  onLoadSession: (session: ProgramSession) => void;
}) {
  const canOpen = completed || isNext;
  const handlePress = () => {
    if (!isPremium) {
      onOpenPremium();
      return;
    }
    if (canOpen) onLoadSession(session);
  };

  return (
    <TactilePressable
      onPress={handlePress}
      disabled={isPremium && locked}
      haptic={canOpen || !isPremium ? 'light' : 'none'}
      pressedScale={0.99}
      accessibilityRole="button"
      accessibilityState={{ disabled: isPremium && locked }}
      accessibilityLabel={`${session.title}, ${sessionDurationLabel(session)}, ${
        completed ? 'completed' : isNext ? 'up next' : 'locked'
      }`}
      style={[
        styles.sessionRow,
        isNext && styles.sessionRowNext,
        locked && styles.sessionRowLocked,
      ]}
    >
      <View style={[
        styles.sessionStatus,
        completed && styles.sessionStatusComplete,
        isNext && styles.sessionStatusNext,
      ]}>
        {completed ? (
          <Ionicons name="checkmark" size={19} color={colors.background} />
        ) : locked ? (
          <Ionicons name="lock-closed-outline" size={17} color={colors.textMuted} />
        ) : (
          <Text style={styles.sessionNumber}>{String(session.sequence).padStart(2, '0')}</Text>
        )}
      </View>
      <View style={styles.sessionCopy}>
        {isNext ? <Text style={styles.nextLabel}>UP NEXT</Text> : null}
        <Text style={styles.sessionTitle}>{session.title}</Text>
        <Text style={styles.sessionFocus}>{session.focus}</Text>
        <Text style={styles.sessionMeta}>{sessionDurationLabel(session)}</Text>
      </View>
      {canOpen || !isPremium ? (
        <Ionicons name="chevron-forward" size={20} color={isNext ? colors.peach : colors.textMuted} />
      ) : null}
    </TactilePressable>
  );
}

export function PlanScreen({
  isPremium,
  onOpenPremium,
  onLoadSession,
}: {
  isPremium: boolean;
  onOpenPremium: () => void;
  onLoadSession: (session: ProgramSession) => void;
}) {
  const { history } = useWorkoutHistory();
  const [selectedProgramId, setSelectedProgramId] = useState<ProgramId>('beginner-fundamentals');
  const selectedProgram = BOXING_PROGRAMS.find(
    program => program.id === selectedProgramId,
  ) ?? BOXING_PROGRAMS[0];
  const completedIds = useMemo(
    () => new Set(history.flatMap(workout => workout.programSessionId
      ? [workout.programSessionId]
      : [])),
    [history],
  );
  const nextSession = selectedProgram.sessions.find(session => !completedIds.has(session.id)) ?? null;
  const completedCount = selectedProgram.sessions.filter(session => completedIds.has(session.id)).length;
  const [selectedWeek, setSelectedWeek] = useState(nextSession?.week ?? 1);

  useEffect(() => {
    setSelectedWeek(nextSession?.week ?? selectedProgram.weeks);
    trackEvent('program_viewed', {
      program: analyticsProgramId(selectedProgram.id),
    });
  }, [nextSession?.week, selectedProgram.id, selectedProgram.weeks]);

  const weekSessions = selectedProgram.sessions.filter(session => session.week === selectedWeek);
  const progress = selectedProgram.sessions.length
    ? completedCount / selectedProgram.sessions.length
    : 0;

  const handlePrimaryAction = () => {
    if (!isPremium) {
      onOpenPremium();
      return;
    }
    if (nextSession) onLoadSession(nextSession);
  };

  return (
    <ScreenShell>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.pageContent}
      >
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.eyebrow}>STRUCTURED TRAINING</Text>
            <Text style={styles.pageTitle}>PROGRAMS</Text>
          </View>
          <View style={styles.programCount}>
            <Text style={styles.programCountValue}>03</Text>
            <Text style={styles.programCountLabel}>PROGRAMS</Text>
          </View>
        </View>

        <Text style={styles.intro}>
          Progress session by session. Every plan changes real round length, pace, movement, and defense frequency.
        </Text>

        <View style={styles.catalog}>
          {BOXING_PROGRAMS.map(program => (
            <ProgramCard
              key={program.id}
              program={program}
              selected={program.id === selectedProgram.id}
              completed={program.sessions.filter(session => completedIds.has(session.id)).length}
              isPremium={isPremium}
              onPress={() => setSelectedProgramId(program.id)}
            />
          ))}
        </View>

        <View style={styles.detailHeader}>
          <Text style={styles.detailKicker}>{selectedProgram.kicker}</Text>
          <Text style={styles.detailTitle}>{selectedProgram.title}</Text>
          <Text style={styles.detailSummary}>{selectedProgram.summary}</Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <View>
              <Text style={styles.progressLabel}>PROGRAM PROGRESS</Text>
              <Text style={styles.progressValue}>
                {completedCount} OF {selectedProgram.sessions.length} SESSIONS
              </Text>
            </View>
            <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        <TactilePressable
          onPress={handlePrimaryAction}
          disabled={isPremium && !nextSession}
          haptic="medium"
          pressedScale={0.985}
          accessibilityRole="button"
          style={[
            styles.primaryButton,
            isPremium && !nextSession && styles.primaryButtonComplete,
          ]}
        >
          <Ionicons
            name={!isPremium ? 'lock-open-outline' : nextSession ? 'play' : 'trophy'}
            size={21}
            color={colors.text}
          />
          <Text style={styles.primaryButtonText}>
            {!isPremium
              ? 'UNLOCK THIS PROGRAM'
              : nextSession
                ? `LOAD WEEK ${nextSession.week} · SESSION ${nextSession.sessionInWeek}`
                : 'PROGRAM COMPLETE'}
          </Text>
        </TactilePressable>

        <View style={styles.outcomes}>
          <Text style={styles.sectionLabel}>WHAT THIS BUILDS</Text>
          {selectedProgram.outcomes.map(outcome => (
            <View key={outcome} style={styles.outcomeRow}>
              <Ionicons name="checkmark-circle-outline" size={19} color={colors.peach} />
              <Text style={styles.outcomeText}>{outcome}</Text>
            </View>
          ))}
        </View>

        <View style={styles.weekHeading}>
          <Text style={styles.sectionLabel}>SESSION MAP</Text>
          <Text style={styles.weekMeta}>WEEK {String(selectedWeek).padStart(2, '0')}</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekSelector}
        >
          {Array.from({ length: selectedProgram.weeks }, (_, index) => {
            const week = index + 1;
            const selected = week === selectedWeek;
            const completedInWeek = selectedProgram.sessions
              .filter(session => session.week === week)
              .every(session => completedIds.has(session.id));
            return (
              <TactilePressable
                key={week}
                onPress={() => setSelectedWeek(week)}
                haptic="selection"
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[
                  styles.weekButton,
                  selected && styles.weekButtonSelected,
                  completedInWeek && !selected && styles.weekButtonComplete,
                ]}
              >
                <Text style={[
                  styles.weekButtonText,
                  selected && styles.weekButtonTextSelected,
                ]}>
                  W{week}
                </Text>
                {completedInWeek ? (
                  <Ionicons
                    name="checkmark"
                    size={12}
                    color={selected ? colors.text : colors.background}
                  />
                ) : null}
              </TactilePressable>
            );
          })}
        </ScrollView>

        <View style={styles.sessionList}>
          {weekSessions.map(session => (
            <SessionRow
              key={session.id}
              session={session}
              completed={completedIds.has(session.id)}
              isNext={session.id === nextSession?.id}
              locked={!completedIds.has(session.id) && session.id !== nextSession?.id}
              isPremium={isPremium}
              onOpenPremium={onOpenPremium}
              onLoadSession={onLoadSession}
            />
          ))}
        </View>

        <View style={styles.safetyNote}>
          <Ionicons name="heart-outline" size={20} color={colors.peach} />
          <Text style={styles.safetyText}>
            Program progress is based on completed sessions, not measured technique or power. Adjust intensity and stop if training feels unsafe.
          </Text>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 42,
    gap: 22,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  eyebrow: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 11,
    lineHeight: textLineHeight(11),
    letterSpacing: 2,
  },
  pageTitle: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 52,
    lineHeight: 58,
    letterSpacing: 0.4,
  },
  programCount: { alignItems: 'flex-end', paddingBottom: 5 },
  programCountValue: {
    color: colors.red,
    fontFamily: 'Anton',
    fontSize: 30,
    lineHeight: 32,
  },
  programCountLabel: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 9,
    lineHeight: textLineHeight(9),
    letterSpacing: 1,
  },
  intro: {
    maxWidth: 520,
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 16,
    lineHeight: textLineHeight(16),
  },
  catalog: { gap: 11 },
  programCard: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  programCardSelected: { borderColor: colors.peach },
  programCardGradient: {
    minHeight: 168,
    padding: 16,
    overflow: 'hidden',
  },
  programCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programCardKicker: {
    color: 'rgba(255,255,255,0.82)',
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 10,
    lineHeight: textLineHeight(10),
    letterSpacing: 1.5,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: colors.peach,
  },
  lockBadgeText: {
    color: colors.background,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 8,
    lineHeight: textLineHeight(8),
    letterSpacing: 0.7,
  },
  programCardTitle: {
    maxWidth: 330,
    marginTop: 13,
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: 0.3,
  },
  programCardAudience: {
    marginTop: 3,
    color: 'rgba(255,255,255,0.78)',
    fontFamily: 'ArchivoNarrow',
    fontSize: 14,
    lineHeight: textLineHeight(14),
  },
  programCardFooter: {
    marginTop: 'auto',
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  programCardMeta: {
    color: colors.text,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 10,
    lineHeight: textLineHeight(10),
    letterSpacing: 1,
  },
  programCardProgress: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 18,
    lineHeight: 20,
  },
  detailHeader: { gap: 5, marginTop: 8 },
  detailKicker: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 11,
    lineHeight: textLineHeight(11),
    letterSpacing: 1.6,
  },
  detailTitle: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 38,
    lineHeight: 43,
    letterSpacing: 0.3,
  },
  detailSummary: {
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 16,
    lineHeight: textLineHeight(16),
  },
  progressCard: {
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.surface,
  },
  progressTop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 9,
    lineHeight: textLineHeight(9),
    letterSpacing: 1,
  },
  progressValue: {
    marginTop: 3,
    color: colors.text,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 12,
    lineHeight: textLineHeight(12),
    letterSpacing: 0.7,
  },
  progressPercent: {
    color: colors.peach,
    fontFamily: 'Anton',
    fontSize: 26,
    lineHeight: 28,
  },
  progressTrack: { height: 5, backgroundColor: colors.border },
  progressFill: { height: '100%', backgroundColor: colors.red },
  primaryButton: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: colors.red,
    paddingHorizontal: 16,
  },
  primaryButtonComplete: { backgroundColor: colors.surfaceMuted },
  primaryButtonText: {
    color: colors.text,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 14,
    lineHeight: textLineHeight(14),
    letterSpacing: 1,
    textAlign: 'center',
  },
  outcomes: {
    gap: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.surface,
  },
  sectionLabel: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 11,
    lineHeight: textLineHeight(11),
    letterSpacing: 1.5,
  },
  outcomeRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  outcomeText: {
    flex: 1,
    color: colors.text,
    fontFamily: 'ArchivoNarrow',
    fontSize: 15,
    lineHeight: textLineHeight(15),
  },
  weekHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekMeta: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 10,
    lineHeight: textLineHeight(10),
    letterSpacing: 1,
  },
  weekSelector: { gap: 8 },
  weekButton: {
    minWidth: 50,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.surface,
  },
  weekButtonSelected: {
    borderColor: colors.red,
    backgroundColor: colors.red,
  },
  weekButtonComplete: {
    borderColor: colors.peach,
    backgroundColor: colors.peach,
  },
  weekButtonText: {
    color: colors.textMuted,
    fontFamily: 'Anton',
    fontSize: 17,
    lineHeight: 20,
  },
  weekButtonTextSelected: { color: colors.text },
  sessionList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sessionRow: {
    minHeight: 132,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingRight: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sessionRowNext: { backgroundColor: glass.surfaceStrong },
  sessionRowLocked: { opacity: 0.5 },
  sessionStatus: {
    width: 53,
    height: 53,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.surface,
  },
  sessionStatusComplete: {
    borderColor: colors.peach,
    backgroundColor: colors.peach,
  },
  sessionStatusNext: {
    borderColor: colors.red,
    backgroundColor: colors.red,
  },
  sessionNumber: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 22,
    lineHeight: 25,
  },
  sessionCopy: { flex: 1, gap: 2 },
  nextLabel: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 9,
    lineHeight: textLineHeight(9),
    letterSpacing: 1.2,
  },
  sessionTitle: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 23,
    lineHeight: 28,
    letterSpacing: 0.25,
  },
  sessionFocus: {
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 14,
    lineHeight: textLineHeight(14),
  },
  sessionMeta: {
    marginTop: 3,
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 9,
    lineHeight: textLineHeight(9),
    letterSpacing: 0.8,
  },
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.surface,
  },
  safetyText: {
    flex: 1,
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 13,
    lineHeight: textLineHeight(13),
  },
});
