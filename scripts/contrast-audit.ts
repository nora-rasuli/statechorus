import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

function channel(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const value = hex.replace("#", "");
  return (
    0.2126 * channel(Number.parseInt(value.slice(0, 2), 16)) +
    0.7152 * channel(Number.parseInt(value.slice(2, 4), 16)) +
    0.0722 * channel(Number.parseInt(value.slice(4, 6), 16))
  );
}

function ratio(foreground: string, background: string): number {
  const values = [luminance(foreground), luminance(background)].sort(
    (left, right) => right - left,
  );
  return Number(((values[0] + 0.05) / (values[1] + 0.05)).toFixed(2));
}

const checks = [
  {
    use: "body text",
    foreground: "#17231f",
    background: "#fcfbf7",
    threshold: 4.5,
  },
  {
    use: "muted text",
    foreground: "#58635e",
    background: "#fcfbf7",
    threshold: 4.5,
  },
  {
    use: "accent text",
    foreground: "#034437",
    background: "#fcfbf7",
    threshold: 4.5,
  },
  {
    use: "primary button text",
    foreground: "#ffffff",
    background: "#075d4b",
    threshold: 4.5,
  },
  {
    use: "warning text",
    foreground: "#8b3a20",
    background: "#f7e8df",
    threshold: 4.5,
  },
  {
    use: "focus indicator",
    foreground: "#8c4b00",
    background: "#fcfbf7",
    threshold: 3,
  },
].map((check) => {
  const measuredRatio = ratio(check.foreground, check.background);
  return {
    ...check,
    measuredRatio,
    result: measuredRatio >= check.threshold ? "pass" : "fail",
  };
});

const report = {
  capturedAt: new Date().toISOString(),
  method: "WCAG relative-luminance arithmetic against frozen CSS tokens",
  scope:
    "Declared normal text and focus-indicator token pairs; not a conformance claim",
  checks,
  result: checks.every((check) => check.result === "pass") ? "pass" : "fail",
};
await mkdir(resolve(process.cwd(), "evidence/accessibility"), {
  recursive: true,
});
await writeFile(
  resolve(process.cwd(), "evidence/accessibility/contrast.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
if (report.result !== "pass")
  throw new Error(
    `Contrast target failed: ${JSON.stringify(checks.filter((check) => check.result === "fail"))}`,
  );
console.log(
  `Contrast record passed: ${checks.map((check) => `${check.use} ${check.measuredRatio}:1`).join("; ")}.`,
);
