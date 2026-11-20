import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { EvidenceArtifact } from "../src/engine/evidence";
import {
  validateEvidenceIntegrity,
  validateEvidenceLineage,
} from "../src/engine/evidence";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const report = JSON.parse(
  await readFile(
    resolve(projectRoot, "evidence/ai-evaluation/eval-01-report.json"),
    "utf8",
  ),
) as {
  result: string;
  threshold: {
    seededFailuresDetected: string;
    fixedFalseFailures: number;
    consecutiveRuns: number;
  };
};

if (
  report.result !== "pass" ||
  report.threshold.seededFailuresDetected !== "7/7" ||
  report.threshold.fixedFalseFailures !== 0 ||
  report.threshold.consecutiveRuns !== 3
) {
  throw new Error("Browser-captured EVAL-01 report did not meet package 1.0.");
}

for (const id of ["FIX-DEMO-BROKEN", "FIX-DEMO-FIXED"] as const) {
  const artifact = JSON.parse(
    await readFile(
      resolve(projectRoot, `evidence/provenance/${id}-evidence.json`),
      "utf8",
    ),
  ) as EvidenceArtifact;
  const invalid = [
    ...validateEvidenceLineage(artifact),
    ...validateEvidenceIntegrity(artifact),
  ];
  if (invalid.length > 0) {
    throw new Error(`${id} evidence is invalid: ${invalid.join(", ")}`);
  }
}

console.log(
  "Validated browser-captured EVAL-01 and reproducible contract, fixture, and artifact hashes.",
);
