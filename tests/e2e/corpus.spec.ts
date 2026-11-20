import { expect, test, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { EvidenceArtifact } from "../../src/engine/evidence";
import { validateEvidenceIntegrity } from "../../src/engine/evidence";
import {
  CORPUS_IDS,
  FIXTURES,
  type FixtureId,
} from "../../src/fixtures/corpus";
import { stableHash, stableJson } from "../../src/utils/stable";

const reportPath = resolve(
  process.cwd(),
  "evidence/ai-evaluation/eval-01-report.json",
);

async function runFixture(
  page: Page,
  id: FixtureId,
): Promise<EvidenceArtifact> {
  const fixture = FIXTURES[id];
  await page.goto(`/demo?fixture=${id}`);
  await page
    .getByRole("button", {
      name: `Run ${fixture.variant === "fixed" ? "fixed" : "broken"} fixture`,
    })
    .click();
  const approval = page.getByRole("button", {
    name: "Approve synthetic log access once",
  });
  await expect(approval).toBeVisible();

  if (id === "FIX-003") {
    await expect(page.locator("#synthetic-transcript")).toBeFocused();
  }
  if (id === "FIX-005") {
    await expect(approval).toHaveAttribute("tabindex", "-1");
  }

  await approval.click();
  await expect(
    page.getByRole("heading", { name: "Review local observable evidence" }),
  ).toBeVisible();

  if (id === "FIX-006") {
    await expect(
      page.locator("[data-transcript-id='msg-assistant-replacement']"),
    ).toBeVisible();
    await expect(
      page.locator("[data-transcript-id='msg-assistant-001']"),
    ).toHaveCount(0);
  }
  if (id === "FIX-007") {
    await expect(
      page.locator("[data-persisted-status='stalled']"),
    ).toBeVisible();
  }

  const json = await page.getByLabel("json evidence preview").textContent();
  return JSON.parse(json ?? "") as EvidenceArtifact;
}

test.describe.configure({ mode: "serial" });

test("QA-01 / EVAL-01 evaluates three deterministic browser-captured runs per fixture", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await mkdir(resolve(process.cwd(), "evidence/ai-evaluation"), {
    recursive: true,
  });

  const rows = [];
  for (const id of CORPUS_IDS) {
    const fixture = FIXTURES[id];
    const runs = [];
    for (let index = 0; index < 3; index += 1) {
      const artifact = await runFixture(page, id);
      expect(validateEvidenceIntegrity(artifact)).toEqual([]);
      expect(artifact.fixture.hash).toBe(fixture.hash);
      expect(
        artifact.rawEvents.every((event) => event.source === "browser_dom"),
      ).toBe(true);

      if (id === "FIX-001") {
        expect(
          artifact.rawEvents.filter(
            (event) =>
              event.type === "live_region_mutation" &&
              event.semanticKey === "streaming",
          ).length,
        ).toBeGreaterThan(1);
      }
      if (id === "FIX-002") {
        expect(
          artifact.rawEvents.filter(
            (event) =>
              event.type === "live_region_mutation" &&
              event.semanticKey === "stalled",
          ).length,
        ).toBe(4);
      }
      if (id === "FIX-004") {
        expect(
          artifact.rawEvents.some(
            (event) =>
              event.type === "live_region_mutation" &&
              event.semanticKey === "complete",
          ),
        ).toBe(false);
      }

      const comparable = {
        normalizedEvents: artifact.normalizedEvents,
        actualEpisodes: artifact.actualEpisodes,
        findings: artifact.findings,
        result: artifact.result,
      };
      runs.push({
        run: index + 1,
        outputHash: stableHash(comparable),
        ...comparable,
      });
    }
    const actual = runs[0]!.findings.length
      ? runs[0]!.findings.map(({ key }) => key)
      : ["local-observable-pass-native-required"];
    const expected = fixture.expectedFindings.length
      ? fixture.expectedFindings
      : ["local-observable-pass-native-required"];
    expect(actual).toEqual(expected);
    expect(new Set(runs.map(({ outputHash }) => outputHash)).size).toBe(1);
    rows.push({
      fixtureId: id,
      expected,
      actual,
      deterministic: true,
      captureOrigin: "rendered_dom",
      runs,
    });
  }

  const report = {
    reportVersion: "1.1.0",
    generatedAt: new Date().toISOString(),
    wallClockMetadataOnly: true,
    captureOrigin: "BrowserDomProvider queries the rendered replay surface",
    threshold: {
      seededFailuresDetected: "7/7",
      fixedFalseFailures: 0,
      consecutiveRuns: 3,
    },
    result: "pass",
    fixtures: rows,
  };
  await writeFile(reportPath, stableJson(report));
});
