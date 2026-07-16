# Deploy Boxing Coach

This repo has two separate deploy paths:

- Web: Netlify
- Mobile Android: Expo EAS + Google Play
- Mobile iOS: Expo EAS + App Store Connect

## 1. Push to GitHub

### Option A: Create repo on GitHub, then push

1. **Create a new repository** on [GitHub](https://github.com/new):
   - Name: `boxing-coach` (or any name you prefer)
   - Leave it **empty** (no README, .gitignore, or license)
   - Choose public or private

2. **Add the remote and push** (replace `YOUR_USERNAME` with your GitHub username):

   ```bash
   cd /Users/karanbangia/go/src/github.com/boxing-coach
   git remote add origin https://github.com/YOUR_USERNAME/boxing-coach.git
   git branch -M main
   git push -u origin main
   ```

   If you use SSH instead:

   ```bash
   git remote add origin git@github.com:YOUR_USERNAME/boxing-coach.git
   git branch -M main
   git push -u origin main
   ```

### Option B: Use GitHub CLI

If you have [GitHub CLI](https://cli.github.com/) installed:

```bash
cd /Users/karanbangia/go/src/github.com/boxing-coach
gh repo create boxing-coach --private --source=. --remote=origin --push
```

Use `--public` instead of `--private` if you want a public repo.

---

## 2. Deploy the web app on Netlify

1. **Sign in** at [netlify.com](https://www.netlify.com/) (GitHub login is easiest).

2. **Add new site → Import an existing project** and choose **GitHub**.

3. **Select the repository** (e.g. `boxing-coach`).

4. **Build settings** (Netlify will use `netlify.toml` in the repo):
   - **Build command:** `pnpm build`
   - **Publish directory:** `apps/web/dist`
   - **Base directory:** leave empty (build from repo root)

   If you don’t rely on `netlify.toml`, enter the above in the Netlify UI.

5. **Deploy.** Netlify will install deps (pnpm is auto-detected), run `pnpm build`, and serve `apps/web/dist`. Later pushes to `main` will trigger new deploys.

---

## 3. Prepare Android release builds

### Configure Firebase accounts and cloud sync

The mobile Profile tab uses Firebase Authentication and Firestore. Cloud Storage is optional and is only used for custom fighter-photo uploads. Training and Progress continue to work when Firebase is not configured, but account buttons will show a configuration error.

1. Create a Firebase project and register the Android package `com.karanbangia.boxingcoach` and iOS bundle ID `com.karanbangia.boxingcoach`.
2. Enable Google and Apple under **Authentication → Sign-in method**. Add the Android SHA-1/SHA-256 fingerprints and complete Apple's provider setup in both Firebase and Apple Developer.
3. Create Firestore, then deploy the checked-in owner-only rules:

   ```bash
   firebase deploy --only firestore:rules
   ```

4. Copy `apps/mobile/.env.example` to `apps/mobile/.env.local` and fill in the Firebase web-app values plus the Google OAuth client IDs. Keep `.env.local` untracked. The publishable Firebase configuration is safe to bundle; the security boundary is Firebase Authentication plus the checked-in rules. Never place OAuth client secrets, service-account JSON, or Firebase CLI tokens in the app environment.
5. To enable custom fighter-photo uploads, activate Cloud Storage, deploy `firebase/storage.rules`, and set `EXPO_PUBLIC_FIREBASE_PROFILE_PHOTO_UPLOADS_ENABLED=true`. Leave it `false` when Storage is unavailable.
6. Add the same `EXPO_PUBLIC_*` values to the EAS `preview` and `production` environments. `EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_URL_SCHEME` must be the reversed iOS client ID beginning with `com.googleusercontent.apps.`.
7. Rebuild the native app after changing Apple capability or Google URL-scheme configuration; Expo Go cannot load the native Google Sign-In module.

Account data is stored at `users/{uid}` and synced workouts at `users/{uid}/workouts/{workoutId}`. On first successful sign-in, guest workouts are copied into the account and removed from the guest namespace. Guest and signed-in histories remain separate afterward, so signing out never exposes cached account data.

Android release builds are managed from `apps/mobile` with Expo EAS.

### One-time setup

1. Install and log into EAS CLI:

   ```bash
   npm install --global eas-cli
   eas login
   ```

2. Create a Google Play Developer account.

3. Create the app in Google Play Console.

4. Confirm the Android application ID in [apps/mobile/app.json](/Users/karanbangia/go/src/github.com/boxing-coach/apps/mobile/app.json:1):

   ```json
   "android": {
     "package": "com.karanbangia.boxingcoach"
   }
   ```

5. Review the EAS profiles in [apps/mobile/eas.json](/Users/karanbangia/go/src/github.com/boxing-coach/apps/mobile/eas.json:1).

### Build Android binaries

From the repo root:

```bash
pnpm android:build:preview
pnpm android:build:production
```

- `preview` creates an installable APK for internal testing
- `production` creates an Android App Bundle (`.aab`) for Google Play

### Submit to Google Play

After your first manual Play Console upload, you can submit with:

```bash
pnpm android:submit
```

You will also need a Google service account key configured in Expo/EAS for automated submission.

## 4. Prepare iOS release builds

iOS release builds are also managed from `apps/mobile` with Expo EAS.

### One-time setup

1. Install and log into EAS CLI:

   ```bash
   npm install --global eas-cli
   eas login
   ```

2. Make sure your Apple Developer membership is active.

3. Create the app in App Store Connect.

4. Confirm the iOS bundle identifier in [apps/mobile/app.json](/Users/karanbangia/go/src/github.com/boxing-coach/apps/mobile/app.json:1):

   ```json
   "ios": {
     "bundleIdentifier": "com.karanbangia.boxingcoach"
   }
   ```

5. Review the build and submit profiles in [apps/mobile/eas.json](/Users/karanbangia/go/src/github.com/boxing-coach/apps/mobile/eas.json:1).

6. For automated submissions, configure your App Store Connect API key in EAS credentials:

   ```bash
   cd apps/mobile
   eas credentials --platform ios
   ```

### Build iOS binaries

From the repo root:

```bash
pnpm ios:build:simulator
pnpm ios:build:production
```

- `ios:build:simulator` creates a build for the iOS Simulator on macOS
- `ios:build:production` creates the production iOS build for TestFlight/App Store review

### Submit to App Store Connect

After the app exists in App Store Connect, submit with:

```bash
pnpm ios:submit
```

If EAS asks for the App Store Connect app ID (`ascAppId`), add it to the `submit.production.ios` section in `apps/mobile/eas.json` after you create the app entry in App Store Connect.

## Notes

- The repo uses **pnpm** and a **Turborepo** monorepo; building from the root runs the web app and its `@boxing-coach/core` dependency.
- `pnpm build` is still the repo build command; it does not create Play Store binaries.
- `pnpm build` also does not create App Store/TestFlight binaries.
- `netlify.toml` is already in the repo with the correct build and publish settings.
- Android EAS config lives in `apps/mobile`, which matches Expo's monorepo guidance.
- iOS EAS config lives there too for the same monorepo reason.
