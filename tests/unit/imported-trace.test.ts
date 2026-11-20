import { describe, expect, it } from "vitest";
import {
  importedTraceHash,
  parseImportedTrace,
  type ImportedTrace,
} from "../../src/domain/imported-trace";
import { evaluateImportedRun } from "../../src/engine/evaluate";
import type { RawObservableEvent } from "../../src/domain/events";
import { fixedObservedEvents } from "../helpers/observed-events";

function realTrace(): ImportedTrace {
  return {
    schemaVersion: "1.1.0",
    traceId: "checkout-assistant-2026-11-19",
    capturedAt: "2026-11-19T18:00:00.000Z",
    contract: { id: "CONTRACT-AI-TURN-001", version: "1.0.0" },
    source: {
      appName: "Checkout Assistant staging",
      url: "https://staging.example.test/assistant",
      environment: "staging",
      captureTool: "statechorus-playwright-capture@1.0.0",
      captureEnvironment: {
        browserName: "Chromium",
        browserVersion: "test",
        os: "test",
        viewport: { width: 1280, height: 800 },
        reducedMotion: false,
      },
    },
    events: fixedObservedEvents(),
  };
}

describe("FUNC-01 user-controlled trace input", () => {
  it("parses and evaluates a fresh non-corpus trace", () => {
    const result = parseImportedTrace(JSON.stringify(realTrace()));
    expect(result.errors).toEqual([]);
    expect(result.trace?.traceId).toBe("checkout-assistant-2026-11-19");
    expect(importedTraceHash(result.trace!)).toMatch(/^fnv1a64:/);
    expect(evaluateImportedRun(result.trace!.events).result).toBe(
      "local_observable_pass_native_required",
    );
  });

  it("rejects malformed input without substituting a sample", () => {
    const result = parseImportedTrace(
      JSON.stringify({ schemaVersion: "0.1", events: [] }),
    );
    expect(result.trace).toBeNull();
    expect(result.errors.length).toBeGreaterThan(3);
  });

  for (const [label, mutate] of [
    [
      "transition endpoints",
      (events: Array<Record<string, unknown>>) => {
        const event = events.find((row) => row.type === "state_transition")!;
        delete event.from;
        delete event.to;
      },
    ],
    [
      "live-region payload",
      (events: Array<Record<string, unknown>>) => {
        const event = events.find(
          (row) => row.type === "live_region_mutation",
        )!;
        event.semanticKey = "unknown";
      },
    ],
    [
      "focus cause",
      (events: Array<Record<string, unknown>>) => {
        events.push({
          sequence: events.length + 1,
          virtualMs: 9999,
          state: "complete",
          source: "browser_dom",
          type: "focus_change",
          fromElement: "a",
          toElement: "b",
          cause: "magic",
        });
      },
    ],
    [
      "approval observation",
      (events: Array<Record<string, unknown>>) => {
        const event = events.find((row) => row.type === "control_observation")!;
        event.present = "yes";
      },
    ],
    [
      "transcript checksum",
      (events: Array<Record<string, unknown>>) => {
        const event = events.find(
          (row) => row.type === "transcript_observation",
        )!;
        event.textChecksum = "not-a-checksum";
      },
    ],
    [
      "status keys",
      (events: Array<Record<string, unknown>>) => {
        const event = events.find((row) => row.type === "status_snapshot")!;
        event.activeSemanticKeys = [42];
      },
    ],
    [
      "harness name",
      (events: Array<Record<string, unknown>>) => {
        const event = events.find((row) => row.type === "harness_event")!;
        event.name = "invented";
      },
    ],
  ] as const) {
    it(`rejects an invalid ${label}`, () => {
      const candidate = JSON.parse(JSON.stringify(realTrace())) as {
        events: Array<Record<string, unknown>>;
      };
      mutate(candidate.events);
      const result = parseImportedTrace(JSON.stringify(candidate));
      expect(result.trace).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  }

  it("rejects a structurally valid trace without the contract trajectory", () => {
    const candidate = JSON.parse(JSON.stringify(realTrace())) as {
      events: Array<Record<string, unknown>>;
    };
    candidate.events = candidate.events
      .filter((event) => event.type !== "state_transition")
      .map((event, index) => ({ ...event, sequence: index + 1 }));
    const parsed = parseImportedTrace(JSON.stringify(candidate));
    expect(parsed.errors).toEqual([]);
    expect(evaluateImportedRun(parsed.trace!.events).result).toBe(
      "invalid_run",
    );
  });

  for (const [label, mutate] of [
    [
      "one missing transition",
      (events: Array<Record<string, unknown>>) => {
        const index = events.findIndex(
          (event) => event.type === "state_transition",
        );
        events.splice(index, 1);
      },
    ],
    [
      "reordered transitions",
      (events: Array<Record<string, unknown>>) => {
        const indices = events
          .map((event, index) =>
            event.type === "state_transition" ? index : -1,
          )
          .filter((index) => index >= 0);
        [events[indices[1]!]!, events[indices[2]!]!] = [
          events[indices[2]!]!,
          events[indices[1]!]!,
        ];
      },
    ],
    [
      "transition state mismatch",
      (events: Array<Record<string, unknown>>) => {
        const event = events.find((row) => row.type === "state_transition")!;
        event.state = "idle";
      },
    ],
    [
      "required signal missing",
      (events: Array<Record<string, unknown>>) => {
        const index = events.findIndex(
          (event) =>
            event.type === "live_region_mutation" &&
            event.semanticKey === "stalled",
        );
        events.splice(index, 1);
      },
    ],
    [
      "terminal completion missing",
      (events: Array<Record<string, unknown>>) => {
        const index = events.findIndex(
          (event) =>
            event.type === "state_transition" && event.to === "complete",
        );
        events.splice(index, 1);
      },
    ],
  ] as const) {
    it(`returns invalid_run when ${label}`, () => {
      const candidate = JSON.parse(JSON.stringify(realTrace())) as {
        events: Array<Record<string, unknown>>;
      };
      mutate(candidate.events);
      candidate.events = candidate.events.map((event, index) => ({
        ...event,
        sequence: index + 1,
      }));
      expect(
        evaluateImportedRun(candidate.events as unknown as RawObservableEvent[])
          .result,
      ).toBe("invalid_run");
    });
  }

  it("requires capture-environment provenance", () => {
    const candidate = JSON.parse(JSON.stringify(realTrace())) as {
      source: Record<string, unknown>;
    };
    delete candidate.source.captureEnvironment;
    const result = parseImportedTrace(JSON.stringify(candidate));
    expect(result.trace).toBeNull();
    expect(result.errors.join(" ")).toContain("captureEnvironment");
  });
});
