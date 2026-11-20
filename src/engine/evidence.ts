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
    readonly version: "1.0.0";
    readonly commit: string;
  };
  readonly contract: {
    readonly id: string;
    readonly version: string;
    readonly hash: string;
  };
  readonly fixture: {
    readonly id: string;
    readonly version: string;
    readonly hash: string;
  };
  readonly scenario: {
    readonly id: string;
    readonly version: string;
    readonly releaseId: string;
    readonly hash: string;
  };
  readonly provider: ProviderIdentity;
  readonly environment: EvidenceEnvironment;
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
  readonly fixture: FixtureDefinition;
  readonly provider: ProviderIdentity;
  readonly environment: EvidenceEnvironment;
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
  "fixture.id",
  "fixture.hash",
  "contract.id",
  "contract.hash",
  "environment.browserName",
  "environment.browserVersion",
  "run.runId",
  "run.attemptId",
] as const;

export function createEvidence(input: EvidenceInput): EvidenceArtifact {
  const artifactWithoutIntegrity = {
    evidenceSchemaVersion: "1.0.0" as const,
    app: {
      name: "StateChorus" as const,
      version: "1.0.0" as const,
      commit: input.commit ?? "local-uncommitted",
    },
    contract: {
      id: STATECHORUS_CONTRACT.id,
      version: STATECHORUS_CONTRACT.version,
      hash: STATECHORUS_CONTRACT.hash,
    },
    fixture: {
      id: input.fixture.id,
      version: input.fixture.version,
      hash: input.fixture.hash,
    },
    scenario: {
      id: SCENARIO.id,
      version: SCENARIO.version,
      releaseId: SCENARIO.releaseId,
      hash: stableHash(SCENARIO),
    },
    provider: input.provider,
    environment: input.environment,
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
    "fixture.id": artifact.fixture.id,
    "fixture.hash": artifact.fixture.hash,
    "contract.id": artifact.contract.id,
    "contract.hash": artifact.contract.hash,
    "environment.browserName": artifact.environment.browserName,
    "environment.browserVersion": artifact.environment.browserVersion,
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
  if (!isFixtureId(artifact.fixture.id)) {
    errors.push("fixture.id");
  } else if (artifact.fixture.hash !== FIXTURES[artifact.fixture.id].hash) {
    errors.push("fixture.hash");
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
    `# StateChorus evidence — ${artifact.fixture.id}\n\n` +
    `- Result: \`${artifact.result}\`\n` +
    `- Result label: ${artifact.resultCopy}\n` +
    `- Contract: \`${artifact.contract.id}@${artifact.contract.version}\` (${artifact.contract.hash})\n` +
    `- Fixture: \`${artifact.fixture.id}@${artifact.fixture.version}\` (${artifact.fixture.hash})\n` +
    `- Provider: ${artifact.provider.name}@${artifact.provider.version} — ${artifact.provider.authority}\n` +
    `- Browser: ${artifact.environment.browserName} ${artifact.environment.browserVersion}\n` +
    `- Viewport: ${artifact.environment.viewport.width}×${artifact.environment.viewport.height}; reduced motion: ${artifact.environment.reducedMotion}\n` +
    `- Run / attempt: \`${artifact.run.runId}\` / \`${artifact.run.attemptId}\`\n\n` +
    `## Findings\n\n${findingLines.join("\n")}\n\n` +
    `## Authority boundary\n\n${artifact.nativeVerificationRequirement}\n\n` +
    `## Integrity\n\n\`${artifact.integrityHash}\`\n`
  );
}
