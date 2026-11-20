import type { AiState } from "../domain/contract";
import type { NormalizedEvent, SemanticEpisode } from "../domain/events";

const LABELS: Readonly<Record<AiState, string>> = {
  idle: "Idle baseline",
  submitted: "Request submitted",
  thinking: "Work started",
  tool_call: "Tool proposed",
  approval: "Approval required",
  streaming: "Response streaming",
  stalled: "Progress stalled",
  complete: "Turn complete",
  interrupted: "Turn interrupted",
  error: "Operation error",
  retry: "Retry requested",
  resume: "Turn resumed",
};

export function reduceEpisodes(
  events: readonly NormalizedEvent[],
): readonly SemanticEpisode[] {
  const groups = new Map<AiState, NormalizedEvent[]>();
  for (const event of events) {
    const group = groups.get(event.state) ?? [];
    group.push(event);
    groups.set(event.state, group);
  }
  return Object.freeze(
    [...groups.entries()].map(([state, stateEvents]) => {
      const sequences = stateEvents.map(({ sequence }) => sequence);
      const mutationCount = stateEvents.filter(
        ({ type }) => type === "live_region_mutation",
      ).length;
      return Object.freeze({
        state,
        label: LABELS[state],
        startSequence: sequences[0] ?? 0,
        endSequence: sequences.at(-1) ?? 0,
        eventCount: stateEvents.length,
        eventSequences: Object.freeze(sequences),
        summary: `${stateEvents.length} observable event${stateEvents.length === 1 ? "" : "s"}; ${mutationCount} status mutation${mutationCount === 1 ? "" : "s"}.`,
      });
    }),
  );
}

export function expectedEpisodes(): readonly Omit<
  SemanticEpisode,
  "startSequence" | "endSequence" | "eventCount" | "eventSequences"
>[] {
  return [
    {
      state: "submitted",
      label: LABELS.submitted,
      summary: "One stable request-start episode.",
    },
    {
      state: "thinking",
      label: LABELS.thinking,
      summary: "One bounded work-start status.",
    },
    {
      state: "tool_call",
      label: LABELS.tool_call,
      summary: "One synthetic tool proposal.",
    },
    {
      state: "approval",
      label: LABELS.approval,
      summary: "A keyboard-reachable decision without system focus movement.",
    },
    {
      state: "streaming",
      label: LABELS.streaming,
      summary: "Stable assistant node with at most one status mutation.",
    },
    {
      state: "stalled",
      label: LABELS.stalled,
      summary: "One semantic stalled episode.",
    },
    {
      state: "complete",
      label: LABELS.complete,
      summary: "Stable transcript, completion status, and no stale stall.",
    },
  ] as const;
}
