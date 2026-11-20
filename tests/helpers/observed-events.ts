import type { FindingKey, RawObservableEvent } from "../../src/domain/events";
import { SCENARIO } from "../../src/fixtures/corpus";
import { stableHash } from "../../src/utils/stable";

type RawEventInput = RawObservableEvent extends infer Event
  ? Event extends RawObservableEvent
    ? Omit<Event, "sequence" | "virtualMs" | "source">
    : never
  : never;

function sequence(inputs: readonly RawEventInput[]): RawObservableEvent[] {
  return inputs.map(
    (event, index) =>
      ({
        ...event,
        sequence: index + 1,
        virtualMs: (index + 1) * 100,
        source: "browser_dom",
      }) as RawObservableEvent,
  );
}

export function fixedObservedEvents(): readonly RawObservableEvent[] {
  return sequence([
    {
      type: "harness_event",
      state: "submitted",
      name: "run_started",
      cause: "user",
    },
    {
      type: "state_transition",
      state: "submitted",
      from: "idle",
      to: "submitted",
    },
    {
      type: "state_transition",
      state: "thinking",
      from: "submitted",
      to: "thinking",
    },
    {
      type: "live_region_mutation",
      state: "thinking",
      semanticKey: "thinking",
      text: "Reviewing the synthetic request.",
      politeness: "polite",
    },
    {
      type: "state_transition",
      state: "tool_call",
      from: "thinking",
      to: "tool_call",
    },
    {
      type: "live_region_mutation",
      state: "tool_call",
      semanticKey: "tool",
      text: "Synthetic deployment log access proposed.",
      politeness: "polite",
    },
    {
      type: "state_transition",
      state: "approval",
      from: "tool_call",
      to: "approval",
    },
    {
      type: "live_region_mutation",
      state: "approval",
      semanticKey: "approval",
      text: "Approval is required to continue.",
      politeness: "polite",
    },
    {
      type: "control_observation",
      state: "approval",
      controlId: "approval-control",
      present: true,
      keyboardReachable: true,
    },
    {
      type: "harness_event",
      state: "approval",
      name: "approval_activated",
      cause: "user",
    },
    {
      type: "state_transition",
      state: "streaming",
      from: "approval",
      to: "streaming",
    },
    {
      type: "live_region_mutation",
      state: "streaming",
      semanticKey: "streaming",
      text: "Synthetic response is updating.",
      politeness: "polite",
    },
    {
      type: "transcript_observation",
      state: "streaming",
      nodeId: "msg-assistant-001",
      present: true,
      textChecksum: stableHash("The synthetic fixture"),
      stable: false,
    },
    {
      type: "state_transition",
      state: "stalled",
      from: "streaming",
      to: "stalled",
    },
    {
      type: "live_region_mutation",
      state: "stalled",
      semanticKey: "stalled",
      text: "Still working on the synthetic fixture.",
      politeness: "polite",
    },
    {
      type: "state_transition",
      state: "complete",
      from: "stalled",
      to: "complete",
    },
    {
      type: "live_region_mutation",
      state: "complete",
      semanticKey: "complete",
      text: "Synthetic fixture replay complete.",
      politeness: "polite",
    },
    {
      type: "transcript_observation",
      state: "complete",
      nodeId: "msg-assistant-001",
      present: true,
      textChecksum: stableHash(SCENARIO.finalResponse),
      stable: true,
    },
    {
      type: "status_snapshot",
      state: "complete",
      activeSemanticKeys: ["complete"],
    },
    {
      type: "harness_event",
      state: "complete",
      name: "run_completed",
      cause: "system",
    },
  ]);
}

export function observedEventsForFinding(
  key: FindingKey,
): readonly RawObservableEvent[] {
  const fixed = fixedObservedEvents().map((event) => ({ ...event }));
  const extra = (
    event: RawObservableEvent,
    afterType: RawObservableEvent["type"],
  ) => {
    const index = fixed.findIndex((candidate) => candidate.type === afterType);
    fixed.splice(index + 1, 0, event);
  };
  if (key === "episode-budget-exceeded") {
    extra(
      {
        ...fixed.find(
          (event) =>
            event.type === "live_region_mutation" &&
            event.state === "streaming",
        )!,
        sequence: 0,
        virtualMs: 0,
        text: "The synthetic fixture",
      } as RawObservableEvent,
      "transcript_observation",
    );
  }
  if (key === "duplicate-stall-episode") {
    const stalled = fixed.find(
      (event) =>
        event.type === "live_region_mutation" && event.state === "stalled",
    )!;
    fixed.splice(fixed.indexOf(stalled) + 1, 0, { ...stalled });
  }
  if (key === "unexpected-focus-change") {
    const approval = fixed.findIndex(
      (event) => event.type === "control_observation",
    );
    fixed.splice(approval + 1, 0, {
      sequence: 0,
      virtualMs: 0,
      source: "browser_dom",
      type: "focus_change",
      state: "approval",
      fromElement: "run-control",
      toElement: "synthetic-transcript",
      cause: "system",
    });
  }
  if (key === "missing-completion-event") {
    return sequence(
      fixed.filter(
        (event) =>
          !(
            event.type === "live_region_mutation" &&
            event.semanticKey === "complete"
          ),
      ),
    );
  }
  if (key === "approval-control-unreachable") {
    const approval = fixed.findIndex(
      (event) => event.type === "control_observation",
    );
    fixed[approval] = {
      ...fixed[approval]!,
      keyboardReachable: false,
    } as RawObservableEvent;
  }
  if (key === "transcript-instability") {
    let transcript = -1;
    for (let index = fixed.length - 1; index >= 0; index -= 1) {
      if (fixed[index]?.type === "transcript_observation") {
        transcript = index;
        break;
      }
    }
    fixed[transcript] = {
      ...fixed[transcript]!,
      present: false,
      textChecksum: stableHash(""),
      stable: false,
    } as RawObservableEvent;
  }
  if (key === "stale-status-after-complete") {
    const status = fixed.findIndex((event) => event.type === "status_snapshot");
    fixed[status] = {
      ...fixed[status]!,
      activeSemanticKeys: ["complete", "stalled"],
    } as RawObservableEvent;
  }
  return sequence(fixed);
}
