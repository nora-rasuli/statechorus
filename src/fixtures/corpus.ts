import {
  GOLDEN_PATH,
  STATECHORUS_CONTRACT,
  type AiState,
} from "../domain/contract";
import type { FindingKey } from "../domain/events";
import { stableHash } from "../utils/stable";

export const SCENARIO = {
  id: "SCN-RELEASE-001",
  version: "1.0.0",
  releaseId: "2026.11.19-rc3",
  conversationId: "conv-synthetic-release-42",
  userMessageId: "msg-user-001",
  assistantMessageId: "msg-assistant-001",
  toolCallId: "tool-call-deploy-log-001",
  toolName: "readSyntheticDeploymentLog",
  prompt:
    "Check the synthetic deployment log for API-42 and summarize whether the release candidate is ready for accessibility review.",
  approvalLabel: "Approve synthetic log access once",
  finalResponse:
    "The synthetic fixture completed its local observable checks and is ready for native accessibility verification.",
} as const;

export interface FixtureFaults {
  readonly tokenMutationFlood?: boolean;
  readonly duplicateStall?: boolean;
  readonly focusTheft?: boolean;
  readonly missingCompletion?: boolean;
  readonly unreachableApproval?: boolean;
  readonly transcriptInstability?: boolean;
  readonly staleStatus?: boolean;
}

export type FixtureId =
  | "FIX-001"
  | "FIX-002"
  | "FIX-003"
  | "FIX-004"
  | "FIX-005"
  | "FIX-006"
  | "FIX-007"
  | "FIX-008"
  | "FIX-DEMO-BROKEN"
  | "FIX-DEMO-FIXED";

export interface FixtureDefinition {
  readonly id: FixtureId;
  readonly version: "1.0.0";
  readonly label: string;
  readonly variant: "broken" | "fixed";
  readonly scenarioId: typeof SCENARIO.id;
  readonly contractId: typeof STATECHORUS_CONTRACT.id;
  readonly contractVersion: typeof STATECHORUS_CONTRACT.version;
  readonly path: readonly AiState[];
  readonly faults: FixtureFaults;
  readonly expectedFindings: readonly FindingKey[];
  readonly hash: string;
}

type FixtureInput = Omit<
  FixtureDefinition,
  "version" | "scenarioId" | "contractId" | "contractVersion" | "path" | "hash"
>;

function fixture(input: FixtureInput): FixtureDefinition {
  const base = {
    ...input,
    version: "1.0.0" as const,
    scenarioId: SCENARIO.id,
    contractId: STATECHORUS_CONTRACT.id,
    contractVersion: STATECHORUS_CONTRACT.version,
    path: GOLDEN_PATH,
  };
  return { ...base, hash: stableHash(base) };
}

export const FIXTURES: Readonly<Record<FixtureId, FixtureDefinition>> = {
  "FIX-001": fixture({
    id: "FIX-001",
    label: "Token mutation flood",
    variant: "broken",
    faults: { tokenMutationFlood: true },
    expectedFindings: ["episode-budget-exceeded"],
  }),
  "FIX-002": fixture({
    id: "FIX-002",
    label: "Repeated stalled status",
    variant: "broken",
    faults: { duplicateStall: true },
    expectedFindings: ["duplicate-stall-episode"],
  }),
  "FIX-003": fixture({
    id: "FIX-003",
    label: "Unrequested focus change",
    variant: "broken",
    faults: { focusTheft: true },
    expectedFindings: ["unexpected-focus-change"],
  }),
  "FIX-004": fixture({
    id: "FIX-004",
    label: "Missing completion event",
    variant: "broken",
    faults: { missingCompletion: true },
    expectedFindings: ["missing-completion-event"],
  }),
  "FIX-005": fixture({
    id: "FIX-005",
    label: "Keyboard-unreachable approval",
    variant: "broken",
    faults: { unreachableApproval: true },
    expectedFindings: ["approval-control-unreachable"],
  }),
  "FIX-006": fixture({
    id: "FIX-006",
    label: "Unstable completed transcript",
    variant: "broken",
    faults: { transcriptInstability: true },
    expectedFindings: ["transcript-instability"],
  }),
  "FIX-007": fixture({
    id: "FIX-007",
    label: "Stale status after completion",
    variant: "broken",
    faults: { staleStatus: true },
    expectedFindings: ["stale-status-after-complete"],
  }),
  "FIX-008": fixture({
    id: "FIX-008",
    label: "Fixed control",
    variant: "fixed",
    faults: {},
    expectedFindings: [],
  }),
  "FIX-DEMO-BROKEN": fixture({
    id: "FIX-DEMO-BROKEN",
    label: "Guided broken fixture",
    variant: "broken",
    faults: {
      tokenMutationFlood: true,
      duplicateStall: true,
      focusTheft: true,
    },
    expectedFindings: [
      "episode-budget-exceeded",
      "duplicate-stall-episode",
      "unexpected-focus-change",
    ],
  }),
  "FIX-DEMO-FIXED": fixture({
    id: "FIX-DEMO-FIXED",
    label: "Guided fixed fixture",
    variant: "fixed",
    faults: {},
    expectedFindings: [],
  }),
};

export const CORPUS_IDS: readonly FixtureId[] = [
  "FIX-001",
  "FIX-002",
  "FIX-003",
  "FIX-004",
  "FIX-005",
  "FIX-006",
  "FIX-007",
  "FIX-008",
];

export const DEMO_IDS: readonly FixtureId[] = [
  "FIX-DEMO-BROKEN",
  "FIX-DEMO-FIXED",
];

export function isFixtureId(value: string): value is FixtureId {
  return value in FIXTURES;
}

export function validateFixture(input: unknown): readonly string[] {
  if (!input || typeof input !== "object")
    return ["Fixture must be an object."];
  const candidate = input as Partial<FixtureDefinition>;
  const errors: string[] = [];
  if (!candidate.id || !isFixtureId(candidate.id))
    errors.push("Fixture ID is unknown.");
  if (candidate.version !== "1.0.0")
    errors.push("Fixture version must be 1.0.0.");
  if (candidate.contractVersion !== STATECHORUS_CONTRACT.version)
    errors.push("Contract version mismatch.");
  if (candidate.scenarioId !== SCENARIO.id)
    errors.push("Scenario ID mismatch.");
  if (!candidate.hash) errors.push("Fixture content hash is missing.");
  if (candidate.hash) {
    const body = { ...(candidate as FixtureDefinition) };
    Reflect.deleteProperty(body, "hash");
    if (candidate.hash !== stableHash(body))
      errors.push("Fixture content hash does not match its body.");
  }
  return errors;
}
