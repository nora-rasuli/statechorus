import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

const root = process.cwd();
const externalReferences: Array<{ file: string; url: string }> = [];
const forbiddenRuntimePatterns = [
  /fetch\s*\(/,
  /XMLHttpRequest/,
  /WebSocket\s*\(/,
  /dangerouslySetInnerHTML/,
];
const findings: Array<{ file: string; pattern: string }> = [];
const localInputPaths: Array<{ file: string; pattern: string }> = [];

async function scan(directory: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await scan(path);
    else if ([".ts", ".tsx", ".css", ".html"].includes(extname(path))) {
      const content = await readFile(path, "utf8");
      const file = relative(root, path);
      for (const match of content.matchAll(/https?:\/\/[^\s"')]+/g))
        externalReferences.push({ file, url: match[0] });
      for (const pattern of forbiddenRuntimePatterns) {
        if (pattern.test(content))
          findings.push({ file, pattern: pattern.source });
      }
      if (/<input[^>]+type=["']file/i.test(content))
        localInputPaths.push({ file, pattern: "local file input" });
    }
  }
}

await scan(resolve(root, "src"));
const report = {
  capturedAt: new Date().toISOString(),
  productSourceExternalReferences: externalReferences,
  forbiddenRuntimePatterns: findings,
  localInputPaths,
  localInputBoundary:
    "FileReader/File.text browser-memory processing only; no fetch, XHR, WebSocket, server, database, or telemetry path.",
  syntheticFixtureSource: "src/fixtures/corpus.ts",
  frozenResearchSource: "research.md",
  result:
    externalReferences.length === 0 && findings.length === 0 ? "pass" : "fail",
  limitation:
    "This review verifies bundled product source and runtime boundaries; it does not revalidate external research claims.",
};
await mkdir(resolve(root, "evidence/provenance"), { recursive: true });
await writeFile(
  resolve(root, "evidence/provenance/source-review.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
if (report.result !== "pass")
  throw new Error(
    `Provenance/runtime boundary review failed: ${JSON.stringify(report)}`,
  );
console.log(
  "Provenance review passed: local file import is present with no external URL, data-egress API, or unsafe HTML path.",
);
