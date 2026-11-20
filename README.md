# StateChorus

> StateChorus helps accessibility QA engineers replay an AI-interface state contract, diagnose browser-observable regressions, and carry evidence into native assistive-technology review.

**Try it without an account:** [open the guided demo](https://statechorus.vercel.app/demo?fixture=FIX-DEMO-BROKEN).
The guided path starts with a deliberately broken
synthetic release fixture and ends with its corrected equivalent. No API key,
model, backend, or sign-in is required.

**Status:** Public portfolio release. **Built:** November 2026. **Role:** Product
design and frontend engineering. [Live demo](https://statechorus.vercel.app/demo?fixture=FIX-DEMO-BROKEN)
· [Source](https://github.com/nora-rasuli/statechorus)

![StateChorus corrected review showing the local-result and native-verification boundary](presentation-assets/fixed-result.png)

StateChorus is a self-directed product concept built with synthetic interaction
fixtures. Its local evidence does not represent native screen-reader output,
disabled-user experience, or WCAG conformance.

## Why it exists

Streaming responses, tool calls, approval prompts, stalls, retries, and transcript
updates create an interaction lifecycle that static accessibility scans do not
fully describe. When a shared AI interface changes before release, an accessibility
QA engineer still needs to answer a narrower, useful question: which observable
promise changed, where is the evidence, and what must be checked by a trained native
reviewer?

StateChorus turns that review into one repeatable workflow. It runs a versioned
twelve-state contract against a rendered synthetic interface, groups captured DOM
events into semantic episodes, shows expected and observed behavior side by side,
and exports the raw facts, derived findings, versions, environment, and integrity
hashes. A local pass never becomes a screen-reader or conformance pass.

## Demo path

1. Start the production preview and open
   `http://127.0.0.1:4173/demo?fixture=FIX-DEMO-BROKEN`.
2. Run the broken fixture and approve one-time access to the bundled synthetic log.
3. Review the three local findings: excessive streaming mutations, a duplicate
   stalled episode, and unrequested DOM focus movement.
4. Run the corrected equivalent and approve the same synthetic tool request.
5. Confirm the result: **“Local observable checks passed — native verification
   required.”**
6. Inspect or download the JSON and Markdown evidence artifact.

The scenario, release, conversation, tool call, and results are synthetic. The
fixtures reset on reload; no run history is uploaded or stored remotely.

## Product decisions

### Observe the rendered interface, not the fixture flags

The hardest decision was defining what the product could truthfully know. Fixture
flags alter the rendered React replay, but `BrowserDomProvider@1.1.0` receives only
a DOM root. It queries state markers, live-status revisions and text, active-element
changes, approval-control reachability, transcript identity and content, and
retained status elements. Pure modules then normalize events, group episodes,
evaluate invariants, and serialize evidence.

That boundary costs more work than deriving expected failures directly from fixture
metadata, but it keeps the diagnosis tied to observable behavior. Native speech,
assistive-technology behavior, disabled-user experience, and conformance remain
outside the provider’s authority.

### Preserve distinct failure states

The interface does not collapse every problem into pass/fail. Contract violation,
invalid fixture, invalid run, inconclusive evidence, interruption, and local-pass /
native-required are separate result types with scoped recovery actions. Missing
signals fail closed; reviewer annotation can record only `not_ready` or
`requires_native_verification` and cannot rewrite captured evidence.

### Make provenance part of the user outcome

The review is not complete until it can leave the interface. JSON and Markdown
exports retain contract, fixture, scenario, provider, browser, viewport, attempt,
raw events, normalized events, findings, result, and reproducible hashes. Export is
blocked when required lineage is missing.

## Architecture

```text
bundled synthetic fixture
        ↓ renders
React replay surface + virtual clock
        ↓ queried by
BrowserDomProvider (local DOM authority only)
        ↓ raw observable events
normalizer → episode reducer → invariant evaluator
        ↓
review UI + immutable JSON/Markdown evidence
        ↓
trained native assistive-technology review
```

The application is a static React 18 + TypeScript + Vite build. Contract, replay,
provider, evaluator, UI, and serializer boundaries are separately typed. There is
no server, database, remote model, telemetry SDK, authentication flow, arbitrary
URL runner, or upload path.

The architecture rationale is recorded in
[ADR-001](evidence/architecture/ADR-001-local-observable-authority.md).

## Independent verification changed the product

Two release-blocking issues were found after the initial implementation said it
was complete:

1. Stage 03 traced several findings to fixture-authored records labeled as browser
   observations. The repair moved each seeded defect into rendered behavior, made
   the provider fixture-independent, added a flag-only negative regression, fixed
   lineage hashing, exposed invalid/inconclusive browser recovery, and removed a
   nested landmark violation. A fresh verifier reproduced the repaired 24-attempt
   corpus before the audit continued.
2. Stage 04 then ran the complete keyboard loop and found that activating **Run
   fixed fixture** from the broken review unmounted the focused control and dropped
   focus to `BODY`. The bounded repair keeps the canonical Run control mounted as
   the logical target; one ordinary Tab reaches approval. Fresh Stage 03 and Stage
   04 reviewers reproduced that sequence in ordinary Chrome and under reduced
   motion.

The final independent audit returned `PASS / Portfolio-ready` on 2026-11-19 with
no unresolved P0 or P1 finding. The public evidence and its claim boundaries are
summarized in the [claim ledger](claim-ledger.md).

## Verified quality evidence

All measurements below are dated 2026-11-19 and apply to the frozen synthetic
package 1.0 and recorded local environments.

- **Evaluation:** eight fixtures ran three times each in Chromium: all seven seeded
  rendered failures were detected, the corrected control produced zero false
  findings, and each fixture produced one comparable output hash across its three
  runs.
- **Release gate:** the independent Stage 04 recheck completed `npm run verify` in
  53.78 seconds on macOS 15.7.4 / Node 20.19.5. It included 25 Vitest checks,
  24 rendered-browser corpus attempts, and 15 Playwright checks.
- **Accessibility checks:** axe-core 4.10.1 reported zero violations in the tested
  setup and completed-review states. Keyboard/focus, selected contrast tokens,
  360/768/1280 layouts, 200%/400%-equivalent reflow, and reduced motion were also
  checked. These automated and local results are not WCAG certification and do not
  substitute for native screen-reader or disabled-user testing; neither was run.
- **Privacy/runtime:** a recorded local flow loaded three same-origin static assets,
  then made zero post-load and zero external requests.
- **Bundle:** the verified build produced 183.80 kB JavaScript raw / 57.96 kB gzip
  and 12.42 kB CSS raw / 3.48 kB gzip.

The historical Lighthouse profile predates the final bounded repair and is retained
only as internal context, not as current public release evidence. Full methods and
limits are in the [claim ledger](claim-ledger.md).

## Testing and CI

The local release gate covers formatting, ESLint, strict TypeScript, unit/component
tests, the rendered fixture corpus, production build, Playwright workflows,
axe-core, responsive/reflow profiles, reduced motion, network capture, contrast
tokens, provenance, dependency licenses, and claim vocabulary.

The repository contains a GitHub Actions workflow that runs the same root gate on
every push and pull request.

## Run locally

### Prerequisites

- Node.js 20.19 or newer
- npm 10 or newer

```bash
npm ci
npm run verify
npm run preview -- --port 4173
```

Open `http://127.0.0.1:4173/demo?fixture=FIX-DEMO-BROKEN`.

For development:

```bash
npm run dev
```

No environment file, account, key, model, or paid service is required.

## Data, privacy, and limitations

- All personas, release identifiers, conversations, tool calls, and fixtures are
  synthetic and bundled with the application.
- Local observations cover event order, DOM focus, control reachability, transcript
  identity/content, and live-region mutations within the declared provider scope.
- Native NVDA, VoiceOver, JAWS, TalkBack, and other assistive-technology output was
  not tested. Disabled-user testing was not performed.
- Automated accessibility results do not establish WCAG conformance,
  certification, compliance, legal safety, or a safe release decision.
- Performance measurements are dated local profiles, not production reliability,
  compatibility, support, or an SLA.
- There is no customer, adoption, revenue, ROI, time-saving, production-impact, or
  commercial-validation evidence.
- The working name has only a dated collision screen. It is not claimed as owned,
  registered, trademark-safe, or commercially cleared.

## Roadmap

1. Run moderated contract-authoring sessions with accessibility QA and frontend
   platform practitioners to test whether the schema fits their release workflow.
2. Pair the same fixture cases with qualified native assistive-technology review
   and study correlation without weakening the authority boundary.
3. Only after that evidence, evaluate a provider adapter or CI integration and
   preserve explicit inconclusive/native-required outcomes.

## License

The source package includes the [MIT License](LICENSE), matching `package.json`.
The synthetic fixtures and interface are original to this project; dependency
declarations are inventoried in `evidence/licenses/`. The inventory is not legal
advice.
