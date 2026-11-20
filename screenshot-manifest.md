# StateChorus Screenshot Manifest

**Selected:** 2026-11-19

**Source:** Verified Playwright production-preview evidence from package 1.0
**Rule:** Presentation derivatives are deterministic exact-pixel crops/composites.
The retained source images below remain unaltered and must not be replaced without
rerunning the relevant check.

All UI content shown is synthetic. Screenshots demonstrate visible state only; the
behavioral claims rely on paired tests, exports, and independent browser traces.

| Use                                   | Exact evidence path                                     | Source dimensions | Caption                                                                                                                                           | Alt text                                                                                                                                            | Crop guidance                                                                                                                                                                                                                                                   |
| ------------------------------------- | ------------------------------------------------------- | ----------------: | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| README hero / primary portfolio image | `evidence/screenshots/desktop/fixed-review.png`         |         1280×4752 | The corrected equivalent has no local contract finding and still routes the release to native assistive-technology review.                        | StateChorus corrected review showing a local-observable pass, the native-verification requirement, and the expected-versus-observed timeline.       | Create a 1280×800–960 crop beginning at the “Review local observable evidence” heading. Include the full green result card and authority-boundary panel; include the first timeline rows only if space permits. Do not crop out “native verification required.” |
| Case-study broken state               | `evidence/screenshots/desktop/broken-review.png`        |         1280×5088 | The broken fixture groups three local contract violations and links each explanation to raw event sequences.                                      | StateChorus broken review listing excessive streaming mutations, duplicate stalled status, and unrequested DOM focus movement.                      | Crop from the review heading through all three finding cards. Keep the “3 local contract violations” summary and at least one raw sequence pointer visible. Do not imply the synthetic defects came from production.                                            |
| Setup / demo start                    | `evidence/screenshots/desktop/setup.png`                |         1280×2100 | The no-sign-up entry establishes the synthetic scenario, seven-state contract, and local/native/human authority before the run starts.            | StateChorus setup page showing the synthetic disclosure, seven-state contract, broken and corrected fixture options, and Run broken fixture button. | Crop the hero plus the first setup panel. Retain the synthetic disclosure, full contract path, and Run action. Avoid a hero-only crop that hides the product workflow.                                                                                          |
| Mobile / responsive evidence          | `evidence/screenshots/mobile/fixed-review-360x800.png`  |          360×7277 | At 360 pixels wide, the fixed review preserves the result, authority boundary, timeline, provenance, and export controls in a single-column flow. | Mobile StateChorus corrected review with stacked state timeline, native-verification boundary, provenance, and evidence export controls.            | Use two crops if needed: result + authority boundary, then stacked timeline + export. Never scale the entire 7277-pixel image into unreadable thumbnail text.                                                                                                   |
| Keyboard approval focus               | `evidence/screenshots/desktop/keyboard-focus.png`       |          1280×800 | The synthetic tool approval is reachable in ordinary keyboard order with a visible focus indicator.                                               | StateChorus approval checkpoint with visible keyboard focus on Approve synthetic log access once.                                                   | Keep the approval card, focused control, replay heading, and state-sequence context. Do not crop to the focus ring alone.                                                                                                                                       |
| Keyboard rerun focus / audit story    | `evidence/screenshots/desktop/keyboard-rerun-focus.png` |         1280×2282 | After the audit repair, the fixed-equivalent rerun retains the canonical Run target and leaves approval as the next ordinary Tab stop.            | StateChorus broken-review rerun with visible focus retained on the persistent Run fixed fixture control.                                            | Use only in the validation/rework section. Crop enough surrounding review context to distinguish the persistent Run control from the approval card; pair with the independent focus-trace text.                                                                 |
| Failure/recovery supporting image     | `evidence/screenshots/failure-states/inconclusive.png`  |          1280×800 | A missing required local signal becomes inconclusive and routes to inspection/native review instead of a false pass.                              | StateChorus inconclusive result with a scoped recovery action and no local-pass conclusion.                                                         | Optional depth image. Include the result label, reason, and recovery action. Never present deterministic test injection as a naturally observed production failure.                                                                                             |

## Generated presentation derivatives

Run `sh scripts/create-presentation-assets.sh` from the project root to recreate
these files. `sips --cropOffset` takes offsets as top/left (`y`, then `x`); the
table records them as conventional `x, y, width, height`. All outputs were opened
and visually inspected on 2026-11-19. No text, UI pixels, or claims were generated.

| Use                           | Retained source                                                     | Exact crop / composition                                                                       | Output dimensions | Output path                                           |
| ----------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------: | ----------------------------------------------------- |
| Setup overview                | `evidence/screenshots/desktop/setup.png` (1280×2100)                | `x=0, y=80, w=1280, h=1250`                                                                    |         1280×1250 | `presentation-assets/setup-overview.png`              |
| Broken findings               | `evidence/screenshots/desktop/broken-review.png` (1280×5088)        | `x=0, y=2000, w=1280, h=1500`                                                                  |         1280×1500 | `presentation-assets/broken-findings.png`             |
| Fixed result                  | `evidence/screenshots/desktop/fixed-review.png` (1280×4752)         | `x=0, y=2000, w=1280, h=1000`                                                                  |         1280×1000 | `presentation-assets/fixed-result.png`                |
| Mobile result and authority   | `evidence/screenshots/mobile/fixed-review-360x800.png` (360×7277)   | `x=0, y=3000, w=360, h=1400`                                                                   |          360×1400 | `presentation-assets/mobile-result.png`               |
| Mobile timeline/export depth  | `evidence/screenshots/mobile/fixed-review-360x800.png` (360×7277)   | `x=0, y=4200, w=360, h=3000`                                                                   |          360×3000 | `presentation-assets/mobile-depth.png`                |
| Keyboard approval focus       | `evidence/screenshots/desktop/keyboard-focus.png` (1280×800)        | `x=0, y=0, w=1280, h=800`                                                                      |          1280×800 | `presentation-assets/keyboard-approval-focus.png`     |
| Keyboard rerun focus          | `evidence/screenshots/desktop/keyboard-rerun-focus.png` (1280×2282) | `x=0, y=520, w=1280, h=1650`                                                                   |         1280×1650 | `presentation-assets/keyboard-rerun-focus.png`        |
| Inconclusive recovery         | `evidence/screenshots/failure-states/inconclusive.png` (1280×800)   | `x=0, y=0, w=1280, h=800`                                                                      |          1280×800 | `presentation-assets/inconclusive-recovery.png`       |
| Social disclosure component   | `evidence/screenshots/desktop/setup.png` (1280×2100)                | `x=0, y=760, w=1280, h=160`                                                                    |          1280×160 | `presentation-assets/social-synthetic-disclosure.png` |
| Social fixed-result component | `evidence/screenshots/desktop/fixed-review.png` (1280×4752)         | `x=0, y=2000, w=1280, h=480`                                                                   |          1280×480 | `presentation-assets/social-fixed-result.png`         |
| Repository social preview     | The two component crops above                                       | Exact-pixel vertical stack: disclosure at `x=0, y=0`; fixed result at `x=0, y=160`; no scaling |          1280×640 | `presentation-assets/social-preview.png`              |

The social preview deliberately retains the full synthetic-fixture disclosure and
the exact “Local observable checks passed — native verification required” wording.
Its component outputs remain beside the composite so a verifier can compare pixels
and crop provenance directly.

## Recommended set by surface

### GitHub README

1. `presentation-assets/fixed-result.png` for the result and authority boundary.
2. `presentation-assets/broken-findings.png` for the summary and three findings.
3. Optional `presentation-assets/keyboard-approval-focus.png` beside the
   accessibility section.

### Portfolio case study

1. `presentation-assets/setup-overview.png` for the entry and authority model.
2. `presentation-assets/broken-findings.png` for diagnosis.
3. `presentation-assets/fixed-result.png` for the corrected outcome.
4. `presentation-assets/keyboard-rerun-focus.png` for the independent-audit
   correction.
5. `presentation-assets/mobile-result.png` and, where space permits,
   `presentation-assets/mobile-depth.png` for responsive depth.

### Repository social preview

Use `presentation-assets/social-preview.png` (1280×640). It is already reviewable
locally and publication-ready as a repository-settings upload; it does not need to
move under `docs/` or `public/` because the application does not serve it. Keep both
component crops and the generation scripts in the release package for provenance.

## Exclusions

- Do not use screenshots from the preserved nested `app/` directory; the
  authoritative build is the project root.
- Do not use raw JSON as the primary image; it is depth evidence, not the first
  product impression.
- Do not add customer logos, production conversation content, screen-reader badges,
  WCAG marks, or invented analytics.
- Do not caption the corrected result “accessible,” “compliant,” or “safe,” and do
  not convert it into a native assistive-technology success claim.
