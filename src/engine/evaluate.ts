import { STATECHORUS_CONTRACT, validatePath } from "../domain/contract";
import type {
  Finding,
  FindingKey,
  NormalizedEvent,
  RawObservableEvent,
  ResultLabel,
  SemanticEpisode,
} from "../domain/events";
import { FIXED_RESULT_COPY } from "../domain/events";
import type { FixtureDefinition } from "../fixtures/corpus";
import { SCENARIO, validateFixture } from "../fixtures/corpus";
import { reduceEpisodes } from "./episodes";
import { normalizeEvents } from "./normalize";

export interface Evaluation {
  readonly result: ResultLabel;
  readonly resultCopy: string;
  readonly findings: readonly Finding[];
  readonly rawEvents: readonly RawObservableEvent[];
  readonly normalizedEvents: readonly NormalizedEvent[];
  readonly episodes: readonly SemanticEpisode[];
  readonly diagnostics: readonly string[];
}

const details: Readonly<
  Record<FindingKey, Omit<Finding, "evidenceSequences">>
> = {
  "episode-budget-exceeded": {
    key: "episode-budget-exceeded",
    severity: "high",
    rule: STATECHORUS_CONTRACT.invariants["streaming-episode-budget"],
    state: "streaming",
    summary:
      "Streaming emitted more than one live-region mutation; the local episode budget was exceeded.",
  },
  "duplicate-stall-episode": {
    key: "duplicate-stall-episode",
    severity: "high",
    rule: STATECHORUS_CONTRACT.invariants["stall-episode-uniqueness"],
    state: "stalled",
    summary: "The equivalent stalled status was emitted more than once.",
  },
  "unexpected-focus-change": {
    key: "unexpected-focus-change",
    severity: "high",
    rule: STATECHORUS_CONTRACT.invariants["focus-ownership"],
    state: "approval",
    summary:
      "A system-caused DOM focus change occurred when approval appeared.",
  },
  "missing-completion-event": {
    key: "missing-completion-event",
    severity: "high",
    rule: STATECHORUS_CONTRACT.invariants["completion-observable"],
    state: "complete",
    summary: "No completion mutation was present after the complete state.",
  },
  "approval-control-unreachable": {
    key: "approval-control-unreachable",
    severity: "high",
    rule: STATECHORUS_CONTRACT.invariants["approval-keyboard-reachability"],
    state: "approval",
    summary:
      "The required approval control was not reachable in the deterministic keyboard order.",
  },
  "transcript-instability": {
    key: "transcript-instability",
    severity: "high",
    rule: STATECHORUS_CONTRACT.invariants["transcript-stability"],
    state: "complete",
    summary:
      "The completed assistant transcript node, identity, or content was not retained.",
  },
  "stale-status-after-complete": {
    key: "stale-status-after-complete",
    severity: "medium",
    rule: STATECHORUS_CONTRACT.invariants["status-cleared-on-complete"],
    state: "complete",
    summary: "The stalled status remained observable after completion.",
  },
};

function finding(key: FindingKey, events: readonly NormalizedEvent[]): Finding {
  return Object.freeze({
    ...details[key],
    evidenceSequences: Object.freeze(events.map(({ sequence }) => sequence)),
  });
}

export interface EvaluationOptions {
  readonly harnessCrashed?: boolean;
  readonly interrupted?: boolean;
  readonly requiredSignalMissing?: boolean;
}

export function evaluateRun(
  definition: FixtureDefinition,
  rawEvents: readonly RawObservableEvent[],
  options: EvaluationOptions = {},
): Evaluation {
  const fixtureErrors = validateFixture(definition);
  const pathErrors = validatePath(["idle", ...definition.path]);
  const { events, errors: normalizationErrors } = normalizeEvents(rawEvents);
  const diagnostics = [...fixtureErrors, ...pathErrors, ...normalizationErrors];
  const episodes = reduceEpisodes(events);

  if (fixtureErrors.length > 0 || pathErrors.length > 0) {
    return {
      result: "invalid_fixture",
      resultCopy: "Invalid fixture — repair the schema before running.",
      findings: [],
      rawEvents: Object.freeze([...rawEvents]),
      normalizedEvents: events,
      episodes,
      diagnostics,
    };
  }
  if (options.harnessCrashed || normalizationErrors.length > 0) {
    return {
      result: "invalid_run",
      resultCopy: "Invalid run — partial evidence retained; reset and rerun.",
      findings: [],
      rawEvents: Object.freeze([...rawEvents]),
      normalizedEvents: events,
      episodes,
      diagnostics,
    };
  }
  if (options.interrupted) {
    return {
      result: "interrupted",
      resultCopy:
        "Run interrupted — partial evidence retained without a verdict.",
      findings: [],
      rawEvents: Object.freeze([...rawEvents]),
      normalizedEvents: events,
      episodes,
      diagnostics,
    };
  }
  if (options.requiredSignalMissing) {
    return {
      result: "inconclusive",
      resultCopy:
        "Inconclusive — a required local signal is unavailable; native verification remains required.",
      findings: [],
      rawEvents: Object.freeze([...rawEvents]),
      normalizedEvents: events,
      episodes,
      diagnostics: [
        ...diagnostics,
        "Required local observable signal missing.",
      ],
    };
  }

  const findings: Finding[] = [];
  const streamMutations = events.filter(
    (event) =>
      event.type === "live_region_mutation" &&
      event.semanticKey === "streaming",
  );
  if (streamMutations.length > 1)
    findings.push(finding("episode-budget-exceeded", streamMutations));

  const stallMutations = events.filter(
    (event) =>
      event.type === "live_region_mutation" && event.semanticKey === "stalled",
  );
  if (stallMutations.length > 1)
    findings.push(finding("duplicate-stall-episode", stallMutations));

  const focusChanges = events.filter(
    (event) => event.type === "focus_change" && event.cause === "system",
  );
  if (focusChanges.length > 0)
    findings.push(finding("unexpected-focus-change", focusChanges));

  const completions = events.filter(
    (event) =>
      event.type === "live_region_mutation" && event.semanticKey === "complete",
  );
  if (completions.length === 0)
    findings.push(finding("missing-completion-event", []));

  const approvals = events.filter(
    (
      event,
    ): event is Extract<NormalizedEvent, { type: "control_observation" }> =>
      event.type === "control_observation" &&
      event.controlId === "approval-control",
  );
  if (
    approvals.length === 0 ||
    approvals.some((event) => !event.keyboardReachable)
  ) {
    findings.push(finding("approval-control-unreachable", approvals));
  }

  const finalTranscript = [...events]
    .reverse()
    .find(
      (event) =>
        event.type === "transcript_observation" &&
        event.nodeId === "msg-assistant-001",
    );
  if (
    !finalTranscript ||
    finalTranscript.type !== "transcript_observation" ||
    !finalTranscript.present ||
    !finalTranscript.stable ||
    finalTranscript.textChecksum !== `fnv1a64:${stableFinalChecksum()}`
  ) {
    findings.push(
      finding(
        "transcript-instability",
        finalTranscript ? [finalTranscript] : [],
      ),
    );
  }

  const finalStatus = [...events]
    .reverse()
    .find((event) => event.type === "status_snapshot");
  if (
    finalStatus?.type === "status_snapshot" &&
    finalStatus.activeSemanticKeys.includes("stalled")
  ) {
    findings.push(finding("stale-status-after-complete", [finalStatus]));
  }

  return Object.freeze({
    result:
      findings.length > 0
        ? "contract_violation"
        : "local_observable_pass_native_required",
    resultCopy:
      findings.length > 0
        ? `${findings.length} local contract violation${findings.length === 1 ? "" : "s"} found.`
        : FIXED_RESULT_COPY,
    findings: Object.freeze(findings),
    rawEvents: Object.freeze([...rawEvents]),
    normalizedEvents: events,
    episodes,
    diagnostics: Object.freeze(diagnostics),
  });
}

// Kept as a literal derived from the frozen scenario so browser and Node builds agree.
function stableFinalChecksum(): string {
  let hash = 0xcbf29ce484222325n;
  const input = JSON.stringify(SCENARIO.finalResponse);
  const prime = 0x100000001b3n;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= BigInt(input.charCodeAt(index));
    hash = BigInt.asUintN(64, hash * prime);
  }
  return hash.toString(16).padStart(16, "0");
}
