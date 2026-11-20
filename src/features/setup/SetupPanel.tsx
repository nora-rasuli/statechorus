import type { FixtureDefinition, FixtureId } from "../../fixtures/corpus";
import { SCENARIO } from "../../fixtures/corpus";

interface SetupPanelProps {
  readonly fixture: FixtureDefinition;
  readonly onSelect: (id: FixtureId) => void;
  readonly onRun: () => void;
  readonly runButtonRef: React.RefObject<HTMLButtonElement>;
  readonly disabled: boolean;
}

export function SetupPanel({
  fixture,
  onSelect,
  onRun,
  runButtonRef,
  disabled,
}: SetupPanelProps) {
  return (
    <section
      className="workbench-section setup-panel"
      aria-labelledby="setup-heading"
    >
      <div className="section-kicker">Sample / Try the evaluator</div>
      <div className="section-heading-row">
        <div>
          <h2 id="setup-heading">Try a bundled sample</h2>
          <p>
            Scenario <code>{SCENARIO.id}</code> · release{" "}
            <code>{SCENARIO.releaseId}</code>
          </p>
        </div>
        <span className="synthetic-stamp">Sample data</span>
      </div>

      <div className="disclosure" data-testid="disclosure">
        <span aria-hidden="true">◇</span>
        <p>
          <strong>
            A self-directed concept project using synthetic AI interaction
            fixtures.
          </strong>{" "}
          Local browser evidence does not represent native screen-reader output
          or WCAG conformance.
        </p>
      </div>

      <div
        className="contract-strip"
        aria-label="Seven-state executable contract"
        tabIndex={0}
      >
        {fixture.path.map((state, index) => (
          <span key={state} className="contract-state">
            <span>{state.replace("_", " ")}</span>
            {index < fixture.path.length - 1 ? (
              <span aria-hidden="true">→</span>
            ) : null}
          </span>
        ))}
      </div>

      <fieldset className="fixture-choice">
        <legend>Fixture equivalent</legend>
        <label
          className={
            fixture.id === "FIX-DEMO-BROKEN"
              ? "choice-card selected"
              : "choice-card"
          }
        >
          <input
            type="radio"
            name="fixture"
            value="FIX-DEMO-BROKEN"
            checked={fixture.id === "FIX-DEMO-BROKEN"}
            onChange={() => onSelect("FIX-DEMO-BROKEN")}
            disabled={disabled}
          />
          <span>
            <strong>Broken build</strong>
            <small>
              Token flood, repeated stall, and focus ownership change.
            </small>
          </span>
        </label>
        <label
          className={
            fixture.id === "FIX-DEMO-FIXED"
              ? "choice-card selected"
              : "choice-card"
          }
        >
          <input
            type="radio"
            name="fixture"
            value="FIX-DEMO-FIXED"
            checked={fixture.id === "FIX-DEMO-FIXED"}
            onChange={() => onSelect("FIX-DEMO-FIXED")}
            disabled={disabled}
          />
          <span>
            <strong>Corrected build</strong>
            <small>
              Equivalent scenario with bounded local observable events.
            </small>
          </span>
        </label>
      </fieldset>

      <div className="setup-actions">
        <button
          ref={runButtonRef}
          id="run-control"
          className="button primary"
          type="button"
          onClick={() => {
            if (!disabled) onRun();
          }}
          aria-disabled={disabled}
        >
          Run {fixture.variant === "broken" ? "broken" : "fixed"} fixture
        </button>
        <p className="microcopy">
          No sign-in · no network runtime · no model · $0 service cost
        </p>
      </div>
    </section>
  );
}
