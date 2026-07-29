# First-workout recommendation QA

- Device: iPhone 16e simulator, iOS 26.5
- Scenario: fresh onboarding, Beginner, Learn Fundamentals, 20-minute preference
- Expected recommendation: Basic, 2-minute rounds, 3 rounds, 60-second rest
- Observed recommendation: Basic, 2-minute rounds, 3 rounds, 60-second rest
- Combo instructions and audio cues remained enabled
- After returning to the normal app mode, the previously saved Basic, 3-minute,
  8-round, 60-second setup was still present
- Required onboarding now contains five steps: nickname, fitness level, goal,
  stance, and routine
- The five-step flow reached the account handoff and then produced the expected
  recommendation when continued as a guest
- A corrupt legacy height of 53 cm / 1 ft 9 in migrated to `Not set`
- The Profile editor shows blank height inputs with a practical
  3 ft 11 in–7 ft 7 in range instead of inserting a fake default
- An active no-equipment workout now uses the truthful neutral header `BOXING`
  instead of always claiming `HEAVY BAG`
- Normal app mode and the pre-QA workout settings were restored after testing

Automated checks:

- `pnpm --filter @boxing-coach/core test:recommendation`
- `pnpm --dir apps/mobile exec tsc --noEmit`
- `git diff --check`

Evidence: `01-beginner-recommendation.png`
