# App Review notes — draft

Boxing Coach is an audio-guided boxing workout app. The main workout is usable
without creating an account.

## Review path

1. Complete the short onboarding flow or continue with the saved guest profile.
2. Open Training and start a Basic or Medium workout. These levels are free.
3. Select Advanced or Pro to open the Premium paywall.
4. Open Programs to preview the three Premium programs and their 42 sessions.
5. Restore Purchases is available on the paywall and under Profile > Membership.
6. Optional Apple/Google sign-in saves the fighter profile and can link an
   existing Premium entitlement to that Boxing Coach account. It is not
   required for training, purchasing, or restoring Premium.
7. For a signed-in user, account deletion is available at Profile > Account &
   Data > Delete Account. It deletes the Firebase account and cloud fighter
   profile, revokes Sign in with Apple authorization when applicable, then
   clears local Boxing Coach data.

## In-app purchase behavior

- RevenueCat entitlement: `premium`.
- Product identifier: `lifetime`; RevenueCat package: `$rc_lifetime`.
- Premium is a single non-consumable lifetime purchase.
- There is no subscription, introductory trial, or recurring charge.
- The final localized one-time price comes from StoreKit.
- Basic and Medium remain usable as a guest. A guest can purchase and restore
  Premium through the native store account without creating a Boxing Coach
  account.
- RevenueCat uses an anonymous App User ID for guests and the Firebase UID for
  signed-in users. It never uses the account email address as the customer
  identifier.
- Premium unlocks the three Programs plus Advanced and Pro coaching.
- Basic and Medium remain available without purchase.

## Data and health-claim clarification

- Workout history is stored locally on the device.
- Optional account sync covers the fighter profile, not workout history.
- Punch totals count issued combination calls.
- Calories are estimates.
- The app does not measure heart rate, punch power, technique, or form.
- The app does not record audio and does not request microphone access.

Before submission, replace this draft with the final product identifiers,
working reviewer steps, and any required non-expiring demo credentials. Never
place personal production credentials in this repository.
