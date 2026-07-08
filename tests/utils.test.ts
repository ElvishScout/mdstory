import { describe, it, expect } from "vitest";
import { StableIdGenerator } from "../src/core/utils.js";

// ---------------------------------------------------------------------------
// StableIdGenerator unit tests
// ---------------------------------------------------------------------------

describe("StableIdGenerator", () => {
  it("generates sequential ids starting from id_0 by default", () => {
    const gen = new StableIdGenerator();
    expect(gen.next()).toBe("id_0");
    expect(gen.next()).toBe("id_1");
    expect(gen.next()).toBe("id_2");
  });

  it("accepts custom init and increment", () => {
    const gen = new StableIdGenerator(10, 5);
    expect(gen.next()).toBe("id_10");
    expect(gen.next()).toBe("id_15");
    expect(gen.next()).toBe("id_20");
  });

  it("skips reserved ids", () => {
    const gen = new StableIdGenerator();
    gen.reserve("id_0");
    gen.reserve("id_1");
    expect(gen.next()).toBe("id_2");
    expect(gen.next()).toBe("id_3");
  });

  it("reserve is idempotent", () => {
    const gen = new StableIdGenerator();
    gen.reserve("id_0");
    gen.reserve("id_0");
    expect(gen.next()).toBe("id_1");
  });

  it("handles interleaved reserve and next calls", () => {
    const gen = new StableIdGenerator();
    expect(gen.next()).toBe("id_0");
    gen.reserve("id_2");
    expect(gen.next()).toBe("id_1");
    expect(gen.next()).toBe("id_3"); // id_2 reserved, skipped
  });

  it("does not regenerate an id returned by next", () => {
    const gen = new StableIdGenerator();
    const first = gen.next();
    const second = gen.next();
    expect(first).not.toBe(second);
    // Cycling through: next also adds to used set
    expect(gen.next()).not.toBe(first);
    expect(gen.next()).not.toBe(second);
  });
});
