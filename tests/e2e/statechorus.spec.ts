import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const evidenceRoot = resolve(process.cwd(), "evidence");

test.beforeAll(async () => {
  await Promise.all([
    mkdir(resolve(evidenceRoot, "screenshots/desktop"), { recursive: true }),
    mkdir(resolve(evidenceRoot, "screenshots/mobile"), { recursive: true }),
    mkdir(resolve(evidenceRoot, "screenshots/failure-states"), {
      recursive: true,
    }),
    mkdir(resolve(evidenceRoot, "accessibility"), { recursive: true }),
    mkdir(resolve(evidenceRoot, "performance"), { recursive: true }),
    mkdir(resolve(evidenceRoot, "privacy"), { recursive: true }),
  ]);
});

async function startAndApprove(
  page: import("@playwright/test").Page,
  variant: "broken" | "fixed",
) {
  await page.getByRole("button", { name: `Run ${variant} fixture` }).click();
  const approval = page.getByRole("button", {
    name: "Approve synthetic log access once",
  });
  await expect(approval).toBeVisible();
  await approval.click();
  await expect(
    page.getByRole("heading", { name: "Review local observable evidence" }),
  ).toBeVisible();
}

async function retainBrowserEvidence(
  page: import("@playwright/test").Page,
  fixtureId: string,
) {
  await page.getByRole("button", { name: "JSON", exact: true }).click();
  const json = await page.getByLabel("json evidence preview").textContent();
  await writeFile(
    resolve(evidenceRoot, `provenance/${fixtureId}-evidence.json`),
    json ?? "",
  );
  await page.getByRole("button", { name: "Markdown", exact: true }).click();
  const markdown = await page
    .getByLabel("markdown evidence preview")
    .textContent();
  await writeFile(
    resolve(evidenceRoot, `provenance/${fixtureId}-evidence.md`),
    markdown ?? "",
  );
}

test("P-02 P-03 P-04 broken-to-fixed golden path and evidence export", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  const started = performance.now();
  await page.goto("/demo?fixture=FIX-DEMO-BROKEN");
  await expect(page.getByTestId("disclosure")).toBeVisible();
  await page.screenshot({
    path: resolve(evidenceRoot, "screenshots/desktop/setup.png"),
    fullPage: true,
  });
  await startAndApprove(page, "broken");
  await expect(
    page.locator("[data-result='contract_violation']"),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 4 })).toHaveCount(3);
  await expect(
    page.getByRole("heading", { name: "episode-budget-exceeded" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "duplicate-stall-episode" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "unexpected-focus-change" }),
  ).toBeVisible();
  await retainBrowserEvidence(page, "FIX-DEMO-BROKEN");
  await page.screenshot({
    path: resolve(evidenceRoot, "screenshots/desktop/broken-review.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: "Run fixed fixture" }).click();
  await expect(
    page.getByRole("button", { name: "Approve synthetic log access once" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Approve synthetic log access once" })
    .click();
  await expect(
    page.locator("[data-result='local_observable_pass_native_required']"),
  ).toContainText(
    "Local observable checks passed — native verification required.",
  );
  await retainBrowserEvidence(page, "FIX-DEMO-FIXED");
  await page.screenshot({
    path: resolve(evidenceRoot, "screenshots/desktop/fixed-review.png"),
    fullPage: true,
  });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("FIX-DEMO-FIXED-evidence.json");
  expect(consoleErrors).toEqual([]);
  const guidedDurationMs = Math.round(performance.now() - started);
  expect(guidedDurationMs).toBeLessThan(60_000);
  await writeFile(
    resolve(evidenceRoot, "performance/guided-demo.json"),
    `${JSON.stringify({ capturedAt: new Date().toISOString(), profile: "Playwright Chromium 1280x800", guidedDurationMs, thresholdMs: 60_000, result: "pass" }, null, 2)}\n`,
  );
});

test("A11Y-01 keyboard and focus rules on corrected fixture", async ({
  page,
}) => {
  await page.goto("/demo?fixture=FIX-DEMO-FIXED");
  const run = page.getByRole("button", { name: "Run fixed fixture" });
  await run.focus();
  await page.keyboard.press("Enter");
  await expect(run).toBeFocused();
  const approval = page.getByRole("button", {
    name: "Approve synthetic log access once",
  });
  await expect(approval).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(approval).toBeFocused();
  await page.screenshot({
    path: resolve(evidenceRoot, "screenshots/desktop/keyboard-focus.png"),
    fullPage: false,
  });
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Synthetic composer")).toBeFocused();
  const resultHeading = page.getByRole("heading", {
    name: "Review local observable evidence",
  });
  await expect(resultHeading).toBeVisible();
  await expect(resultHeading).not.toBeFocused();
  await page.getByRole("button", { name: "Review result" }).click();
  await expect(resultHeading).toBeFocused();
  await page.getByRole("button", { name: "Reset review" }).click();
  await expect(run).toBeFocused();
});

test("A11Y-01 keyboard focus remains deliberate through broken-to-fixed rerun", async ({
  page,
}) => {
  await page.goto("/demo?fixture=FIX-DEMO-BROKEN");
  await startAndApprove(page, "broken");
  const rerun = page.getByRole("button", { name: "Run fixed fixture" });
  await rerun.focus();
  await page.keyboard.press("Enter");

  const stableRun = page.getByRole("button", { name: "Run fixed fixture" });
  await expect(stableRun).toBeFocused();
  const approval = page.getByRole("button", {
    name: "Approve synthetic log access once",
  });
  await expect(approval).toBeVisible();
  await expect(stableRun).toBeFocused();
  await page.screenshot({
    path: resolve(evidenceRoot, "screenshots/desktop/keyboard-rerun-focus.png"),
    fullPage: true,
  });

  await page.keyboard.press("Tab");
  await expect(approval).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Synthetic composer")).toBeFocused();
  await expect(
    page.locator("[data-result='local_observable_pass_native_required']"),
  ).toContainText(
    "Local observable checks passed — native verification required.",
  );

  const resultHeading = page.getByRole("heading", {
    name: "Review local observable evidence",
  });
  await expect(resultHeading).not.toBeFocused();
  await page.getByRole("button", { name: "Review result" }).click();
  await expect(resultHeading).toBeFocused();
  await page.getByRole("button", { name: "Reset review" }).click();
  await expect(stableRun).toBeFocused();
});

test("A11Y-01 pointer rerun uses the stable run control under reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/demo?fixture=FIX-DEMO-BROKEN");
  await startAndApprove(page, "broken");
  await page.getByRole("button", { name: "Run fixed fixture" }).click();

  const stableRun = page.getByRole("button", { name: "Run fixed fixture" });
  const approval = page.getByRole("button", {
    name: "Approve synthetic log access once",
  });
  await expect(approval).toBeVisible();
  await expect(stableRun).toBeFocused();
  await approval.click();
  await expect(page.getByLabel("Synthetic composer")).toBeFocused();
  await expect(
    page.locator("[data-result='local_observable_pass_native_required']"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Review local observable evidence" }),
  ).not.toBeFocused();
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
});

test("A11Y-02 axe finds no issues in setup and review", async ({ page }) => {
  await page.goto("/demo?fixture=FIX-DEMO-FIXED");
  const setup = await new AxeBuilder({ page: page as never }).analyze();
  expect(setup.violations).toEqual([]);
  await startAndApprove(page, "fixed");
  const review = await new AxeBuilder({ page: page as never }).analyze();
  const blocking = review.violations;
  expect(blocking).toEqual([]);
  await writeFile(
    resolve(evidenceRoot, "accessibility/axe-results.json"),
    `${JSON.stringify({ capturedAt: new Date().toISOString(), tool: "@axe-core/playwright 4.10.1", setupViolations: setup.violations, reviewViolations: review.violations, seriousOrCritical: blocking.length, nativeAssistiveTechnologyRun: false }, null, 2)}\n`,
  );
});

for (const viewport of [
  { name: "mobile-360x800", width: 360, height: 800 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "desktop-1280x800", width: 1280, height: 800 },
] as const) {
  test(`UX-03 responsive reflow ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto("/demo?fixture=FIX-DEMO-FIXED");
    await startAndApprove(page, "fixed");
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    if (viewport.width === 360) {
      await page.screenshot({
        path: resolve(
          evidenceRoot,
          "screenshots/mobile/fixed-review-360x800.png",
        ),
        fullPage: true,
      });
    }
  });
}

test("UX-03 200% and 400% zoom-equivalent CSS viewports retain controls without app overflow", async ({
  page,
}) => {
  for (const profile of [
    { zoom: 2, width: 640 },
    { zoom: 4, width: 320 },
  ]) {
    await page.setViewportSize({ width: profile.width, height: 800 });
    await page.goto("/demo?fixture=FIX-DEMO-FIXED");
    await expect(
      page.getByRole("button", { name: "Run fixed fixture" }),
    ).toBeVisible();
    const hasDocumentOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    );
    expect(hasDocumentOverflow).toBe(false);
  }
});

test("A11Y-04 reduced motion preserves complete task", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/demo?fixture=FIX-DEMO-FIXED");
  await startAndApprove(page, "fixed");
  await expect(
    page.locator("[data-result='local_observable_pass_native_required']"),
  ).toBeVisible();
  const behavior = await page.evaluate(
    () => getComputedStyle(document.documentElement).scrollBehavior,
  );
  expect(behavior).toBe("auto");
});

test("PRIV-01 no runtime request after static assets load", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/demo?fixture=FIX-DEMO-FIXED");
  const loadRequestCount = requests.length;
  await startAndApprove(page, "fixed");
  expect(requests).toHaveLength(loadRequestCount);
  expect(
    requests.every((url) => url.startsWith("http://127.0.0.1:4273/")),
  ).toBe(true);
  await writeFile(
    resolve(evidenceRoot, "privacy/runtime-network.json"),
    `${JSON.stringify({ capturedAt: new Date().toISOString(), initialStaticRequests: requests, runtimeRequestsAfterLoad: 0, externalRequests: [], result: "pass" }, null, 2)}\n`,
  );
});

test("QA-02 invalid fixture and interruption preserve distinct recovery", async ({
  page,
}) => {
  await page.goto("/demo?fixture=NOT-A-FIXTURE");
  await expect(page.getByRole("alert")).toContainText("Invalid fixture");
  await page.screenshot({
    path: resolve(
      evidenceRoot,
      "screenshots/failure-states/invalid-fixture.png",
    ),
    fullPage: false,
  });
  await page.getByRole("button", { name: "Use guided fixture" }).click();
  await page.getByRole("button", { name: "Run broken fixture" }).click();
  await page
    .getByRole("button", { name: "Stop and retain partial log" })
    .click();
  await expect(page.locator("[data-result='interrupted']")).toContainText(
    "partial evidence retained without a verdict",
  );
  await page.screenshot({
    path: resolve(evidenceRoot, "screenshots/failure-states/interrupted.png"),
    fullPage: false,
  });
});

for (const injectedResult of ["invalid_run", "inconclusive"] as const) {
  test(`QA-02 ${injectedResult} is browser-reachable, recoverable, and never passes`, async ({
    page,
  }) => {
    await page.addInitScript((result) => {
      window.__STATECHORUS_TEST_FAULT__ = result;
    }, injectedResult);
    await page.goto("/demo?fixture=FIX-DEMO-FIXED");
    await startAndApprove(page, "fixed");
    const notice = page.locator(`[data-result='${injectedResult}']`);
    await expect(notice).toBeVisible();
    await expect(
      page.locator("[data-result='local_observable_pass_native_required']"),
    ).toHaveCount(0);
    await expect(notice).toContainText(
      injectedResult === "invalid_run"
        ? "reset and rerun"
        : "native verification remains required",
    );
    await page.screenshot({
      path: resolve(
        evidenceRoot,
        `screenshots/failure-states/${injectedResult.replace("_", "-")}.png`,
      ),
      fullPage: false,
    });
    await page.getByRole("button", { name: "Reset review" }).click();
    await expect(
      page.getByRole("button", { name: "Run fixed fixture" }),
    ).toBeFocused();
  });
}
