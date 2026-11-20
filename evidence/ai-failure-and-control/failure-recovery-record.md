# Failure, degraded mode, and human-control record

**Captured:** 2026-11-19
**Requirements:** `QA-02`, `HUMAN-01`, `PROV-01`

| Condition                              | Top-level result / product behavior                         | Verified recovery                                  |
| -------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Contract mismatch                      | `contract_violation`; evidence and stable findings retained | Review evidence; run fixed equivalent              |
| Invalid fixture/schema                 | `invalid_fixture`; run blocked / alert summary              | Use or repair a versioned fixture                  |
| Harness exception or unstable sequence | `invalid_run`; partial evidence retained without verdict    | Deterministic reset and rerun                      |
| Required local signal missing          | `inconclusive`; never converted to pass                     | Inspect adapter/fixture and route to native review |
| User cancellation                      | `interrupted`; partial evidence retained without pass/fail  | Resume/restart with a linked attempt               |
| All declared local invariants hold     | `local_observable_pass_native_required`                     | Schedule trained native review                     |
| Missing export lineage                 | `Export blocked` exception names missing fields             | Supply/derive required metadata before export      |

Unit/component tests cover all six allowed result labels and export blocking. Browser tests make all six labels reachable: invalid fixture through an invalid fixture ID, invalid run and inconclusive through deterministic test-only injection, interruption through the stop control, contract violation through the broken composite, and native-required through the fixed equivalent. Screenshots are retained for invalid fixture, invalid run, inconclusive, and interruption. Each degraded case exposes reset, rerun, correction, or native-routing recovery and never renders a local pass. Reviewer annotation permits only `not_ready` and `requires_native_verification`; raw evidence and verdict are immutable.
