import { isAiState, type AiState } from "../domain/contract";
import type { EventCause, RawObservableEvent } from "../domain/events";
import { stableHash } from "../utils/stable";
import type {
  ObservableProvider,
  ProviderIdentity,
} from "./observable-provider";

export const BROWSER_DOM_PROVIDER_IDENTITY: ProviderIdentity = Object.freeze({
  name: "BrowserDomProvider",
  version: "1.1.0",
  authority: "local_browser_observable",
  capabilities: Object.freeze([
    "fixture_phase",
    "event_order",
    "dom_focus",
    "keyboard_reachability",
    "transcript_identity_content",
    "live_region_mutation",
  ] as const),
  unsupported: Object.freeze([
    "native_speech",
    "disabled_user_experience",
    "wcag_conformance",
  ] as const),
});

type RawEventInput = RawObservableEvent extends infer Event
  ? Event extends RawObservableEvent
    ? Omit<Event, "sequence" | "virtualMs" | "source">
    : never
  : never;

const LIVE_KEYS = new Set([
  "thinking",
  "tool",
  "approval",
  "streaming",
  "stalled",
  "complete",
]);

function elementIdentity(element: Element | null): string {
  if (!element) return "none";
  return (
    element.id ||
    element.getAttribute("data-transcript-id") ||
    element.getAttribute("data-observable-control") ||
    element.tagName.toLowerCase()
  );
}

function isKeyboardReachable(element: HTMLElement | null): boolean {
  if (!element) return false;
  if (element.matches(":disabled") || element.hidden) return false;
  if (element.getAttribute("aria-hidden") === "true") return false;
  const style = window.getComputedStyle(element);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    element.tabIndex >= 0
  );
}

export class BrowserDomProvider implements ObservableProvider {
  readonly identity = BROWSER_DOM_PROVIDER_IDENTITY;

  private events: RawObservableEvent[] = [];
  private sequence = 0;
  private virtualMs = 0;
  private previousState: AiState = "idle";
  private currentState: AiState = "idle";
  private lastActiveElementId = "none";
  private nextFocusCause: EventCause = "system";
  private observedStatusRevisions = new Set<string>();
  private observedControls = new Set<string>();
  private observedTranscripts = new Set<string>();
  private observedStatusSnapshots = new Set<string>();
  private listening = false;

  private readonly noteUserInput = () => {
    this.nextFocusCause = "user";
  };

  private readonly noteFocus = (event: FocusEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    const toElement = elementIdentity(target);
    if (toElement === this.lastActiveElementId) return;
    this.add({
      type: "focus_change",
      state: this.currentState,
      fromElement: this.lastActiveElementId,
      toElement,
      cause: this.nextFocusCause,
    });
    this.lastActiveElementId = toElement;
    this.nextFocusCause = "system";
  };

  start(root: HTMLElement, initialActiveElementId: string): void {
    this.stop();
    this.events = [];
    this.sequence = 0;
    this.virtualMs = 0;
    this.previousState = "idle";
    this.currentState = "idle";
    this.lastActiveElementId = initialActiveElementId;
    this.nextFocusCause = "system";
    this.observedStatusRevisions.clear();
    this.observedControls.clear();
    this.observedTranscripts.clear();
    this.observedStatusSnapshots.clear();
    root.ownerDocument.addEventListener("keydown", this.noteUserInput, true);
    root.ownerDocument.addEventListener(
      "pointerdown",
      this.noteUserInput,
      true,
    );
    root.ownerDocument.addEventListener("focusin", this.noteFocus, true);
    this.listening = true;
  }

  observe(root: HTMLElement): void {
    const replay = root.querySelector<HTMLElement>("[data-replay-state]");
    const stateValue = replay?.dataset.replayState;
    if (!stateValue || !isAiState(stateValue) || stateValue === "idle") return;
    const state = stateValue;
    this.currentState = state;

    if (state !== this.previousState) {
      this.add({
        type: "state_transition",
        state,
        from: this.previousState,
        to: state,
      });
      this.previousState = state;
    }

    const status = root.querySelector<HTMLElement>("[data-observable-status]");
    const statusRevision = status?.dataset.statusRevision;
    const statusKey = status?.dataset.semanticKey;
    if (
      status &&
      statusRevision &&
      statusKey &&
      LIVE_KEYS.has(statusKey) &&
      !this.observedStatusRevisions.has(statusRevision)
    ) {
      this.observedStatusRevisions.add(statusRevision);
      this.add({
        type: "live_region_mutation",
        state,
        semanticKey: statusKey as Extract<
          RawObservableEvent,
          { type: "live_region_mutation" }
        >["semanticKey"],
        text: status.textContent?.trim() ?? "",
        politeness: "polite",
      });
    }

    if (state === "approval" && !this.observedControls.has(state)) {
      this.observedControls.add(state);
      const control = root.querySelector<HTMLElement>(
        "[data-observable-control='approval-control']",
      );
      this.add({
        type: "control_observation",
        state,
        controlId: "approval-control",
        present: Boolean(control),
        keyboardReachable: isKeyboardReachable(control),
      });
    }

    if (state === "streaming" || state === "complete") {
      const transcriptRevision = `${state}:${statusRevision ?? "none"}`;
      if (!this.observedTranscripts.has(transcriptRevision)) {
        this.observedTranscripts.add(transcriptRevision);
        const transcript = root.querySelector<HTMLElement>(
          "[data-transcript-id='msg-assistant-001']",
        );
        const text = transcript?.textContent?.trim() ?? "";
        this.add({
          type: "transcript_observation",
          state,
          nodeId: "msg-assistant-001",
          present: Boolean(transcript),
          textChecksum: stableHash(text),
          stable: transcript?.dataset.transcriptStable === "true",
        });
      }
    }

    if (state === "complete" && !this.observedStatusSnapshots.has(state)) {
      this.observedStatusSnapshots.add(state);
      const activeKeys = new Set<string>();
      if (status?.dataset.statusState === "complete" && statusKey) {
        activeKeys.add(statusKey);
      }
      root
        .querySelectorAll<HTMLElement>("[data-persisted-status]")
        .forEach((node) => {
          const key = node.dataset.persistedStatus;
          if (key) activeKeys.add(key);
        });
      this.add({
        type: "status_snapshot",
        state,
        activeSemanticKeys: Object.freeze([...activeKeys].sort()),
      });
    }
  }

  recordHarnessEvent(
    name:
      | "run_started"
      | "approval_activated"
      | "run_completed"
      | "run_interrupted",
    state: AiState,
    cause: EventCause,
  ): void {
    this.currentState = state;
    this.add({ type: "harness_event", state, name, cause });
  }

  setNextFocusCause(cause: EventCause): void {
    this.nextFocusCause = cause;
  }

  capture(): readonly RawObservableEvent[] {
    return Object.freeze(
      this.events.map((event) => Object.freeze({ ...event })),
    );
  }

  stop(): void {
    if (!this.listening) return;
    document.removeEventListener("keydown", this.noteUserInput, true);
    document.removeEventListener("pointerdown", this.noteUserInput, true);
    document.removeEventListener("focusin", this.noteFocus, true);
    this.listening = false;
  }

  private add(event: RawEventInput): void {
    this.sequence += 1;
    this.virtualMs += 100;
    this.events.push({
      ...event,
      sequence: this.sequence,
      virtualMs: this.virtualMs,
      source: "browser_dom",
    } as RawObservableEvent);
  }
}
