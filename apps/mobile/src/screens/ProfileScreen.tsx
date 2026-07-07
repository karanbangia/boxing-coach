import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { colors } from '../theme';

const profileStats = [
  ['0', 'Total Rounds'],
  ['0', 'Workouts'],
  ['0', 'Day Streak'],
  ['Beginner', 'Level'],
];

export function ProfileScreen() {
  return (
    <ScreenShell>
      <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>BC</Text>
          </View>
          <View>
            <Text style={styles.eyebrow}>Profile</Text>
            <Text style={styles.pageTitle}>FIGHTER</Text>
          </View>
        </View>
        <View style={styles.statGrid}>
          {profileStats.map(([value, label]) => (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text,
  },
  avatarText: {
    color: colors.background,
    fontSize: 20,
    fontWeight: '900',
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
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 96,
    borderRadius: 24,
    padding: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 5,
  },
});
