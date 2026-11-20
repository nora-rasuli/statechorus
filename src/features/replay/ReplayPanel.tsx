import type { AiState } from "../../domain/contract";
import type { FixtureDefinition } from "../../fixtures/corpus";
import { SCENARIO } from "../../fixtures/corpus";
import { responseForState } from "./replay-behavior";

interface ReplayPanelProps {
  readonly fixture: FixtureDefinition;
  readonly currentState: AiState | null;
  readonly visitedStates: readonly AiState[];
  readonly observationStep: number;
  readonly runStatus:
    | "idle"
    | "running"
    | "awaiting_approval"
    | "complete"
    | "interrupted";
  readonly onApprove: () => void;
  readonly onStop: () => void;
  readonly composerRef: React.RefObject<HTMLTextAreaElement>;
  readonly transcriptRef: React.RefObject<HTMLDivElement>;
}

export function ReplayPanel({
  fixture,
  currentState,
  visitedStates,
  observationStep,
  runStatus,
  onApprove,
  onStop,
  composerRef,
  transcriptRef,
}: ReplayPanelProps) {
  const streamingResponse = responseForState(currentState, observationStep);
  const completedResponse =
    currentState === "complete" ? SCENARIO.finalResponse : "";
  const response = completedResponse || streamingResponse;
  const transcriptId =
    currentState === "complete" && fixture.faults.transcriptInstability
      ? "msg-assistant-replacement"
      : SCENARIO.assistantMessageId;
  return (
    <section
      className="workbench-section replay-panel"
      aria-labelledby="replay-heading"
      data-replay-state={currentState ?? "idle"}
      data-observation-step={observationStep}
    >
      <div className="section-kicker">02 / Replay</div>
      <div className="section-heading-row">
        <div>
          <h2 id="replay-heading">Observe the contract lifecycle</h2>
          <p>
            Fixture adapter presents discrete synthetic updates on a virtual
            clock.
          </p>
        </div>
        <span className={`phase-pill phase-${currentState ?? "idle"}`}>
          {(currentState ?? "idle").replace("_", " ")}
        </span>
      </div>

      <div className="replay-grid">
        <div
          className="synthetic-surface"
          aria-label="Synthetic fixture surface"
        >
          <div
            ref={transcriptRef}
            id="synthetic-transcript"
            className="transcript"
            tabIndex={-1}
          >
            <article
              className="message user-message"
              aria-labelledby="user-message-label"
            >
              <div id="user-message-label" className="message-label">
                Synthetic request
              </div>
              <p id={SCENARIO.userMessageId}>{SCENARIO.prompt}</p>
            </article>
            {response ? (
              <article
                className="message assistant-message"
                aria-labelledby="assistant-message-label"
              >
                <div id="assistant-message-label" className="message-label">
                  Synthetic assistant
                </div>
                <p
                  id={transcriptId}
                  data-transcript-id={transcriptId}
                  data-transcript-stable={
                    currentState === "complete" &&
                    !fixture.faults.transcriptInstability
                      ? "true"
                      : "false"
                  }
                >
                  {response}
                </p>
              </article>
            ) : null}
          </div>

          {currentState === "approval" &&
          (runStatus === "running" || runStatus === "awaiting_approval") ? (
            <div className="approval-card" aria-labelledby="approval-heading">
              <span className="approval-mark" aria-hidden="true">
                ↳
              </span>
              <div>
                <h3 id="approval-heading">Permission checkpoint</h3>
                <p>
                  <code>{SCENARIO.toolName}</code> requests one-time access to
                  bundled synthetic data.
                </p>
                <button
                  id="approval-control"
                  data-observable-control="approval-control"
                  className="button primary"
                  type="button"
                  onClick={onApprove}
                  tabIndex={fixture.faults.unreachableApproval ? -1 : undefined}
                >
                  {SCENARIO.approvalLabel}
                </button>
              </div>
            </div>
          ) : null}

          <label className="composer-label" htmlFor="synthetic-composer">
            Synthetic composer
          </label>
          <textarea
            ref={composerRef}
            id="synthetic-composer"
            value="Fixture input is locked during deterministic replay."
            readOnly
            rows={2}
          />
          {currentState === "complete" && fixture.faults.staleStatus ? (
            <p className="stale-status-residue" data-persisted-status="stalled">
              Still working on the synthetic fixture.
            </p>
          ) : null}
        </div>

        <div className="sequence-rail" aria-labelledby="sequence-heading">
          <h3 id="sequence-heading">State sequence</h3>
          <ol>
            {fixture.path.map((state) => {
              const visited = visitedStates.includes(state);
              const current = currentState === state;
              return (
                <li
                  key={state}
                  className={
                    current ? "current" : visited ? "visited" : "pending"
                  }
                >
                  <span className="state-marker" aria-hidden="true">
                    {visited ? "✓" : "·"}
                  </span>
                  <span>{state.replace("_", " ")}</span>
                  <span className="sr-only">
                    {current
                      ? "Current state"
                      : visited
                        ? "Observed"
                        : "Pending"}
                  </span>
                </li>
              );
            })}
          </ol>
          {runStatus === "running" || runStatus === "awaiting_approval" ? (
            <button className="button quiet" type="button" onClick={onStop}>
              Stop and retain partial log
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
