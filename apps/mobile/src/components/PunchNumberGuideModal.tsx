import { PUNCH_NUMBER_GUIDE } from '@boxing-coach/core';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenShell } from './ScreenShell';
import { TactilePressable } from './TactilePressable';
import { colors, textLineHeight } from '../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const QUICK_COMBOS = [
  { numbers: '1–2', punches: 'Jab · Cross' },
  { numbers: '1–2–3', punches: 'Jab · Cross · Lead Hook' },
  { numbers: '5–6–2', punches: 'Lead Uppercut · Rear Uppercut · Cross' },
] as const;

export function PunchNumberGuideModal({ visible, onClose }: Props) {
  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      visible={visible}
      onRequestClose={onClose}
    >
      <ScreenShell>
        <View style={styles.screen} accessibilityViewIsModal>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.kicker} allowFontScaling={false}>COACH REFERENCE</Text>
              <Text
                style={styles.title}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                allowFontScaling={false}
              >
                PUNCH NUMBERS
              </Text>
            </View>
            <TactilePressable
              accessibilityRole="button"
              accessibilityLabel="Close punch number guide"
              onPress={onClose}
              haptic="light"
              pressedScale={0.92}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText} allowFontScaling={false}>×</Text>
            </TactilePressable>
          </View>

          <ScrollView
            style={styles.scroller}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.intro}>
              Use lead and rear—not left and right—so every call stays correct in orthodox or southpaw.
            </Text>

            <View style={styles.stanceRule}>
              <View style={styles.stanceRuleItem}>
                <Text style={styles.stanceRuleLabel} allowFontScaling={false}>LEAD</Text>
                <Text style={styles.stanceRuleValue}>Front hand and foot</Text>
              </View>
              <View style={styles.stanceRuleDivider} />
              <View style={styles.stanceRuleItem}>
                <Text style={styles.stanceRuleLabel} allowFontScaling={false}>REAR</Text>
                <Text style={styles.stanceRuleValue}>Back hand and foot</Text>
              </View>
            </View>

            <View style={styles.punchGrid}>
              {PUNCH_NUMBER_GUIDE.map(punch => (
                <View
                  key={punch.number}
                  accessible
                  accessibilityLabel={`${punch.number}, ${punch.name}, ${punch.cue}`}
                  style={styles.punchCard}
                >
                  <Text style={styles.punchNumber} allowFontScaling={false}>{punch.number}</Text>
                  <View style={styles.punchCopy}>
                    <Text
                      style={styles.punchName}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.72}
                      allowFontScaling={false}
                    >
                      {punch.name}
                    </Text>
                    <Text style={styles.punchCue}>{punch.cue}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.bodyShotNote}>
              <Text style={styles.bodyShotMark} allowFontScaling={false}>B</Text>
              <View style={styles.bodyShotCopy}>
                <Text style={styles.bodyShotTitle} allowFontScaling={false}>BODY SHOT PREFIX</Text>
                <Text style={styles.bodyShotText}>
                  A B before the number changes the target, not the hand. B3 means a lead hook to the body.
                </Text>
              </View>
            </View>

            <View style={styles.quickSection}>
              <Text style={styles.sectionLabel} allowFontScaling={false}>QUICK COMBOS</Text>
              {QUICK_COMBOS.map(combo => (
                <View key={combo.numbers} style={styles.comboRow}>
                  <Text style={styles.comboNumbers} allowFontScaling={false}>{combo.numbers}</Text>
                  <Text style={styles.comboPunches}>{combo.punches}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.footerNote}>
              Advanced sessions may also call movement and defense words such as slip, roll, pivot, and step.
            </Text>
          </ScrollView>
        </View>
      </ScreenShell>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    minHeight: 104,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  headerCopy: { flex: 1 },
  kicker: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 11,
    lineHeight: textLineHeight(11),
    letterSpacing: 2,
  },
  title: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 46,
    lineHeight: textLineHeight(46),
    marginTop: 8,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: colors.text,
    fontFamily: 'ArchivoNarrow',
    fontSize: 32,
    lineHeight: 34,
    marginTop: -2,
  },
  scroller: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 34,
    gap: 18,
  },
  intro: {
    color: colors.text,
    fontFamily: 'ArchivoNarrow',
    fontSize: 17,
    lineHeight: textLineHeight(17),
  },
  stanceRule: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 2,
    borderColor: colors.peach,
    backgroundColor: 'rgba(249,189,173,0.08)',
  },
  stanceRuleItem: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  stanceRuleDivider: {
    width: 2,
    backgroundColor: colors.peach,
  },
  stanceRuleLabel: {
    color: colors.peach,
    fontFamily: 'Anton',
    fontSize: 19,
    lineHeight: textLineHeight(19),
  },
  stanceRuleValue: {
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 14,
    lineHeight: textLineHeight(14),
  },
  punchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  punchCard: {
    width: '48.5%',
    minHeight: 91,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  punchNumber: {
    width: 39,
    color: colors.accent,
    fontFamily: 'Anton',
    fontSize: 48,
    lineHeight: textLineHeight(48),
    textAlign: 'center',
  },
  punchCopy: { flex: 1 },
  punchName: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 18,
    lineHeight: textLineHeight(18),
  },
  punchCue: {
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 13,
    lineHeight: textLineHeight(13),
  },
  bodyShotNote: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    backgroundColor: colors.surface,
  },
  bodyShotMark: {
    width: 48,
    color: colors.accent,
    fontFamily: 'Anton',
    fontSize: 48,
    lineHeight: textLineHeight(48),
    textAlign: 'center',
  },
  bodyShotCopy: { flex: 1 },
  bodyShotTitle: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 11,
    lineHeight: textLineHeight(11),
    letterSpacing: 1.4,
  },
  bodyShotText: {
    color: colors.text,
    fontFamily: 'ArchivoNarrow',
    fontSize: 14,
    lineHeight: textLineHeight(14),
  },
  quickSection: { gap: 8 },
  sectionLabel: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 12,
    lineHeight: textLineHeight(12),
    letterSpacing: 1.8,
  },
  comboRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  comboNumbers: {
    width: 86,
    color: colors.accent,
    fontFamily: 'Anton',
    fontSize: 24,
    lineHeight: textLineHeight(24),
  },
  comboPunches: {
    flex: 1,
    color: colors.text,
    fontFamily: 'ArchivoNarrow',
    fontSize: 14,
    lineHeight: textLineHeight(14),
  },
  footerNote: {
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 13,
    lineHeight: textLineHeight(13),
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
