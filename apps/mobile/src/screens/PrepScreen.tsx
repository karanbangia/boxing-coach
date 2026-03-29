import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from '../components/ScreenShell';
import { colors, shadow } from '../theme';

interface Props {
  secondsLeft: number;
  totalRounds: number;
  onSkip: () => void;
  onCancel: () => void;
}

export function PrepScreen({ secondsLeft, totalRounds, onSkip, onCancel }: Props) {
  return (
    <ScreenShell>
      <View style={styles.container}>
        <Text style={styles.kicker}>GET READY</Text>
        <Text style={styles.timer}>{secondsLeft}</Text>
        <Text style={styles.subtitle}>
          Strap in, wrap up, gloves on — round 1 of {totalRounds} starts when the timer hits zero.
        </Text>
        <Pressable
          onPress={onSkip}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.primaryBtnText}>START NOW</Text>
        </Pressable>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.secondaryBtnText}>CANCEL</Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    color: colors.textMuted,
    marginBottom: 8,
  },
  timer: {
    fontSize: 96,
    fontWeight: '900',
    color: colors.text,
    fontVariant: ['tabular-nums'],
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
    marginBottom: 32,
  },
  primaryBtn: {
    width: '100%',
    maxWidth: 320,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    ...shadow,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
    color: colors.background,
  },
  secondaryBtn: {
    width: '100%',
    maxWidth: 320,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  btnPressed: {
    opacity: 0.88,
  },
});
