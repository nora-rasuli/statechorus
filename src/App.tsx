import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { AiState } from "./domain/contract";
import type { ReviewerAnnotation } from "./engine/evidence";
import { createEvidence } from "./engine/evidence";
import type { Evaluation, EvaluationOptions } from "./engine/evaluate";
import { evaluateRun } from "./engine/evaluate";
import { ReplayPanel } from "./features/replay/ReplayPanel";
import {
  statusMutationsForState,
  type StatusMutation,
} from "./features/replay/replay-behavior";
import { ReviewPanel } from "./features/review/ReviewPanel";
import { SetupPanel } from "./features/setup/SetupPanel";
import { FIXTURES, isFixtureId, type FixtureId } from "./fixtures/corpus";
import { BrowserDomProvider } from "./providers/browser-dom";

declare global {
  interface Window {
    __STATECHORUS_TEST_FAULT__?: "invalid_run" | "inconclusive";
  }
}

type RunStatus =
  | "idle"
  | "running"
  | "awaiting_approval"
  | "complete"
  | "interrupted";

interface RenderedStatus {
  readonly state: AiState;
  readonly mutation: StatusMutation;
  readonly revision: string;
}

const provider = new BrowserDomProvider();
const PRESENTATION_TICK_MS = 70;

function initialFixture(): { id: FixtureId; error: string | null } {
  const requested = new URLSearchParams(window.location.search).get("fixture");
  if (!requested) return { id: "FIX-DEMO-BROKEN", error: null };
  if (!isFixtureId(requested))
    return {
      id: "FIX-DEMO-BROKEN",
      error: `Invalid fixture “${requested}”. A valid synthetic fixture was selected instead.`,
    };
  return { id: requested, error: null };
}

function browserEnvironment() {
  const userAgent = navigator.userAgent;
  const match =
    userAgent.match(/(Chrome|Chromium)\/([\d.]+)/) ??
    userAgent.match(/(Firefox)\/([\d.]+)/) ??
    userAgent.match(/Version\/([\d.]+).*Safari/);
  return {
    browserName: match?.[1] ?? "Browser",
    browserVersion: match?.[2] ?? "unreported",
    os: navigator.platform || "unreported",
    viewport: { width: window.innerWidth, height: window.innerHeight },
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches,
  };
}

function latestRenderedStatus(
  fixture: (typeof FIXTURES)[FixtureId],
  currentState: AiState | null,
  observationStep: number,
): RenderedStatus | null {
  if (!currentState) return null;
  const currentIndex = fixture.path.indexOf(currentState);
  for (let index = currentIndex; index >= 0; index -= 1) {
    const state = fixture.path[index];
    if (!state) continue;
    const mutations = statusMutationsForState(fixture, state);
    if (mutations.length === 0) continue;
    const mutationIndex =
      index === currentIndex
        ? Math.min(observationStep, mutations.length - 1)
        : mutations.length - 1;
    const mutation = mutations[mutationIndex];
    if (!mutation) continue;
    return {
      state,
      mutation,
      revision: `${state}-${mutationIndex}`,
    };
  }
  return null;
}

function injectedEvaluationOptions(): EvaluationOptions {
  if (!navigator.webdriver) return {};
  if (window.__STATECHORUS_TEST_FAULT__ === "invalid_run") {
    return { harnessCrashed: true };
  }
  if (window.__STATECHORUS_TEST_FAULT__ === "inconclusive") {
    return { requiredSignalMissing: true };
  }
  return {};
}

export default function App() {
  const first = useMemo(initialFixture, []);
  const [fixtureId, setFixtureId] = useState<FixtureId>(first.id);
  const [fixtureError, setFixtureError] = useState(first.error);
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [stateIndex, setStateIndex] = useState(-1);
  const [observationStep, setObservationStep] = useState(0);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [annotation, setAnnotation] = useState<
    ReviewerAnnotation | undefined
  >();
  const [attempt, setAttempt] = useState(0);
  const [startedAt, setStartedAt] = useState("");
  const [completedAt, setCompletedAt] = useState("");
  const runButtonRef = useRef<HTMLButtonElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const fixture = FIXTURES[fixtureId];
  const currentState = stateIndex >= 0 ? fixture.path[stateIndex] : null;
  const visitedStates =
    stateIndex >= 0 ? fixture.path.slice(0, stateIndex + 1) : [];
  const renderedStatus = latestRenderedStatus(
    fixture,
    currentState,
    observationStep,
  );

  useLayoutEffect(() => {
    if (
      (runStatus === "running" || runStatus === "awaiting_approval") &&
      currentState
    ) {
      provider.observe(document.body);
    }
  }, [currentState, observationStep, runStatus]);

  useEffect(() => {
    if (runStatus !== "running" || !currentState) return;
    if (currentState === "approval") {
      setRunStatus("awaiting_approval");
      return;
    }

    const mutations = statusMutationsForState(fixture, currentState);
    if (observationStep < mutations.length - 1) {
      const timer = window.setTimeout(
        () => setObservationStep((step) => step + 1),
        PRESENTATION_TICK_MS,
      );
      return () => window.clearTimeout(timer);
    }

    if (currentState === "complete") {
      const timer = window.setTimeout(() => {
        provider.recordHarnessEvent("run_completed", "complete", "system");
        const rawEvents = provider.capture();
        provider.stop();
        const nextEvaluation = evaluateRun(
          fixture,
          rawEvents,
          injectedEvaluationOptions(),
        );
        setEvaluation(nextEvaluation);
        setCompletedAt(new Date().toISOString());
        setRunStatus("complete");
      }, PRESENTATION_TICK_MS);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setObservationStep(0);
      setStateIndex((index) => index + 1);
    }, PRESENTATION_TICK_MS);
    return () => window.clearTimeout(timer);
  }, [currentState, fixture, observationStep, runStatus]);

  useEffect(() => {
    if (runStatus === "awaiting_approval" && fixture.faults.focusTheft) {
      transcriptRef.current?.focus();
    }
  }, [fixture.faults.focusTheft, runStatus]);

  useEffect(() => () => provider.stop(), []);

  function updateUrl(id: FixtureId) {
    const url = new URL(window.location.href);
    url.pathname = "/demo";
    url.searchParams.set("fixture", id);
    window.history.replaceState({}, "", url);
  }

  function selectFixture(id: FixtureId) {
    provider.stop();
    setFixtureId(id);
    setFixtureError(null);
    setRunStatus("idle");
    setStateIndex(-1);
    setObservationStep(0);
    setEvaluation(null);
    setAnnotation(undefined);
    updateUrl(id);
  }

  function beginRun() {
    provider.start(document.body, "run-control");
    provider.recordHarnessEvent("run_started", "submitted", "user");
    setAttempt((value) => value + 1);
    setStartedAt(new Date().toISOString());
    setCompletedAt("");
    setEvaluation(null);
    setAnnotation(undefined);
    setObservationStep(0);
    setStateIndex(0);
    setRunStatus("running");
  }

  function approve() {
    provider.recordHarnessEvent("approval_activated", "approval", "user");
    provider.setNextFocusCause("user");
    setObservationStep(0);
    setStateIndex(4);
    setRunStatus("running");
    window.requestAnimationFrame(() => composerRef.current?.focus());
  }

  function stopRun() {
    if (!currentState) return;
    provider.recordHarnessEvent("run_interrupted", currentState, "user");
    const rawEvents = provider.capture();
    provider.stop();
    setEvaluation(evaluateRun(fixture, rawEvents, { interrupted: true }));
    setCompletedAt(new Date().toISOString());
    setRunStatus("interrupted");
  }

  function reset() {
    provider.stop();
    setRunStatus("idle");
    setStateIndex(-1);
    setObservationStep(0);
    setEvaluation(null);
    setAnnotation(undefined);
    window.requestAnimationFrame(() => runButtonRef.current?.focus());
  }

  function runEquivalent(id: FixtureId) {
    runButtonRef.current?.focus({ preventScroll: true });
    selectFixture(id);
    window.setTimeout(beginRun, 0);
  }

  const evidence = useMemo(() => {
    if (!evaluation) return null;
    return createEvidence({
      fixture,
      provider: provider.identity,
      environment: browserEnvironment(),
      runId: `run-${fixture.id.toLowerCase()}-${attempt.toString().padStart(3, "0")}`,
      attemptId: `attempt-${attempt.toString().padStart(3, "0")}`,
      startedAt: startedAt || new Date(0).toISOString(),
      completedAt: completedAt || new Date().toISOString(),
      rawEvents: evaluation.rawEvents,
      normalizedEvents: evaluation.normalizedEvents,
      episodes: evaluation.episodes,
      findings: evaluation.findings,
      result: evaluation.result,
      resultCopy: evaluation.resultCopy,
      annotation,
    });
  }, [annotation, attempt, completedAt, evaluation, fixture, startedAt]);

  const statusMessage =
    runStatus === "complete"
      ? (evaluation?.resultCopy ?? "Replay complete.")
      : runStatus === "interrupted"
        ? "Replay interrupted. Partial evidence retained."
        : runStatus === "running" || runStatus === "awaiting_approval"
          ? (renderedStatus?.mutation.text ??
            `Synthetic replay state: ${currentState?.replace("_", " ") ?? "starting"}.`)
          : "Ready to run a synthetic fixture.";

  const observedStatus =
    runStatus === "running" || runStatus === "awaiting_approval"
      ? renderedStatus
      : null;

  return (
    <>
      <header className="site-header">
        <a className="wordmark" href="/demo?fixture=FIX-DEMO-BROKEN">
          <span className="wordmark-glyph" aria-hidden="true">
            SC
          </span>
          <span>
            <strong>StateChorus</strong>
            <small>AI interface accessibility contract testing</small>
          </span>
        </a>
        <span className="build-badge">Package 1.0 · local/static</span>
      </header>

      <div
        className="status-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-observable-status
        data-status-revision={
          observedStatus?.revision ?? `${runStatus}-${attempt}`
        }
        data-status-state={observedStatus?.state}
        data-semantic-key={observedStatus?.mutation.semanticKey}
      >
        <span key={observedStatus?.revision ?? `${runStatus}-${attempt}`}>
          {statusMessage}
        </span>
      </div>

      <main id="main-content" className="page-shell">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">Release evidence workbench</p>
          <h1 id="page-title">Follow the state. Keep the authority honest.</h1>
          <p className="hero-copy">
            Replay a versioned AI-turn contract, inspect captured local DOM
            observations, and carry complete evidence into native review.
          </p>
          <div
            className="authority-key"
            aria-label="Evidence authority summary"
          >
            <span>
              <i aria-hidden="true" className="dot local" />
              Local: event order, DOM focus, controls, transcript, mutations
            </span>
            <span>
              <i aria-hidden="true" className="dot native" />
              Native: spoken output and assistive-technology behavior
            </span>
            <span>
              <i aria-hidden="true" className="dot human" />
              Human: usability, release, and conformance decisions
            </span>
          </div>
        </section>

        {fixtureError ? (
          <div
            className="error-summary"
            role="alert"
            data-result="invalid_fixture"
          >
            <strong>Invalid fixture</strong>
            <p>{fixtureError}</p>
            <p>Select or repair a valid, versioned fixture before running.</p>
            <button
              className="button secondary"
              type="button"
              onClick={() => setFixtureError(null)}
            >
              Use guided fixture
            </button>
          </div>
        ) : null}

        <SetupPanel
          fixture={fixture}
          onSelect={selectFixture}
          onRun={beginRun}
          runButtonRef={runButtonRef}
          disabled={
            runStatus === "running" || runStatus === "awaiting_approval"
          }
        />

        <ReplayPanel
          fixture={fixture}
          currentState={currentState}
          visitedStates={visitedStates}
          observationStep={observationStep}
          runStatus={runStatus}
          onApprove={approve}
          onStop={stopRun}
          composerRef={composerRef}
          transcriptRef={transcriptRef}
        />

        {evaluation && evidence ? (
          <ReviewPanel
            fixture={fixture}
            evaluation={evaluation}
            evidence={evidence}
            resultHeadingRef={resultHeadingRef}
            onReviewFocus={() => resultHeadingRef.current?.focus()}
            onRerunEquivalent={runEquivalent}
            onReset={reset}
            onAnnotation={setAnnotation}
          />
        ) : null}
      </main>

      <footer className="site-footer">
        <p>
          Bundled synthetic fixtures only. No uploads, telemetry,
          authentication, arbitrary URLs, or remote model calls.
        </p>
        <p>
          Native assistive-technology and disabled-user testing: not run in this
          MVP.
        </p>
      </footer>
    </>
  );
}
