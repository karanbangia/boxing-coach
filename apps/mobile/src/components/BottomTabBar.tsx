import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { TactilePressable } from './TactilePressable';

export type AppTab = 'timer' | 'workout' | 'profile';

const tabs: { id: AppTab; label: string }[] = [
  { id: 'timer', label: 'TRAINING' },
  { id: 'workout', label: 'PROGRESS' },
  { id: 'profile', label: 'PROFILE' },
];

export const TAB_DOCK_CONTENT_HEIGHT = 60;

export function getTabDockHeight(bottomInset: number) {
  return TAB_DOCK_CONTENT_HEIGHT + Math.max(bottomInset, 6);
}

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
      <View style={[styles.calendarIcon, { borderColor: tint }]}>
        <View style={[styles.calendarHeader, { borderColor: tint }]} />
        <View style={[styles.calendarRing, styles.calendarRingLeft, { backgroundColor: tint }]} />
        <View style={[styles.calendarRing, styles.calendarRingRight, { backgroundColor: tint }]} />
        <View style={[styles.calendarDate, styles.calendarDateOne, { backgroundColor: tint }]} />
        <View style={[styles.calendarDate, styles.calendarDateTwo, { backgroundColor: tint }]} />
        <View style={[styles.calendarDate, styles.calendarDateThree, { backgroundColor: tint }]} />
        <View style={[styles.calendarDate, styles.calendarDateFour, { backgroundColor: tint }]} />
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
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.tabSafeArea, { height: getTabDockHeight(insets.bottom) }]}
    >
      <View style={[styles.tabWrap, { paddingBottom: Math.max(insets.bottom, 6) }]}>
        <View style={styles.tabBar}>
          {tabs.map(tab => {
            const active = tab.id === activeTab;
            return (
              <TactilePressable
                key={tab.id}
                accessibilityRole="tab"
                accessibilityLabel={`${tab.label.toLowerCase()} tab`}
                accessibilityState={{ selected: active }}
                onPress={() => onChange(tab.id)}
                haptic="selection"
                pressedScale={0.94}
                style={[
                  styles.tabButton,
                  active && styles.tabButtonActive,
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
              </TactilePressable>
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
    backgroundColor: '#0e0e0e',
  },
  tabWrap: {
    paddingHorizontal: 0,
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
    height: TAB_DOCK_CONTENT_HEIGHT,
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
    fontFamily: 'BarlowSemiCondensed',
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
  calendarIcon: {
    width: 20,
    height: 19,
    borderWidth: 2,
    borderRadius: 3,
  },
  calendarHeader: {
    position: 'absolute',
    left: -2,
    right: -2,
    top: 4,
    borderTopWidth: 2,
  },
  calendarRing: {
    position: 'absolute',
    width: 3,
    height: 5,
    borderRadius: 2,
    top: -4,
  },
  calendarRingLeft: {
    left: 3,
  },
  calendarRingRight: {
    right: 3,
  },
  calendarDate: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2,
    top: 9,
  },
  calendarDateOne: {
    left: 4,
  },
  calendarDateTwo: {
    right: 4,
  },
  calendarDateThree: {
    left: 4,
    top: 14,
  },
  calendarDateFour: {
    right: 4,
    top: 14,
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
