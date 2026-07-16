import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
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
