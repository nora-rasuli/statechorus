import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResultNotice } from "../../src/features/review/ResultNotice";
import type { ResultLabel } from "../../src/domain/events";

const cases: readonly [ResultLabel, string][] = [
  ["contract_violation", "Review the named evidence"],
  ["invalid_fixture", "repair a valid"],
  ["invalid_run", "Reset the harness"],
  ["inconclusive", "route the question"],
  ["interrupted", "Resume or restart"],
  ["local_observable_pass_native_required", "Schedule trained native"],
];

describe("QA-02 distinct failure and recovery notices", () => {
  for (const [result, action] of cases) {
    it(`renders ${result} with its recovery`, () => {
      render(<ResultNotice result={result} copy={`Result: ${result}`} />);
      expect(screen.getByText(`Result: ${result}`)).toBeVisible();
      expect(screen.getByText(new RegExp(action, "i"))).toBeVisible();
    });
  }
});
