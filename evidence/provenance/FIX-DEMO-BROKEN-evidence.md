# StateChorus evidence — FIX-DEMO-BROKEN

- Result: `contract_violation`
- Result label: 3 local contract violations found.
- Contract: `CONTRACT-AI-TURN-001@1.0.0` (fnv1a64:0598e74b9ba4bbfb)
- Input: Sample fixture — `FIX-DEMO-BROKEN@1.0.0` (fnv1a64:d592f1b28e93f093)
- Source: Guided broken fixture
- Provider: BrowserDomProvider@1.1.0 — local_browser_observable
- Capture browser: Chrome 159.0.8154.6
- Capture viewport: 1280×800; reduced motion: false
- Analysis browser: Chrome 159.0.8154.6
- Analysis viewport: 1280×800; reduced motion: false
- Run / attempt: `run-fix-demo-broken-001` / `attempt-001`

## Findings

- **episode-budget-exceeded** (high): Streaming emitted more than one live-region mutation; the local episode budget was exceeded. Evidence sequences: 14, 17, 19, 21, 23.
- **duplicate-stall-episode** (high): The equivalent stalled status was emitted more than once. Evidence sequences: 26, 27, 28, 29.
- **unexpected-focus-change** (high): A system-caused DOM focus change occurred when approval appeared. Evidence sequences: 10.

## Authority boundary

Local browser evidence does not represent native screen-reader output, disabled-user experience, or WCAG conformance. Native assistive-technology review remains required.

## Integrity

`fnv1a64:a5595b0f3177f687`
