import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useRef, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';

type HapticFeedback = 'none' | 'selection' | 'light' | 'medium' | 'success';

const outerLayoutKeys = [
  'alignSelf',
  'bottom',
  'end',
  'flex',
  'flexBasis',
  'flexGrow',
  'flexShrink',
  'height',
  'left',
  'margin',
  'marginBottom',
  'marginEnd',
  'marginHorizontal',
  'marginLeft',
  'marginRight',
  'marginStart',
  'marginTop',
  'marginVertical',
  'maxHeight',
  'maxWidth',
  'minHeight',
  'minWidth',
  'position',
  'right',
  'start',
  'top',
  'width',
] as const;

const sizingKeys = new Set<keyof ViewStyle>([
  'bottom',
  'flex',
  'flexBasis',
  'flexGrow',
  'flexShrink',
  'height',
  'left',
  'maxHeight',
  'maxWidth',
  'minHeight',
  'minWidth',
  'position',
  'right',
  'top',
  'width',
]);

interface Props extends Omit<PressableProps, 'children' | 'style'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
  haptic?: HapticFeedback;
}

function triggerHaptic(feedback: HapticFeedback) {
  switch (feedback) {
    case 'selection':
      void Haptics.selectionAsync();
      return;
    case 'medium':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    case 'success':
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    case 'light':
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    case 'none':
      return;
  }
}

function splitStyle(style?: StyleProp<ViewStyle>) {
  const flattened = StyleSheet.flatten(style);
  if (!flattened) {
    return { contentStyle: undefined, outerStyle: undefined, shouldFill: false };
  }

  const contentStyle = { ...flattened };
  const outerStyle: ViewStyle = {};
  const contentStyleRecord = contentStyle as Record<string, unknown>;
  const outerStyleRecord = outerStyle as Record<string, unknown>;
  let shouldFill = false;

  for (const key of outerLayoutKeys) {
    const value = contentStyleRecord[key];
    if (value === undefined) continue;

    outerStyleRecord[key] = value;
    delete contentStyleRecord[key];
    shouldFill ||= sizingKeys.has(key);
  }

  return { contentStyle, outerStyle, shouldFill };
}

/**
 * Keeps every high-frequency control feeling physical: a fast press-in, a
 * spring release, and a small haptic acknowledgement after an action lands.
 */
export function TactilePressable({
  children,
  style,
  pressedScale = 0.975,
  haptic = 'light',
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  ...props
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReducedMotion();
  const { contentStyle, outerStyle, shouldFill } = useMemo(() => splitStyle(style), [style]);

  const animateTo = useCallback(
    (toValue: number, duration: number) => {
      scale.stopAnimation();
      if (reduceMotion) {
        scale.setValue(1);
        return;
      }
      Animated.timing(scale, {
        toValue,
        duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    },
    [reduceMotion, scale],
  );

  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      animateTo(pressedScale, 75);
      onPressIn?.(event);
    },
    [animateTo, onPressIn, pressedScale],
  );

  const handlePressOut = useCallback(
    (event: GestureResponderEvent) => {
      scale.stopAnimation();
      if (reduceMotion) {
        scale.setValue(1);
        onPressOut?.(event);
        return;
      }
      Animated.spring(scale, {
        toValue: 1,
        tension: 280,
        friction: 15,
        useNativeDriver: true,
      }).start();
      onPressOut?.(event);
    },
    [onPressOut, reduceMotion, scale],
  );

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (!disabled) triggerHaptic(haptic);
      onPress?.(event);
    },
    [disabled, haptic, onPress],
  );

  return (
    <Animated.View style={[outerStyle, { transform: [{ scale }] }]}>
      <Pressable
        {...props}
        disabled={disabled}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[shouldFill && styles.fill, contentStyle]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    alignSelf: 'stretch',
    flex: 1,
  },
});
