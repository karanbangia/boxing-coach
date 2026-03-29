import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import type { TuningOverrides } from '@boxing-coach/core';
import { ScreenShell } from '../components/ScreenShell';
import { colors, shadow } from '../theme';

interface Props {
  tuning: TuningOverrides;
  onChange: (tuning: TuningOverrides) => void;
  onBack: () => void;
}

interface SliderRowProps {
  label: string;
  hint: string;
  value: number | undefined;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number | undefined) => void;
  onDragStateChange: (dragging: boolean) => void;
}

function SliderRow({
  label,
  hint,
  value,
  defaultValue,
  min,
  max,
  step,
  unit = '',
  onChange,
  onDragStateChange,
}: SliderRowProps) {
  const active = value !== undefined;
  const display = value ?? defaultValue;
  const progress = ((display - min) / (max - min)) * 100;
  const trackRef = useRef<View | null>(null);
  const trackWidthRef = useRef(0);
  const trackPageXRef = useRef(0);
  const lastEmittedRef = useRef<number>(display);

  useEffect(() => {
    lastEmittedRef.current = display;
  }, [display]);

  const measureTrack = (afterMeasure?: () => void) => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      trackPageXRef.current = x;
      trackWidthRef.current = width;
      afterMeasure?.();
    });
  };

  const updateFromPageX = (pageX: number) => {
    if (trackWidthRef.current <= 0) {
      return;
    }

    const localX = pageX - trackPageXRef.current;
    const ratio = Math.max(0, Math.min(1, localX / trackWidthRef.current));
    const raw = min + ratio * (max - min);
    const snapped = min + Math.round((raw - min) / step) * step;
    const nextValue = Math.max(min, Math.min(max, snapped));

    if (nextValue === lastEmittedRef.current) {
      return;
    }

    lastEmittedRef.current = nextValue;
    onChange(nextValue);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: event => {
          onDragStateChange(true);
          measureTrack(() => {
            updateFromPageX(event.nativeEvent.pageX);
          });
        },
        onPanResponderMove: event => {
          updateFromPageX(event.nativeEvent.pageX);
        },
        onPanResponderRelease: () => {
          onDragStateChange(false);
        },
        onPanResponderTerminate: () => {
          onDragStateChange(false);
        },
      }),
    [min, max, step, onChange, onDragStateChange],
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    trackWidthRef.current = event.nativeEvent.layout.width;
    measureTrack();
  };

  return (
    <View style={styles.card}>
      <View style={styles.rowHeader}>
        <Pressable onPress={() => onChange(active ? undefined : defaultValue)}>
          <Text style={[styles.rowTitle, active && styles.rowTitleActive]}>
            {label} {active ? '' : '(default)'}
          </Text>
        </Pressable>
        <Text style={styles.rowValue}>
          {display}
          {unit}
        </Text>
      </View>

      <View
        ref={trackRef}
        style={styles.sliderWrap}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        <View style={styles.sliderTrack} />
        <View style={[styles.sliderFill, { width: `${progress}%` }]} />
        <View style={[styles.sliderThumb, { left: `${progress}%` }]} />
      </View>

      <View style={styles.sliderButtons}>
        <Pressable
          onPress={() => onChange(Math.max(min, display - step))}
          style={({ pressed }) => [styles.adjustButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.adjustButtonText}>-</Text>
        </Pressable>
        <Pressable
          onPress={() => onChange(Math.min(max, display + step))}
          style={({ pressed }) => [styles.adjustButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.adjustButtonText}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.rowHint}>{hint}</Text>
    </View>
  );
}

function ToggleRow({
  value,
  onChange,
}: {
  value: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
}) {
  const active = value !== undefined;
  const display = value ?? true;

  return (
    <View style={styles.card}>
      <View style={styles.rowHeader}>
        <Pressable onPress={() => onChange(active ? undefined : true)}>
          <Text style={[styles.rowTitle, active && styles.rowTitleActive]}>
            Tighten At Midpoint {active ? '' : '(default)'}
          </Text>
        </Pressable>
        <Switch
          value={display}
          onValueChange={next => onChange(next)}
          trackColor={{ false: colors.surfaceMuted, true: colors.accentSoft }}
          thumbColor={display ? colors.accent : colors.textMuted}
        />
      </View>
      <Text style={styles.rowHint}>
        Increase movement and defense frequency in the second half of the workout.
      </Text>
    </View>
  );
}

export function DevScreen({ tuning, onChange, onBack }: Props) {
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  const set = (key: keyof TuningOverrides) => (value: number | boolean | undefined) => {
    onChange({ ...tuning, [key]: value });
  };

  return (
    <ScreenShell>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isDraggingSlider}
      >
        <Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
          <Text style={styles.backButtonText}>← BACK TO SETUP</Text>
        </Pressable>

        <View style={styles.hero}>
          <Text style={styles.kicker}>HIDDEN PANEL</Text>
          <Text style={styles.title}>DEV</Text>
          <Text style={[styles.title, styles.titleAccent]}>TUNING</Text>
          <Text style={styles.subtitle}>
            Changes are saved locally and apply the next time you start a workout.
          </Text>
        </View>

        <SliderRow
          label="Recovery Gap Base"
          hint="ms recovery after each action at round 1"
          value={tuning.intervalBase}
          defaultValue={1300}
          min={500}
          max={6000}
          step={250}
          unit="ms"
          onChange={set('intervalBase')}
          onDragStateChange={setIsDraggingSlider}
        />
        <SliderRow
          label="Recovery Gap Min"
          hint="fastest recovery pace floor"
          value={tuning.intervalMin}
          defaultValue={800}
          min={300}
          max={4000}
          step={250}
          unit="ms"
          onChange={set('intervalMin')}
          onDragStateChange={setIsDraggingSlider}
        />
        <SliderRow
          label="Tighten / Round"
          hint="ms removed from the gap each round"
          value={tuning.tightenPerRound}
          defaultValue={250}
          min={0}
          max={1000}
          step={25}
          unit="ms"
          onChange={set('tightenPerRound')}
          onDragStateChange={setIsDraggingSlider}
        />
        <SliderRow
          label="Movement Every N"
          hint="movement callouts every Nth action"
          value={tuning.movementEveryN}
          defaultValue={8}
          min={2}
          max={10}
          step={1}
          onChange={set('movementEveryN')}
          onDragStateChange={setIsDraggingSlider}
        />
        <SliderRow
          label="Defense Every N"
          hint="defense callouts every Nth action"
          value={tuning.defenseEveryN}
          defaultValue={7}
          min={2}
          max={15}
          step={1}
          onChange={set('defenseEveryN')}
          onDragStateChange={setIsDraggingSlider}
        />
        <ToggleRow
          value={tuning.tightenAtMidpoint}
          onChange={set('tightenAtMidpoint')}
        />
        <SliderRow
          label="Freestyle Threshold"
          hint="override only: default 15s before round end (all round lengths)"
          value={tuning.freestyleThreshold}
          defaultValue={10}
          min={0}
          max={60}
          step={1}
          unit="s"
          onChange={set('freestyleThreshold')}
          onDragStateChange={setIsDraggingSlider}
        />
        <SliderRow
          label="Freestyle Interval"
          hint="legacy; ~15s finisher clips"
          value={tuning.freestyleIntervalMs}
          defaultValue={1000}
          min={400}
          max={3000}
          step={100}
          unit="ms"
          onChange={set('freestyleIntervalMs')}
          onDragStateChange={setIsDraggingSlider}
        />
        <SliderRow
          label="Jitter"
          hint="random variation added around the interval"
          value={tuning.jitterMs}
          defaultValue={300}
          min={0}
          max={2000}
          step={50}
          unit="ms"
          onChange={set('jitterMs')}
          onDragStateChange={setIsDraggingSlider}
        />
        <SliderRow
          label="Start countdown"
          hint="seconds after Start before round 1 (gloves); 0 = skip"
          value={tuning.prepCountdownSeconds}
          defaultValue={10}
          min={0}
          max={120}
          step={1}
          unit="s"
          onChange={set('prepCountdownSeconds')}
          onDragStateChange={setIsDraggingSlider}
        />

        <Pressable
          onPress={() => onChange({})}
          style={({ pressed }) => [styles.resetButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.resetButtonText}>RESET ALL TO DEFAULTS</Text>
        </Pressable>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 14,
  },
  backButton: {
    alignSelf: 'stretch',
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    marginBottom: 2,
  },
  backButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  hero: {
    padding: 22,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  kicker: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 12,
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
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
  },
  card: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rowTitle: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 1,
  },
  rowTitleActive: {
    color: colors.accent,
  },
  rowValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  sliderWrap: {
    height: 20,
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 12,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  sliderThumb: {
    position: 'absolute',
    marginLeft: -8,
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: colors.text,
  },
  sliderButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  adjustButton: {
    width: 44,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adjustButtonText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
  },
  rowHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  resetButton: {
    marginTop: 4,
    minHeight: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
