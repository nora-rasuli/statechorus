# Safe and unsupported claim ledger

**Reviewed:** 2026-11-19
**Requirement:** `CLAIM-01`

## Safe with retained evidence

- StateChorus is a self-directed concept using bundled synthetic fixtures.
- The implementation models twelve typed AI interaction states and executes the exact seven-state demo path.
- `BrowserDomProvider@1.1.0` compares deterministic event order, DOM focus, keyboard reachability, transcript identity/content, and live-region mutations queried from the rendered synthetic replay surface; it has no fixture input.
- The eight-fixture corpus completed 24 browser attempts, detected 7/7 seeded rendered failures, produced 0 fixed-control false failures, and emitted identical normalized outputs across three executions per fixture.
- The measured local test, build, timing, bundle, axe, Lighthouse, contrast-token, reflow, reduced-motion, console, network, provenance, audit, and license results are those retained in this evidence directory.
- Unsupported native behavior is routed to native verification.

## Not supported

- Native speech, NVDA, VoiceOver, JAWS, TalkBack, screen-reader success, or native/local correlation.
- Disabled-user usability, efficiency, or experience.
- WCAG conformance, certification, compliance, legal safety, or a safe release gate.
- Prevention of inaccessible releases.
- Customer interviews, validation, adoption, pilots, payment, demand, ROI, time savings, business impact, or commercial viability.
- Model accuracy, quality, latency, or cost; no model is used.
- An independent validation pass for the repaired candidate; fresh Stage 03 verification remains required.
- Public production performance, reliability, compatibility, or support beyond the exact recorded environments.
- Trademark, package, repository, or domain ownership/clearance.
