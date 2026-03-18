import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { colors, shadow } from '../theme';

interface Props {
  totalRounds: number;
  roundDuration: number;
  onRestart: () => void;
}

export function CompleteScreen({ totalRounds, roundDuration, onRestart }: Props) {
  const totalMinutes = Math.round((totalRounds * roundDuration) / 60);

  return (
    <ScreenShell>
      <View style={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>DONE</Text>
        </View>

        <Text style={styles.title}>Workout complete.</Text>
        <Text style={styles.subtitle}>
          {totalRounds} rounds in the bank. Catch your breath, then go again when you are ready.
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalRounds}</Text>
            <Text style={styles.summaryLabel}>ROUNDS</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalMinutes}</Text>
            <Text style={styles.summaryLabel}>MINUTES</Text>
          </View>
        </View>

        <Pressable
          onPress={onRestart}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>GO AGAIN</Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  badge: {
    minWidth: 92,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(244, 79, 90, 0.4)',
    marginBottom: 20,
  },
  badgeText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2.8,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 14,
    maxWidth: 320,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 36,
    borderRadius: 28,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow,
  },
  summaryCard: {
    paddingVertical: 26,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.4,
    marginTop: 6,
  },
  button: {
    minWidth: 220,
    minHeight: 58,
    paddingHorizontal: 24,
    marginTop: 34,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    ...shadow,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.7,
  },
});
