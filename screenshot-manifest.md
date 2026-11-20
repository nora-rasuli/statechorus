# StateChorus Screenshot Manifest

**Selected:** 2026-11-19
**Source:** Verified Playwright production-preview evidence from functional
release candidate 1.1.

Retained source screenshots are immutable during the normal `npm run verify` gate.
They are refreshed only with the explicit `npm run evidence:screenshots` command,
reviewed, and then used to regenerate presentation assets. This prevents a normal
test run from silently replacing release evidence with run-dependent PNG bytes.

The setup image shows the real-trace entry path; review screenshots use the
optional bundled sample. Screenshots demonstrate visible state only. Behavioral
claims rely on paired tests, exports, and independent browser traces.

## Retained sources

| Use | Evidence path | Dimensions | Required framing |
| --- | --- | ---: | --- |
| Product entry | `evidence/screenshots/desktop/setup.png` | 1280×2572 | Keep the capture-helper and import controls above the optional sample. |
| Corrected review | `evidence/screenshots/desktop/fixed-review.png` | 1280×5324 | Keep the local-result and native-verification boundary together. |
| Broken review | `evidence/screenshots/desktop/broken-review.png` | 1280×5660 | Keep the three named findings and raw sequence pointers. |
| Mobile review | `evidence/screenshots/mobile/fixed-review-360x800.png` | 360×8403 | Use focused crops; never shrink the full page into unreadable text. |
| Approval focus | `evidence/screenshots/desktop/keyboard-focus.png` | 1280×800 | Keep the approval context and visible focus indicator. |
| Rerun focus | `evidence/screenshots/desktop/keyboard-rerun-focus.png` | 1280×2753 | Use only with the keyboard-regression repair story. |
| Inconclusive state | `evidence/screenshots/failure-states/inconclusive.png` | 1280×800 | Label as deterministic failure handling, not a production incident. |

## Generated presentation assets

Run `sh scripts/create-presentation-assets.sh` from the project root. Outputs are
deterministic exact-pixel crops or composites; no UI text is generated.

| Output | Source | Crop / composition | Dimensions |
| --- | --- | --- | ---: |
| `presentation-assets/setup-overview.png` | setup | x=0, y=80, w=1280, h=1250 | 1280×1250 |
| `presentation-assets/broken-findings.png` | broken review | x=0, y=2000, w=1280, h=1500 | 1280×1500 |
| `presentation-assets/fixed-result.png` | fixed review | x=0, y=2000, w=1280, h=1000 | 1280×1000 |
| `presentation-assets/mobile-depth.png` | mobile review | x=0, y=4200, w=360, h=3000 | 360×3000 |
| `presentation-assets/keyboard-approval-focus.png` | approval focus | full image | 1280×800 |
| `presentation-assets/keyboard-rerun-focus.png` | rerun focus | x=0, y=520, w=1280, h=1650 | 1280×1650 |
| `presentation-assets/inconclusive-recovery.png` | inconclusive | full image | 1280×800 |
| `presentation-assets/social-product-intro.png` | setup | 1280×470 crop retaining product name, hero, and real-input promise | 1280×470 |
| `presentation-assets/social-result-boundary.png` | fixed review | 1280×170 crop retaining result and native-review wording | 1280×170 |
| `presentation-assets/social-preview.png` | product intro + result boundary | vertical stack, no scaling | 1280×640 |

## Recommended set

- **README:** `fixed-result.png`, followed by `setup-overview.png` when explaining
  the real-input workflow.
- **Portfolio:** `setup-overview.png`, `broken-findings.png`, and
  `fixed-result.png`; add the keyboard or mobile crop only when its point is
  discussed.
- **GitHub social preview:** `social-preview.png`; it must show the StateChorus
  name/product framing and the exact native-verification boundary.

## Exclusions

- Do not present sample screenshots as customer, user, or production evidence.
- Do not add customer logos, private conversation content, screen-reader badges,
  WCAG marks, or invented analytics.
- Do not caption the corrected result “accessible,” “compliant,” or “safe.”
