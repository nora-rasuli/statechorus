import { afterEach, describe, expect, it } from "vitest";
import { FIXTURES } from "../../src/fixtures/corpus";
import { BrowserDomProvider } from "../../src/providers/browser-dom";

describe("ENG-03 BrowserDomProvider authority", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("captures rendered DOM facts and cannot turn fixture flags into observations", () => {
    const flaggedFixture = FIXTURES["FIX-001"];
    expect(flaggedFixture.faults.tokenMutationFlood).toBe(true);

    document.body.innerHTML = `
      <div role="status"
        data-observable-status
        data-status-revision="streaming-0"
        data-status-state="streaming"
        data-semantic-key="streaming">Synthetic response is updating.</div>
      <section data-replay-state="streaming">
        <p data-transcript-id="msg-assistant-001" data-transcript-stable="false">The synthetic fixture</p>
      </section>
    `;

    const provider = new BrowserDomProvider();
    provider.start(document.body, "run-control");
    provider.observe(document.body);
    const captured = provider.capture();
    provider.stop();

    expect(
      captured.filter(
        (event) =>
          event.type === "live_region_mutation" &&
          event.semanticKey === "streaming",
      ),
    ).toHaveLength(1);
    expect(captured.some((event) => event.source !== "browser_dom")).toBe(
      false,
    );
  });
});
