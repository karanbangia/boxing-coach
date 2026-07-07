import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { BottomTabBar, type AppTab } from './BottomTabBar';

export function MainTabShell({
  activeTab,
  onTabChange,
  children,
}: {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.shell}>
      <View style={styles.content}>{children}</View>
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
    paddingBottom: 90,
  },
});
