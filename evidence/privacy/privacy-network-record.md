# Privacy, network, security, and economics record

**Captured:** 2026-11-19
**Requirements:** `PRIV-01`, `ECON-01`, `DEPLOY-01`, `LIC-01`

- The production workflow loaded three same-origin static resources: the document, one JavaScript asset, and one CSS asset.
- After static load, the complete fixed replay produced zero network requests and zero external requests.
- Product source contains a local JSON file input and no `fetch`, XMLHttpRequest,
  WebSocket, arbitrary URL runner, unsafe HTML injection, telemetry, auth, model
  SDK, secret, credential, server, or database path.
- Imported traces are capped at 5 MB, parsed in browser memory, and not uploaded by
  the static application. Users are instructed to remove secrets and personal data.
- Bundled sample fixtures remain synthetic TypeScript data and are optional.
- `npm ci` completed from the committed lockfile and reported zero vulnerabilities on 2026-11-19.
- `npm audit --json` reported 0 total vulnerabilities after the toolchain refresh.
- The license inventory covers 313 lockfile entries across runtime, development, optional-platform, and transitive packages with 0 unresolved license entries.
- Required local service/account/model cost is $0. No API key or sign-in is used.

Evidence: `runtime-network.json`, `../provenance/source-review.json`, and `../licenses/dependency-inventory.json`.
