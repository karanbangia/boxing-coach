# iOS App Store submission package

This folder contains copy-ready English (U.S.) metadata for version 1.0.0.
Do not submit it until every unchecked external dependency below is complete.

## Metadata limits

| Field | Draft size | Apple limit |
| --- | ---: | ---: |
| Name | 26 characters | 30 characters |
| Subtitle | 28 characters | 30 characters |
| Promotional text | 133 characters | 170 characters |
| Keywords | 78 UTF-8 bytes | 100 bytes |
| Description | Under 4,000 characters | 4,000 characters |

## App information

- Primary category: Health & Fitness.
- Secondary category: Sports.
- Bundle ID: `com.karanbangia.boxingcoach`.
- Version: `1.0.0`.
- Price: Free with an optional non-consumable lifetime Premium purchase.
- Copyright: `2026 Karan Bangia` unless the App Store account uses a company legal entity.
- Made for Kids: No.
- Regulated medical device: No. The app must not make diagnosis, treatment, measured-heart-rate, measured-calorie, measured-power, or measured-technique claims.
- Release: Manual for the first production launch.

## Required external configuration

- [ ] Publish and legally review the Privacy Policy, Terms of Use, Support page, and marketing site.
- [ ] Confirm the Support URL exposes contact information sufficient for the intended storefronts.
- [ ] Create the app record with the final name, SKU, bundle ID, primary language, categories, age-rating questionnaire, DSA trader status, and regional declarations.
- [ ] Accept current Paid Applications agreements and complete banking/tax setup.
- [ ] Create one non-consumable lifetime Premium product in App Store Connect.
- [ ] Connect only that lifetime product to RevenueCat's `premium` entitlement and default offering.
- [ ] Set RevenueCat restore behavior to `Transfer to new App User ID`.
- [ ] Add the production RevenueCat iOS public SDK key to EAS.
- [ ] Add production PostHog/Sentry keys only after the App Privacy answers match the enabled configuration.
- [ ] Verify sign-in, purchase, refund/revocation, restore, offline entitlement, reinstall recovery, and account deletion in a production TestFlight build.
- [x] Generate and validate six 6.9-inch iPhone screenshots at `1320 × 2868`,
  8-bit RGB, with no alpha channel.
- [ ] Recapture any changed UI from the submitted build, regenerate the set,
  and upload it to App Store Connect.
- [x] Keep version 1 iPhone-only. Native iPad QA showed that the phone-first flow
      needs a purpose-built tablet layout before tablet distribution would meet
      the launch quality bar.
- [ ] Supply App Review contact details and a non-expiring demo account only if review needs to inspect optional cloud profile behavior.

## Accurate paid-content disclosure

Every screenshot or preview that shows Programs, Advanced, or Pro must carry a
visible `Premium` label. Basic and Medium must remain useful without a Boxing
Coach account or purchase.

## Current local verification

- Core recommendation, adaptation, and profile-isolation tests pass.
- The three Programs contain 42 unique progressive sessions.
- Mobile TypeScript and iOS export pass.
- Web TypeScript and production build pass.
- Native iPhone 16e launch, Premium, Programs, simplified Setup, and punch-number guide screens have been visually checked.
- The app configuration no longer declares microphone access because the product does not record audio.
