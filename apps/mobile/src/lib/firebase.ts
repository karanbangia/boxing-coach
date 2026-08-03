import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getAuth, getIdToken, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

export const googleSignInConfigured = Boolean(
  process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_WEB_CLIENT_ID,
);

export const profilePhotoUploadsEnabled =
  process.env.EXPO_PUBLIC_FIREBASE_PROFILE_PHOTO_UPLOADS_ENABLED === 'true';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (firebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  type AuthDependencies = NonNullable<Parameters<typeof initializeAuth>[1]>;
  type AuthPersistence = Exclude<AuthDependencies['persistence'], undefined>;
  const getReactNativePersistence = (
    FirebaseAuth as unknown as {
      getReactNativePersistence: (storage: typeof AsyncStorage) => AuthPersistence;
    }
  ).getReactNativePersistence;
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = getAuth(app);
  }
  db = getFirestore(app);
  storage = getStorage(app);
}

if (googleSignInConfigured) {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID,
    offlineAccess: false,
    profileImageSize: 240,
  });
}

export function requireFirebase() {
  if (!auth || !db || !storage) {
    throw new Error(
      'Account services are not configured yet. Add the Firebase environment variables and rebuild the app.',
    );
  }
  return { auth, db, storage };
}

function firebaseAuthError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

/**
 * Revokes an Apple authorization code obtained from the native Apple sign-in prompt.
 *
 * Firebase's JavaScript `revokeAccessToken` helper always labels its input as an
 * access token. Native Apple sign-in supplies an authorization code instead, so use
 * the Identity Toolkit endpoint's CODE flow explicitly.
 */
export async function revokeAppleAuthorizationCode(auth: Auth, authorizationCode: string) {
  const apiKey = auth.app.options.apiKey;
  const authDomain = auth.app.options.authDomain;
  const user = auth.currentUser;

  if (!apiKey || !authDomain || !user) {
    throw firebaseAuthError(
      'auth/requires-recent-login',
      'Confirm your Apple identity, then try deleting the account again.',
    );
  }

  const normalizedAuthDomain = authDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const idToken = await getIdToken(user);
  let response: Response;
  try {
    response = await fetch(
      `https://identitytoolkit.googleapis.com/v2/accounts:revokeToken?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: 'apple.com',
          tokenType: 'CODE',
          token: authorizationCode,
          idToken,
          redirectUri: `https://${normalizedAuthDomain}/__/auth/handler`,
        }),
      },
    );
  } catch {
    throw firebaseAuthError(
      'auth/network-request-failed',
      'Account deletion needs an internet connection. Check your connection and try again.',
    );
  }

  if (response.ok) return;

  const payload = await response.json().catch(() => null) as {
    error?: { message?: string };
  } | null;
  const message = payload?.error?.message ?? 'Apple could not complete account deletion.';
  if (/code flow is not enabled|code_flow_not_enabled/i.test(message)) {
    throw firebaseAuthError(
      'auth/operation-not-allowed',
      'Apple account deletion is temporarily unavailable. Your account and cloud data were not removed.',
    );
  }
  throw firebaseAuthError('auth/operation-not-allowed', message);
}
