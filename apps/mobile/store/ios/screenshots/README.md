# App Store screenshot brief

The upload-ready English set is generated in `6.9-inch/` at `1320 × 2868`
pixels, RGB, with no alpha channel. Native device captures live in `source/`.

Regenerate after recapturing any changed screens:

```sh
pnpm --dir apps/mobile screenshots:ios
```

Always verify the final files in App Store Connect against the submitted build.

## Story order

1. **TRAIN WITHOUT WATCHING A SCREEN**
   - Native active-workout screen.
   - Support: `Real-time combinations, bells, movement, and defense calls.`
   - No Premium label.

2. **REAL COMBOS. REAL ROUNDS.**
   - Round timer with a readable combination and coaching state.
   - Support: `Built for shadowboxing and heavy-bag work.`
   - No measured-power, form, or heart-rate claim.

3. **A WORKOUT THAT ADAPTS**
   - Completion feedback and next-workout recommendation.
   - Support: `Too easy, just right, or too hard—change one variable at a time.`
   - No Premium label.

4. **42 SESSIONS THAT PROGRESS**
   - Programs catalog with Beginner Fundamentals, Heavy Bag Conditioning, and
     Fight Camp visible.
   - Add a visible `PREMIUM` badge to the composition.

5. **SEE EVERY ROUND YOU EARN**
   - Progress calendar, rounds, streak, and history.
   - Support: `Local history. No account required.`
   - No Premium label.

6. **YOUR CORNER. YOUR PROFILE.**
   - Fictional profile demonstrating stance, training history, and optional
     cloud sync.
   - Support: `Goals, stance, equipment, schedule—and optional cloud sync.`

## Production rules

- Use screenshots from the submitted build.
- Remove development menus, test banners, placeholder prices, status-bar
  oddities, impossible profile values, and personal information.
- Do not show the store-unconfigured paywall.
- Any screenshot containing Programs, Advanced, or Pro must say `Premium`.
- Do not imply punch tracking, heart-rate measurement, power measurement,
  camera form analysis, coach messaging, or community features.
- Use a single visual campaign system derived from the black, red, cream, and
  peach app identity.
- Prepare a second 6.5-inch or 6.1-inch set only if App Store Connect requires
  it for the final device support matrix.
