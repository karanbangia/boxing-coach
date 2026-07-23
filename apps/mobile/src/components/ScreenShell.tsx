import type { PropsWithChildren } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { premiumBackgroundGradient } from '../theme';

type Props = PropsWithChildren;

export function ScreenShell({ children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={premiumBackgroundGradient.colors}
      locations={premiumBackgroundGradient.locations}
      start={premiumBackgroundGradient.start}
      end={premiumBackgroundGradient.end}
      style={styles.root}
    >
      <View
        style={[
          styles.safeArea,
          {
            paddingTop: insets.top,
            paddingRight: insets.right,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
          },
        ]}
      >
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});
