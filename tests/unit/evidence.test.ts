import { describe, expect, it } from "vitest";
import {
  createEvidence,
  serializeEvidenceJson,
  serializeEvidenceMarkdown,
  validateEvidenceIntegrity,
  validateEvidenceLineage,
} from "../../src/engine/evidence";
import { evaluateRun } from "../../src/engine/evaluate";
import { FIXTURES } from "../../src/fixtures/corpus";
import { BROWSER_DOM_PROVIDER_IDENTITY } from "../../src/providers/browser-dom";
import { fixedObservedEvents } from "../helpers/observed-events";

function evidence() {
  const fixture = FIXTURES["FIX-008"];
  const evaluation = evaluateRun(fixture, fixedObservedEvents());
  return createEvidence({
    fixture,
    provider: BROWSER_DOM_PROVIDER_IDENTITY,
    environment: {
      browserName: "Chromium",
      browserVersion: "test",
      os: "test",
      viewport: { width: 1280, height: 800 },
      reducedMotion: false,
    },
    runId: "run-test-001",
    attemptId: "attempt-001",
    startedAt: "2026-11-19T00:00:00.000Z",
    completedAt: "2026-11-19T00:00:01.000Z",
    rawEvents: evaluation.rawEvents,
    normalizedEvents: evaluation.normalizedEvents,
    episodes: evaluation.episodes,
    findings: evaluation.findings,
    result: evaluation.result,
    resultCopy: evaluation.resultCopy,
    annotation: {
      note: "Route to trained native review.",
      disposition: "requires_native_verification",
      recordedAt: "2026-11-19T00:01:00.000Z",
    },
  });
}

describe("PROV-01 / HUMAN-01 evidence", () => {
  it("serializes complete immutable lineage to JSON and Markdown", () => {
    const artifact = evidence();
    expect(validateEvidenceLineage(artifact)).toEqual([]);
    expect(validateEvidenceIntegrity(artifact)).toEqual([]);
    expect(serializeEvidenceJson(artifact)).toContain(
      '"wallClockMetadataOnly": true',
    );
    expect(serializeEvidenceMarkdown(artifact)).toContain(
      "Native assistive-technology review",
    );
    expect(artifact.reviewerAnnotation?.disposition).toBe(
      "requires_native_verification",
    );
    expect(artifact.result).toBe("local_observable_pass_native_required");
  });

  it("blocks an export when lineage is missing", () => {
    const artifact = evidence();
    const invalid = { ...artifact, run: { ...artifact.run, runId: "" } };
    expect(validateEvidenceLineage(invalid)).toContain("run.runId");
    expect(() => serializeEvidenceJson(invalid)).toThrow(/Export blocked/);
  });

  it("blocks contract, fixture, or artifact hash drift", () => {
    const artifact = evidence();
    const invalid = {
      ...artifact,
      contract: { ...artifact.contract, hash: "fnv1a64:0000000000000000" },
    };
    expect(validateEvidenceIntegrity(invalid)).toContain("contract.hash");
    expect(() => serializeEvidenceJson(invalid)).toThrow(/Export blocked/);
  });
});
