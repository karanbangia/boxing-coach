import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../theme';
import { TactilePressable } from './TactilePressable';

interface Props {
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function BackButton({
  onPress,
  accessibilityLabel = 'Go back',
  accessibilityHint,
  style,
}: Props) {
  return (
    <TactilePressable
      onPress={onPress}
      haptic="light"
      pressedScale={0.92}
      hitSlop={6}
      style={[styles.button, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <Ionicons name="chevron-back" size={24} color={colors.text} />
    </TactilePressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
