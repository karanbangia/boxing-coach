# Progress Timeline Design QA

- Source visual truth: https://www.figma.com/design/RNo0jPZelXHBSSxucNPfwm
- Source status: Figma draft exists, but its canvas is blank because the Starter-plan MCP call limit blocked the first write.
- Implementation screenshot: /Users/karanbangia/.codex/visualizations/2026/07/21/019f8514-414b-7082-9b65-5b817c648a90/progress-timeline-audit/04-redesigned-timeline.png
- Previous implementation screenshot: /Users/karanbangia/.codex/visualizations/2026/07/21/019f8514-414b-7082-9b65-5b817c648a90/progress-timeline-audit/01-history-timeline.png
- Viewport: iPhone 16e, 390 x 844 logical points (946 x 2048 raster capture)
- State: Dark theme, seeded history with three Basic workouts across two dates, scrolled to the History section.

## Full-view comparison evidence

The previous native capture and revised native capture were both opened and inspected. The revised implementation visibly resolves the approved audit findings: repeated dates are grouped, the duplicate icon tile is removed, timeline nodes align with date headers, the latest state has a text label, and each row exposes time, rounds, duration, and punches.

A fidelity comparison against the intended Figma frame could not be performed because the Figma frame could not be created after the account tool limit was reached.

## Focused region comparison evidence

The timeline occupies most of the revised capture and all critical details are legible at the captured scale, so a separate crop was not needed. Exact Figma-to-native spacing, typography, and colour comparison remains unavailable until the Figma canvas can be written and captured.

## Required fidelity surfaces

- Fonts and typography: Native implementation uses the existing Anton, Barlow Semi Condensed SemiBold, and Archivo Narrow families with the project's 1.4 line-height ratio. Figma comparison blocked.
- Spacing and layout rhythm: The native capture shows grouped date sections, a 32-point rail, 12-point rail-to-content gap, 8-point row gaps, and 72-point minimum row height. Figma comparison blocked.
- Colors and visual tokens: Native implementation uses the existing Boxing Coach theme tokens. Figma token binding comparison blocked.
- Image quality and asset fidelity: No raster image assets are part of this component. Existing Ionicons remain code-native icons.
- Copy and content: Date, latest state, difficulty, completion time, rounds, duration, and punch count are all present in the native capture.

## Comparison history

### Iteration 1

- Earlier findings: repeated dates, duplicated workout icons, top-aligned oversized markers, low information density, and colour-only latest state.
- Fixes made: grouped workouts by date; moved the workout icon to the 32-point timeline node; added a LATEST badge; increased row typography; added time, duration, punch count, and chevron; connected date groups with a one-point rail.

### Iteration 2

- Post-fix evidence: `04-redesigned-timeline.png` shows the approved structural changes with no visible clipping, overlap, horizontal overflow, or hidden primary content.
- Remaining blocker: no rendered Figma source frame exists for a direct source-versus-implementation comparison.

## Findings

- [Blocked] Figma source frame unavailable
  - Location: Figma draft linked above.
  - Evidence: the file was created, but the Starter-plan MCP call limit rejected the first token write.
  - Impact: exact visual fidelity cannot be proven against the requested Figma design.
  - Fix: resume the Figma foundation, component, and screen creation after the account limit resets or is increased, then rerun this comparison.

## Implementation checklist

- [x] Group repeated workout dates.
- [x] Center and reduce timeline nodes.
- [x] Remove the duplicate card icon.
- [x] Add visible latest-state copy.
- [x] Add time, rounds, duration, punches, and navigation affordance.
- [x] Type-check the mobile app.
- [x] Build and capture the iOS simulator implementation.
- [ ] Create and capture the matching Figma frame.
- [ ] Run direct Figma-to-native visual comparison.

final result: blocked
