import type { ResultLabel } from "../../domain/events";

const recovery: Readonly<Record<ResultLabel, string>> = {
  contract_violation:
    "Review the named evidence and rerun the corrected equivalent.",
  invalid_fixture:
    "Select or repair a valid, versioned fixture before running.",
  invalid_run:
    "Reset the harness and rerun; partial evidence is not a verdict.",
  inconclusive:
    "Inspect the unavailable local signal and route the question to native review.",
  interrupted:
    "Resume or restart with a linked attempt; no pass/fail verdict was created.",
  local_observable_pass_native_required:
    "Schedule trained native assistive-technology review before any release conclusion.",
};

export function ResultNotice({
  result,
  copy,
}: {
  readonly result: ResultLabel;
  readonly copy: string;
}) {
  const isViolation = result === "contract_violation";
  return (
    <div className={`result-notice result-${result}`} data-result={result}>
      <span className="result-icon" aria-hidden="true">
        {isViolation
          ? "!"
          : result === "local_observable_pass_native_required"
            ? "✓"
            : "◇"}
      </span>
      <div>
        <p className="result-label">{result.replaceAll("_", " ")}</p>
        <p className="result-copy">{copy}</p>
        <p>{recovery[result]}</p>
      </div>
    </div>
  );
}
