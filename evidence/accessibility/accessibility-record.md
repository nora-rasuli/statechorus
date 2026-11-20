# Accessibility implementation record

**Captured:** 2026-11-19

**Requirements:** `UX-03`, `A11Y-01`, `A11Y-02`, `A11Y-03`, `A11Y-04`, `HUMAN-01`
**Production route:** `/demo?fixture=FIX-DEMO-BROKEN` and fixed equivalent

## Reproduced local checks

- Keyboard-only corrected path passed: run control retained focus; approval was reached by ordinary Tab order; activation returned focus to the synthetic composer; completion did not focus the review; **Review result** focused its heading on request; reset returned focus to the run control.
- The bounded Stage 04 rerun regression passed: from broken review, activating **Run fixed fixture** moves focus to the persistent setup run control before the review button unmounts; focus never falls to `BODY`; one Tab reaches approval; the established composer, review-heading-on-request, and reset targets remain intact.
- Pointer activation follows the same stable rerun target, and the complete broken-to-fixed task also passed with reduced-motion emulation.
- The deliberately broken fixture moved DOM focus to the synthetic transcript and exported `unexpected-focus-change`; the corrected equivalent did not.
- One hidden atomic `role="status"` region carries concise phase/result text. Transcript content is not live. The invalid-fixture summary alone uses `role="alert"`.
- Native landmarks, heading order, buttons, fieldset/radios, lists, details, definition lists, labeled code preview, and download controls were exercised. The state-sequence rail is a labeled visual group rather than a nested complementary landmark.
- axe 4.10.1 reported zero violations in setup and completed review states; the prior `landmark-complementary-is-top-level` finding is absent.
- Lighthouse 12.8.2 accessibility score: 1.00 on the production build profile. This score is tool output, not WCAG conformance.
- Required viewports passed without app-level horizontal overflow: 360×800, 768×1024, and 1280×800.
- 200%/400% zoom-equivalent CSS viewport checks at 640 and 320 CSS pixels retained the run control without app-level horizontal overflow.
- Reduced-motion emulation completed the full path; computed root scroll behavior was `auto`; CSS removes nonessential animation/transition duration.
- No typewriter animation is implemented.
- Measured token ratios: body 15.64:1, muted 6.03:1, accent 10.75:1, primary button 7.85:1, warning 6.45:1, focus indicator 6.5:1.

## Evidence

- `axe-results.json`
- `contrast.json`
- `../screenshots/desktop/keyboard-focus.png`
- `../screenshots/desktop/keyboard-rerun-focus.png`
- `../screenshots/mobile/fixed-review-360x800.png`
- `../../tests/e2e/statechorus.spec.ts`

## Authority limitation

Native screen-reader checks performed: **None**. Disabled-user testing performed: **None**. The checks above establish only the recorded DOM, keyboard, focus, semantics, contrast-token, reflow, motion, and automated-rule facts. They do not establish spoken output, usability for a disabled person, WCAG conformance, legal compliance, or a safe release gate.
