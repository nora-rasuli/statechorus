# ADR-001 — Local observable evidence and native/human authority

**Status:** Accepted for package 1.0

**Date:** 2026-11-19
**Requirements:** `P-01`, `ENG-01`, `ENG-02`, `ENG-03`, `HUMAN-01`, `PROV-01`, `PRIV-01`

## Context

StateChorus must diagnose deterministic browser-observable regressions in a synthetic AI-turn lifecycle without implying that DOM mutations represent native assistive-technology speech, disabled-user experience, WCAG conformance, or release safety.

## Decision

The shipped provider boundary is `ObservableProvider`. Package 1.0 includes only `BrowserDomProvider`, whose capabilities are fixture phase, event order, DOM focus, keyboard reachability, transcript identity/content, and live-region mutations. Its unsupported conclusions are typed as `native_speech`, `disabled_user_experience`, and `wcag_conformance`.

Fixture flags alter only the rendered React replay surface. `BrowserDomProvider@1.1.0` neither imports nor accepts a fixture definition: on each controlled render it queries the actual state marker, live-status revision/text, active-element changes, approval control, transcript node, and persisted status DOM. It assigns stable sequence numbers and virtual time to those captured facts. Pure modules then normalize events, reduce semantic episodes, evaluate contract invariants, and serialize separate raw and normalized evidence. Result types do not contain a native-pass or conformance-pass state.

The fixed outcome is exactly “Local observable checks passed — native verification required.” Reviewer annotation can only choose `not_ready` or `requires_native_verification`; it cannot mutate captured evidence or declare a native/WCAG pass.

## Consequences

- Local results can reject a seeded contract mismatch or route a case onward.
- Missing signals become `inconclusive`; harness errors become `invalid_run`; invalid data becomes `invalid_fixture`; cancellation becomes `interrupted`.
- Native NVDA, VoiceOver, JAWS, disabled-user testing, and conformance decisions remain unrun and authoritative future work.
- Export is blocked when required lineage is absent or the reproducible contract, fixture, or artifact hash is invalid.
- The MVP remains static, synthetic, no-auth, no-network at runtime, and $0 in required services/model cost.

## Rejected alternatives

- A simulated speech layer: rejected because it would blur local mutation evidence with native output.
- A backend/native bridge: rejected because it expands cost, privacy, and authority beyond package 1.0.
- A single generic pass/fail: rejected because it would collapse invalid, inconclusive, interrupted, and native-required outcomes.
