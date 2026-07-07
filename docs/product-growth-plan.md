# Boxing Coach Product Growth Plan

## Product Thesis

Boxing Coach should become the best hands-free boxing training app for people who train alone with a heavy bag, shadowbox at home, or want structured conditioning without watching a video class.

The wedge is simple: most fitness apps make users look at the screen. This app should let users press Start, put the phone nearby, and train by listening. The bigger vision is an adaptive boxing coach that learns the user's level, builds weekly programs, tracks progress, and eventually gives form feedback through the camera.

## Current Strengths

- Shared core workout engine for web and mobile.
- Real round/rest structure with difficulty progression.
- Audio coach callouts already exist.
- Mobile app is already present, not just planned.
- Expo dependencies already include camera and pose detection pieces, which creates a path toward premium form feedback.
- The app works well as a PWA and can also become a native subscription product.

## Market Read

Competitors prove people pay for boxing apps, but there is still room for a sharper product:

- PunchLab emphasizes guided workouts, punch tracking, trackers, and leaderboards: https://punchlab.net/
- Boxx sells a broader class library across boxing, strength, pilates, yoga, and recovery, currently positioned around annual subscription pricing: https://boxxldn.com/pages/our-app
- Heavy Bag Pro is positioned around a deep combo library, structured bag intervals, and audio callouts; a 2026 competitor review lists pricing at $9.99/month, $59.99/year, and $129.99 lifetime: https://fightflow.app/blog/best-boxing-apps-2025
- RevenueCat's 2026 subscription report says health and fitness monetization skews annual, with health and fitness showing 68% annual in their category mix: https://www.revenuecat.com/state-of-subscription-apps/
- Apple offers a 15% App Store commission for eligible small businesses under the Small Business Program: https://developer.apple.com/app-store/small-business-program/
- Google Play's service-fee docs show many developers can qualify for reduced fees, and in some major markets auto-renewing subscriptions start at 10% service fee plus billing fee from June 30, 2026: https://support.google.com/googleplay/android-developer/answer/112622

The opportunity: avoid being just "another workout library." Win by being the app that feels like a real corner coach in your ears.

## Target Users

### Primary: Solo Heavy Bag User

Trains in a garage, apartment gym, boxing gym open mat, or home setup. Wants audio callouts, rounds, variety, and progress.

### Secondary: Beginner Shadowboxer

Wants to learn boxing basics without being overwhelmed. Needs clear punch naming, slower pacing, beginner programs, and confidence.

### Tertiary: Fitness User

Wants sweat, calories, and conditioning more than technique. Needs quick workouts, music-friendly flow, streaks, and simple goals.

### Later: Coach/Gym Segment

Trainers who want to run classes, assign workouts, and track members. This can become a higher-priced B2B product after consumer traction.

## Positioning

"Audio-first boxing training that adapts to your level."

Supporting promises:

- Train without staring at a screen.
- Get real boxing combos, defense, movement, and round structure.
- Build from beginner to advanced with progression.
- Track your work and improve week by week.
- Add camera feedback when you want coaching, not just sweat.

## Feature Roadmap

### Phase 1: Make The Core App Addictive

Goal: make free users complete workouts and come back.

- Workout history: date, duration, rounds, difficulty, actions completed, freestyle finishers.
- Streaks: weekly training streak, total rounds, total minutes.
- Personal records: longest workout, most rounds in a week, highest difficulty completed.
- Saved presets: "3 round beginner", "6 round bag work", "12 round pro camp".
- Workout summary screen: total time, round count, estimated action count, next suggested workout.
- Better onboarding: choose goal, level, equipment, and available time.
- Beginner learning layer: show punch number mapping before first workout.
- Post-workout rating: too easy, just right, too hard. Use this to adapt pacing.
- Share card: image export for completed workout, streak, or PR.

Why this matters: retention comes before monetization. Users need visible progress and a reason to return tomorrow.

### Phase 2: Create Premium Value

Goal: introduce paid features that feel natural, not punitive.

- Premium workout programs:
  - Beginner Fundamentals, 2 weeks.
  - Heavy Bag Conditioning, 4 weeks.
  - Footwork and Defense, 3 weeks.
  - Fight Camp, 6 weeks.
- Adaptive difficulty:
  - App adjusts interval speed, defense frequency, and combo complexity based on user ratings and completion.
- Advanced/pro content:
  - Counterpunching rounds.
  - Feints.
  - Southpaw mode.
  - Orthodox/southpaw mirror instructions.
  - Body-head level changes.
- Custom workout builder:
  - Choose combo families, round count, pacing, defense frequency, movement frequency, finishers.
  - Save and duplicate templates.
- Coach voice packs:
  - Calm coach.
  - Aggressive coach.
  - Technical coach.
  - Minimal callout mode.
- Music mode:
  - Lower callout volume.
  - Bell and warning cues.
  - Fewer long voice clips.
- Offline audio packs on mobile.

Recommended paywall: keep basic timer, beginner/intermediate random workouts, and a limited history free. Put programs, adaptive training, advanced/pro content, custom builder, voice packs, and deeper analytics behind Premium.

### Phase 3: Build The "Real Coach" Moat

Goal: build features harder for copycat combo apps to match.

- Camera form checks:
  - Guard position.
  - Hands returning to face.
  - Jab/cross extension.
  - Head movement during slip/roll prompts.
  - Stance width.
- Rep detection and punch count using camera or sensors.
- Round scoring:
  - Activity score.
  - Consistency score.
  - Defense response score.
  - Combo completion confidence.
- Video replay snippets:
  - Last 10 seconds of a round.
  - Highlight missed guard drops.
- AI-generated weekly plans:
  - Based on goal, available days, level, soreness, and past completion.
- Skill tree:
  - Jab Basics.
  - Cross Mechanics.
  - Hook Development.
  - Defense Reactions.
  - Footwork.
  - Conditioning.
- Technique tests:
  - Complete 3 rounds with 80% guard score.
  - React to 20 defense calls.
  - Finish 6 rounds at intermediate pace.

This is the long-term monetization layer. Audio callouts get users in. Feedback and progression keep them paying.

### Phase 4: Social And Distribution

Goal: turn workouts into growth loops.

- Weekly challenges:
  - 3 rounds every day.
  - 50 rounds in July.
  - Beginner to Intermediate challenge.
- Friends:
  - Follow training streaks.
  - Compare weekly rounds.
  - Send a workout preset.
- Public leaderboard for optional challenges.
- Gym codes:
  - Coach creates workout.
  - Members scan code and run the same session.
- Trainer profiles:
  - Featured programs by real coaches.
  - Revenue share later.
- Creator marketplace:
  - Coaches sell programs.
  - App takes a platform fee.

Do not build social too early. It only works after the solo product is sticky.

## Monetization Model

### Free

- Basic round timer.
- Beginner and intermediate random workouts.
- Limited workout history, for example last 7 workouts.
- Basic audio cues.
- One or two sample programs.

### Premium Individual

Suggested starting price:

- $9.99/month.
- $59.99/year.
- Optional lifetime at $129.99 while early.

Premium includes:

- Full programs.
- Advanced/pro difficulty.
- Adaptive difficulty.
- Custom workout builder.
- Full history and analytics.
- Voice packs.
- Offline audio.
- Camera feedback when ready.

### Premium Plus

Add later after the product has proof of retention:

- $14.99/month or $99.99/year.
- Includes AI plans, detailed camera form scoring, video snippets, and advanced analytics.

### Coaches/Gyms

Add after consumer product is working:

- $19/month for solo coach.
- $49/month for small gym.
- $99/month for larger gym.

Features:

- Assign workouts.
- Create templates.
- Track member completion.
- Class mode.
- Gym leaderboard.

## Paywall Strategy

Start with a soft paywall:

- Let users complete a real workout before asking for money.
- After first completion, show progress unlocked by Premium.
- Offer a 7-day free trial on annual.
- Make annual the default value plan.
- Keep the app useful without paying, but make serious progress clearly premium.

Do not hard-paywall the first session. The app's magic is felt during a workout, not on a marketing screen.

## Metrics To Track

### Activation

- Install to first workout start.
- Workout start to workout completion.
- Number of users who complete 2 workouts in first 7 days.

### Retention

- D1, D7, D30 retention.
- Workouts per active user per week.
- Rounds per user per week.
- Streak adoption.

### Monetization

- Paywall view to trial start.
- Trial start to paid conversion.
- Monthly churn.
- Annual share of revenue.
- Revenue per install.

### Product Quality

- Too easy / just right / too hard rating.
- Crash-free sessions.
- Audio playback failures.
- Workout abandonment by round.

## 90-Day Build Plan

### Weeks 1-2: Product Foundation

- Add workout history.
- Add complete-screen analytics.
- Add persistent streaks and total rounds.
- Add post-workout difficulty rating.
- Add events/analytics abstraction, even if initially local/log-only.

### Weeks 3-4: Retention Loop

- Add saved presets.
- Add next-workout recommendation.
- Add share card.
- Improve onboarding with goal, equipment, and experience.
- Add beginner punch-number primer.

### Weeks 5-7: Premium v1

- Add subscription infrastructure.
- Add entitlement checks.
- Add premium feature flags.
- Add paywall screen.
- Add 3 premium programs and 1 free sample program.
- Gate custom workout builder and advanced/pro content.

### Weeks 8-10: Adaptive Coaching

- Use post-workout ratings to adjust pacing.
- Create progression rules by goal and level.
- Add weekly plan view.
- Add reminders only after users opt in.

### Weeks 11-12: Launch Polish

- App Store and Play Store screenshots.
- Landing page with clear positioning.
- Privacy policy and terms.
- Crash/error logging.
- Beta group.
- Pricing A/B plan.

## Technical Roadmap

### Local Data First

- Add a `WorkoutSession` model in core or app-local storage.
- Store sessions locally first.
- Sync later when accounts exist.

Suggested model:

```ts
interface WorkoutSession {
  id: string;
  startedAt: string;
  completedAt?: string;
  difficulty: string;
  totalRounds: number;
  roundDuration: number;
  restDuration: number;
  completedRounds: number;
  actionsCompleted: number;
  userRating?: 'too_easy' | 'just_right' | 'too_hard';
}
```

### Programs

- Add data-driven program definitions to core.
- A program is a sequence of planned workouts.
- Each planned workout maps to an `EngineConfig` plus optional training focus.

### Subscription

- Use StoreKit/Google Play Billing through a mobile subscription layer.
- Consider RevenueCat for faster entitlement management.
- Keep web monetization separate initially unless you want web checkout.

### Accounts

Delay full accounts until after premium v1 unless cross-device sync becomes urgent. Account systems add friction and maintenance. Local-first subscriptions and restore purchase are enough for the first native launch.

### Camera Feedback

Treat camera feedback as a separate premium module:

- Start with one reliable form signal, such as guard up.
- Do not promise full technique scoring until you can validate accuracy.
- Add explicit privacy language before enabling camera features.

## Content Strategy

Create named programs instead of only random workouts:

- Start Boxing: 7 days.
- Bag Basics: 14 days.
- Cardio Rounds: 21 days.
- Defense Builder: 14 days.
- Footwork Flow: 14 days.
- Fight Camp: 6 weeks.
- Quick Sweat: 10 minutes.
- Lunch Break Rounds: 15 minutes.
- Championship 12: full 12-round challenge.

Each program should have:

- Goal.
- Skill focus.
- Recommended level.
- Number of sessions.
- Expected weekly schedule.
- Completion badge.

## Brand Direction

Keep the app direct, intense, and practical. Avoid looking like a generic wellness app. The experience should feel like:

- Big readable controls.
- Loud, reliable audio.
- No clutter during rounds.
- Serious training language.
- A little energy, but not gimmicky.

Potential taglines:

- "Your corner coach, in your headphones."
- "Press start. Hit the round."
- "Boxing rounds that adapt to you."
- "Train the bag like someone is calling the fight."

## Launch Strategy

### Beta

- Recruit 25-50 users from boxing gyms, Reddit, Discord, friends, and local trainers.
- Ask each beta user for 3 completed workouts, not vague feedback.
- Watch where workouts are abandoned.
- Ask what they would pay for.

### First Public Launch

- Launch mobile first.
- Keep web as a demo/PWA and SEO surface.
- Focus App Store screenshots on audio-first training, progress, and programs.
- Publish short videos showing someone training without looking at the screen.

### Growth Channels

- TikTok/Reels: "3 rounds with a random boxing coach app."
- YouTube Shorts: combo drills.
- SEO: boxing number system, heavy bag workouts, shadowboxing rounds.
- Gym partnerships: free coach accounts for local trainers.
- App Store Optimization: boxing workout, heavy bag training, boxing timer, shadow boxing.

## Risks

- Audio reliability is existential. If callouts fail, the product fails.
- Too many AI features too early can feel gimmicky.
- Camera scoring can be wrong and break trust.
- A large content library is expensive to maintain if it depends on recorded video.
- Social features will look empty until the user base is active.

## Recommended Next Step

Build the retention layer before subscriptions:

1. Workout history.
2. Streaks and totals.
3. Post-workout rating.
4. Saved presets.
5. Named programs.
6. Premium gate for advanced programs and custom builder.

This gives the app a business shape without losing the simple thing that already works: press Start and train.
