import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccountSignInActions } from '../components/AccountSignInActions';
import { BackButton } from '../components/BackButton';
import { TactilePressable } from '../components/TactilePressable';
import { EXTERNAL_LINKS, openExternalLink } from '../lib/externalLinks';
import { trackEvent } from '../lib/observability';
import {
  actionStatusUnlocksPremium,
  resolvePendingPremiumAction,
  type PendingPremiumAction,
} from '../lib/premiumIdentity';
import { useAuth } from '../providers/AuthProvider';
import {
  usePremium,
  type PremiumPlan,
} from '../providers/PremiumProvider';
import { colors, glass, premiumBackgroundGradient, textLineHeight } from '../theme';

export type PaywallSource = 'difficulty' | 'preset' | 'profile';

interface Props {
  visible: boolean;
  source: PaywallSource;
  initialAction?: PendingPremiumAction;
  onClose: () => void;
  onUnlocked: () => void;
  onPromoteGuestProfile: () => Promise<void>;
}

function PlanCard({
  plan,
}: {
  plan: PremiumPlan;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`Lifetime Premium access, one-time purchase of ${plan.price}`}
      style={styles.planCard}
    >
      <View style={styles.planHeader}>
        <View style={styles.planTitleRow}>
          <Ionicons name="infinite" size={22} color={colors.peach} />
          <Text style={styles.planName}>LIFETIME ACCESS</Text>
        </View>
        <View style={styles.oneTimeBadge}>
          <Text style={styles.oneTimeBadgeText}>ONE TIME</Text>
        </View>
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.price}>{plan.price}</Text>
        <Text style={styles.pricePeriod}> ONCE</Text>
      </View>
      <Text style={styles.planDetail}>Pay once. Keep Premium permanently.</Text>
    </View>
  );
}

const benefits = [
  {
    icon: 'flash-outline' as const,
    title: 'ADVANCED & PRO PACING',
    copy: 'Faster combinations and championship-level work rates.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'FREE CORE STAYS FREE',
    copy: 'Basic and Medium workouts remain available without an account.',
  },
];

export function PremiumPaywall({
  visible,
  source,
  initialAction,
  onClose,
  onUnlocked,
  onPromoteGuestProfile,
}: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    isReady,
    isConfigured,
    isBusy,
    errorMessage,
    isTestStore,
    isPremium,
    identityState,
    plans,
    refresh,
    purchase,
    restore,
    clearError,
  } = usePremium();
  const [accountGateVisible, setAccountGateVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingPremiumAction | null>(null);
  const resumingActionRef = useRef(false);
  const initialActionHandledRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      setAccountGateVisible(false);
      setPendingAction(null);
      resumingActionRef.current = false;
      initialActionHandledRef.current = false;
      return;
    }
    clearError();
    trackEvent('paywall_viewed', { source });
  }, [clearError, source, visible]);

  const lifetimePlan = plans[0] ?? null;

  const executePurchase = useCallback(async () => {
    const result = await purchase('lifetime');
    if (actionStatusUnlocksPremium(result.status)) onUnlocked();
    else if (result.status === 'account_required') setAccountGateVisible(true);
  }, [onUnlocked, purchase]);

  const executeRestore = useCallback(async () => {
    if (isTestStore) {
      Alert.alert(
        'Test Store cannot restore',
        'RevenueCat Test Store has no Apple receipt to restore. Purchase the test product again, or use an Apple sandbox build to test real StoreKit restore.',
      );
      return;
    }
    const result = await restore();
    if (actionStatusUnlocksPremium(result.status)) {
      Alert.alert('Premium restored', 'Your Premium access is active again.', [
        { text: 'Continue', onPress: onUnlocked },
      ]);
      return;
    }
    if (result.status === 'not_found') {
      Alert.alert(
        'No lifetime purchase found',
        'Make sure you are signed in to the App Store or Play Store account that made the purchase.',
      );
    } else if (result.status === 'account_required') {
      setAccountGateVisible(true);
    }
  }, [isTestStore, onUnlocked, restore]);

  const requestAction = useCallback((action: PendingPremiumAction) => {
    clearError();
    setPendingAction(action);
    if (identityState === 'error') void refresh();
  }, [clearError, identityState, refresh]);

  useEffect(() => {
    if (
      !pendingAction
      || accountGateVisible
      || resumingActionRef.current
    ) return;

    const resolution = resolvePendingPremiumAction({
      pendingAction,
      identityState,
      isPremium,
    });
    if (resolution.effect === 'wait') return;

    setPendingAction(resolution.pendingAction);
    resumingActionRef.current = true;
    void (async () => {
      try {
        if (resolution.effect === 'unlock') onUnlocked();
        else if (resolution.effect === 'purchase') await executePurchase();
        else await executeRestore();
      } finally {
        resumingActionRef.current = false;
      }
    })();
  }, [
    accountGateVisible,
    executePurchase,
    executeRestore,
    identityState,
    isPremium,
    onUnlocked,
    pendingAction,
  ]);

  useEffect(() => {
    if (
      !visible
      || !initialAction
      || initialActionHandledRef.current
    ) return;
    initialActionHandledRef.current = true;
    requestAction(initialAction);
  }, [initialAction, requestAction, visible]);

  const cancelAccountGate = () => {
    setAccountGateVisible(false);
    setPendingAction(null);
  };

  const ctaLabel = lifetimePlan
    ? `UNLOCK FOREVER — ${lifetimePlan.price}`
    : 'UNLOCK LIFETIME ACCESS';

  if (accountGateVisible) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={cancelAccountGate}
      >
        <ImageBackground
          source={require('../../assets/onboarding/save-training-glove.jpg')}
          resizeMode="cover"
          style={styles.background}
          accessible={false}
        >
          <LinearGradient
            colors={['rgba(5,0,0,0.42)', 'rgba(5,0,0,0.7)', 'rgba(5,0,0,0.97)']}
            locations={[0, 0.46, 1]}
            style={styles.background}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.accountContent,
                { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 },
              ]}
            >
              <View style={styles.topBar}>
                <BackButton
                  onPress={cancelAccountGate}
                  accessibilityLabel="Back to Premium"
                />
                <TactilePressable
                  onPress={onClose}
                  haptic="light"
                  accessibilityRole="button"
                  accessibilityLabel="Close Premium"
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TactilePressable>
              </View>

              <View style={styles.accountHero}>
                <Text style={styles.eyebrow}>PROTECT YOUR PURCHASE</Text>
                <Text style={styles.accountTitle}>SAVE YOUR PREMIUM</Text>
                <Text style={styles.subtitle}>
                  Sign in before payment to keep Premium after reinstalling.
                </Text>
              </View>

              <View style={styles.accountActions}>
                <AccountSignInActions
                  showGuidance={false}
                  onSignedIn={async () => {
                    await onPromoteGuestProfile();
                    setAccountGateVisible(false);
                  }}
                  onCancelled={cancelAccountGate}
                />
                <Text style={styles.accountLegalCopy}>
                  By continuing, you agree to and acknowledge:
                </Text>
                <View style={styles.accountLegalLinks}>
                  <Text
                    style={styles.accountLegalLink}
                    onPress={() => void openExternalLink(EXTERNAL_LINKS.terms, 'Terms of Use')}
                    accessibilityRole="link"
                  >
                    TERMS OF USE
                  </Text>
                  <Text style={styles.accountLegalDivider} accessibilityElementsHidden>·</Text>
                  <Text
                    style={styles.accountLegalLink}
                    onPress={() => void openExternalLink(EXTERNAL_LINKS.privacy, 'Privacy Policy')}
                    accessibilityRole="link"
                  >
                    PRIVACY POLICY
                  </Text>
                </View>
              </View>
            </ScrollView>
          </LinearGradient>
        </ImageBackground>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <LinearGradient
        {...premiumBackgroundGradient}
        style={styles.background}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 },
          ]}
        >
          <View style={styles.topBar}>
            <View style={styles.premiumPill}>
              <Ionicons name="star" size={13} color={colors.background} />
              <Text style={styles.premiumPillText}>BOXING COACH PREMIUM</Text>
            </View>
            <TactilePressable
              onPress={onClose}
              haptic="light"
              accessibilityRole="button"
              accessibilityLabel="Close Premium"
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TactilePressable>
          </View>

          <View style={styles.hero}>
            {/*<Text style={styles.eyebrow}>YOUR NEXT LEVEL</Text>*/}
            <Text style={styles.title}>TRAIN LIKE</Text>
            <Text style={[styles.title, styles.titleAccent]}>A FIGHTER</Text>
            <Text style={styles.subtitle}>
              Unlock higher-intensity training. Basic and Medium remain free without an account.
            </Text>
          </View>

          {user ? (
            <View style={styles.accountBanner}>
              <Ionicons name="person-circle-outline" size={22} color={colors.peach} />
              <View style={styles.accountBannerCopy}>
                <Text style={styles.accountBannerLabel}>PREMIUM WILL BE SAVED TO</Text>
                <Text style={styles.accountBannerValue}>
                  {user.email ?? user.displayName ?? 'Your signed-in account'}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.benefitList}>
            {benefits.map(benefit => (
              <View key={benefit.title} style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name={benefit.icon} size={22} color={colors.peach} />
                </View>
                <View style={styles.benefitCopy}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitText}>{benefit.copy}</Text>
                </View>
              </View>
            ))}
          </View>

          {!isReady ? (
            <View style={styles.storeLoading}>
              <ActivityIndicator color={colors.peach} />
              <Text style={styles.storeLoadingText}>CONNECTING TO YOUR STORE...</Text>
            </View>
          ) : lifetimePlan ? (
            <View style={styles.plans}>
              <PlanCard plan={lifetimePlan} />
            </View>
          ) : (
            <View style={styles.unavailableCard}>
              <Ionicons name="construct-outline" size={24} color={colors.peach} />
              <View style={styles.unavailableCopy}>
                <Text style={styles.unavailableTitle}>STORE SETUP REQUIRED</Text>
                <Text style={styles.unavailableText}>
                  Premium products are not connected in this build. Basic and Medium training still work.
                </Text>
              </View>
            </View>
          )}

          {errorMessage ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={19} color={colors.red} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TactilePressable
            onPress={() => requestAction('purchase')}
            disabled={!isConfigured || !lifetimePlan || isBusy}
            haptic="medium"
            pressedScale={0.985}
            accessibilityRole="button"
            style={[
              styles.cta,
              (!isConfigured || !lifetimePlan || isBusy) && styles.ctaDisabled,
            ]}
          >
            {isBusy ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <Text style={styles.ctaText}>{ctaLabel}</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.text} />
              </>
            )}
          </TactilePressable>

          <TactilePressable
            onPress={() => requestAction('restore')}
            disabled={!isConfigured || isBusy}
            haptic="light"
            accessibilityRole="button"
            style={styles.restoreButton}
          >
            <Text style={styles.restoreText}>RESTORE PURCHASES</Text>
          </TactilePressable>

          <Text style={styles.billingCopy}>
            One-time purchase. No subscription and no recurring charges. Payment is charged to your store account, and the store confirms the final price before purchase.
          </Text>

          <View style={styles.legalRow}>
            <TactilePressable
              onPress={() => void openExternalLink(EXTERNAL_LINKS.terms, 'Terms of Use')}
              haptic="none"
            >
              <Text style={styles.legalLink}>TERMS</Text>
            </TactilePressable>
            <View style={styles.legalDot} />
            <TactilePressable
              onPress={() => void openExternalLink(EXTERNAL_LINKS.privacy, 'Privacy Policy')}
              haptic="none"
            >
              <Text style={styles.legalLink}>PRIVACY</Text>
            </TactilePressable>
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    gap: 22,
  },
  accountContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 24,
  },
  topBar: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colors.peach,
  },
  premiumPillText: {
    color: colors.background,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 10,
    lineHeight: textLineHeight(10),
    letterSpacing: 1,
  },
  closeButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: 21,
    backgroundColor: glass.surface,
  },
  hero: { gap: 2 },
  accountHero: { gap: 8 },
  accountActions: { gap: 12 },
  accountLegalCopy: {
    marginTop: 3,
    paddingHorizontal: 10,
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 13,
    lineHeight: textLineHeight(13),
    textAlign: 'center',
  },
  accountLegalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  accountLegalLink: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 11,
    lineHeight: textLineHeight(11),
    letterSpacing: 0.8,
    textDecorationLine: 'underline',
  },
  accountLegalDivider: {
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 13,
    lineHeight: textLineHeight(13),
  },
  accountTitle: {
    maxWidth: 500,
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 38,
    lineHeight: textLineHeight(38),
    letterSpacing: 0.4,
  },
  eyebrow: {
    color: colors.peach,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 12,
    lineHeight: textLineHeight(12),
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 52,
    lineHeight: textLineHeight(52),
    letterSpacing: 0.5,
  },
  titleAccent: {
    color: colors.red,
    marginTop: 52 - textLineHeight(52),
  },
  subtitle: {
    maxWidth: 480,
    marginTop: 10,
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 17,
    lineHeight: textLineHeight(17),
  },
  accountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.peach,
    backgroundColor: glass.surfaceStrong,
  },
  accountBannerCopy: { flex: 1, gap: 2 },
  accountBannerLabel: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 9,
    lineHeight: textLineHeight(9),
    letterSpacing: 0.9,
  },
  accountBannerValue: {
    color: colors.text,
    fontFamily: 'ArchivoNarrow',
    fontSize: 15,
    lineHeight: textLineHeight(15),
  },
  benefitList: { gap: 12 },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 13,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.surface,
  },
  benefitIcon: {
    width: 43,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glass.surfaceStrong,
  },
  benefitCopy: { flex: 1, gap: 2 },
  benefitTitle: {
    color: colors.text,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 14,
    lineHeight: textLineHeight(14),
    letterSpacing: 0.8,
  },
  benefitText: {
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 14,
    lineHeight: textLineHeight(14),
  },
  plans: { gap: 10 },
  planCard: {
    minHeight: 112,
    padding: 15,
    gap: 5,
    borderWidth: 1,
    borderColor: colors.peach,
    backgroundColor: glass.surfaceStrong,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  planName: {
    color: colors.text,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 15,
    lineHeight: textLineHeight(15),
    letterSpacing: 1.1,
  },
  oneTimeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.red,
  },
  oneTimeBadgeText: {
    color: colors.text,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 9,
    lineHeight: textLineHeight(9),
    letterSpacing: 0.8,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  price: {
    color: colors.text,
    fontFamily: 'Anton',
    fontSize: 27,
    lineHeight: textLineHeight(27),
  },
  pricePeriod: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 11,
    lineHeight: textLineHeight(11),
    letterSpacing: 0.7,
  },
  planDetail: {
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 13,
    lineHeight: textLineHeight(13),
  },
  storeLoading: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.surface,
  },
  storeLoadingText: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 11,
    lineHeight: textLineHeight(11),
    letterSpacing: 1,
  },
  unavailableCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.surface,
  },
  unavailableCopy: { flex: 1, gap: 4 },
  unavailableTitle: {
    color: colors.text,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 13,
    lineHeight: textLineHeight(13),
    letterSpacing: 0.8,
  },
  unavailableText: {
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 14,
    lineHeight: textLineHeight(14),
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 12,
    borderWidth: 1,
    borderColor: glass.accentSurfaceStrong,
    backgroundColor: glass.accentSurface,
  },
  errorText: {
    flex: 1,
    color: colors.text,
    fontFamily: 'ArchivoNarrow',
    fontSize: 14,
    lineHeight: textLineHeight(14),
  },
  cta: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.red,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: {
    color: colors.text,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 15,
    lineHeight: textLineHeight(15),
    letterSpacing: 1.2,
  },
  restoreButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreText: {
    color: colors.text,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 12,
    lineHeight: textLineHeight(12),
    letterSpacing: 1,
    textDecorationLine: 'underline',
  },
  billingCopy: {
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 12,
    lineHeight: textLineHeight(12),
    textAlign: 'center',
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  legalDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  legalLink: {
    color: colors.textMuted,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 11,
    lineHeight: textLineHeight(11),
    letterSpacing: 0.8,
    textDecorationLine: 'underline',
  },
});
