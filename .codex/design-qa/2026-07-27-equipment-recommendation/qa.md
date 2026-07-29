# Equipment-aware recommendation QA

- Device: iPhone 16e simulator, iOS 26.5
- Scenario: fresh onboarding, Lightly Active, Heavy-bag Conditioning,
  Heavy Bag, Orthodox, 30-minute preference
- Onboarding remained five steps by combining training mode and stance
- Recommendation screen appeared before signup
- Observed recommendation: Heavy Bag, Medium, 4 rounds, 2 minutes,
  60-second rest, about 11 minutes
- `SAVE & SYNC FIRST` opened signup and Back returned to the recommendation
- Back from the recommendation returned to the routine step
- `USE THIS WORKOUT` produced the matching persisted setup
- The active workout header displayed `HEAVY BAG`
- Legacy settings without a training mode safely default to Shadowboxing
- Notification permission is no longer requested during onboarding; the
  permission request is available only from an explicit post-workout action
- Normal app mode and the pre-QA Shadowboxing, Basic, 3-minute, 8-round,
  60-second setup were restored after testing

Automated checks:

- `pnpm --dir apps/mobile exec tsc --noEmit`
- `pnpm --filter @boxing-coach/core test:recommendation`
- `git diff --check`
