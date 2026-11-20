# Performance and timing record

**Captured:** 2026-11-19

**Requirement:** `PERF-01`
**Environment:** macOS/Darwin 24.6.0; Node 20.19.5; local Vite production preview; Playwright Chromium 159.0.8154.6 for E2E; Lighthouse 12.8.2 / Headless Chrome 157 profile

## Measurements

| Measurement                                      |                        Result | Frozen budget / context                               |
| ------------------------------------------------ | ----------------------------: | ----------------------------------------------------- |
| Guided broken-to-fixed loop after A11Y-01 repair |                      2,836 ms | `<60,000 ms`                                          |
| Clean-install full repair `npm run verify`       |                  57.80 s real | `<90 s`                                               |
| Final post-hardening `npm run verify`            |                  53.83 s real | `<90 s`                                               |
| Final post-A11Y-01 `npm run verify`              |                  54.29 s real | `<90 s`                                               |
| Production build                                 |     73 ms in final timed gate | Recorded command output                               |
| JS bundle                                        | 183.80 kB raw / 57.96 kB gzip | Measured Vite output                                  |
| CSS bundle                                       |   12.42 kB raw / 3.48 kB gzip | Measured Vite output                                  |
| Retained pre-repair Lighthouse performance       |                          1.00 | Historical profile; not re-run for the bounded repair |
| Retained pre-repair Lighthouse accessibility     |                          1.00 | Historical automated profile only; not conformance    |
| Retained pre-repair Lighthouse best practices    |                          1.00 | Historical production-local profile                   |
| First Contentful Paint                           |                  1,213.405 ms | Lighthouse simulated profile                          |
| Largest Contentful Paint                         |                  1,213.405 ms | Lighthouse simulated profile                          |
| Total Blocking Time                              |                          0 ms | Lighthouse simulated profile                          |
| Cumulative Layout Shift                          |                             0 | Lighthouse simulated profile                          |

## Method and limitations

The guided duration is an automated Playwright path, not a moderated first-time-user study. Lighthouse used a local production preview before the bounded Stage 03 repair and is retained only as historical context; it is not post-repair evidence. Results are not production-SLA, browser-support, accessibility, or reliability claims. Wall-clock metadata is never used for fixture comparison.

Raw evidence: `guided-demo.json`, `lighthouse.json`, and the final verification ledger in `../../implementation-report.md`.
