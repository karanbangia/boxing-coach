import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export type AppTab = 'timer' | 'workout' | 'plan' | 'profile';

const tabs: { id: AppTab; label: string }[] = [
  { id: 'timer', label: 'TRAINING' },
  { id: 'workout', label: 'STATS' },
  { id: 'plan', label: 'PLANS' },
];

function LineIcon({ tab, active }: { tab: AppTab; active: boolean }) {
  const tint = active ? colors.peach : colors.textMuted;

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
    <View pointerEvents="box-none" style={styles.tabSafeArea}>
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
                <Text
                  style={[styles.tabLabel, active && styles.tabLabelActive]}
                  numberOfLines={1}
                  allowFontScaling={false}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabSafeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    backgroundColor: '#0e0e0e',
  },
  tabWrap: {
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  tabBar: {
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: '#353535',
    backgroundColor: '#0e0e0e',
  },
  tabButton: {
    flex: 1,
    height: 58,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 4,
    borderTopColor: 'transparent',
    gap: 4,
  },
  tabButtonActive: {
    borderTopColor: colors.peach,
  },
  tabButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  tabLabel: {
    color: colors.textMuted,
    fontFamily: 'SpaceGrotesk',
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1,
  },
  tabLabelActive: {
    color: colors.peach,
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
