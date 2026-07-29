# App Privacy answers — production draft

These answers are a code-informed draft, not a substitute for the final App
Store Connect questionnaire. Reconfirm them against the exact production build,
enabled provider configuration, privacy policy, and Apple definitions before
submission.

## Tracking

- Data used to track the user across other companies' apps or websites: **No**.
- Advertising: **None**.
- App Tracking Transparency prompt: **Not used**.

## Data linked to the user

Only applies when the boxer voluntarily creates a cloud profile:

| Apple data type | Collected data | Purpose |
| --- | --- | --- |
| Contact Info > Email Address | Firebase authentication email or private relay email | App Functionality |
| User Content > Photos or Videos | Optional fighter profile photo | App Functionality |
| Identifiers > User ID | Firebase user identifier | App Functionality |
| Other User Content | Fighter profile choices and nickname | App Functionality |

The app must remain useful without creating this account.

## Data not linked to the user

| Apple data type | Source | Purpose |
| --- | --- | --- |
| Purchases > Purchase History | StoreKit transaction and RevenueCat account-based entitlement state | App Functionality |
| Usage Data > Product Interaction | Privacy-restricted PostHog event allow-list, when configured | Analytics |
| Diagnostics > Crash Data | Privacy-restricted Sentry events, when configured | App Functionality / Analytics |
| Diagnostics > Performance Data | Only if explicitly enabled later | App Functionality / Analytics |

RevenueCat uses the pseudonymous Firebase UID, not the account email address,
to make Premium available across supported devices and platforms. Automatic
device-identifier collection and RevenueCat diagnostics are disabled in app
code. PostHog person profiles, autocapture, replay, and GeoIP enrichment are
disabled. Sentry user, request, screenshot, and PII capture are disabled.

## Not collected by this version

- Precise or coarse location.
- Contacts.
- Browsing or search history.
- Health or fitness sensor data.
- Measured heart rate.
- Microphone recordings or audio samples.
- Payment-card details.
- Advertising data.
- Workout history outside the device.

## Final verification gate

- [ ] Check every third-party SDK in the release build.
- [ ] Match all enabled EAS environment variables to these answers.
- [ ] Verify the published privacy policy names Firebase, RevenueCat, PostHog,
      Sentry, Apple/Google sign-in, notifications, and profile photos.
- [ ] Re-evaluate the answers if Apple Health export, cloud workout sync,
      background audio, or any camera-based coaching is added.
