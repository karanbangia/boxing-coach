import { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  DIFFICULTIES,
  REST_DURATIONS,
  ROUND_DURATIONS,
  TOTAL_ROUNDS,
  type SetupSettings,
} from '../config';
import { ScreenShell } from '../components/ScreenShell';
import { colors, shadow } from '../theme';

const DEV_TAP_THRESHOLD = 3;
const DEV_TAP_WINDOW_MS = 3500;

interface Props {
  settings: SetupSettings;
  isReady: boolean;
  onChange: (patch: Partial<SetupSettings>) => void;
  onStart: (settings: SetupSettings) => void;
  onOpenDev: () => void;
}

function OptionGroup<T extends string | number>({
  label,
  options,
  value,
  onSelect,
  compact = false,
}: {
  label: string;
  options: { value: T; label: string; desc?: string }[];
  value: T;
  onSelect: (value: T) => void;
  compact?: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={compact ? styles.compactGrid : styles.fullGrid}>
        {options.map(option => {
          const selected = option.value === value;

          return (
            <Pressable
              key={String(option.value)}
              onPress={() => onSelect(option.value)}
              style={({ pressed }) => [
                styles.optionCard,
                !compact && styles.fullOptionCard,
                compact && styles.compactOptionCard,
                compact && label === 'Round Duration' && styles.roundDurationOptionCard,
                compact && label === 'Rounds' && styles.roundsOptionCard,
                compact && label === 'Rest Between Rounds' && styles.restOptionCard,
                selected && styles.optionCardSelected,
                pressed && styles.optionCardPressed,
              ]}
            >
              <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                {option.label}
              </Text>
              {option.desc ? (
                <Text style={[styles.optionDesc, selected && styles.optionDescSelected]}>
                  {option.desc}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SetupScreen({ settings, isReady, onChange, onStart, onOpenDev }: Props) {
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }
    };
  }, []);

  const handleHeroPress = () => {
    tapCountRef.current += 1;

    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    if (tapCountRef.current >= DEV_TAP_THRESHOLD) {
      tapCountRef.current = 0;
      onOpenDev();
      return;
    }

    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
      tapTimerRef.current = null;
    }, DEV_TAP_WINDOW_MS);
  };

  return (
    <ScreenShell>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={handleHeroPress} style={({ pressed }) => [pressed && styles.heroPressed]}>
          <View style={styles.heroPanel}>
            <Text style={styles.title}>BOXING</Text>
            <Text style={[styles.title, styles.titleAccent]}>COACH</Text>
            <Text style={styles.subtitle}>
              Set up your workout and hit the bag.
            </Text>
          </View>
        </Pressable>

        {!isReady ? (
          <View style={styles.loadingPanel}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.loadingText}>Loading your last session...</Text>
          </View>
        ) : (
          <>
            <OptionGroup
              label="Difficulty"
              options={DIFFICULTIES}
              value={settings.difficulty}
              onSelect={difficulty => onChange({ difficulty })}
            />
            <OptionGroup
              label="Round Duration"
              options={ROUND_DURATIONS}
              value={settings.roundDuration}
              onSelect={roundDuration => onChange({ roundDuration })}
              compact
            />
            <OptionGroup
              label="Rounds"
              options={TOTAL_ROUNDS}
              value={settings.totalRounds}
              onSelect={totalRounds => onChange({ totalRounds })}
              compact
            />
            <OptionGroup
              label="Rest Between Rounds"
              options={REST_DURATIONS}
              value={settings.restDuration}
              onSelect={restDuration => onChange({ restDuration })}
              compact
            />

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Audio</Text>
              <Pressable
                onPress={() => onChange({ audioCuesEnabled: !settings.audioCuesEnabled })}
                style={({ pressed }) => [
                  styles.audioCueRow,
                  settings.audioCuesEnabled && styles.audioCueRowOn,
                  pressed && styles.optionCardPressed,
                ]}
              >
                <Text
                  style={[
                    styles.audioCueLabel,
                    settings.audioCuesEnabled && styles.optionLabelSelected,
                  ]}
                >
                  Audio cues
                </Text>
                <Text
                  style={[
                    styles.audioCueValue,
                    settings.audioCuesEnabled && styles.optionLabelSelected,
                  ]}
                >
                  {settings.audioCuesEnabled ? 'ON' : 'OFF'}
                </Text>
              </Pressable>
              <Text style={styles.audioCueHint}>
                Spoken callouts when clips are bundled. Round sounds still play unless muted in
                workout.
              </Text>
            </View>

            <Pressable
              onPress={() => onStart(settings)}
              style={({ pressed }) => [
                styles.startButton,
                pressed && styles.startButtonPressed,
              ]}
            >
              <Text style={styles.startButtonText}>START WORKOUT</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  heroPanel: {
    paddingVertical: 2,
    marginBottom: 14,
  },
  heroPressed: {
    opacity: 0.98,
    transform: [{ scale: 0.995 }],
  },
  title: {
    color: colors.text,
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: 1,
  },
  titleAccent: {
    color: colors.accent,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
  },
  loadingPanel: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  section: {
    marginBottom: 14,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.4,
    marginBottom: 8,
    paddingLeft: 2,
    textTransform: 'uppercase',
  },
  fullGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  compactGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  optionCard: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: colors.surfaceMuted,
  },
  fullOptionCard: {
    width: '48.5%',
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactOptionCard: {
    minWidth: 0,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  roundDurationOptionCard: {
    width: 68,
  },
  roundsOptionCard: {
    width: 56,
  },
  restOptionCard: {
    width: 72,
  },
  optionCardSelected: {
    backgroundColor: colors.accent,
  },
  optionCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  optionLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  optionLabelSelected: {
    color: '#FFF5F4',
  },
  optionDesc: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 3,
  },
  optionDescSelected: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  audioCueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surfaceMuted,
  },
  audioCueRowOn: {
    backgroundColor: colors.accent,
  },
  audioCueLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  audioCueValue: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  audioCueHint: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  startButton: {
    marginTop: 4,
    minHeight: 56,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    ...shadow,
  },
  startButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  startButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
});
