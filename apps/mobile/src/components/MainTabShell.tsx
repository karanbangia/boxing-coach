import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { colors } from '../theme';
import { BottomTabBar, getTabDockHeight, type AppTab } from './BottomTabBar';

export function MainTabShell({
  activeTab,
  onTabChange,
  children,
}: {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const contentTransition = useRef(new Animated.Value(1)).current;
  const previousTab = useRef(activeTab);

  useLayoutEffect(() => {
    contentTransition.stopAnimation();
    if (reduceMotion) {
      previousTab.current = activeTab;
      contentTransition.setValue(1);
      return;
    }
    if (previousTab.current === activeTab) return;

    previousTab.current = activeTab;
    contentTransition.setValue(0);
    Animated.timing(contentTransition, {
      toValue: 1,
      duration: 185,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeTab, contentTransition, reduceMotion]);

  const translateY = contentTransition.interpolate({
    inputRange: [0, 1],
    outputRange: [7, 0],
  });

  return (
    <View style={styles.shell}>
      <Animated.View
        style={[
          styles.content,
          {
            paddingBottom: getTabDockHeight(insets.bottom),
            opacity: contentTransition,
            transform: [{ translateY }],
          },
        ]}
      >
        {children}
      </Animated.View>
      <BottomTabBar activeTab={activeTab} onChange={onTabChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});
