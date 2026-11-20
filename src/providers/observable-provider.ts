import type { RawObservableEvent } from "../domain/events";
import type { AiState } from "../domain/contract";
import type { EventCause } from "../domain/events";

export type ObservableCapability =
  | "fixture_phase"
  | "event_order"
  | "dom_focus"
  | "keyboard_reachability"
  | "transcript_identity_content"
  | "live_region_mutation";

export interface ProviderIdentity {
  readonly name: "BrowserDomProvider";
  readonly version: "1.1.0";
  readonly authority: "local_browser_observable";
  readonly capabilities: readonly ObservableCapability[];
  readonly unsupported: readonly [
    "native_speech",
    "disabled_user_experience",
    "wcag_conformance",
  ];
}

export interface ObservableProvider {
  readonly identity: ProviderIdentity;
  start(root: HTMLElement, initialActiveElementId: string): void;
  observe(root: HTMLElement): void;
  recordHarnessEvent(
    name:
      | "run_started"
      | "approval_activated"
      | "run_completed"
      | "run_interrupted",
    state: AiState,
    cause: EventCause,
  ): void;
  setNextFocusCause(cause: EventCause): void;
  capture(): readonly RawObservableEvent[];
  stop(): void;
}
