import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { colors } from '../theme';

export function WorkoutHomeScreen({ onOpenTimer }: { onOpenTimer: () => void }) {
  return (
    <ScreenShell>
      <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Workout</Text>
        <Text style={styles.pageTitle}>READY ROOM</Text>

        <View style={styles.featurePanel}>
          <View style={styles.featureHeader}>
            <View>
              <Text style={styles.mutedText}>Next up</Text>
              <Text style={styles.featureTitle}>3 Round Tune-Up</Text>
            </View>
            <View style={styles.roundBadge}>
              <Text style={styles.roundBadgeText}>3</Text>
            </View>
          </View>

          <View style={styles.metaGrid}>
            {['2 MIN', '30s REST', 'BEGINNER'].map(item => (
              <View key={item} style={styles.metaPill}>
                <Text style={styles.metaText}>{item}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={onOpenTimer}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}
          >
            <Text style={styles.primaryButtonText}>SET TIMER</Text>
          </Pressable>
        </View>

        <View style={styles.statGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Rounds Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0:00</Text>
            <Text style={styles.statLabel}>Bag Time</Text>
          </View>
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
  featurePanel: {
    marginTop: 28,
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: colors.surface,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  featureTitle: {
    color: colors.text,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  roundBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  roundBadgeText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  metaPill: {
    flex: 1,
    minHeight: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 6,
  },
  metaText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
  },
  primaryButton: {
    height: 52,
    marginTop: 20,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text,
  },
  primaryPressed: {
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '900',
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
