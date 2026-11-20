import { describe, expect, it } from "vitest";
import {
  CORPUS_IDS,
  FIXTURES,
  validateFixture,
} from "../../src/fixtures/corpus";
import { stableHash } from "../../src/utils/stable";

describe("QA-01 versioned fixture corpus", () => {
  it("contains the exact eight evaluation fixtures with stable hashes and sequences", () => {
    expect(CORPUS_IDS).toHaveLength(8);
    for (const id of CORPUS_IDS) {
      const fixture = FIXTURES[id];
      expect(validateFixture(fixture)).toEqual([]);
      expect(fixture.hash).toMatch(/^fnv1a64:[0-9a-f]{16}$/);
      const body = { ...fixture };
      Reflect.deleteProperty(body, "hash");
      expect(fixture.hash).toBe(stableHash(body));
    }
  });
});
