import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const root = process.cwd();
const roots = [resolve(root, "src")];
const forbidden = [
  /screen[- ]reader (passed|safe)/gi,
  /wcag (passed|compliant|conformant)/gi,
  /accessible release/gi,
  /safe ci gate/gi,
  /customer[- ]validated/gi,
  /prevents inaccessible releases/gi,
];
const findings: Array<{ file: string; match: string }> = [];
async function scan(directory: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await scan(path);
    else if ([".ts", ".tsx", ".css", ".html"].includes(extname(path))) {
      const content = await readFile(path, "utf8");
      for (const pattern of forbidden)
        for (const match of content.matchAll(pattern))
          findings.push({ file: path.slice(root.length + 1), match: match[0] });
    }
  }
}
for (const directory of roots) await scan(directory);
await mkdir(resolve(root, "evidence/claims"), { recursive: true });
await writeFile(
  resolve(root, "evidence/claims/claim-review.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), forbiddenPositiveClaims: findings, result: findings.length ? "fail" : "pass" }, null, 2)}\n`,
);
if (findings.length)
  throw new Error(
    `Forbidden positive claim vocabulary found: ${JSON.stringify(findings)}`,
  );
console.log(
  "Claim review passed: no forbidden positive claim language in product source.",
);
