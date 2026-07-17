import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Platform } from 'react-native';
import {
  deleteUser,
  getIdTokenResult,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithCredential,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
  type User,
  type AuthCredential,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  DEFAULT_FIGHTER_PROFILE,
  type Equipment,
  type Experience,
  type FighterProfile,
  type SessionDuration,
  type Stance,
  type TrainingGoal,
} from '../features/profile/types';
import {
  firebaseConfigured,
  googleSignInConfigured,
  profilePhotoUploadsEnabled,
  requireFirebase,
} from '../lib/firebase';
import {
  clearWorkoutHistoryForScope,
  loadWorkoutHistoryForScope,
  replaceWorkoutHistoryForScope,
  setActiveHistoryUser,
  setLastAccountHistoryUser,
  type WorkoutHistoryItem,
} from '../lib/workoutHistory';

type AuthProviderName = 'apple' | 'google';
type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

const RECENT_AUTH_MAX_AGE_MS = 3 * 60 * 1000;
const DELETE_BATCH_SIZE = 450;

interface AuthContextValue {
  user: User | null;
  profile: FighterProfile | null;
  isReady: boolean;
  isBusy: boolean;
  syncStatus: SyncStatus;
  errorMessage: string | null;
  connectedProvider: AuthProviderName | null;
  appleSignInEnabled: boolean;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  saveProfile: (profile: FighterProfile) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  syncWorkout: (workout: WorkoutHistoryItem) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const profilePreviewMode = __DEV__ ? process.env.EXPO_PUBLIC_PROFILE_PREVIEW : undefined;
const loadingPreviewMode = profilePreviewMode === 'loading';
const appleSignInEnabled = process.env.EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED !== 'false';
const previewUser = {
  uid: 'profile-preview',
  displayName: 'Jordan “Switch” Lee',
  email: 'jordan@example.com',
  providerData: [{ providerId: 'google.com' }],
} as User;
const previewProfile: FighterProfile = {
  displayName: 'Jordan “Switch” Lee',
  photoUrl: null,
  experience: 'intermediate',
  stance: 'southpaw',
  goal: 'fitness',
  equipment: ['heavy_bag', 'gloves', 'wraps'],
  targetDaysPerWeek: 4,
  preferredSessionMinutes: 30,
};

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function parseProfile(data: Record<string, unknown> | undefined): FighterProfile | null {
  if (!data || data.profileComplete !== true || !isString(data.displayName)) return null;

  const equipment = Array.isArray(data.equipment)
    ? data.equipment.filter(isString) as Equipment[]
    : DEFAULT_FIGHTER_PROFILE.equipment;

  return {
    displayName: data.displayName,
    photoUrl: isString(data.photoUrl) ? data.photoUrl : null,
    experience: (isString(data.experience)
      ? data.experience
      : DEFAULT_FIGHTER_PROFILE.experience) as Experience,
    stance: (isString(data.stance) ? data.stance : DEFAULT_FIGHTER_PROFILE.stance) as Stance,
    goal: (isString(data.goal) ? data.goal : DEFAULT_FIGHTER_PROFILE.goal) as TrainingGoal,
    equipment: equipment.length ? equipment : DEFAULT_FIGHTER_PROFILE.equipment,
    targetDaysPerWeek:
      typeof data.targetDaysPerWeek === 'number'
        ? data.targetDaysPerWeek
        : DEFAULT_FIGHTER_PROFILE.targetDaysPerWeek,
    preferredSessionMinutes:
      typeof data.preferredSessionMinutes === 'number'
        ? data.preferredSessionMinutes as SessionDuration
        : DEFAULT_FIGHTER_PROFILE.preferredSessionMinutes,
  };
}

function parseWorkout(data: Record<string, unknown>, id: string): WorkoutHistoryItem | null {
  if (
    !isString(data.completedAt) ||
    !isString(data.difficulty) ||
    typeof data.totalRounds !== 'number' ||
    typeof data.roundDuration !== 'number' ||
    typeof data.punches !== 'number' ||
    typeof data.averageHeartRate !== 'number' ||
    typeof data.caloriesBurned !== 'number'
  ) return null;

  return {
    id,
    completedAt: data.completedAt,
    difficulty: data.difficulty as WorkoutHistoryItem['difficulty'],
    totalRounds: data.totalRounds,
    roundDuration: data.roundDuration,
    punches: data.punches,
    averageHeartRate: data.averageHeartRate,
    caloriesBurned: data.caloriesBurned,
  };
}

function providerForUser(user: User | null): AuthProviderName | null {
  const providerId = user?.providerData[0]?.providerId;
  if (providerId === 'apple.com') return 'apple';
  if (providerId === 'google.com') return 'google';
  return null;
}

async function hasRecentAuthentication(user: User) {
  const token = await getIdTokenResult(user);
  const authenticatedAt = Date.parse(token.authTime);
  return Number.isFinite(authenticatedAt)
    && Date.now() - authenticatedAt < RECENT_AUTH_MAX_AGE_MS;
}

function accountDeletionError(error: unknown) {
  const code = (error as { code?: string }).code;
  if (code === 'auth/requires-recent-login' || code === 'auth/user-token-expired') {
    return new Error('Your sign-in expired. Confirm your identity, then try deleting the account again.');
  }
  if (
    code === 'auth/network-request-failed'
    || code === 'unavailable'
    || code === 'storage/retry-limit-exceeded'
  ) {
    return new Error('Account deletion needs an internet connection. Check your connection and try again.');
  }
  if (code === 'permission-denied' || code === 'storage/unauthorized') {
    return new Error('Your account data could not be removed. Please try again or contact support.');
  }
  return error instanceof Error
    ? error
    : new Error('Your account could not be deleted. Please try again.');
}

async function mergeWorkoutHistory(userId: string) {
  const { db } = requireFirebase();
  const guestHistory = await loadWorkoutHistoryForScope(null);
  const accountHistory = await loadWorkoutHistoryForScope(userId);
  const localById = new Map(
    [...guestHistory, ...accountHistory].map(workout => [workout.id, workout]),
  );

  if (localById.size) {
    const batch = writeBatch(db);
    for (const workout of localById.values()) {
      batch.set(doc(db, 'users', userId, 'workouts', workout.id), workout, { merge: true });
    }
    await batch.commit();
  }

  const remoteSnapshot = await getDocs(collection(db, 'users', userId, 'workouts'));
  for (const remote of remoteSnapshot.docs) {
    const workout = parseWorkout(remote.data(), remote.id);
    if (workout) localById.set(workout.id, workout);
  }

  await replaceWorkoutHistoryForScope(userId, [...localById.values()]);
  await clearWorkoutHistoryForScope(null);
  await setActiveHistoryUser(userId);
}

async function getGoogleCredential(): Promise<AuthCredential | null> {
  if (!googleSignInConfigured) {
    throw new Error('Google Sign-In needs its Firebase web client ID before it can be used.');
  }
  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }
  const response = await GoogleSignin.signIn();
  if (response.type !== 'success') return null;
  if (!response.data.idToken) throw new Error('Google did not return an identity token.');
  return GoogleAuthProvider.credential(response.data.idToken);
}

async function getSilentGoogleCredential(): Promise<AuthCredential | null> {
  if (!googleSignInConfigured) return null;
  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: false });
    }
    const response = await GoogleSignin.signInSilently();
    if (response.type !== 'success' || !response.data.idToken) return null;
    return GoogleAuthProvider.credential(response.data.idToken);
  } catch {
    return null;
  }
}

async function getAppleCredential() {
  if (!appleSignInEnabled) {
    throw new Error(
      'Apple Sign-In is unavailable in this development build. Enable it with an Apple Developer Program team, then rebuild the app.',
    );
  }
  if (Platform.OS !== 'ios' || !(await AppleAuthentication.isAvailableAsync())) {
    throw new Error('Apple Sign-In is available on iPhone and iPad.');
  }
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );
  let response: AppleAuthentication.AppleAuthenticationCredential;
  try {
    response = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'ERR_REQUEST_CANCELED') throw new Error('Apple Sign-In cancelled.');
    if (
      code === 'ERR_REQUEST_UNKNOWN' ||
      code === 'ERR_REQUEST_FAILED' ||
      code === 'ERR_REQUEST_INVALID_RESPONSE' ||
      code === 'ERR_REQUEST_NOT_HANDLED'
    ) {
      throw new Error(
        'Apple could not complete sign-in on this device. Confirm iCloud and two-factor authentication, then retry on a physical iPhone.',
      );
    }
    if (code === 'ERR_REQUEST_NOT_INTERACTIVE') {
      throw new Error('Apple Sign-In could not present its authorization screen. Please try again.');
    }
    throw error;
  }
  if (!response.identityToken) throw new Error('Apple did not return an identity token.');
  const credential = new OAuthProvider('apple.com').credential({
    idToken: response.identityToken,
    rawNonce,
  });
  const displayName = [response.fullName?.givenName, response.fullName?.familyName]
    .filter(Boolean)
    .join(' ');
  return { credential, displayName };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(
    profilePreviewMode && !loadingPreviewMode ? previewUser : null,
  );
  const [profile, setProfile] = useState<FighterProfile | null>(
    profilePreviewMode === 'profile' ? previewProfile : null,
  );
  const [isReady, setIsReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const run = useCallback(async (
    operation: () => Promise<void>,
    options?: { showCancellationError?: boolean },
  ) => {
    setIsBusy(true);
    setErrorMessage(null);
    try {
      await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong. Try again.';
      if (options?.showCancellationError || !message.toLowerCase().includes('cancel')) {
        setErrorMessage(message);
      }
      throw error;
    } finally {
      setIsBusy(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    void setActiveHistoryUser(null);

    if (loadingPreviewMode) return undefined;

    if (profilePreviewMode) {
      setSyncStatus('synced');
      setIsReady(true);
      return undefined;
    }

    if (!firebaseConfigured) {
      setIsReady(true);
      return undefined;
    }

    const { auth, db } = requireFirebase();
    const unsubscribe = onAuthStateChanged(auth, nextUser => {
      void (async () => {
        if (!active) return;
        setIsReady(false);
        setUser(nextUser);
        setProfile(null);

        if (!nextUser) {
          await setActiveHistoryUser(null);
          if (active) {
            setSyncStatus('idle');
            setIsReady(true);
          }
          return;
        }

        setSyncStatus('syncing');
        try {
          const profileSnapshot = await getDoc(doc(db, 'users', nextUser.uid));
          if (active) setProfile(parseProfile(profileSnapshot.data()));
          await mergeWorkoutHistory(nextUser.uid);
          if (active) setSyncStatus('synced');
        } catch (error) {
          await setActiveHistoryUser(nextUser.uid);
          if (active) {
            setSyncStatus('error');
            setErrorMessage(
              error instanceof Error ? error.message : 'Your account is ready, but sync failed.',
            );
          }
        } finally {
          if (active) setIsReady(true);
        }
      })();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await run(async () => {
      const { auth } = requireFirebase();
      const credential = await getGoogleCredential();
      if (!credential) return;
      await signInWithCredential(auth, credential);
    }).catch(() => undefined);
  }, [run]);

  const signInWithApple = useCallback(async () => {
    await run(async () => {
      const { auth } = requireFirebase();
      const { credential, displayName } = await getAppleCredential();
      const result = await signInWithCredential(auth, credential);
      if (displayName && !result.user.displayName) {
        await updateFirebaseProfile(result.user, { displayName });
      }
    }).catch(() => undefined);
  }, [run]);

  const saveProfile = useCallback(async (nextProfile: FighterProfile) => {
    await run(async () => {
      if (!user) throw new Error('Sign in before saving your fighter profile.');
      if (profilePreviewMode) {
        setProfile({ ...nextProfile, displayName: nextProfile.displayName.trim() });
        return;
      }
      const { db, storage } = requireFirebase();
      let photoUrl = nextProfile.photoUrl;
      if (photoUrl && !photoUrl.startsWith('https://')) {
        if (!profilePhotoUploadsEnabled) {
          throw new Error('Profile photo uploads are not available yet. Remove the photo and try again.');
        }
        const response = await fetch(photoUrl);
        const blob = await response.blob();
        const avatarRef = ref(storage, `users/${user.uid}/profile/avatar.jpg`);
        await uploadBytes(avatarRef, blob, { contentType: blob.type || 'image/jpeg' });
        photoUrl = await getDownloadURL(avatarRef);
      }
      const cleanProfile = {
        ...nextProfile,
        photoUrl,
        displayName: nextProfile.displayName.trim(),
      };
      if (!cleanProfile.displayName) throw new Error('Add a display name or boxing nickname.');
      await setDoc(doc(db, 'users', user.uid), {
        ...cleanProfile,
        email: user.email,
        provider: providerForUser(user),
        profileComplete: true,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      if (user.displayName !== cleanProfile.displayName) {
        await updateFirebaseProfile(user, { displayName: cleanProfile.displayName });
      }
      setProfile(cleanProfile);
      setSyncStatus('synced');
    });
  }, [run, user]);

  const signOut = useCallback(async () => {
    await run(async () => {
      if (profilePreviewMode) {
        await setLastAccountHistoryUser(user?.uid ?? null).catch(() => undefined);
        setUser(null);
        setProfile(null);
        await setActiveHistoryUser(null);
        return;
      }
      const { auth } = requireFirebase();
      await setLastAccountHistoryUser(user?.uid ?? null).catch(() => undefined);
      if (providerForUser(user) === 'google') await GoogleSignin.signOut().catch(() => null);
      await firebaseSignOut(auth);
      await setActiveHistoryUser(null);
      setProfile(null);
    });
  }, [run, user]);

  const deleteAccount = useCallback(async () => {
    await run(async () => {
      let accountDeleted = false;
      let guestHistoryBeforeDeletion: WorkoutHistoryItem[] | null = null;
      let copiedAccountHistoryToGuest = false;
      try {
        if (!user) return;
        if (profilePreviewMode) {
          setUser(null);
          setProfile(null);
          await setActiveHistoryUser(null);
          return;
        }
        const { db, storage } = requireFirebase();
        const provider = providerForUser(user);
        const accountHistory = await loadWorkoutHistoryForScope(user.uid);
        if (!(await hasRecentAuthentication(user))) {
          if (provider === 'google') {
            const credential = await getSilentGoogleCredential() ?? await getGoogleCredential();
            if (!credential) {
              throw new Error('Google sign-in was cancelled. Your account was not deleted.');
            }
            await reauthenticateWithCredential(user, credential);
          } else if (provider === 'apple') {
            const { credential } = await getAppleCredential();
            await reauthenticateWithCredential(user, credential);
          } else {
            throw new Error('Sign in again before deleting this account.');
          }
        }

        const workouts = await getDocs(collection(db, 'users', user.uid, 'workouts'));
        for (let offset = 0; offset < workouts.docs.length; offset += DELETE_BATCH_SIZE) {
          const batch = writeBatch(db);
          workouts.docs
            .slice(offset, offset + DELETE_BATCH_SIZE)
            .forEach(workout => batch.delete(workout.ref));
          await batch.commit();
        }
        if (profilePhotoUploadsEnabled) {
          try {
            await deleteObject(ref(storage, `users/${user.uid}/profile/avatar.jpg`));
          } catch (error) {
            if ((error as { code?: string }).code !== 'storage/object-not-found') throw error;
          }
        }
        await deleteDoc(doc(db, 'users', user.uid));

        guestHistoryBeforeDeletion = await loadWorkoutHistoryForScope(null);
        await replaceWorkoutHistoryForScope(
          null,
          [...guestHistoryBeforeDeletion, ...accountHistory],
        );
        copiedAccountHistoryToGuest = true;
        await deleteUser(user);
        accountDeleted = true;

        if (provider === 'google') await GoogleSignin.signOut().catch(() => null);
        await clearWorkoutHistoryForScope(user.uid).catch(() => undefined);
        await setLastAccountHistoryUser(null).catch(() => undefined);
        await setActiveHistoryUser(null).catch(() => undefined);
        setProfile(null);
      } catch (error) {
        if (
          copiedAccountHistoryToGuest
          && !accountDeleted
          && guestHistoryBeforeDeletion
        ) {
          await replaceWorkoutHistoryForScope(null, guestHistoryBeforeDeletion).catch(() => undefined);
        }
        throw accountDeletionError(error);
      }
    }, { showCancellationError: true });
  }, [run, user]);

  const syncWorkout = useCallback(async (workout: WorkoutHistoryItem) => {
    if (!user || !firebaseConfigured || profilePreviewMode) return;
    try {
      const { db } = requireFirebase();
      setSyncStatus('syncing');
      await setDoc(doc(db, 'users', user.uid, 'workouts', workout.id), workout, { merge: true });
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    isReady,
    isBusy,
    syncStatus,
    errorMessage,
    connectedProvider: providerForUser(user),
    appleSignInEnabled,
    signInWithApple,
    signInWithGoogle,
    saveProfile,
    signOut,
    deleteAccount,
    syncWorkout,
    clearError: () => setErrorMessage(null),
  }), [
    deleteAccount,
    errorMessage,
    isBusy,
    isReady,
    profile,
    saveProfile,
    signInWithApple,
    signInWithGoogle,
    signOut,
    syncStatus,
    syncWorkout,
    user,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
