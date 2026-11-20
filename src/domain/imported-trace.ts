import {
  STATECHORUS_CONTRACT,
  isAiState,
  isAllowedTransition,
} from "./contract";
import type { RawObservableEvent } from "./events";
import { stableHash } from "../utils/stable";

export interface ImportedTrace {
  readonly schemaVersion: "1.1.0";
  readonly traceId: string;
  readonly capturedAt: string;
  readonly contract: {
    readonly id: typeof STATECHORUS_CONTRACT.id;
    readonly version: typeof STATECHORUS_CONTRACT.version;
  };
  readonly source: {
    readonly appName: string;
    readonly url: string;
    readonly environment: "local" | "staging" | "production";
    readonly captureTool: string;
    readonly captureEnvironment: {
      readonly browserName: string;
      readonly browserVersion: string;
      readonly os: string;
      readonly viewport: { readonly width: number; readonly height: number };
      readonly reducedMotion: boolean;
    };
  };
  readonly events: readonly RawObservableEvent[];
}

export interface TraceParseResult {
  readonly trace: ImportedTrace | null;
  readonly errors: readonly string[];
}

const EVENT_TYPES = new Set([
  "state_transition",
  "live_region_mutation",
  "focus_change",
  "control_observation",
  "transcript_observation",
  "status_snapshot",
  "harness_event",
]);
const SEMANTIC_KEYS = new Set([
  "thinking",
  "tool",
  "approval",
  "streaming",
  "stalled",
  "complete",
]);
const HARNESS_EVENTS = new Set([
  "run_started",
  "approval_activated",
  "run_completed",
  "run_interrupted",
]);
const EVENT_CAUSES = new Set(["system", "user", "harness"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateEvent(value: unknown, index: number): readonly string[] {
  if (!isRecord(value)) return [`events[${index}] must be an object.`];
  const errors: string[] = [];
  if (value.sequence !== index + 1)
    errors.push(`events[${index}].sequence must equal ${index + 1}.`);
  if (
    typeof value.virtualMs !== "number" ||
    !Number.isFinite(value.virtualMs) ||
    value.virtualMs < 0
  )
    errors.push(`events[${index}].virtualMs must be a non-negative number.`);
  if (!isAiState(value.state))
    errors.push(`events[${index}].state is not a supported contract state.`);
  if (value.source !== "browser_dom")
    errors.push(`events[${index}].source must be browser_dom.`);
  if (!nonEmpty(value.type) || !EVENT_TYPES.has(value.type))
    errors.push(`events[${index}].type is not supported.`);

  if (value.type === "state_transition") {
    if (!isAiState(value.from) || !isAiState(value.to)) {
      errors.push(
        `events[${index}] transitions need supported from and to states.`,
      );
    } else if (!isAllowedTransition(value.from, value.to)) {
      errors.push(`events[${index}] contains an unsupported transition.`);
    }
  }
  if (value.type === "live_region_mutation") {
    if (
      !nonEmpty(value.semanticKey) ||
      !SEMANTIC_KEYS.has(value.semanticKey) ||
      !nonEmpty(value.text) ||
      value.politeness !== "polite"
    )
      errors.push(`events[${index}] has an invalid live-region observation.`);
  }
  if (value.type === "focus_change") {
    if (!nonEmpty(value.fromElement) || !nonEmpty(value.toElement))
      errors.push(
        `events[${index}] focus events need fromElement and toElement.`,
      );
    if (!EVENT_CAUSES.has(String(value.cause)))
      errors.push(`events[${index}].cause is not supported.`);
  }
  if (value.type === "control_observation") {
    if (
      value.controlId !== "approval-control" ||
      typeof value.present !== "boolean" ||
      typeof value.keyboardReachable !== "boolean"
    )
      errors.push(`events[${index}] has an invalid approval observation.`);
  }
  if (value.type === "transcript_observation") {
    if (
      !["msg-user-001", "msg-assistant-001"].includes(String(value.nodeId)) ||
      typeof value.present !== "boolean" ||
      typeof value.stable !== "boolean" ||
      !nonEmpty(value.textChecksum) ||
      !/^fnv1a64:[0-9a-f]{16}$/.test(value.textChecksum)
    )
      errors.push(`events[${index}] has an invalid transcript observation.`);
  }
  if (value.type === "status_snapshot") {
    if (
      !Array.isArray(value.activeSemanticKeys) ||
      !value.activeSemanticKeys.every(
        (key) => typeof key === "string" && SEMANTIC_KEYS.has(key),
      )
    )
      errors.push(
        `events[${index}].activeSemanticKeys must contain supported semantic keys.`,
      );
  }
  if (value.type === "harness_event") {
    if (
      !HARNESS_EVENTS.has(String(value.name)) ||
      !EVENT_CAUSES.has(String(value.cause))
    )
      errors.push(`events[${index}] has an invalid harness event.`);
  }
  return errors;
}

export function parseImportedTrace(text: string): TraceParseResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { trace: null, errors: ["The selected file is not valid JSON."] };
  }
  if (!isRecord(value))
    return { trace: null, errors: ["The trace root must be an object."] };

  const errors: string[] = [];
  if (value.schemaVersion !== "1.1.0")
    errors.push("schemaVersion must be 1.1.0.");
  if (
    !nonEmpty(value.traceId) ||
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,79}$/.test(value.traceId)
  )
    errors.push("traceId must be 3–80 URL-safe characters.");
  if (!nonEmpty(value.capturedAt) || Number.isNaN(Date.parse(value.capturedAt)))
    errors.push("capturedAt must be an ISO date-time.");

  const contract = isRecord(value.contract) ? value.contract : {};
  if (contract.id !== STATECHORUS_CONTRACT.id)
    errors.push(`contract.id must be ${STATECHORUS_CONTRACT.id}.`);
  if (contract.version !== STATECHORUS_CONTRACT.version)
    errors.push(`contract.version must be ${STATECHORUS_CONTRACT.version}.`);

  const source = isRecord(value.source) ? value.source : {};
  if (!nonEmpty(source.appName)) errors.push("source.appName is required.");
  if (!nonEmpty(source.url)) errors.push("source.url is required.");
  if (!["local", "staging", "production"].includes(String(source.environment)))
    errors.push("source.environment must be local, staging, or production.");
  if (!nonEmpty(source.captureTool))
    errors.push("source.captureTool is required.");
  const captureEnvironment = isRecord(source.captureEnvironment)
    ? source.captureEnvironment
    : {};
  if (!nonEmpty(captureEnvironment.browserName))
    errors.push("source.captureEnvironment.browserName is required.");
  if (!nonEmpty(captureEnvironment.browserVersion))
    errors.push("source.captureEnvironment.browserVersion is required.");
  if (!nonEmpty(captureEnvironment.os))
    errors.push("source.captureEnvironment.os is required.");
  const viewport = isRecord(captureEnvironment.viewport)
    ? captureEnvironment.viewport
    : {};
  if (
    typeof viewport.width !== "number" ||
    viewport.width <= 0 ||
    typeof viewport.height !== "number" ||
    viewport.height <= 0
  )
    errors.push(
      "source.captureEnvironment.viewport must have positive dimensions.",
    );
  if (typeof captureEnvironment.reducedMotion !== "boolean")
    errors.push("source.captureEnvironment.reducedMotion must be boolean.");

  if (!Array.isArray(value.events) || value.events.length === 0) {
    errors.push("events must contain at least one observation.");
  } else if (value.events.length > 10_000) {
    errors.push("events must contain 10,000 observations or fewer.");
  } else {
    value.events.forEach((event, index) =>
      errors.push(...validateEvent(event, index)),
    );
  }

  if (errors.length > 0) return { trace: null, errors };
  return { trace: value as unknown as ImportedTrace, errors: [] };
}

export function importedTraceHash(trace: ImportedTrace): string {
  return stableHash(trace);
}
