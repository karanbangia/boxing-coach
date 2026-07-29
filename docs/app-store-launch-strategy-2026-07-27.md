# Boxing Coach App Store Launch Strategy

Date: 2026-07-27

## Executive decision

Boxing Coach should not launch as another generic round timer or a large video-class library.

The most defensible position is:

> The audio-first corner coach for people who train alone.

The launch promise should be:

> Real boxing rounds, called in your ear.

The product is visually distinctive and its live workout is already the strongest part of the experience. The launch icon, splash, first-workout recommendation, equipment-driven training-mode handoff, stance-safe punch-number guide, adaptive completion loop, privacy-safe observability, and native Premium programs are now aligned with that quality. The business is not ready for a paid public launch yet because public legal/support deployment, store product configuration, production TestFlight evidence, and fully stance-aware live coaching still remain.

The right sequence is:

1. Repair trust and first-session activation.
2. Prove that new users complete and repeat workouts.
3. Add three genuinely valuable Premium programs and a native lifetime-purchase infrastructure.
4. Soft-launch, measure, and only then scale acquisition.

## Current product scorecard

| Area | Score | Current assessment |
| --- | ---: | --- |
| Core workout | 8/10 | Focused, hands-free, boxing-specific, and visually strong. |
| Visual system | 8/10 | The in-app identity, native icon, splash, and Android adaptive assets now share one sharp boxing mark; store/social campaign artwork remains. |
| First-use activation | 8/10 | Five focused steps now reveal a concrete first workout before the optional account decision. |
| Personalization | 7/10 | Experience, goal, duration, and saved equipment now seed the first setup; a lead/rear punch guide works for either stance, while stance still needs to shape live coaching. |
| Retention loop | 9/10 | Progress, history, streaks, share cards, reminders, 42 program sessions, post-workout feedback, and explainable next-session adaptation now form a connected loop. |
| Premium readiness | 8/10 | RevenueCat entitlement, localized lifetime price, Advanced/Pro gate, guest purchase, restore, and three data-driven programs are implemented; store product configuration and sandbox evidence remain. |
| App Store readiness | 7/10 | Native brand assets, metadata, an upload-ready six-image product-page campaign, observability, and lifetime-purchase UX are implemented; public legal deployment, store configuration, and production-beta work remain. |
| Accessibility | 5/10 | Many controls are labeled well, but Dynamic Type is widely disabled and some visible legal text is not actionable. |

## Fresh native audit

Audit device: iPhone 16e simulator, iOS 26.5.

Evidence folder:

`/Users/karanbangia/go/src/github.com/boxing-coach/.codex/design-audit/2026-07-27-app-store-launch`

### Flow health

| Step | Screen | Health | Evidence-based finding |
| ---: | --- | --- | --- |
| 0 | Welcome | Good with friction | Strong mood and brand voice. Three competing paths dilute the primary decision. |
| 1 | Gender | Poor | This is the first data request, has only male/female choices, and is not needed to start a workout. |
| 2 | Nickname | Fair | Simple and clear, but still precedes proof of value. |
| 3 | Fitness level | Good | Clear options and descriptions. It is not mapped to the default workout. |
| 4 | Training goal | Good-looking, incomplete | Useful choice, but the selected goal does not generate a matching workout or program. |
| 5 | Stance | Risky promise | The screen says stance cues and footwork will be tailored, but the workout engine does not consume the fighter profile. |
| 6 | Routine | Fair | Clear UI. Reminder permission is requested before the user has completed a workout. |
| 7 | Weight | Low value | Not needed by the current workout engine or performance estimate; better as an optional profile field. |
| 8 | Height | Critical defect | The live selector produced and saved `1′9″`, an impossible default for the intended audience. |
| 9 | Save/sign in | Fair | Guest continuation is preserved. Terms and Privacy are rendered as plain text rather than actionable links. |
| 10 | Workout setup | Good-looking, misaligned | A beginner can arrive at Advanced, 8 × 3-minute rounds because setup defaults are independent of onboarding. Advanced and Pro are not gated. |
| 11 | Scrolled setup | Good | The workout controls are usable and the fixed Start button remains accessible. |
| 12 | Prep | Strong | Clear countdown, Start Now, and Cancel actions. |
| 13 | Active workout | Strongest | Large timer, audio control, combo hierarchy, and session controls fit the hands-free promise. |
| 14 | End confirmation | Strong | Prevents accidental loss and states the consequence clearly. |
| 15 | Progress empty state | Fair | Strong visual hierarchy but no direct “complete your first workout” action. |
| 16 | Fighter profile | Good-looking, inconsistent | Shows the broken height and “No equipment / Shadowboxing” while the workout itself is labeled Heavy Bag. |

### Accessibility risks

- Most important controls have useful roles and labels.
- Custom rulers expose adjustable accessibility values.
- Dynamic Type is commonly disabled with `allowFontScaling={false}`. This risks clipped or unreadable content for users who need larger text.
- Several headings use fixed sizes and fixed-height cards; these require testing with Larger Text accessibility sizes.
- The first onboarding choice excludes people outside a binary gender model even though the field does not materially improve current coaching.
- “Terms of Service · Privacy Policy” is not interactive or exposed as two links.
- Visible contrast is generally strong, but exact WCAG contrast and focus behavior were not measured in this screenshot audit.
- VoiceOver reading order, Reduce Motion, switch control, and physical-device audio behavior still require hands-on testing.

## P0: blockers before a public paid launch

### 1. Replace the launch assets

**Implemented and native-verified on 2026-07-27.**

The historical watermarked splash and cartoon glove were replaced with an original black, red, and cream glove system. The 1024 × 1024 iOS icon is RGB with no alpha, the launch artwork is watermark-free, and matching Android adaptive foreground and monochrome assets are included. A clean Expo prebuild and native iOS rebuild confirmed both the Home Screen icon and launch screen.

Delivered:

- App icon.
- Monochrome Android icon.
- Android adaptive foreground.
- Splash mark and wordmark.
- Web favicon.
- Editable SVG sources and reproducible build instructions.

Still needed for the growth campaign:

- Store lifetime-purchase artwork.
- Social avatar and post templates.
- [x] Six-image 6.9-inch App Store screenshot campaign, generated at
  `1320 × 2868`, 8-bit RGB, with no alpha.
- App Preview video using the submitted production build.

Version 1 should be iPhone-only. Native iPad QA confirmed that the current
phone-first flow is functional but too sparse in the iPad windowing model.
Tablet support should return only with a deliberate coach-dashboard layout,
not a stretched phone interface.

### 2. Shorten onboarding to value

Recommended first-use flow:

1. Welcome: `START A FREE ROUND`.
2. Experience: Beginner / Intermediate / Advanced.
3. Training mode: Shadowboxing / Heavy bag.
4. Goal: Technique / Fitness / Fight camp.
5. Recommended first workout with one-tap Start.
6. After completion: nickname, schedule, optional account, and optional body details.

Remove gender from required onboarding. Move weight and height to optional profile settings unless a user explicitly enables a calculation that needs them.

Do not request notification permission until the user taps an explicit reminder action after completing a workout. **Implemented:** onboarding no longer requests permission, and the completion screen owns the explicit reminder action.

### 3. Make personalization truthful

Create a single recommendation mapper:

```text
experience + mode + goal + available time
    -> difficulty + rounds + round duration + rest + coaching focus
```

At minimum:

- Beginner + Technique + 10–20 min -> Basic, 3 × 2 min, generous rest.
- Beginner + Fitness -> Basic, 4 × 2 min, conditioning finishers.
- Intermediate + Heavy Bag -> Medium, 5–6 rounds.
- Advanced + Fight Camp -> Advanced, 6–8 × 3 min.

Do not promise stance-specific cues until orthodox/southpaw wording and movement directions are actually mirrored.

### 4. Add legal and account trust surfaces

**Implemented locally; production publication and legal review are pending.**

The mobile app now exposes separate, accessible Terms, Privacy, and Support
links. Product-specific responsive pages and a Netlify support form are in the
web bundle. All account copy now truthfully states that Firebase syncs the
fighter profile while workout history remains local. The intended public URLs
must be deployed and rechecked before submission.

Before submission:

- [ ] Publish and legally review Privacy Policy, Terms of Use, and Support pages.
- [x] Make both legal labels tappable in onboarding and Account.
- [x] Document Firebase Auth, Firestore, Storage, notifications, profile photos, and local workout history in the privacy policy draft.
- [x] Keep account deletion working and describe local-versus-cloud deletion clearly.
- Verify Apple Sign-In in the production build.
- [ ] Deploy and submit a production support-form test.

### 5. Build Premium as ongoing value

Preserve the agreed guest-first model:

- Basic and Medium remain useful without login.
- Tapping Advanced or Pro presents Premium.
- Native purchase does not require Boxing Coach login.
- Optional login handles the cloud fighter profile; workout history stays local until a real sync layer is built; verified store entitlement handles paid access.

Premium v1 must include more than a difficulty gate:

- **Implemented locally:** three complete programs:
  - Beginner Fundamentals: 2 weeks.
  - Heavy Bag Conditioning: 4 weeks.
  - Fight Camp: 6 weeks.
- Advanced and Pro coaching.
- Full progress/history.
- Saved presets or a simple custom builder.
- Adaptive next-workout recommendation.

**Implemented locally and native-verified on 2026-07-27:** every completed
workout asks `Too easy / Just right / Too hard`. Standard workouts change only
one variable at a time (round count, recovery, duration, then coaching level);
program workouts advance, repeat after `Too hard`, or celebrate program
completion. The App Store review request now waits for positive feedback after
at least two completed workouts instead of appearing immediately on
completion.

**Native foundation implemented locally on 2026-07-27.** RevenueCat's
`premium` entitlement is the source of truth, Firebase UID provides the
cross-device RevenueCat customer identity, the localized one-time store price
is displayed, and account-gated Restore Purchases is present. Advanced and Pro
are gated both when selected and again when starting a previously saved
workout. Production activation still requires RevenueCat/App Store
Connect/Play Console products and platform public SDK keys.

The Programs tab now contains 42 sessions with sequential progress derived
from local workout completions. Sessions change real engine inputs:
difficulty, training mode, rounds, round duration, rest, coaching-call cadence,
movement frequency, and defense frequency. Product copy deliberately avoids
claiming measured technique, power, or conditioning outcomes.

Store activation checklist:

- [ ] Create the `premium` entitlement in RevenueCat.
- [ ] Create one non-consumable lifetime product in App Store Connect and one equivalent one-time product in Play Console.
- [ ] Attach only the lifetime product to the entitlement and a default RevenueCat offering.
- [ ] Set RevenueCat restore behavior to `Transfer to new App User ID`.
- [ ] Add the iOS and Android RevenueCat public SDK keys to the build environment.
- [ ] Verify purchase, cancel, pending payment, offline entitlement, refund/revocation, reinstall recovery, and restore with sandbox accounts.
- [ ] Confirm App Store in-app purchase metadata, review screenshot, localization, and agreements.

### 6. Instrument quality and the funnel

**Implemented locally on 2026-07-27; production provider keys and dashboard
validation are pending.** PostHog is restricted to an anonymous event
allow-list with replay, autocapture, GeoIP, and person profiles disabled.
Sentry is opt-in by build configuration with PII, screenshots, request capture,
and performance tracing disabled. Audio failures and core launch funnel events
are explicitly covered.

Add a privacy-conscious analytics abstraction before scaling:

- `onboarding_started`
- `onboarding_step_completed`
- `recommended_workout_shown`
- `workout_started`
- `first_round_completed`
- `workout_completed`
- `workout_abandoned`
- `completion_rating_submitted`
- `next_workout_loaded`
- `paywall_viewed`
- `purchase_completed`
- `purchase_restored`

Also add crash/error monitoring and explicit audio-failure logging. Do not use Health data for marketing or advertising.

## Product roadmap

### Phase A: launch foundation

- [x] Fix/remove broken height and unnecessary required profile data.
- [x] Replace watermarked/inconsistent brand assets.
- [x] Reduce onboarding and show a one-tap recommended workout.
- [x] Map profile choices to workout defaults.
- [x] Add legal/support links and responsive local pages; public deployment
  and legal review remain launch gates.
- [x] Add analytics and crash monitoring.
- [x] Generate and validate the six-image 6.9-inch App Store campaign.
- Run production TestFlight QA on at least three iPhone sizes.

Exit gate:

- No P0 launch defects.
- Crash-free workout sessions above 99.5%.
- At least 30 external beta testers.

### Phase B: retention proof

- [x] Post-workout “Too easy / Just right / Too hard”.
- [x] Explainable next-workout recommendation.
- [x] Stance-safe beginner punch-number primer with lead/rear mapping, body-shot notation, and starter combinations.
- Surface the existing progress, streak, personal best, and share-card loop.
- [x] Replace the orphaned hard-coded `PlanScreen` concept with three data-driven programs and local completion progress.
- Add an empty-state CTA from Progress back to the recommended workout.

Exit gate, recalibrated after the first 500 users:

- Install-to-first-workout start above 35%.
- Started-to-completed first workout above 65%.
- At least 25% complete two workouts in the first seven days.
- D7 retention above 18%.

### Phase C: Premium v1

- [x] RevenueCat/StoreKit entitlement foundation.
- [x] One lifetime offering using localized store metadata.
- [x] Advanced/Pro gate.
- [x] Three complete programs with 42 total progressive sessions.
- [x] Restore, pending-purchase, offline-friendly entitlement, and error states.
- [x] Contextual paywall from Premium difficulty and Profile.

Set the final India lifetime price in App Store Connect after pricing validation.
Localize global prices by territory rather than converting the India price literally. Keep the one-time total price prominent and explicitly state that there are no recurring charges.

Exit gate:

- Paywall-to-purchase above 5%.
- Refund rate monitored and explained.

### Phase D: differentiation

- Apple Health write-only workout export with estimated calories clearly labeled.
- Music-friendly and lock-screen-safe training, only after revisiting the product decision and validating reliable background timing.
- Custom workout builder.
- Coach voice styles.
- Technique lessons for punch numbers, stance, guard, defense, and footwork.
- Offline program/audio packs.

Do not start with camera “AI form scoring.” First prove one reliable, privacy-safe signal such as guard position, then expand.

### Phase E: community and distribution

- Weekly challenges.
- Coach-authored programs.
- Shareable workout presets.
- Gym QR/class mode.
- Coach and gym accounts.
- Apple Watch only after the agreed Apple Health v1 is stable and the phone experience has retention.

## Competitive gap

| Capability | Boxing Coach now | Category expectation | Decision |
| --- | --- | --- | --- |
| Hands-free combo calling | Strong | Common in better boxing apps | Make this the hero, not just a feature. |
| Real round/rest UX | Strong | Expected | Preserve reliability and high visibility. |
| Programs | Three focused programs and 42 engine-backed sessions | Strong competitors have libraries | Validate completion and retention before expanding the catalog. |
| Custom workouts | Not surfaced | Common differentiator | Premium after programs. |
| Technique education | Punch-number primer implemented | Important for beginners | Validate guide usage, then add stance, guard, defense, and footwork lessons. |
| Defense/footwork modes | Present in engine, weakly merchandised | Competitors market these explicitly | Turn engine depth into named workouts/programs. |
| Progress/history | Connected to feedback and adaptation | Expected | Validate whether the loop improves second-workout completion. |
| Apple Health | Planned, not implemented | Present in leading apps | Post-launch priority after Premium foundation. |
| Watch/background/group modes | Missing | Present in timer leaders | Later; do not dilute launch. |
| Subscription | Native entitlement, paywall, restore/manage, and Premium content implemented locally | Common | Activate store products and verify sandbox lifecycle before launch. |

## Brand strategy

### Audience

Primary:

- A solo heavy-bag user who wants structure without staring at a screen.

Secondary:

- A beginner shadowboxer who needs simple, credible guidance.

Later:

- Coaches and gyms assigning structured sessions.

### Brand pillars

1. Authentic: real boxing language and round structure.
2. Hands-free: train by listening, not watching.
3. Earned progress: rounds, streaks, and skill progression.
4. No nonsense: fast start, clear coaching, no mandatory account.

### Voice

- Short.
- Direct.
- Encouraging without fake aggression.
- Technically credible.
- Never claim measured punch accuracy, heart rate, or form when the app only estimates.

### App Store positioning draft

Name candidate, 26 characters:

`Boxing Coach: Bag Training`

Subtitle candidate, 28 characters:

`Audio-guided boxing workouts`

Tagline:

`Your corner, in your ears.`

Screenshot story:

1. `TRAIN WITHOUT WATCHING A SCREEN`
2. `REAL COMBOS. REAL ROUNDS.`
3. `BUILT FOR BAG WORK OR SHADOWBOXING`
4. `SEE EVERY ROUND YOU EARN`
5. `PROGRAMS THAT PROGRESS WITH YOU`

Only advertise features that are present in the submitted build.

## App Store growth plan

### Pre-launch

- Recruit 30–50 TestFlight users from boxing gyms, Reddit boxing communities, local coaches, and existing contacts.
- Interview at least 10 after two sessions.
- Collect the exact words users use to describe the value.
- Produce a short App Preview showing someone starting the phone, putting it down, and training entirely by audio.
- Prepare localized product pages for heavy bag, shadowboxing, and beginner boxing once those flows are real.

### Launch

- Launch with a free, immediately useful first workout.
- Ask for an App Store rating only after positive feedback on the second or later completed workout, never after abandonment or `Too hard`.
- Use campaign links per coach/community so acquisition quality can be measured.
- Nominate the launch for App Store featuring well in advance, emphasizing the indie story, hands-free accessibility, privacy-conscious local-first use, and boxing-community benefit.

### Post-launch

- Run Product Page Optimization on icon, screenshot one, and subtitle—one meaningful variable at a time.
- Publish one meaningful program/challenge update per month.
- Respond to every early review.
- Turn top review language into product-page copy only when accurate.
- Stop paid acquisition if retention and payback are not proven.

## Profitability model

Do not optimize for “top selling” as an unmeasurable aspiration. Optimize for a repeatable engine:

```text
qualified installs
  x activation
  x retained users
  x paid conversion
  x net revenue per payer
  - support, content, infrastructure, and acquisition cost
  = contribution profit
```

For planning, calculate contribution from the final lifetime price after the
applicable Apple commission, taxes, refunds, vendor costs, and acquisition cost.
Because a lifetime purchase has no renewal revenue, model support and content
cost across the expected customer lifetime before setting the price.

Replace the cost assumption with actual founder time, content production, tools, support, cloud, and acquisition costs before making pricing decisions.

## North-star and operating dashboard

North-star metric:

> Completed coached rounds per weekly active boxer.

Supporting metrics:

- Time from install to first workout.
- First workout completion.
- Two workouts in first seven days.
- Weekly coached rounds.
- D1, D7, and D30 retention.
- Completion difficulty rating.
- Paywall-to-purchase.
- Refunds and purchase revocations.
- Revenue per install.
- Crash-free and audio-successful workout sessions.
- Ratings count and average, without incentives or manipulation.

## First implementation batch

The first engineering batch should be deliberately small:

1. Remove or defer gender, weight, and height from required onboarding. **Implemented and native-verified:** onboarding is now five steps, uncollected demographics remain `Not set`, and the old 1 ft 9 in height edge case is repaired during migration.
2. Add training mode/equipment to onboarding. **Implemented and native-verified:** Shadowboxing and Heavy Bag are chosen through onboarding/equipment profile, persist safely, and label the live workout. The Training Mode picker was deliberately removed from Setup to keep the pre-workout decision surface simple.
3. Convert the final onboarding step into a recommended first workout. **Implemented and native-verified:** the recommendation is visible before optional signup, with guest-first use and reversible back navigation.
4. Map the recommendation to Basic/Medium and sensible rounds. **Implemented and native-verified:** a Beginner/Fundamentals/20-minute profile produces Basic, 2-minute rounds, 3 rounds, and 60-second rest without overwriting later saved settings.
5. Add actionable Privacy/Terms/Support links. **Implemented and native-verified locally:** the app exposes distinct link roles and the responsive pages build successfully; production Netlify publication remains gated on review and approval.
6. Add event instrumentation around the shortened flow. **Implemented locally:** the allow-list now covers onboarding, activation, completion feedback, next-workout loading, Programs, review timing, and Premium conversion.
7. Teach boxing number calls without complicating Setup. **Implemented and native-verified:** a compact Setup entry opens an accessible 1–6 guide using stance-safe lead/rear language, `B` body-shot notation, and starter combinations; guide opens are tracked.

Brand asset exploration and Premium UI should run as separate visual/product decisions so neither is improvised inside an engineering patch.
