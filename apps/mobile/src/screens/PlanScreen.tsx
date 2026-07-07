import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { colors } from '../theme';

const plannedWorkouts = [
  ['Mon', 'Bag Basics', '3 rounds'],
  ['Wed', 'Defense Builder', '4 rounds'],
  ['Fri', 'Power Finish', '6 rounds'],
];

export function PlanScreen() {
  return (
    <ScreenShell>
      <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Plan</Text>
        <Text style={styles.pageTitle}>THIS WEEK</Text>
        <View style={styles.list}>
          {plannedWorkouts.map(([day, title, meta], index) => (
            <View key={day} style={styles.planRow}>
              <View style={[styles.dayBadge, index === 0 && styles.dayBadgeActive]}>
                <Text style={[styles.dayText, index === 0 && styles.dayTextActive]}>{day}</Text>
              </View>
              <View style={styles.planCopy}>
                <Text style={styles.planTitle} numberOfLines={1}>{title}</Text>
                <Text style={styles.planMeta}>{meta}</Text>
              </View>
              <View style={styles.rowDot} />
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 22,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  pageTitle: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 6,
  },
  list: {
    marginTop: 28,
    gap: 12,
  },
  planRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  dayBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  dayBadgeActive: {
    backgroundColor: colors.accent,
  },
  dayText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '900',
  },
  dayTextActive: {
    color: colors.text,
  },
  planCopy: {
    flex: 1,
    minWidth: 0,
  },
  planTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  planMeta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  rowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
});
