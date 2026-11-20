import type { AiState } from "./contract";

export type EventCause = "system" | "user" | "harness";

interface EventBase {
  readonly sequence: number;
  readonly virtualMs: number;
  readonly state: AiState;
  readonly source: "browser_dom";
}

export type RawObservableEvent =
  | (EventBase & {
      readonly type: "state_transition";
      readonly from: AiState;
      readonly to: AiState;
    })
  | (EventBase & {
      readonly type: "live_region_mutation";
      readonly semanticKey:
        | "thinking"
        | "tool"
        | "approval"
        | "streaming"
        | "stalled"
        | "complete";
      readonly text: string;
      readonly politeness: "polite";
    })
  | (EventBase & {
      readonly type: "focus_change";
      readonly fromElement: string;
      readonly toElement: string;
      readonly cause: EventCause;
    })
  | (EventBase & {
      readonly type: "control_observation";
      readonly controlId: "approval-control";
      readonly present: boolean;
      readonly keyboardReachable: boolean;
    })
  | (EventBase & {
      readonly type: "transcript_observation";
      readonly nodeId: "msg-user-001" | "msg-assistant-001";
      readonly present: boolean;
      readonly textChecksum: string;
      readonly stable: boolean;
    })
  | (EventBase & {
      readonly type: "status_snapshot";
      readonly activeSemanticKeys: readonly string[];
    })
  | (EventBase & {
      readonly type: "harness_event";
      readonly name:
        | "run_started"
        | "approval_activated"
        | "run_completed"
        | "run_interrupted";
      readonly cause: EventCause;
    });

export type NormalizedEvent = Readonly<RawObservableEvent>;

export interface SemanticEpisode {
  readonly state: AiState;
  readonly label: string;
  readonly startSequence: number;
  readonly endSequence: number;
  readonly eventCount: number;
  readonly eventSequences: readonly number[];
  readonly summary: string;
}

export type FindingKey =
  | "episode-budget-exceeded"
  | "duplicate-stall-episode"
  | "unexpected-focus-change"
  | "missing-completion-event"
  | "approval-control-unreachable"
  | "transcript-instability"
  | "stale-status-after-complete";

export type FindingSeverity = "high" | "medium";

export interface Finding {
  readonly key: FindingKey;
  readonly severity: FindingSeverity;
  readonly rule: string;
  readonly state: AiState;
  readonly summary: string;
  readonly evidenceSequences: readonly number[];
}

export type ResultLabel =
  | "contract_violation"
  | "invalid_fixture"
  | "invalid_run"
  | "inconclusive"
  | "interrupted"
  | "local_observable_pass_native_required";

export const FIXED_RESULT_COPY =
  "Local observable checks passed — native verification required.";
export const NATIVE_LIMITATION =
  "Local browser evidence does not represent native screen-reader output, disabled-user experience, or WCAG conformance. Native assistive-technology review remains required.";
