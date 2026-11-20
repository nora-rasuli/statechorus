import { describe, expect, it } from "vitest";
import {
  AI_STATES,
  GOLDEN_PATH,
  STATECHORUS_CONTRACT,
  isAllowedTransition,
  validatePath,
} from "../../src/domain/contract";
import { stableHash } from "../../src/utils/stable";

describe("P-01 twelve-state contract", () => {
  it("contains exactly the frozen twelve states", () => {
    expect(AI_STATES).toEqual([
      "idle",
      "submitted",
      "thinking",
      "tool_call",
      "approval",
      "streaming",
      "stalled",
      "complete",
      "interrupted",
      "error",
      "retry",
      "resume",
    ]);
  });

  it("accepts the golden path and rejects invalid or unknown paths", () => {
    expect(validatePath(["idle", ...GOLDEN_PATH])).toEqual([]);
    expect(isAllowedTransition("error", "retry")).toBe(true);
    expect(isAllowedTransition("interrupted", "resume")).toBe(true);
    expect(validatePath(["idle", "complete"])).toContain(
      "Invalid transition: idle -> complete",
    );
    expect(validatePath(["idle", "invented"])).toContain(
      "Unknown state at index 1: invented",
    );
  });

  it("derives a reproducible hash from the complete contract body", () => {
    const { hash, ...body } = STATECHORUS_CONTRACT;
    expect(hash).toBe(stableHash(body));
  });
});
