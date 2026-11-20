import { useMemo, useState } from "react";
import type {
  EvidenceArtifact,
  ReviewerAnnotation,
  ReviewerDisposition,
} from "../../engine/evidence";
import {
  serializeEvidenceJson,
  serializeEvidenceMarkdown,
} from "../../engine/evidence";
import { expectedEpisodes } from "../../engine/episodes";
import type { Evaluation } from "../../engine/evaluate";
import type { FixtureDefinition, FixtureId } from "../../fixtures/corpus";
import { NATIVE_LIMITATION } from "../../domain/events";
import { ResultNotice } from "./ResultNotice";

interface ReviewPanelProps {
  readonly fixture?: FixtureDefinition;
  readonly source: {
    readonly id: string;
    readonly version: string;
    readonly kind: "sample_fixture" | "user_trace";
  };
  readonly evaluation: Evaluation;
  readonly evidence: EvidenceArtifact;
  readonly resultHeadingRef: React.RefObject<HTMLHeadingElement>;
  readonly onReviewFocus: () => void;
  readonly onRerunEquivalent?: (id: FixtureId) => void;
  readonly onReset: () => void;
  readonly onAnnotation: (annotation: ReviewerAnnotation | undefined) => void;
}

function downloadFile(filename: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ReviewPanel({
  fixture,
  source,
  evaluation,
  evidence,
  resultHeadingRef,
  onReviewFocus,
  onRerunEquivalent,
  onReset,
  onAnnotation,
}: ReviewPanelProps) {
  const [preview, setPreview] = useState<"json" | "markdown">("json");
  const [annotationText, setAnnotationText] = useState("");
  const [disposition, setDisposition] = useState<ReviewerDisposition>(
    evaluation.result === "contract_violation"
      ? "not_ready"
      : "requires_native_verification",
  );
  const json = useMemo(() => serializeEvidenceJson(evidence), [evidence]);
  const markdown = useMemo(
    () => serializeEvidenceMarkdown(evidence),
    [evidence],
  );
  const expected = expectedEpisodes();

  function saveAnnotation() {
    const trimmed = annotationText.trim();
    onAnnotation(
      trimmed
        ? { note: trimmed, disposition, recordedAt: new Date().toISOString() }
        : undefined,
    );
  }

  return (
    <section
      className="workbench-section review-panel"
      aria-labelledby="result-heading"
    >
      <div className="section-kicker">03 / Review</div>
      <div className="review-heading-row">
        <div>
          <h2 ref={resultHeadingRef} id="result-heading" tabIndex={-1}>
            Review local observable evidence
          </h2>
          <p>
            <code>
              {source.id}@{source.version}
            </code>{" "}
            · {evidence.integrityHash}
          </p>
        </div>
        <button
          className="button secondary"
          type="button"
          onClick={onReviewFocus}
        >
          Review result
        </button>
      </div>

      <ResultNotice result={evaluation.result} copy={evaluation.resultCopy} />

      <div className="authority-boundary">
        <span className="authority-tag">Authority boundary</span>
        <p>{NATIVE_LIMITATION}</p>
      </div>

      <div className="review-actions">
        {fixture?.id === "FIX-DEMO-BROKEN" && onRerunEquivalent ? (
          <button
            className="button primary"
            type="button"
            onClick={() => onRerunEquivalent("FIX-DEMO-FIXED")}
          >
            Run fixed fixture
          </button>
        ) : fixture && onRerunEquivalent ? (
          <button
            className="button secondary"
            type="button"
            onClick={() => onRerunEquivalent("FIX-DEMO-BROKEN")}
          >
            Compare broken fixture
          </button>
        ) : null}
        <button className="button quiet" type="button" onClick={onReset}>
          Reset review
        </button>
      </div>

      <section className="review-subsection" aria-labelledby="findings-heading">
        <div className="subsection-heading">
          <h3 id="findings-heading">Findings</h3>
          <span>
            {evaluation.findings.length} local{" "}
            {evaluation.findings.length === 1 ? "finding" : "findings"}
          </span>
        </div>
        {evaluation.findings.length ? (
          <ul className="finding-list">
            {evaluation.findings.map((finding) => (
              <li key={finding.key}>
                <span className={`severity severity-${finding.severity}`}>
                  {finding.severity}
                </span>
                <div>
                  <h4>{finding.key}</h4>
                  <p>{finding.summary}</p>
                  <p className="rule-copy">Rule: {finding.rule}</p>
                  <p className="evidence-pointer">
                    Raw sequences:{" "}
                    {finding.evidenceSequences.join(", ") ||
                      "required event absent"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">
            No local contract violations were found within the provider’s
            declared observable capabilities.
          </p>
        )}
      </section>

      <section className="review-subsection" aria-labelledby="timeline-heading">
        <div className="subsection-heading">
          <h3 id="timeline-heading">Expected and actual semantic timeline</h3>
          <span>{evaluation.normalizedEvents.length} normalized events</span>
        </div>
        <ol className="timeline-list">
          {expected.map((episode) => {
            const actual = evaluation.episodes.find(
              (candidate) => candidate.state === episode.state,
            );
            const hasFinding = evaluation.findings.some(
              (finding) => finding.state === episode.state,
            );
            return (
              <li
                key={episode.state}
                className={hasFinding ? "timeline-failed" : "timeline-observed"}
              >
                <div className="timeline-state">
                  <span aria-hidden="true">{hasFinding ? "!" : "✓"}</span>
                  {episode.state.replace("_", " ")}
                </div>
                <div>
                  <span className="timeline-label">Expected</span>
                  <p>{episode.summary}</p>
                </div>
                <div>
                  <span className="timeline-label">Observed</span>
                  <p>{actual?.summary ?? "No episode observed."}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section
        className="review-subsection provenance"
        aria-labelledby="provenance-heading"
      >
        <div className="subsection-heading">
          <h3 id="provenance-heading">Provenance</h3>
          <span>Complete lineage</span>
        </div>
        <dl>
          <div>
            <dt>Contract</dt>
            <dd>
              {evidence.contract.id}@{evidence.contract.version}
              <br />
              <code>{evidence.contract.hash}</code>
            </dd>
          </div>
          <div>
            <dt>Input</dt>
            <dd>
              {evidence.input.id}@{evidence.input.version}
              <br />
              <code>{evidence.input.hash}</code>
              <br />
              {source.kind === "user_trace"
                ? "User-supplied trace"
                : "Bundled sample"}
            </dd>
          </div>
          <div>
            <dt>Adapter</dt>
            <dd>
              {evidence.provider.name}@{evidence.provider.version}
              <br />
              {evidence.provider.authority}
            </dd>
          </div>
          <div>
            <dt>Capture environment</dt>
            <dd>
              {evidence.environment.browserName}{" "}
              {evidence.environment.browserVersion}
              <br />
              {evidence.environment.viewport.width}×
              {evidence.environment.viewport.height}
            </dd>
          </div>
          <div>
            <dt>Analysis environment</dt>
            <dd>
              {evidence.analysisEnvironment.browserName}{" "}
              {evidence.analysisEnvironment.browserVersion}
              <br />
              {evidence.analysisEnvironment.viewport.width}×
              {evidence.analysisEnvironment.viewport.height}
            </dd>
          </div>
          <div>
            <dt>Run</dt>
            <dd>
              <code>{evidence.run.runId}</code>
              <br />
              <code>{evidence.run.attemptId}</code>
            </dd>
          </div>
          <div>
            <dt>Integrity</dt>
            <dd>
              <code>{evidence.integrityHash}</code>
            </dd>
          </div>
        </dl>
      </section>

      <details className="contract-inspector">
        <summary>Inspect contract and provider limits</summary>
        <div className="details-body">
          <h3>Declared local capabilities</h3>
          <ul>
            {evidence.provider.capabilities.map((capability) => (
              <li key={capability}>{capability.replaceAll("_", " ")}</li>
            ))}
          </ul>
          <h3>Unsupported conclusions</h3>
          <ul>
            {evidence.provider.unsupported.map((capability) => (
              <li key={capability}>{capability.replaceAll("_", " ")}</li>
            ))}
          </ul>
        </div>
      </details>

      <details className="annotation-panel">
        <summary>Add conservative reviewer context</summary>
        <div className="details-body">
          <p>
            Annotations can add context or make the disposition more
            conservative. They cannot change raw evidence or declare a native or
            WCAG pass.
          </p>
          <label htmlFor="reviewer-note">Reviewer note</label>
          <textarea
            id="reviewer-note"
            rows={3}
            value={annotationText}
            onChange={(event) => setAnnotationText(event.target.value)}
          />
          <label htmlFor="reviewer-disposition">Disposition</label>
          <select
            id="reviewer-disposition"
            value={disposition}
            onChange={(event) =>
              setDisposition(event.target.value as ReviewerDisposition)
            }
          >
            <option value="not_ready">Not ready</option>
            <option value="requires_native_verification">
              Requires native verification
            </option>
          </select>
          <button
            className="button secondary"
            type="button"
            onClick={saveAnnotation}
          >
            Save annotation to export
          </button>
        </div>
      </details>

      <section
        className="review-subsection evidence-preview"
        aria-labelledby="evidence-heading"
      >
        <div className="subsection-heading">
          <h3 id="evidence-heading">Evidence preview and export</h3>
          <span>Immutable raw + derived evidence</span>
        </div>
        <div
          className="preview-controls"
          role="group"
          aria-label="Evidence format"
        >
          <button
            className={
              preview === "json" ? "button segment active" : "button segment"
            }
            type="button"
            onClick={() => setPreview("json")}
          >
            JSON
          </button>
          <button
            className={
              preview === "markdown"
                ? "button segment active"
                : "button segment"
            }
            type="button"
            onClick={() => setPreview("markdown")}
          >
            Markdown
          </button>
        </div>
        <pre aria-label={`${preview} evidence preview`} tabIndex={0}>
          <code>{preview === "json" ? json : markdown}</code>
        </pre>
        <div className="export-actions">
          <button
            className="button secondary"
            type="button"
            onClick={() =>
              downloadFile(
                `${source.id}-evidence.json`,
                json,
                "application/json",
              )
            }
          >
            Download JSON
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() =>
              downloadFile(
                `${source.id}-evidence.md`,
                markdown,
                "text/markdown",
              )
            }
          >
            Download Markdown
          </button>
        </div>
      </section>
    </section>
  );
}
