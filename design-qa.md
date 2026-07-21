## Dashboard setup typography and copy — 2026-07-13

**Findings**
- No actionable P0/P1/P2 findings.

**Required fidelity surfaces**
- Fonts and typography: `Difficulty`, `Round Duration`, and `Rounds` all render in Barlow Semi Condensed SemiBold at 14px with the same line height, letter spacing, color, and uppercase treatment. Control values use Anton, while secondary explanatory copy uses Archivo Narrow. This is a consistent three-level type hierarchy rather than a mix of styles within the same level.
- Spacing and layout rhythm: the two-column difficulty grid keeps the source's alignment and density; all four shortened descriptions fit on one line at the tested viewport.
- Colors and visual tokens: section labels retain the peach token, selected borders retain the red accent, and the round count now renders white (`rgb(255, 255, 255)`).
- Image quality and asset fidelity: the target region contains no raster imagery, logos, or new icon assets. Existing UI icon treatment was preserved.
- Copy and content: difficulty summaries are reduced to short level-and-pace cues. `Voice + Bell` is now `Audio Cues`, with `Coach instructions & round bells` as the supporting hint.

**Open Questions**
- None. The source screenshot is the pre-change state, so the requested copy reductions and color change are intentional differences from it.

**Implementation Checklist**
- Standardized the three setup section headings on the existing label type token.
- Shortened all four difficulty descriptions.
- Changed the round-count value to white on web and mobile.
- Renamed and clarified Audio Cues on web and mobile.
- Added switch semantics and a coach-instruction accessibility hint on mobile.

**Follow-up Polish**
- No P3 follow-up is required for this scope.

source visual truth path: `/var/folders/4g/hd8s523s2zzgn1g5w1mf_1qh0000gn/T/TemporaryItems/NSIRD_screencaptureui_xu2plc/Screenshot 2026-07-13 at 5.34.36 PM.png`
implementation screenshot path: `/Users/karanbangia/go/src/github.com/boxing-coach/.codex/design-qa/dashboard/setup-final-390x844.png`
viewport: `390x844`
state: workout setup screen scrolled to the top, Beginner selected, 3-minute round duration, 9 rounds, and 60-second rest period
full-view comparison evidence: `/Users/karanbangia/go/src/github.com/boxing-coach/.codex/design-qa/dashboard/difficulty-comparison.png` combines the complete supplied reference with the matching rendered difficulty region in one image.
focused region comparison evidence: `/Users/karanbangia/go/src/github.com/boxing-coach/.codex/design-qa/dashboard/audio-cues-390x844.png` verifies the renamed Audio Cues row, coach-instruction hint, white round number, and surrounding type hierarchy.
primary interactions tested: difficulty selection, round increment, and Audio Cues toggle.
console errors checked: no browser console errors were present.
comparison history: the first same-state comparison found no actionable P0/P1/P2 mismatch; no visual-fix iteration was required.
final result: passed

## Profile authentication headline clipping regression — 2026-07-15

**Root cause**
- The new Profile screen used one-off tight line heights, including `62px / 64px` for the Anton authentication headline. That line box was too small for the font's glyph metrics and contradicted the mobile typography rule of `lineHeight = fontSize * 1.4`.

**Fix and prevention**
- Added the shared `textLineHeight(fontSize)` helper in the mobile theme with an exact `1.4` multiplier.
- Audited all 42 text styles in the Profile flow and moved every one to the shared calculation, including authentication, onboarding, signed-in profile, editing, account rows, and confirmation sheets.
- Re-rendered the Firebase configuration-error state because that was the state shown in the reported regression.

source visual truth path: `/var/folders/4g/hd8s523s2zzgn1g5w1mf_1qh0000gn/T/TemporaryItems/NSIRD_screencaptureui_Ahd5Zi/Screenshot 2026-07-15 at 8.28.00 PM.png`
implementation screenshot path: `/Users/karanbangia/go/src/github.com/boxing-coach/.codex/design-qa/profile/profile-auth-line-height-fixed-native.png`
viewport: iPhone 16e simulator, iOS 26.3, 945 × 2048 native capture
state: guest Profile with the missing-Firebase inline error visible
validation: both `SAVE YOUR` and `TRAINING` render fully without top or bottom glyph clipping; TypeScript and diff validation passed.
final result: passed

## Firebase authentication and fighter profile — 2026-07-15

**Findings**
- No actionable P0/P1/P2 visual or interaction findings at the tested iPhone viewport.
- P3: Apple/Google provider completion still needs a real Firebase project, OAuth credentials, and physical-device validation before release. The guest flow, inline configuration error, native provider modules, and post-auth states were validated locally.

**Required fidelity surfaces**
- Typography and hierarchy: Profile reuses the existing Anton display face, Barlow Semi Condensed labels, and Archivo Narrow supporting copy. Editorial peach/red headings remain consistent with Training and Progress.
- Layout and navigation: the former Plans destination is replaced by a fixed three-item `TRAINING / PROGRESS / PROFILE` dock. Authentication is contained inside Profile, so Training and local Progress remain reachable as a guest.
- Color and component language: near-black backgrounds, charcoal selection cards, peach labels, red selected borders, square primary actions, and restrained corner radii match the existing app.
- Content: no age, birthday, gender, weight, or injury fields were added. The profile surface summarizes training preferences without duplicating Progress charts or history.
- Accessibility: provider actions, tabs, radio selections, multi-select equipment, account actions, and confirmation controls expose semantic roles and selected/checked states.

**Flow and behavior verified**
- Guest Profile renders Apple and Google actions and leaves the bottom navigation available.
- Missing Firebase configuration produces an inline, dismissible error without blocking Training or Progress.
- New-user setup advances through identity, training, and routine/confirmation states. Shadowboxing is mutually exclusive with bag equipment, while bag, gloves, and wraps support multi-select.
- Completing setup preserves the existing on-device history; the rendered Profile showed the same 32 workouts, 52 rounds, 3-day streak, and 2H 32M of training time.
- The signed-in overview exposes Edit Fighter Profile and Account & Data; the latter includes connected provider, sync, Free membership, sign out, and delete-account confirmation states.
- Account deletion reauthenticates with the connected Apple/Google provider before deleting Firestore, Storage, or local account-scoped history.

source visual truth paths: `/Users/karanbangia/go/src/github.com/boxing-coach/.codex/design-qa/dashboard/setup-final-390x844.png` and `/Users/karanbangia/go/src/github.com/boxing-coach/.codex/design-qa/progress/progress-overview-v2-top-430x932.png`
implementation screenshot paths: `/Users/karanbangia/go/src/github.com/boxing-coach/.codex/design-qa/profile/profile-auth-app-wait.png`, `/Users/karanbangia/go/src/github.com/boxing-coach/.codex/design-qa/profile/profile-setup-1-keyboard-dismissed.png`, `/Users/karanbangia/go/src/github.com/boxing-coach/.codex/design-qa/profile/profile-setup-2-simulator.png`, `/Users/karanbangia/go/src/github.com/boxing-coach/.codex/design-qa/profile/profile-setup-3-simulator.png`, and `/Users/karanbangia/go/src/github.com/boxing-coach/.codex/design-qa/profile/profile-overview-simulator.png`
viewport: iPhone 16e simulator, iOS 26.3
primary interactions tested: Profile tab navigation, provider error state, all three setup steps, goal and equipment selection, setup completion, local-history preservation, and signed-in profile rendering.
validation: TypeScript passed, Expo iOS export passed, CocoaPods installed, and the native Xcode simulator build completed with 0 errors.
final result: passed

## Native iOS training-log and tactile-controls pass — 2026-07-14

**Findings**
- No actionable visual P0/P1/P2 findings on the iPhone 16e simulator.

**What was verified**
- The app was built and installed natively on the iPhone 16e simulator; the iOS bundle includes the haptics module and launches without the earlier module-resolution error.
- `Stats` now renders a high-contrast Training Log from persisted workout history: the latest session, rounds today, all-time volume, bag time, streak, and recent sessions are readable without leaving the screen.
- The Training Log's `Build Workout` action returns to the setup surface, and the Audio Cues switch changes state and was restored after testing.
- The shared press treatment is used across setup, bottom navigation, prep, active workout, rest, and completion controls. Each uses a short press-in/spring-out motion and an appropriately weighted native haptic request.
- Explicit button, radio, switch, and tab semantics are provided where the mobile controls expose an action or selected state.

**Native visual evidence**
- capture: `.codex/design-qa/native/training-log-1170x2532.png`
- device: iPhone 16e simulator, iOS 26.3, 1170 × 2532 native capture
- state: persisted workout history present; Stats tab selected

**Follow-up polish**
- Haptic strength must still be felt and tuned on a physical iPhone; the Simulator validates the native module, interactions, and visual motion path but does not reproduce physical feedback.

## Previous QA: workout volume modal

**Findings**
- No actionable P0/P1/P2 findings.

**Open Questions**
- The source visual is the workout screen before the volume modal opens, so modal layout fidelity was judged against the provided screen's style system rather than an existing modal reference.

**Implementation Checklist**
- Added a centered volume modal opened from the `VOL` control.
- Added a blurred, dimmed workout-screen backdrop behind the modal.
- Updated the control to a horizontal volume bar with direct touch/drag control, volume icons on both sides, and a stable single-line percent readout.
- Removed modal, mute-button, and slider border lines from the volume modal.
- Kept mute and incremental volume controls functional.

**Follow-up Polish**
- P3: Native iOS device testing can tune the exact blur intensity if the physical simulator differs from the Expo web preview.

source visual truth path: `/var/folders/4g/hd8s523s2zzgn1g5w1mf_1qh0000gn/T/TemporaryItems/NSIRD_screencaptureui_C2bDpr/Screenshot 2026-07-09 at 5.06.19 PM.png`
implementation screenshot path: `/Users/karanbangia/go/src/github.com/boxing-coach/.design-qa/mobile-volume-modal-horizontal.png`
viewport: `365x686`
state: mobile workout screen with `VOL` modal open after dragging volume to `100%`
full-view comparison evidence: opened the provided screenshot and the implementation capture side by side through local image inspection.
focused region comparison evidence: focused region was not needed because the full viewport clearly shows the horizontal bar, icons, borderless modal treatment, and stable readout.
patches made since previous QA pass: replaced the vertical control with a horizontal bar, removed border lines, added Expo vector volume icons, removed the thumb side-line artifact, and verified `100` stays on one line.
final result: passed

# Timer-Only Countdown Ring Design QA

- Source visual truth: `/var/folders/4g/hd8s523s2zzgn1g5w1mf_1qh0000gn/T/TemporaryItems/NSIRD_screencaptureui_5bqBIB/Screenshot 2026-07-21 at 6.45.36 PM.png`, plus the approved countdown-ring direction in the task.
- Implementation screenshot: `/tmp/boxing-coach-ring-qa/implementation-round-2.png`
- Combined comparison: `/tmp/boxing-coach-ring-qa/comparison.png`
- Viewport: iPhone 16e simulator, 390 x 844 logical points.
- State: Round 2, coaching instructions disabled, active workout.

## Full-view comparison evidence

The implementation retains the source header, round hierarchy, typography, background, and bottom controls. The formerly empty timer region now contains a 250-280 point responsive tick ring around the timer. The remaining red ticks drain clockwise from 12 o'clock, and the round block has been pulled closer to the ring without colliding with it.

## Focused region comparison evidence

A separate crop was not needed: the high-resolution full-view comparison makes the timer typography, ring ticks, spacing, colors, labels, and controls clearly readable.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Typography: existing Anton and Barlow Semi Condensed hierarchy is preserved; timer and round labels remain legible and unclipped.
- Spacing and layout: the ring gives the center appropriate visual weight while preserving clear separation from the header and controls.
- Colors and tokens: active, inactive, and final-ten-second tick states use existing theme colors.
- Image quality and assets: no raster imagery or custom decorative assets are required for this functional progress indicator.
- Copy and content: no workout labels or control copy changed.

## Interaction checks

- Combo Instructions off forces Audio Cues off and disables the audio switch.
- Starting the workout renders the ring only in the timer-only state.
- Advancing from Round 1 through rest to Round 2 keeps the ring and timer aligned.
- The remaining-tick segment updates with the countdown.
- The coached workout branch remains unchanged in code and continues to render its existing timer, combination panel, and equalizer.

## Comparison history

- Initial QA pass: passed. No post-comparison P0/P1/P2 fixes were required.

## Follow-up polish

- P3: confirm the brighter final-ten-second ticks during a full timed device run; the state is implemented but was not held open for the complete three-minute countdown during visual QA.

final result: passed
