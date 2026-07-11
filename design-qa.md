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
