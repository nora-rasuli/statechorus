# StateChorus Public Claim Ledger

**Candidate:** Functional release 1.1 · 2026-11-19
**Approval source:** the committed source, public evidence package, and dated local
release gate. A fresh production decision must be recorded before deployment
claims are published.

This ledger defines what the README, portfolio, repository metadata, and launch
materials may say. Every claim is scoped to its actual evidence.

| ID | Approved public claim | Evidence | Boundary |
| --- | --- | --- | --- |
| `CL-01` | StateChorus accepts a JSON trace captured from a user's local or staging AI interface. | `public/statechorus-playwright-capture.ts`; cross-context import in `tests/e2e/statechorus.spec.ts`. | Requires explicit `data-statechorus-*` instrumentation and Playwright; it does not crawl arbitrary URLs. |
| `CL-02` | Imported traces are parsed and evaluated locally in the browser. | Source review; zero post-load/external requests in audited import flows. | The static app does not upload traces; users control the hosting environment and must remove sensitive data before capture. |
| `CL-03` | Malformed and semantically incomplete imports fail visibly without sample substitution. | Unit/E2E negative matrix in `tests/unit/imported-trace.test.ts` and `tests/e2e/statechorus.spec.ts`. | Covers the tested schema and contract path, not every possible hostile file. |
| `CL-04` | The current contract requires the complete path `idle → submitted → thinking → tool_call → approval → streaming → stalled → complete`. | `src/engine/evaluate.ts`; fresh negative-path verification. | This is a product contract, not a universal model of every AI interface. |
| `CL-05` | StateChorus compares expected and observed state, focus, approval, transcript, and live-region signals. | Typed capture schema, evaluator, and verifier-owned primary job. | Browser-observable evidence only; no native speech or lived usability inference. |
| `CL-06` | JSON and Markdown exports preserve trace identity, capture provider/environment, analysis environment, events, findings, result, and recomputable integrity hashes. | Cross-context downloads and hash assertions in `tests/e2e/statechorus.spec.ts` and `tests/unit/evidence.test.ts`. | Integrity is tamper-evidence for the serialized bodies, not identity authentication or legal chain of custody. |
| `CL-07` | User-trace exports have trace-native identity and no fixture lineage; bundled sample exports preserve truthful fixture lineage. | Focused provenance assertions in `tests/unit/evidence.test.ts` and `scripts/provenance-review.ts`. | Applies to schema 1.1.0 and evidence schema in this candidate. |
| `CL-08` | A local clean result is labeled “native verification required.” | Browser review and serializer tests. | It is not a screen-reader pass, WCAG conformance decision, compliance statement, or safe-release certification. |
| `CL-09` | The bundled broken/fixed sample is optional and uses the same evaluator and review UI. | Corpus and E2E suite; visible setup flow. | Sample content and results are synthetic and must not be described as customer or production evidence. |
| `CL-10` | Eight sample fixtures ran three times each in Chromium; all seven seeded rendered failures were detected and the corrected control produced zero findings. | `evidence/ai-evaluation/eval-01-report.json`; 24/24 corpus attempts. | Deterministic local corpus, not model accuracy or real-world defect prevalence. |
| `CL-11` | The release gate passed 42/42 Vitest checks, 24/24 corpus attempts, and 19/19 Playwright checks on 2026-11-19. | Committed unit, corpus, and Playwright suites plus the generated public evidence records. | Dated local candidate evidence; production must be rechecked after deploy. |
| `CL-12` | Audited setup and review states had zero serious or critical automated accessibility violations. | axe-core result files and Playwright audit. | Automated/local evidence is not WCAG conformance or disabled-user testing. |
| `CL-13` | The candidate build measured 194.69 kB JavaScript raw / 60.96 kB gzip and 13.44 kB CSS raw / 3.65 kB gzip. | Clean post-repair build. | Local Vite build measurement, not production performance or an SLA. |
| `CL-14` | The app requires no account, API key, backend, database, or remote model call. | Architecture/source review and runtime network capture. | The separate Playwright capture environment is operated by the user. |
| `CL-15` | The work is an independent product designed and engineered by Nora Rasuli. | Repository history, package, case study, and implementation evidence. | No customer, adoption, revenue, ROI, production-impact, or commercial-validation claim is approved. |

## Claims withheld

Do not publish positive claims about:

- native NVDA, VoiceOver, JAWS, TalkBack, or other assistive-technology output;
- disabled-user usability, preference, efficiency, confidence, or task success;
- WCAG conformance, certification, compliance, legal safety, or a safe release;
- production reliability, compatibility, traffic, support, or availability until a
  fresh production verifier records them;
- customer discovery, pilots, adoption, payment, revenue, ROI, time savings, or
  business impact;
- model accuracy, quality, latency, or cost optimization—the product uses no model;
- trademark ownership or legal clearance.

## Publication rule

Any changed metric, workflow, screenshot, or production statement requires a dated
source, method, environment, limitation, and fresh verifier decision. A local gate
cannot authorize a deployment claim.
