import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { TactilePressable } from '../components/TactilePressable';
import type { SetupSettings } from '../config';
import { colors } from '../theme';

type PlanPreset = Pick<SetupSettings, 'roundDuration' | 'totalRounds' | 'restDuration'>;

const plannedWorkouts = [
  {
    day: 'MON',
    title: 'FOUNDATION',
    focus: 'Jab mechanics · footwork',
    detail: '3 ROUNDS  ·  2 MIN',
    preset: { totalRounds: 3, roundDuration: 120, restDuration: 60 },
  },
  {
    day: 'WED',
    title: 'DEFENSE',
    focus: 'Slips · rolls · counters',
    detail: '4 ROUNDS  ·  2 MIN',
    preset: { totalRounds: 4, roundDuration: 120, restDuration: 60 },
  },
  {
    day: 'FRI',
    title: 'POWER',
    focus: 'Pressure combinations',
    detail: '6 ROUNDS  ·  3 MIN',
    preset: { totalRounds: 6, roundDuration: 180, restDuration: 60 },
  },
];

function SessionMapRow({
  workout,
  index,
  onBuildWorkout,
}: {
  workout: (typeof plannedWorkouts)[number];
  index: number;
  onBuildWorkout: (preset: PlanPreset) => void;
}) {
  const isNext = index === 0;
  const content = (
    <>
      <View style={[styles.dayRail, isNext && styles.dayRailNext]}>
        <Text style={[styles.dayNumber, isNext && styles.dayNumberNext]} allowFontScaling={false}>
          0{index + 1}
        </Text>
        <Text style={[styles.dayText, isNext && styles.dayTextNext]} allowFontScaling={false}>
          {workout.day}
        </Text>
      </View>
      <View style={styles.planCopy}>
        {isNext ? <Text style={styles.nextLabel} allowFontScaling={false}>UP NEXT</Text> : null}
        <Text style={styles.planTitle} allowFontScaling={false}>{workout.title}</Text>
        <Text style={styles.planFocus} allowFontScaling={false}>{workout.focus}</Text>
        <Text style={styles.planMeta} allowFontScaling={false}>{workout.detail}</Text>
      </View>
    </>
  );

  if (!isNext) {
    return <View style={styles.planRow}>{content}</View>;
  }

  return (
    <TactilePressable
      accessibilityRole="button"
      accessibilityLabel={`Build ${workout.title.toLowerCase()} workout`}
      accessibilityHint="Opens the workout builder"
      onPress={() => onBuildWorkout(workout.preset)}
      haptic="light"
      pressedScale={0.985}
      style={[styles.planRow, styles.planRowNext]}
    >
      {content}
    </TactilePressable>
  );
}

export function PlanScreen({
  onBuildWorkout,
}: {
  onBuildWorkout: (preset: PlanPreset) => void;
}) {
  return (
    <ScreenShell>
      <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow} allowFontScaling={false}>The blueprint</Text>
        <Text style={styles.pageTitle} allowFontScaling={false}>FIGHT CAMP</Text>

        <TactilePressable
          accessibilityRole="button"
          accessibilityLabel="Build your next workout"
          accessibilityHint="Opens the workout builder"
          onPress={() => onBuildWorkout(plannedWorkouts[0].preset)}
          haptic="medium"
          pressedScale={0.98}
          style={styles.campCardButton}
        >
          <LinearGradient
            colors={['#f32a24', '#be0d13', '#77080d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.campCard}
          >
            <View style={styles.campRingOuter} pointerEvents="none" />
            <View style={styles.campRingInner} pointerEvents="none" />
            <Text style={styles.campKicker} allowFontScaling={false}>YOUR NEXT THREE</Text>
            <Text style={styles.campTitle} allowFontScaling={false}>BUILD THE{`\n`}ROUND.</Text>
            <View style={styles.campFooter}>
              <Text style={styles.campCount} allowFontScaling={false}>03</Text>
              <Text style={styles.campMeta} allowFontScaling={false}>SESSIONS{`\n`}THIS WEEK</Text>
              <View style={styles.campActionWrap}>
                <Text style={styles.campDays} allowFontScaling={false}>M · W · F</Text>
                <Text style={styles.campAction} allowFontScaling={false}>TAP TO BUILD</Text>
              </View>
            </View>
          </LinearGradient>
        </TactilePressable>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>SESSION MAP</Text>
          <Text style={styles.sectionMeta} allowFontScaling={false}>WEEK 01</Text>
        </View>

        <View style={styles.list}>
          {plannedWorkouts.map((workout, index) => (
            <SessionMapRow
              key={workout.day}
              workout={workout}
              index={index}
              onBuildWorkout={onBuildWorkout}
            />
          ))}
        </View>

        <View style={styles.focusPanel}>
          <Text style={styles.focusLabel} allowFontScaling={false}>CAMP FOCUS</Text>
          <Text style={styles.focusCopy} allowFontScaling={false}>
            Clean repetition first. Speed and power follow a stable base.
          </Text>
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 27,
    paddingBottom: 40,
  },
  eyebrow: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
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
  campCard: {
    width: '100%',
    minHeight: 280,
    padding: 22,
    overflow: 'hidden',
  },
  campCardButton: {
    marginTop: 25,
  },
  campRingOuter: {
    position: 'absolute',
    width: 224,
    height: 224,
    borderRadius: 112,
    top: -126,
    right: -58,
    borderWidth: 28,
    borderColor: 'rgba(255,255,255,0.13)',
  },
  campRingInner: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    right: 29,
    top: 71,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  campKicker: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 2.5,
  },
  campTitle: {
    color: '#fff7f5',
    fontFamily: 'Anton',
    fontSize: 45,
    lineHeight: 50,
    marginTop: 9,
  },
  campFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 'auto',
    paddingTop: 17,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.28)',
  },
  campCount: {
    color: '#fff7f5',
    fontFamily: 'Anton',
    fontSize: 47,
    lineHeight: 48,
  },
  campMeta: {
    color: '#fff7f5',
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.2,
    marginLeft: 11,
    marginBottom: 4,
  },
  campActionWrap: {
    alignItems: 'flex-end',
    marginLeft: 'auto',
    marginBottom: 2,
  },
  campDays: {
    color: '#fff7f5',
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
  },
  campAction: {
    color: '#fff7f5',
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 1.2,
    marginTop: 3,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 31,
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 2,
  },
  sectionMeta: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.4,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  planRow: {
    minHeight: 123,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  planRowNext: {
    backgroundColor: colors.surface,
  },
  dayRail: {
    width: 82,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  dayRailNext: {
    borderRightColor: 'rgba(255,20,20,0.75)',
    backgroundColor: colors.accent,
  },
  dayNumber: {
    color: colors.textMuted,
    fontFamily: 'Anton',
    fontSize: 32,
    lineHeight: 36,
  },
  dayNumberNext: {
    color: colors.text,
  },
  dayText: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.4,
    marginTop: 2,
  },
  dayTextNext: {
    color: colors.text,
  },
  planCopy: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 17,
    paddingVertical: 14,
  },
  nextLabel: {
    color: colors.accentGlow,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 1.7,
    marginBottom: 4,
  },
  planTitle: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: 0.2,
  },
  planFocus: {
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 18,
    lineHeight: 22,
    marginTop: 2,
  },
  planMeta: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.15,
    marginTop: 8,
  },
  focusPanel: {
    marginTop: 30,
    paddingVertical: 21,
    paddingHorizontal: 18,
    borderLeftWidth: 3,
    borderLeftColor: colors.peach,
    backgroundColor: colors.surface,
  },
  focusLabel: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.5,
  },
  focusCopy: {
    maxWidth: 295,
    color: colors.text,
    fontFamily: 'ArchivoNarrow',
    fontSize: 21,
    lineHeight: 25,
    marginTop: 6,
  },
});
