## Dashboard setup typography and copy — 2026-07-13

**Findings**
- No actionable P0/P1/P2 findings.

**Required fidelity surfaces**
- Fonts and typography: `Difficulty`, `Round Duration`, and `Rounds` all render in Space Grotesk Bold at 14px with the same line height, letter spacing, color, and uppercase treatment. Control values use Anton, while secondary explanatory copy uses Archivo Narrow. This is a consistent three-level type hierarchy rather than a mix of styles within the same level.
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
