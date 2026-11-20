import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

interface LockEntry {
  readonly version?: string;
  readonly license?: string;
}

interface PackageLock {
  readonly lockfileVersion: number;
  readonly packages: Readonly<Record<string, LockEntry>>;
}

const root = process.cwd();
const packageJson = JSON.parse(
  await readFile(resolve(root, "package.json"), "utf8"),
) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};
const lock = JSON.parse(
  await readFile(resolve(root, "package-lock.json"), "utf8"),
) as PackageLock;
const allowed = new Set([
  "MIT",
  "MIT-0",
  "ISC",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "BlueOak-1.0.0",
  "0BSD",
  "MPL-2.0",
  "Python-2.0",
]);

const rows = Object.entries(lock.packages)
  .filter(([path]) => path.includes("node_modules/"))
  .map(([path, metadata]) => {
    const name = path.slice(
      path.lastIndexOf("node_modules/") + "node_modules/".length,
    );
    const isTopLevel = path === `node_modules/${name}`;
    const scope =
      isTopLevel && name in packageJson.dependencies
        ? "runtime-direct"
        : isTopLevel && name in packageJson.devDependencies
          ? "development-direct"
          : "transitive";
    const license = metadata.license ?? "UNKNOWN";
    return {
      path,
      name,
      version: metadata.version ?? "UNKNOWN",
      license,
      scope,
      compatible: allowed.has(license),
    };
  })
  .sort((left, right) => left.path.localeCompare(right.path));

const unresolved = rows.filter(({ compatible }) => !compatible);
const generatedAt = new Date().toISOString();
await mkdir(resolve(root, "evidence/licenses"), { recursive: true });
await writeFile(
  resolve(root, "evidence/licenses/dependency-inventory.json"),
  `${JSON.stringify({ generatedAt, lockfileVersion: lock.lockfileVersion, packages: rows, unresolved }, null, 2)}\n`,
);
await writeFile(
  resolve(root, "evidence/licenses/dependency-inventory.md"),
  `# Dependency license inventory\n\nGenerated ${generatedAt} from package-lock.json. Runtime, development, and transitive packages are included.\n\n| Package path | Version | Scope | License | Disposition |\n|---|---:|---|---|---|\n${rows.map((row) => `| ${row.path} | ${row.version} | ${row.scope} | ${row.license} | ${row.compatible ? "Compatible" : "Review required"} |`).join("\n")}\n`,
);
if (unresolved.length > 0) {
  throw new Error(
    `Unresolved dependency licenses: ${unresolved.map(({ path, license }) => `${path} (${license})`).join(", ")}`,
  );
}
console.log(
  `License inventory passed: ${rows.length} locked packages; 0 unresolved.`,
);
