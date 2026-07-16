import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';

export function SkeletonBlock({ style }: { style?: StyleProp<ViewStyle> }) {
  const opacity = useRef(new Animated.Value(0.48)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    opacity.stopAnimation();

    if (reduceMotion) {
      opacity.setValue(0.68);
      return undefined;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.82,
          duration: 720,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.42,
          duration: 720,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacity, reduceMotion]);

  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.block, { opacity }, style]}
    />
  );
}

const styles = StyleSheet.create({
  block: {
    overflow: 'hidden',
    backgroundColor: '#3a3434',
    borderRadius: 2,
  },
});
