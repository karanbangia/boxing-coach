import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TactilePressable } from './TactilePressable';
import { useAuth, type AuthResult } from '../providers/AuthProvider';
import { colors, glass, textLineHeight } from '../theme';

type AccountProvider = 'apple' | 'google';

interface Props {
  onSignedIn?: () => Promise<void> | void;
  onCancelled?: () => void;
  showGuidance?: boolean;
}

export function AccountSignInActions({
  onSignedIn,
  onCancelled,
  showGuidance = true,
}: Props) {
  const {
    signInWithApple,
    signInWithGoogle,
    appleSignInEnabled,
    isBusy,
    errorMessage,
    clearError,
  } = useAuth();
  const [activeProvider, setActiveProvider] = useState<AccountProvider | null>(null);
  const [finishing, setFinishing] = useState(false);
  const authenticationBusy = isBusy || activeProvider !== null || finishing;

  const authenticate = async (provider: AccountProvider) => {
    if (authenticationBusy) return;
    clearError();
    setActiveProvider(provider);
    let result: AuthResult = 'failed';
    try {
      result = provider === 'apple'
        ? await signInWithApple()
        : await signInWithGoogle();
      if (result === 'signed_in') {
        setFinishing(true);
        await onSignedIn?.();
      } else if (result === 'cancelled') {
        onCancelled?.();
      }
    } finally {
      setFinishing(false);
      setActiveProvider(null);
    }
  };

  return (
    <View style={styles.container}>
      {errorMessage ? (
        <View style={styles.errorBanner} accessibilityRole="alert">
          <Ionicons name="alert-circle-outline" size={20} color={colors.peach} />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TactilePressable
            onPress={clearError}
            haptic="none"
            style={styles.errorClose}
            accessibilityLabel="Dismiss sign-in error"
          >
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </TactilePressable>
        </View>
      ) : null}

      {Platform.OS === 'ios' ? (
        <TactilePressable
          onPress={() => void authenticate('apple')}
          disabled={authenticationBusy || !appleSignInEnabled}
          haptic="medium"
          accessibilityRole="button"
          accessibilityLabel="Continue with Apple"
          accessibilityState={{ disabled: authenticationBusy || !appleSignInEnabled }}
          style={[
            styles.providerButton,
            (!appleSignInEnabled || authenticationBusy) && styles.disabled,
          ]}
        >
          {activeProvider === 'apple' ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <>
              <Ionicons name="logo-apple" size={22} color={colors.background} />
              <Text style={styles.providerButtonText}>
                {appleSignInEnabled ? 'CONTINUE WITH APPLE' : 'APPLE SIGN-IN UNAVAILABLE'}
              </Text>
            </>
          )}
        </TactilePressable>
      ) : null}

      <TactilePressable
        onPress={() => void authenticate('google')}
        disabled={authenticationBusy}
        haptic="medium"
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        accessibilityState={{ disabled: authenticationBusy }}
        style={[
          styles.providerButton,
          styles.googleButton,
          authenticationBusy && styles.disabled,
        ]}
      >
        {activeProvider === 'google' ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <>
            <Ionicons name="logo-google" size={21} color={colors.text} />
            <Text style={[styles.providerButtonText, styles.googleButtonText]}>
              CONTINUE WITH GOOGLE
            </Text>
          </>
        )}
      </TactilePressable>

      {showGuidance ? (
        <Text style={styles.guidance}>
          {Platform.OS === 'ios'
            ? 'Google works on iPhone and Android. Apple works across Apple devices. Always use the same sign-in method.'
            : 'Google keeps the same Boxing Coach account available on Android and iPhone.'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  providerButton: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.text,
  },
  providerButtonText: {
    color: colors.background,
    fontFamily: 'BarlowSemiCondensedSemiBold',
    fontSize: 13,
    lineHeight: textLineHeight(13),
    letterSpacing: 1,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.surface,
  },
  googleButtonText: { color: colors.text },
  disabled: { opacity: 0.45 },
  guidance: {
    color: colors.textMuted,
    fontFamily: 'ArchivoNarrow',
    fontSize: 13,
    lineHeight: textLineHeight(13),
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.red,
    backgroundColor: glass.accentSurface,
  },
  errorText: {
    flex: 1,
    color: colors.text,
    fontFamily: 'ArchivoNarrow',
    fontSize: 14,
    lineHeight: textLineHeight(14),
  },
  errorClose: { padding: 4 },
});
