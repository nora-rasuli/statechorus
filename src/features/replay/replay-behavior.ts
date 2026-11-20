import type { AiState } from "../../domain/contract";
import type { FixtureDefinition } from "../../fixtures/corpus";

export interface StatusMutation {
  readonly semanticKey:
    | "thinking"
    | "tool"
    | "approval"
    | "streaming"
    | "stalled"
    | "complete";
  readonly text: string;
}

const STREAMING_FLOOD = [
  "The",
  "The synthetic",
  "The synthetic fixture",
  "The synthetic fixture completed",
  "The synthetic fixture completed its checks",
] as const;

export function statusMutationsForState(
  fixture: FixtureDefinition,
  state: AiState | null,
): readonly StatusMutation[] {
  if (state === "thinking")
    return [
      { semanticKey: "thinking", text: "Reviewing the synthetic request." },
    ];
  if (state === "tool_call")
    return [
      {
        semanticKey: "tool",
        text: "Synthetic deployment log access proposed.",
      },
    ];
  if (state === "approval")
    return [
      {
        semanticKey: "approval",
        text: "Approval is required to continue.",
      },
    ];
  if (state === "streaming") {
    return fixture.faults.tokenMutationFlood
      ? STREAMING_FLOOD.map((text) => ({
          semanticKey: "streaming" as const,
          text,
        }))
      : [
          {
            semanticKey: "streaming",
            text: "Synthetic response is updating.",
          },
        ];
  }
  if (state === "stalled") {
    const mutation = {
      semanticKey: "stalled" as const,
      text: "Still working on the synthetic fixture.",
    };
    return Array.from(
      { length: fixture.faults.duplicateStall ? 4 : 1 },
      () => mutation,
    );
  }
  if (state === "complete" && !fixture.faults.missingCompletion) {
    return [
      {
        semanticKey: "complete",
        text: "Synthetic fixture replay complete.",
      },
    ];
  }
  return [];
}

export function responseForState(
  state: AiState | null,
  observationStep: number,
): string {
  if (state === "streaming") {
    const stream = [
      "The synthetic fixture",
      "The synthetic fixture completed its local observable checks",
      "The synthetic fixture completed its local observable checks…",
    ];
    return stream[Math.min(observationStep, stream.length - 1)] ?? "";
  }
  if (state === "stalled")
    return "The synthetic fixture completed its local observable checks…";
  return "";
}
