/**
 * StateChorus Playwright capture helper v1.0.0
 *
 * Instrument the page under test with:
 * - data-statechorus-state="submitted|thinking|tool_call|approval|streaming|stalled|complete"
 *   on <html> or <body>
 * - data-statechorus-semantic-key on observable aria-live status nodes
 * - data-statechorus-approval on the approval button
 * - data-statechorus-transcript="assistant" on the final assistant message
 *
 * Call installStateChorusCapture(page) before page.goto(), exercise one full
 * turn, then call saveStateChorusTrace(page, metadata, outputPath).
 */
import type { Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

interface TraceMetadata {
  traceId: string;
  appName: string;
  url: string;
  environment: "local" | "staging" | "production";
}

export async function installStateChorusCapture(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const target = window as typeof window & {
      __stateChorusEvents?: Array<Record<string, unknown>>;
      __stateChorusStartedAt?: number;
      __stateChorusApprovalObserved?: boolean;
    };
    target.__stateChorusEvents = [];
    target.__stateChorusStartedAt = performance.now();
    target.__stateChorusApprovalObserved = false;
    let sequence = 0;
    let state = "idle";
    let activeElement = "none";
    let nextFocusCause: "system" | "user" = "system";

    const record = (event: Record<string, unknown>) => {
      target.__stateChorusEvents?.push({
        sequence: ++sequence,
        virtualMs: Math.round(
          performance.now() - (target.__stateChorusStartedAt ?? 0),
        ),
        state,
        source: "browser_dom",
        ...event,
      });
    };
    const elementId = (element: Element | null) =>
      element?.id ||
      element?.getAttribute("data-statechorus-id") ||
      element?.getAttribute("data-testid") ||
      element?.tagName.toLowerCase() ||
      "none";
    const currentState = () =>
      document.body?.dataset.statechorusState ||
      document.documentElement.dataset.statechorusState ||
      "idle";

    window.addEventListener(
      "pointerdown",
      () => {
        nextFocusCause = "user";
      },
      true,
    );
    window.addEventListener(
      "keydown",
      () => {
        nextFocusCause = "user";
      },
      true,
    );
    window.addEventListener(
      "focusin",
      (event) => {
        const next = elementId(event.target as Element);
        record({
          type: "focus_change",
          fromElement: activeElement,
          toElement: next,
          cause: nextFocusCause,
        });
        activeElement = next;
        nextFocusCause = "system";
      },
      true,
    );

    window.addEventListener("DOMContentLoaded", () => {
      state = currentState();
      activeElement = elementId(document.activeElement);
      const observer = new MutationObserver((mutations) => {
        const nextState = currentState();
        if (nextState !== state) {
          const previousState = state;
          state = nextState;
          record({
            type: "state_transition",
            from: previousState,
            to: nextState,
          });
        }
        const changed = new Set<Element>();
        for (const mutation of mutations) {
          if (mutation.target instanceof Element) changed.add(mutation.target);
          if (mutation.target.parentElement)
            changed.add(mutation.target.parentElement);
        }
        for (const element of changed) {
          const live = element.closest(
            "[aria-live][data-statechorus-semantic-key]",
          );
          if (live) {
            record({
              type: "live_region_mutation",
              semanticKey: live.getAttribute("data-statechorus-semantic-key"),
              text: live.textContent?.trim() || "",
              politeness: "polite",
            });
          }
        }
        const approval = document.querySelector<HTMLElement>(
          "[data-statechorus-approval]",
        );
        if (approval && !target.__stateChorusApprovalObserved) {
          target.__stateChorusApprovalObserved = true;
          record({
            type: "control_observation",
            controlId: "approval-control",
            present: true,
            keyboardReachable:
              !approval.hasAttribute("disabled") && approval.tabIndex >= 0,
          });
        }
      });
      observer.observe(document.documentElement, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: [
          "data-statechorus-state",
          "data-statechorus-semantic-key",
          "aria-live",
        ],
      });
    });
  });
}

export async function saveStateChorusTrace(
  page: Page,
  metadata: TraceMetadata,
  outputPath: string,
): Promise<void> {
  const capture = await page.evaluate(() => {
    const target = window as typeof window & {
      __stateChorusEvents?: Array<Record<string, unknown>>;
    };
    const rows = target.__stateChorusEvents ?? [];
    const state =
      document.body.dataset.statechorusState ||
      document.documentElement.dataset.statechorusState ||
      "complete";
    if (!rows.some((row) => row.type === "control_observation")) {
      const approval = document.querySelector<HTMLElement>(
        "[data-statechorus-approval]",
      );
      rows.push({
        sequence: rows.length + 1,
        virtualMs: Math.round(performance.now()),
        state: "approval",
        source: "browser_dom",
        type: "control_observation",
        controlId: "approval-control",
        present: Boolean(approval),
        keyboardReachable: Boolean(
          approval &&
            !approval.hasAttribute("disabled") &&
            approval.tabIndex >= 0,
        ),
      });
    }
    const transcript = document.querySelector<HTMLElement>(
      '[data-statechorus-transcript="assistant"]',
    );
    const value = JSON.stringify(transcript?.textContent?.trim() || "");
    let hash = 0xcbf29ce484222325n;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= BigInt(value.charCodeAt(index));
      hash = BigInt.asUintN(64, hash * 0x100000001b3n);
    }
    rows.push({
      sequence: rows.length + 1,
      virtualMs: Math.round(performance.now()),
      state,
      source: "browser_dom",
      type: "transcript_observation",
      nodeId: "msg-assistant-001",
      present: Boolean(transcript),
      textChecksum: `fnv1a64:${hash.toString(16).padStart(16, "0")}`,
      stable: Boolean(transcript),
    });
    rows.push({
      sequence: rows.length + 1,
      virtualMs: Math.round(performance.now()),
      state,
      source: "browser_dom",
      type: "status_snapshot",
      activeSemanticKeys: Array.from(
        document.querySelectorAll<HTMLElement>(
          "[aria-live][data-statechorus-semantic-key]",
        ),
      )
        .filter((element) => element.textContent?.trim())
        .map((element) => element.dataset.statechorusSemanticKey),
    });
    const userAgent = navigator.userAgent;
    const browserMatch =
      userAgent.match(/(Chrome|Chromium)\/([\d.]+)/) ??
      userAgent.match(/(Firefox)\/([\d.]+)/) ??
      userAgent.match(/Version\/([\d.]+).*Safari/);
    return {
      events: rows,
      environment: {
        browserName: browserMatch?.[1] ?? "Browser",
        browserVersion: browserMatch?.[2] ?? "unreported",
        os: navigator.platform || "unreported",
        viewport: { width: window.innerWidth, height: window.innerHeight },
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
          .matches,
      },
    };
  });

  const trace = {
    schemaVersion: "1.1.0",
    traceId: metadata.traceId,
    capturedAt: new Date().toISOString(),
    contract: { id: "CONTRACT-AI-TURN-001", version: "1.0.0" },
    source: {
      appName: metadata.appName,
      url: metadata.url,
      environment: metadata.environment,
      captureTool: "statechorus-playwright-capture@1.0.0",
      captureEnvironment: capture.environment,
    },
    events: capture.events,
  };
  await writeFile(outputPath, `${JSON.stringify(trace, null, 2)}\n`, "utf8");
}
