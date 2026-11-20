import type { NormalizedEvent, RawObservableEvent } from "../domain/events";

export interface NormalizationResult {
  readonly events: readonly NormalizedEvent[];
  readonly errors: readonly string[];
}

export function normalizeEvents(
  rawEvents: readonly RawObservableEvent[],
): NormalizationResult {
  const errors: string[] = [];
  let previousSequence = 0;
  let previousVirtualMs = -1;
  const events = rawEvents.map((event, index) => {
    if (event.sequence !== index + 1)
      errors.push(
        `Sequence ${event.sequence} is not stable at index ${index}.`,
      );
    if (event.sequence <= previousSequence)
      errors.push(`Sequence ${event.sequence} is not strictly increasing.`);
    if (event.virtualMs < previousVirtualMs)
      errors.push(`Virtual time regressed at sequence ${event.sequence}.`);
    previousSequence = event.sequence;
    previousVirtualMs = event.virtualMs;
    return Object.freeze({ ...event });
  });
  return { events: Object.freeze(events), errors: Object.freeze(errors) };
}
