import { useState } from "react";
import type { ImportedTrace } from "../../domain/imported-trace";
import { parseImportedTrace } from "../../domain/imported-trace";

interface TraceImportPanelProps {
  readonly disabled: boolean;
  readonly onImport: (trace: ImportedTrace) => void;
}

export function TraceImportPanel({
  disabled,
  onImport,
}: TraceImportPanelProps) {
  const [errors, setErrors] = useState<readonly string[]>([]);
  const [filename, setFilename] = useState("");

  async function importFile(file: File | undefined) {
    if (!file) return;
    setFilename(file.name);
    if (file.size > 5_000_000) {
      setErrors(["Trace files must be 5 MB or smaller."]);
      return;
    }
    const result = parseImportedTrace(await file.text());
    setErrors(result.errors);
    if (result.trace) onImport(result.trace);
  }

  return (
    <section
      className="workbench-section import-panel"
      aria-labelledby="import-heading"
    >
      <div className="section-kicker">01 / Bring a real trace</div>
      <div className="section-heading-row">
        <div>
          <h2 id="import-heading">Evaluate your own AI interface</h2>
          <p>
            Capture observable behavior in Playwright, then analyze the JSON
            locally in this browser. Your trace is never uploaded.
          </p>
        </div>
        <span className="input-stamp">User supplied</span>
      </div>

      <ol className="import-steps">
        <li>Add the capture helper to a Playwright test for your interface.</li>
        <li>
          Exercise one complete AI turn, including approval when relevant.
        </li>
        <li>Import the trace and export a reviewable evidence file.</li>
      </ol>

      <div className="import-actions">
        <a
          className="button secondary"
          href="/statechorus-playwright-capture.ts"
          download
        >
          Download capture helper
        </a>
        <label className="button primary file-control">
          <span>Import trace JSON</span>
          <input
            className="sr-only"
            type="file"
            accept="application/json,.json"
            disabled={disabled}
            onChange={(event) => void importFile(event.target.files?.[0])}
          />
        </label>
        <span className="microcopy">
          {filename || "JSON schema 1.1 · maximum 5 MB"}
        </span>
      </div>

      {errors.length > 0 ? (
        <div className="error-summary" role="alert">
          <strong>Trace could not be imported</strong>
          <ul>
            {errors.slice(0, 8).map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
          <p>Nothing was evaluated or replaced with sample data.</p>
        </div>
      ) : null}
    </section>
  );
}
