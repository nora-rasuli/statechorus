import { describe, expect, it } from "vitest";
import type { FindingKey } from "../../src/domain/events";
import { FIXED_RESULT_COPY } from "../../src/domain/events";
import { evaluateRun } from "../../src/engine/evaluate";
import { FIXTURES } from "../../src/fixtures/corpus";
import { stableJson } from "../../src/utils/stable";
import {
  fixedObservedEvents,
  observedEventsForFinding,
} from "../helpers/observed-events";

const CASES: readonly [FindingKey, (typeof FIXTURES)["FIX-001"]][] = [
  ["episode-budget-exceeded", FIXTURES["FIX-001"]],
  ["duplicate-stall-episode", FIXTURES["FIX-002"]],
  ["unexpected-focus-change", FIXTURES["FIX-003"]],
  ["missing-completion-event", FIXTURES["FIX-004"]],
  ["approval-control-unreachable", FIXTURES["FIX-005"]],
  ["transcript-instability", FIXTURES["FIX-006"]],
  ["stale-status-after-complete", FIXTURES["FIX-007"]],
];

describe("ENG-01 deterministic evaluation of captured facts", () => {
  for (const [key, definition] of CASES) {
    it(`${key} derives only from its observed event`, () => {
      const rawEvents = observedEventsForFinding(key);
      const outputs = Array.from({ length: 3 }, () =>
        evaluateRun(definition, rawEvents),
      );
      const comparable = outputs.map((output) =>
        stableJson({
          events: output.normalizedEvents,
          episodes: output.episodes,
          findings: output.findings,
          result: output.result,
        }),
      );
      expect(new Set(comparable).size).toBe(1);
      expect(outputs[0].findings.map((finding) => finding.key)).toEqual([key]);
      expect(outputs[0].result).toBe("contract_violation");
    });
  }

  it("returns the exact fixed label for a clean captured event stream", () => {
    const result = evaluateRun(FIXTURES["FIX-008"], fixedObservedEvents());
    expect(result.findings).toEqual([]);
    expect(result.result).toBe("local_observable_pass_native_required");
    expect(result.resultCopy).toBe(FIXED_RESULT_COPY);
  });

  it("keeps invalid, inconclusive, and interrupted outcomes distinct", () => {
    const fixed = FIXTURES["FIX-008"];
    const raw = fixedObservedEvents();
    expect(evaluateRun(fixed, raw, { harnessCrashed: true }).result).toBe(
      "invalid_run",
    );
    expect(
      evaluateRun(fixed, raw, { requiredSignalMissing: true }).result,
    ).toBe("inconclusive");
    expect(
      evaluateRun(fixed, raw.slice(0, 5), { interrupted: true }).result,
    ).toBe("interrupted");
    expect(evaluateRun({ ...fixed, hash: "" }, raw).result).toBe(
      "invalid_fixture",
    );
  });
});
