import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { colors, shadow } from '../theme';

export type AppTab = 'timer' | 'workout' | 'plan' | 'profile';

const tabs: { id: AppTab; label: string }[] = [
  { id: 'timer', label: 'TIMER' },
  { id: 'workout', label: 'WORKOUT' },
  { id: 'plan', label: 'PLAN' },
  { id: 'profile', label: 'PROFILE' },
];

function LineIcon({ tab, active }: { tab: AppTab; active: boolean }) {
  const tint = active ? colors.text : colors.textMuted;

  if (tab === 'timer') {
    return (
      <View style={styles.iconBox}>
        <View style={[styles.timerStem, { backgroundColor: tint }]} />
        <View style={[styles.timerCircle, { borderColor: tint }]}>
          <View style={[styles.timerHand, { backgroundColor: tint }]} />
        </View>
      </View>
    );
  }

  if (tab === 'workout') {
    return (
      <View style={styles.iconBox}>
        <View style={[styles.bellBar, { backgroundColor: tint }]} />
        <View style={[styles.bellBar, styles.bellBarBottom, { backgroundColor: tint }]} />
        <View style={[styles.bellCapLeft, { backgroundColor: tint }]} />
        <View style={[styles.bellCapRight, { backgroundColor: tint }]} />
      </View>
    );
  }

  if (tab === 'plan') {
    return (
      <View style={[styles.planBox, { borderColor: tint }]}>
        <View style={[styles.planLine, { backgroundColor: tint }]} />
        <View style={[styles.planLineShort, { backgroundColor: tint }]} />
      </View>
    );
  }

  return (
    <View style={styles.iconBox}>
      <View style={[styles.profileHead, { borderColor: tint }]} />
      <View style={[styles.profileBody, { borderColor: tint }]} />
    </View>
  );
}

export function BottomTabBar({
  activeTab,
  onChange,
}: {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}) {
  return (
    <SafeAreaView pointerEvents="box-none" style={styles.tabSafeArea}>
      <View style={styles.tabWrap}>
        <View style={styles.tabBar}>
          {tabs.map(tab => {
            const active = tab.id === activeTab;
            return (
              <Pressable
                key={tab.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => onChange(tab.id)}
                style={({ pressed }) => [
                  styles.tabButton,
                  active && styles.tabButtonActive,
                  pressed && styles.tabButtonPressed,
                ]}
              >
                <LineIcon tab={tab.id} active={active} />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabSafeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  tabBar: {
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    gap: 4,
    padding: 6,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(17,17,17,0.96)',
    ...shadow,
  },
  tabButton: {
    flex: 1,
    height: 56,
    minWidth: 0,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: colors.accent,
  },
  tabButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  tabLabel: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  tabLabelActive: {
    color: colors.text,
  },
  iconBox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerStem: {
    width: 8,
    height: 2,
    borderRadius: 2,
    marginBottom: 2,
  },
  timerCircle: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerHand: {
    width: 2,
    height: 6,
    borderRadius: 2,
    transform: [{ rotate: '35deg' }],
  },
  bellBar: {
    position: 'absolute',
    width: 14,
    height: 2,
    borderRadius: 2,
    top: 7,
  },
  bellBarBottom: {
    top: 14,
  },
  bellCapLeft: {
    position: 'absolute',
    width: 2,
    height: 10,
    borderRadius: 2,
    left: 2,
    top: 6,
  },
  bellCapRight: {
    position: 'absolute',
    width: 2,
    height: 10,
    borderRadius: 2,
    right: 2,
    top: 6,
  },
  planBox: {
    width: 20,
    height: 21,
    borderRadius: 6,
    borderWidth: 2,
    paddingHorizontal: 4,
    justifyContent: 'center',
    gap: 4,
  },
  planLine: {
    height: 2,
    width: 9,
    borderRadius: 2,
  },
  planLineShort: {
    height: 2,
    width: 6,
    borderRadius: 2,
  },
  profileHead: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
    marginBottom: 2,
  },
  profileBody: {
    width: 18,
    height: 9,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderWidth: 2,
    borderBottomWidth: 0,
  },
});
