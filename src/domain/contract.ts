export const AI_STATES = [
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
] as const;

export type AiState = (typeof AI_STATES)[number];
export type ContractVersion = "1.0.0";

export interface Transition {
  readonly from: AiState;
  readonly to: AiState;
}

export const ALLOWED_TRANSITIONS: readonly Transition[] = [
  { from: "idle", to: "submitted" },
  { from: "submitted", to: "thinking" },
  { from: "thinking", to: "tool_call" },
  { from: "thinking", to: "streaming" },
  { from: "thinking", to: "error" },
  { from: "thinking", to: "interrupted" },
  { from: "tool_call", to: "approval" },
  { from: "tool_call", to: "streaming" },
  { from: "tool_call", to: "error" },
  { from: "tool_call", to: "interrupted" },
  { from: "approval", to: "streaming" },
  { from: "approval", to: "error" },
  { from: "approval", to: "interrupted" },
  { from: "streaming", to: "stalled" },
  { from: "streaming", to: "complete" },
  { from: "streaming", to: "error" },
  { from: "streaming", to: "interrupted" },
  { from: "stalled", to: "streaming" },
  { from: "stalled", to: "complete" },
  { from: "stalled", to: "error" },
  { from: "stalled", to: "interrupted" },
  { from: "error", to: "retry" },
  { from: "interrupted", to: "resume" },
  { from: "retry", to: "resume" },
  { from: "resume", to: "thinking" },
  { from: "resume", to: "tool_call" },
  { from: "resume", to: "streaming" },
  { from: "resume", to: "error" },
  { from: "resume", to: "interrupted" },
  { from: "complete", to: "idle" },
] as const;

export const GOLDEN_PATH: readonly AiState[] = [
  "submitted",
  "thinking",
  "tool_call",
  "approval",
  "streaming",
  "stalled",
  "complete",
] as const;

export type InvariantKey =
  | "streaming-episode-budget"
  | "stall-episode-uniqueness"
  | "focus-ownership"
  | "completion-observable"
  | "approval-keyboard-reachability"
  | "transcript-stability"
  | "status-cleared-on-complete";

export interface InteractionContract {
  readonly id: "CONTRACT-AI-TURN-001";
  readonly version: ContractVersion;
  readonly schemaVersion: "1.0.0";
  readonly states: readonly AiState[];
  readonly transitions: readonly Transition[];
  readonly path: readonly AiState[];
  readonly invariants: Readonly<Record<InvariantKey, string>>;
  readonly hash: string;
}

const CONTRACT_BODY: Omit<InteractionContract, "hash"> = {
  id: "CONTRACT-AI-TURN-001",
  version: "1.0.0",
  schemaVersion: "1.0.0",
  states: AI_STATES,
  transitions: ALLOWED_TRANSITIONS,
  path: GOLDEN_PATH,
  invariants: {
    "streaming-episode-budget":
      "At most one streaming status mutation is observable.",
    "stall-episode-uniqueness":
      "One semantic stalled episode is observable per pause.",
    "focus-ownership":
      "System state changes do not move DOM focus without user action.",
    "completion-observable":
      "A completion status mutation is observable after complete.",
    "approval-keyboard-reachability":
      "The approval control is reachable in ordinary Tab order.",
    "transcript-stability":
      "The completed assistant transcript retains its stable ID and content.",
    "status-cleared-on-complete":
      "No stalled status remains observable after complete.",
  },
};

export const STATECHORUS_CONTRACT: InteractionContract = Object.freeze({
  ...CONTRACT_BODY,
  hash: stableHash(CONTRACT_BODY),
});

const stateSet = new Set<string>(AI_STATES);
const transitionSet = new Set(
  ALLOWED_TRANSITIONS.map(({ from, to }) => `${from}->${to}`),
);

export function isAiState(value: unknown): value is AiState {
  return typeof value === "string" && stateSet.has(value);
}

export function isAllowedTransition(from: AiState, to: AiState): boolean {
  return transitionSet.has(`${from}->${to}`);
}

export function validatePath(path: readonly string[]): readonly string[] {
  const errors: string[] = [];
  if (path.length < 2) errors.push("A path must include at least two states.");
  path.forEach((state, index) => {
    if (!isAiState(state))
      errors.push(`Unknown state at index ${index}: ${state}`);
  });
  for (let index = 1; index < path.length; index += 1) {
    const from = path[index - 1];
    const to = path[index];
    if (isAiState(from) && isAiState(to) && !isAllowedTransition(from, to)) {
      errors.push(`Invalid transition: ${from} -> ${to}`);
    }
  }
  return errors;
}
import { stableHash } from "../utils/stable";
