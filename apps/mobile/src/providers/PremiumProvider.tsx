import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  type CustomerInfo,
  type CustomerInfoUpdateListener,
  type PurchasesError,
  type PurchasesPackage,
} from 'react-native-purchases';
import {
  hasPremiumAccess,
  type PremiumActionStatus,
  type PremiumIdentityState,
} from '../lib/premiumIdentity';
import { reportError, trackEvent } from '../lib/observability';
import { useAuth } from './AuthProvider';

const PREMIUM_ENTITLEMENT_ID = 'premium';
const REVENUECAT_ANONYMOUS_PREFIX = '$RCAnonymousID:';

export type PremiumPlanId = 'lifetime';

export interface PremiumPlan {
  id: PremiumPlanId;
  price: string;
}

export type { PremiumActionStatus } from '../lib/premiumIdentity';

export interface PremiumActionResult {
  status: PremiumActionStatus;
}

interface PremiumContextValue {
  isReady: boolean;
  isConfigured: boolean;
  isTestStore: boolean;
  isPremium: boolean;
  isBusy: boolean;
  identityState: PremiumIdentityState;
  errorMessage: string | null;
  plans: PremiumPlan[];
  refresh: () => Promise<void>;
  purchase: (plan: PremiumPlanId) => Promise<PremiumActionResult>;
  restore: () => Promise<PremiumActionResult>;
  clearError: () => void;
}

const PremiumContext = createContext<PremiumContextValue | null>(null);

function apiKeyForPlatform() {
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() ?? '';
  }
  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() ?? '';
  }
  return '';
}

function activePremiumEntitlement(customerInfo: CustomerInfo) {
  return customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] ?? null;
}

function planFromPackage(
  id: PremiumPlanId,
  purchasePackage: PurchasesPackage,
): PremiumPlan {
  return {
    id,
    price: purchasePackage.product.priceString,
  };
}

function isPurchaseCancelled(error: unknown) {
  const purchaseError = error as Partial<PurchasesError> | null;
  return purchaseError?.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
    || purchaseError?.userCancelled === true;
}

function errorMessageForUser(error: unknown, fallback: string) {
  const purchaseError = error as Partial<PurchasesError> | null;
  if (purchaseError?.code === Purchases.PURCHASES_ERROR_CODE.NETWORK_ERROR) {
    return 'Check your connection and try again.';
  }
  if (purchaseError?.code === Purchases.PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
    return 'Your purchase is pending store approval. Premium will unlock automatically once approved.';
  }
  if (purchaseError?.code === Purchases.PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR) {
    return 'This lifetime purchase is not available from your store account right now.';
  }
  return fallback;
}

export function PremiumProvider({ children }: PropsWithChildren) {
  const { user, isReady: authReady } = useAuth();
  const firebaseUid = user?.uid ?? null;

  const apiKey = apiKeyForPlatform();
  const isConfigured = Boolean(apiKey);
  const isTestStore = apiKey.startsWith('test_');
  const premiumPreview = __DEV__
    && process.env.EXPO_PUBLIC_PREMIUM_TEST_SCENARIO === 'premium';
  const [sdkReady, setSdkReady] = useState(!isConfigured);
  const [storeReady, setStoreReady] = useState(!isConfigured);
  const [identityState, setIdentityState] = useState<PremiumIdentityState>('initializing');
  const [entitlementActive, setEntitlementActive] = useState(false);
  const [revenueCatAppUserId, setRevenueCatAppUserId] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lifetimePackage, setLifetimePackage] = useState<PurchasesPackage | null>(null);
  const [identityRetryNonce, setIdentityRetryNonce] = useState(0);
  const identityRequestRef = useRef(0);

  const applyCustomerInfo = useCallback((
    customerInfo: CustomerInfo,
    appUserId: string,
  ) => {
    setRevenueCatAppUserId(appUserId);
    setEntitlementActive(Boolean(activePremiumEntitlement(customerInfo)));
  }, []);

  const loadOfferings = useCallback(async () => {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    const lifetime = current?.lifetime
      ?? current?.availablePackages.find(item => item.packageType === PACKAGE_TYPE.LIFETIME)
      ?? null;
    setLifetimePackage(lifetime);
    setStoreReady(true);
    setErrorMessage(current => {
      if (!lifetime) {
        return 'The Premium lifetime product has not been connected to this build yet.';
      }
      return current?.includes('lifetime product') ? null : current;
    });
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!isConfigured) {
      setSdkReady(true);
      setStoreReady(true);
      setIdentityState(firebaseUid ? 'error' : 'guest');
      return;
    }

    let active = true;
    let listenerAttached = false;
    const listener: CustomerInfoUpdateListener = () => {
      void Promise.all([
        Purchases.getAppUserID(),
        Purchases.getCustomerInfo(),
      ]).then(([appUserId, customerInfo]) => {
        if (active) applyCustomerInfo(customerInfo, appUserId);
      }).catch(error => {
        reportError(error, 'purchases', { operation: 'customer_info_update' });
      });
    };

    const initialize = async () => {
      try {
        if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        const alreadyConfigured = await Purchases.isConfigured();
        if (!alreadyConfigured) {
          Purchases.configure({
            apiKey,
            appUserID: firebaseUid ?? undefined,
            automaticDeviceIdentifierCollectionEnabled: false,
            diagnosticsEnabled: false,
          });
        }
        if (!active) return;
        Purchases.addCustomerInfoUpdateListener(listener);
        listenerAttached = true;
        if (active) setSdkReady(true);
      } catch (error) {
        reportError(error, 'purchases', { operation: 'configure' });
        if (active) {
          setIdentityState('error');
          setStoreReady(true);
          setErrorMessage('Premium is not available in this build yet.');
        }
        return;
      }

      try {
        await loadOfferings();
      } catch (error) {
        reportError(error, 'purchases', { operation: 'offerings' });
        if (active) {
          setStoreReady(true);
          setErrorMessage(errorMessageForUser(
            error,
            'Premium could not connect to the store. Please try again.',
          ));
        }
      }
    };

    void initialize();
    return () => {
      active = false;
      if (listenerAttached) Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [
    apiKey,
    applyCustomerInfo,
    authReady,
    isConfigured,
    loadOfferings,
  ]);

  useEffect(() => {
    if (!authReady || !sdkReady) return;
    if (!isConfigured) {
      setEntitlementActive(false);
      setRevenueCatAppUserId(null);
      setIdentityState(firebaseUid ? 'error' : 'guest');
      return;
    }

    const requestId = identityRequestRef.current + 1;
    identityRequestRef.current = requestId;
    let active = true;

    setIdentityState('syncing');
    setEntitlementActive(false);

    const synchronizeIdentity = async () => {
      try {
        let appUserId = await Purchases.getAppUserID();
        let customerInfo: CustomerInfo;

        if (firebaseUid) {
          if (appUserId === firebaseUid) {
            customerInfo = await Purchases.getCustomerInfo();
          } else {
            const result = await Purchases.logIn(firebaseUid);
            customerInfo = result.customerInfo;
            appUserId = await Purchases.getAppUserID();
          }
          if (appUserId !== firebaseUid) {
            throw new Error('Premium account identity did not match the signed-in account.');
          }
        } else {
          if (appUserId.startsWith(REVENUECAT_ANONYMOUS_PREFIX)) {
            customerInfo = await Purchases.getCustomerInfo();
          } else {
            customerInfo = await Purchases.logOut();
            appUserId = await Purchases.getAppUserID();
          }
        }

        if (!active || identityRequestRef.current !== requestId) return;
        applyCustomerInfo(customerInfo, appUserId);
        setIdentityState(firebaseUid ? 'identified' : 'guest');
        setErrorMessage(current => (
          current?.includes('account')
            ? null
            : current
        ));
      } catch (error) {
        reportError(error, 'purchases', { operation: 'sync_identity' });
        if (!active || identityRequestRef.current !== requestId) return;
        setEntitlementActive(false);
        setRevenueCatAppUserId(null);
        setIdentityState('error');
        setErrorMessage(
          firebaseUid
            ? 'Your account is signed in, but Premium could not connect. Check your connection and try again.'
            : 'Premium could not connect to the store. Please try again.',
        );
      }
    };

    void synchronizeIdentity();
    return () => {
      active = false;
    };
  }, [
    applyCustomerInfo,
    authReady,
    firebaseUid,
    identityRetryNonce,
    isConfigured,
    sdkReady,
  ]);

  const isPremium = premiumPreview || hasPremiumAccess({
    firebaseUid,
    revenueCatAppUserId,
    entitlementActive,
  });

  const refresh = useCallback(async () => {
    if (!isConfigured || !sdkReady) return;
    setIdentityRetryNonce(current => current + 1);
    try {
      const [appUserId, customerInfo] = await Promise.all([
        Purchases.getAppUserID(),
        Purchases.getCustomerInfo(),
        loadOfferings(),
      ]);
      applyCustomerInfo(customerInfo, appUserId);
      if (firebaseUid && appUserId === firebaseUid) setIdentityState('identified');
      else if (!firebaseUid && appUserId.startsWith(REVENUECAT_ANONYMOUS_PREFIX)) {
        setIdentityState('guest');
      }
    } catch (error) {
      reportError(error, 'purchases', { operation: 'refresh' });
      setErrorMessage(errorMessageForUser(
        error,
        'Premium could not connect to the store. Please try again.',
      ));
    }
  }, [
    applyCustomerInfo,
    firebaseUid,
    isConfigured,
    loadOfferings,
    sdkReady,
  ]);

  const purchaseIdentityReady = Boolean(
    revenueCatAppUserId
    && (
      firebaseUid
        ? identityState === 'identified' && revenueCatAppUserId === firebaseUid
        : identityState === 'guest'
          && revenueCatAppUserId.startsWith(REVENUECAT_ANONYMOUS_PREFIX)
    ),
  );

  const purchase = useCallback(async (
    plan: PremiumPlanId,
  ): Promise<PremiumActionResult> => {
    if (!purchaseIdentityReady) {
      setErrorMessage('Finish connecting to the store before purchasing Premium.');
      return { status: 'failed' };
    }
    if (isPremium) return { status: 'unlocked' };

    const purchasePackage = plan === 'lifetime' ? lifetimePackage : null;
    if (!isConfigured || !purchasePackage) {
      setErrorMessage('The Premium lifetime product has not been connected to this build yet.');
      return { status: 'failed' };
    }

    setActionBusy(true);
    setErrorMessage(null);
    try {
      const result = await Purchases.purchasePackage(purchasePackage);
      const appUserId = await Purchases.getAppUserID();
      applyCustomerInfo(result.customerInfo, appUserId);
      const unlocked = Boolean(activePremiumEntitlement(result.customerInfo));
      if (!unlocked) {
        setErrorMessage('The store completed without activating Premium. Try Restore Purchases.');
        return { status: 'failed' };
      }
      trackEvent('purchase_completed', { product: plan });
      return { status: 'unlocked' };
    } catch (error) {
      if (isPurchaseCancelled(error)) return { status: 'cancelled' };
      reportError(error, 'purchases', { operation: 'purchase', product: plan });
      setErrorMessage(errorMessageForUser(
        error,
        'The purchase could not be completed. You were not charged.',
      ));
      return { status: 'failed' };
    } finally {
      setActionBusy(false);
    }
  }, [
    applyCustomerInfo,
    isConfigured,
    isPremium,
    lifetimePackage,
    purchaseIdentityReady,
  ]);

  const restore = useCallback(async (): Promise<PremiumActionResult> => {
    if (!purchaseIdentityReady) {
      setErrorMessage('Finish connecting to the store before restoring Premium.');
      return { status: 'failed' };
    }
    if (!isConfigured) {
      setErrorMessage('Purchase restore is not available in this build yet.');
      return { status: 'failed' };
    }

    setActionBusy(true);
    setErrorMessage(null);
    try {
      const customerInfo = await Purchases.restorePurchases();
      const appUserId = await Purchases.getAppUserID();
      applyCustomerInfo(customerInfo, appUserId);
      const entitlementActiveNow = Boolean(activePremiumEntitlement(customerInfo));
      trackEvent('purchase_restored', { entitlement_active: entitlementActiveNow });
      return { status: entitlementActiveNow ? 'unlocked' : 'not_found' };
    } catch (error) {
      reportError(error, 'purchases', { operation: 'restore' });
      setErrorMessage(errorMessageForUser(
        error,
        'Purchases could not be restored. Please try again.',
      ));
      return { status: 'failed' };
    } finally {
      setActionBusy(false);
    }
  }, [
    applyCustomerInfo,
    isConfigured,
    purchaseIdentityReady,
  ]);

  const plans = useMemo(() => (
    lifetimePackage
      ? [planFromPackage('lifetime', lifetimePackage)]
      : []
  ), [lifetimePackage]);

  const isReady = authReady && (
    !isConfigured
    || (
      sdkReady
      && storeReady
      && identityState !== 'initializing'
      && identityState !== 'syncing'
    )
  );
  const isBusy = actionBusy || identityState === 'syncing';

  const value = useMemo<PremiumContextValue>(() => ({
    isReady,
    isConfigured,
    isTestStore,
    isPremium,
    isBusy,
    identityState,
    errorMessage,
    plans,
    refresh,
    purchase,
    restore,
    clearError: () => setErrorMessage(null),
  }), [
    errorMessage,
    identityState,
    isBusy,
    isConfigured,
    isPremium,
    isReady,
    isTestStore,
    plans,
    purchase,
    refresh,
    restore,
  ]);

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const value = useContext(PremiumContext);
  if (!value) throw new Error('usePremium must be used inside PremiumProvider.');
  return value;
}
