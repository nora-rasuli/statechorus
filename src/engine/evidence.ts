import { STATECHORUS_CONTRACT } from "../domain/contract";
import {
  NATIVE_LIMITATION,
  type Finding,
  type NormalizedEvent,
  type RawObservableEvent,
  type ResultLabel,
  type SemanticEpisode,
} from "../domain/events";
import type { FixtureDefinition } from "../fixtures/corpus";
import { FIXTURES, SCENARIO, isFixtureId } from "../fixtures/corpus";
import type { ImportedTrace } from "../domain/imported-trace";
import { importedTraceHash } from "../domain/imported-trace";
import type { ProviderIdentity } from "../providers/observable-provider";
import { stableHash, stableJson } from "../utils/stable";
import { expectedEpisodes } from "./episodes";

export type ReviewerDisposition = "not_ready" | "requires_native_verification";

export interface ReviewerAnnotation {
  readonly note: string;
  readonly disposition: ReviewerDisposition;
  readonly recordedAt: string;
}

export interface EvidenceEnvironment {
  readonly browserName: string;
  readonly browserVersion: string;
  readonly os: string;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly reducedMotion: boolean;
}

export interface EvidenceArtifact {
  readonly evidenceSchemaVersion: "1.0.0";
  readonly app: {
    readonly name: "StateChorus";
    readonly version: "1.1.0";
    readonly commit: string;
  };
  readonly contract: {
    readonly id: string;
    readonly version: string;
    readonly hash: string;
  };
  readonly fixture?: {
    readonly id: string;
    readonly version: string;
    readonly hash: string;
  };
  readonly input: {
    readonly kind: "sample_fixture" | "user_trace";
    readonly id: string;
    readonly version: string;
    readonly hash: string;
    readonly label: string;
    readonly sourceUrl?: string;
    readonly environment?: string;
    readonly captureTool?: string;
  };
  readonly scenario: {
    readonly id: string;
    readonly version: string;
    readonly releaseId: string;
    readonly hash: string;
  };
  readonly provider: ProviderIdentity;
  readonly environment: EvidenceEnvironment;
  readonly analysisEnvironment: EvidenceEnvironment;
  readonly run: {
    readonly runId: string;
    readonly attemptId: string;
    readonly startedAt: string;
    readonly completedAt: string;
    readonly wallClockMetadataOnly: true;
  };
  readonly rawEvents: readonly RawObservableEvent[];
  readonly normalizedEvents: readonly NormalizedEvent[];
  readonly expectedEpisodes: ReturnType<typeof expectedEpisodes>;
  readonly actualEpisodes: readonly SemanticEpisode[];
  readonly findings: readonly Finding[];
  readonly result: ResultLabel;
  readonly resultCopy: string;
  readonly reviewerAnnotation?: ReviewerAnnotation;
  readonly nativeVerificationRequirement: typeof NATIVE_LIMITATION;
  readonly integrityHash: string;
}

export interface EvidenceInput {
  readonly fixture?: FixtureDefinition;
  readonly trace?: ImportedTrace;
  readonly provider: ProviderIdentity;
  readonly environment: EvidenceEnvironment;
  readonly analysisEnvironment?: EvidenceEnvironment;
  readonly runId: string;
  readonly attemptId: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly rawEvents: readonly RawObservableEvent[];
  readonly normalizedEvents: readonly NormalizedEvent[];
  readonly episodes: readonly SemanticEpisode[];
  readonly findings: readonly Finding[];
  readonly result: ResultLabel;
  readonly resultCopy: string;
  readonly commit?: string;
  readonly annotation?: ReviewerAnnotation;
}

const REQUIRED_LINEAGE = [
  "input.id",
  "input.hash",
  "contract.id",
  "contract.hash",
  "provider.name",
  "provider.version",
  "environment.browserName",
  "environment.browserVersion",
  "analysisEnvironment.browserName",
  "analysisEnvironment.browserVersion",
  "run.runId",
  "run.attemptId",
] as const;

export function createEvidence(input: EvidenceInput): EvidenceArtifact {
  if (!input.fixture && !input.trace)
    throw new Error("Evidence requires a fixture or imported trace.");
  const source = input.trace
    ? {
        id: input.trace.traceId,
        version: input.trace.schemaVersion,
        hash: importedTraceHash(input.trace),
      }
    : {
        id: input.fixture!.id,
        version: input.fixture!.version,
        hash: input.fixture!.hash,
      };
  const artifactWithoutIntegrity = {
    evidenceSchemaVersion: "1.0.0" as const,
    app: {
      name: "StateChorus" as const,
      version: "1.1.0" as const,
      commit: input.commit ?? "local-uncommitted",
    },
    contract: {
      id: STATECHORUS_CONTRACT.id,
      version: STATECHORUS_CONTRACT.version,
      hash: STATECHORUS_CONTRACT.hash,
    },
    ...(input.trace ? {} : { fixture: { ...source } }),
    input: input.trace
      ? {
          kind: "user_trace" as const,
          ...source,
          label: input.trace.source.appName,
          sourceUrl: input.trace.source.url,
          environment: input.trace.source.environment,
          captureTool: input.trace.source.captureTool,
        }
      : {
          kind: "sample_fixture" as const,
          ...source,
          label: input.fixture!.label,
        },
    scenario: {
      id: input.trace ? input.trace.traceId : SCENARIO.id,
      version: input.trace ? input.trace.schemaVersion : SCENARIO.version,
      releaseId: input.trace ? input.trace.capturedAt : SCENARIO.releaseId,
      hash: input.trace ? importedTraceHash(input.trace) : stableHash(SCENARIO),
    },
    provider: input.provider,
    environment: input.environment,
    analysisEnvironment: input.analysisEnvironment ?? input.environment,
    run: {
      runId: input.runId,
      attemptId: input.attemptId,
      startedAt: input.startedAt,
      completedAt: input.completedAt,
      wallClockMetadataOnly: true as const,
    },
    rawEvents: input.rawEvents,
    normalizedEvents: input.normalizedEvents,
    expectedEpisodes: expectedEpisodes(),
    actualEpisodes: input.episodes,
    findings: input.findings,
    result: input.result,
    resultCopy: input.resultCopy,
    ...(input.annotation ? { reviewerAnnotation: input.annotation } : {}),
    nativeVerificationRequirement:
      NATIVE_LIMITATION as typeof NATIVE_LIMITATION,
  };
  return Object.freeze({
    ...artifactWithoutIntegrity,
    integrityHash: stableHash(artifactWithoutIntegrity),
  });
}

export function validateEvidenceLineage(
  artifact: EvidenceArtifact,
): readonly string[] {
  const values: Readonly<Record<(typeof REQUIRED_LINEAGE)[number], string>> = {
    "input.id": artifact.input.id,
    "input.hash": artifact.input.hash,
    "contract.id": artifact.contract.id,
    "contract.hash": artifact.contract.hash,
    "provider.name": artifact.provider.name,
    "provider.version": artifact.provider.version,
    "environment.browserName": artifact.environment.browserName,
    "environment.browserVersion": artifact.environment.browserVersion,
    "analysisEnvironment.browserName": artifact.analysisEnvironment.browserName,
    "analysisEnvironment.browserVersion":
      artifact.analysisEnvironment.browserVersion,
    "run.runId": artifact.run.runId,
    "run.attemptId": artifact.run.attemptId,
  };
  return REQUIRED_LINEAGE.filter((field) => !values[field]?.trim());
}

export function validateEvidenceIntegrity(
  artifact: EvidenceArtifact,
): readonly string[] {
  const errors: string[] = [];
  const contractBody = { ...STATECHORUS_CONTRACT };
  Reflect.deleteProperty(contractBody, "hash");
  const expectedContractHash = stableHash(contractBody);
  if (artifact.contract.hash !== expectedContractHash) {
    errors.push("contract.hash");
  }
  if (artifact.input.kind === "sample_fixture") {
    if (!artifact.fixture || !isFixtureId(artifact.input.id)) {
      errors.push("fixture.id");
    } else if (
      artifact.input.hash !== FIXTURES[artifact.input.id].hash ||
      artifact.fixture.id !== artifact.input.id ||
      artifact.fixture.hash !== artifact.input.hash
    ) {
      errors.push("fixture.hash");
    }
  } else if (artifact.fixture) {
    errors.push("trace.fixture");
  } else if (artifact.input.hash !== artifact.scenario.hash) {
    errors.push("trace.hash");
  } else {
    if (
      artifact.provider.name !== "StateChorusPlaywrightCapture" ||
      artifact.input.captureTool !==
        `statechorus-playwright-capture@${artifact.provider.version}`
    )
      errors.push("trace.provider");
    if (!artifact.run.runId.includes(artifact.input.id.toLowerCase()))
      errors.push("trace.runId");
  }
  const artifactBody = { ...artifact };
  Reflect.deleteProperty(artifactBody, "integrityHash");
  if (artifact.integrityHash !== stableHash(artifactBody)) {
    errors.push("integrityHash");
  }
  return Object.freeze(errors);
}

export function serializeEvidenceJson(artifact: EvidenceArtifact): string {
  const missing = validateEvidenceLineage(artifact);
  if (missing.length > 0)
    throw new Error(`Export blocked: missing ${missing.join(", ")}`);
  const invalid = validateEvidenceIntegrity(artifact);
  if (invalid.length > 0)
    throw new Error(`Export blocked: invalid ${invalid.join(", ")}`);
  return stableJson(artifact);
}

export function serializeEvidenceMarkdown(artifact: EvidenceArtifact): string {
  const missing = validateEvidenceLineage(artifact);
  if (missing.length > 0)
    throw new Error(`Export blocked: missing ${missing.join(", ")}`);
  const invalid = validateEvidenceIntegrity(artifact);
  if (invalid.length > 0)
    throw new Error(`Export blocked: invalid ${invalid.join(", ")}`);
  const findingLines = artifact.findings.length
    ? artifact.findings.map(
        (item) =>
          `- **${item.key}** (${item.severity}): ${item.summary} Evidence sequences: ${item.evidenceSequences.join(", ") || "none"}.`,
      )
    : [
        "- No local contract violations were found in the declared observable scope.",
      ];
  return (
    `# StateChorus evidence — ${artifact.input.id}\n\n` +
    `- Result: \`${artifact.result}\`\n` +
    `- Result label: ${artifact.resultCopy}\n` +
    `- Contract: \`${artifact.contract.id}@${artifact.contract.version}\` (${artifact.contract.hash})\n` +
    `- Input: ${artifact.input.kind === "user_trace" ? "User trace" : "Sample fixture"} — \`${artifact.input.id}@${artifact.input.version}\` (${artifact.input.hash})\n` +
    `- Source: ${artifact.input.label}${artifact.input.sourceUrl ? ` — ${artifact.input.sourceUrl}` : ""}\n` +
    `- Provider: ${artifact.provider.name}@${artifact.provider.version} — ${artifact.provider.authority}\n` +
    `- Capture browser: ${artifact.environment.browserName} ${artifact.environment.browserVersion}\n` +
    `- Capture viewport: ${artifact.environment.viewport.width}×${artifact.environment.viewport.height}; reduced motion: ${artifact.environment.reducedMotion}\n` +
    `- Analysis browser: ${artifact.analysisEnvironment.browserName} ${artifact.analysisEnvironment.browserVersion}\n` +
    `- Analysis viewport: ${artifact.analysisEnvironment.viewport.width}×${artifact.analysisEnvironment.viewport.height}; reduced motion: ${artifact.analysisEnvironment.reducedMotion}\n` +
    `- Run / attempt: \`${artifact.run.runId}\` / \`${artifact.run.attemptId}\`\n\n` +
    `## Findings\n\n${findingLines.join("\n")}\n\n` +
    `## Authority boundary\n\n${artifact.nativeVerificationRequirement}\n\n` +
    `## Integrity\n\n\`${artifact.integrityHash}\`\n`
  );
}
