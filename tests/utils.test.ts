import { describe, it, expect } from "vitest";
import { parseKeyValuePairs } from "../src/utils/object.js";
import { StableIdGenerator } from "../src/utils/id.js";

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

// ---------------------------------------------------------------------------
// parseKeyValuePairs unit tests
// ---------------------------------------------------------------------------

describe("parseKeyValuePairs", () => {
  it("parses simple flat key-value pairs", () => {
    const result = parseKeyValuePairs([
      ["foo", "bar"],
      ["baz", "qux"],
    ]);
    expect(result).toEqual({ foo: "bar", baz: "qux" });
  });

  it("coerces boolean and number values", () => {
    const result = parseKeyValuePairs([
      ["debug", "true"],
      ["count", "42"],
      ["name", "hello"],
    ]);
    expect(result).toEqual({ debug: true, count: 42, name: "hello" });
  });

  it("converts kebab-case keys to camelCase", () => {
    const result = parseKeyValuePairs([
      ["font-size", "16"],
      ["background-color", "red"],
    ]);
    expect(result).toEqual({ fontSize: 16, backgroundColor: "red" });
  });

  it("supports dot-notation for nested objects", () => {
    const result = parseKeyValuePairs([
      ["ui.theme", "dark"],
      ["ui.fontSize", "14"],
    ]);
    expect(result).toEqual({ ui: { theme: "dark", fontSize: 14 } });
  });

  it("creates arrays when a key segment is a numeric index", () => {
    const result = parseKeyValuePairs([
      ["a.0", "foo"],
      ["a.1", "bar"],
    ]);
    expect(result).toEqual({ a: ["foo", "bar"] });
  });

  it("creates arrays of objects when numeric index has nested keys", () => {
    const result = parseKeyValuePairs([
      ["items.0.name", "first"],
      ["items.0.value", "10"],
      ["items.1.name", "second"],
    ]);
    expect(result).toEqual({
      items: [{ name: "first", value: 10 }, { name: "second" }],
    });
  });

  it("handles nested arrays", () => {
    const result = parseKeyValuePairs([
      ["matrix.0.0", "a"],
      ["matrix.0.1", "b"],
    ]);
    expect(result).toEqual({ matrix: [["a", "b"]] });
  });

  it("handles sparse arrays", () => {
    const result = parseKeyValuePairs([
      ["a.0", "first"],
      ["a.2", "third"],
    ]);
    // sparse: index 1 is a hole
    expect(result).toHaveProperty("a.0", "first");
    expect(result).toHaveProperty("a.2", "third");
    expect((result as any).a[1]).toBeUndefined();
  });

  it("combines camelCase conversion with array indices", () => {
    const result = parseKeyValuePairs([
      ["nav-items.0.label", "Home"],
      ["nav-items.0.href", "/"],
      ["nav-items.1.label", "About"],
    ]);
    expect(result).toEqual({
      navItems: [{ label: "Home", href: "/" }, { label: "About" }],
    });
  });

  it("merges into an optional target object", () => {
    const target = { existing: "value" };
    const result = parseKeyValuePairs([["newKey", "newValue"]], target);
    expect(result).toBe(target);
    expect(result).toEqual({ existing: "value", newKey: "newValue" });
  });

  it("extends nested objects in the target", () => {
    const target = { ui: { theme: "light" } };
    const result = parseKeyValuePairs([["ui.fontSize", "14"]], target);
    expect(result).toEqual({ ui: { theme: "light", fontSize: 14 } });
  });

  it("preserves leading-zero strings as strings (not numbers)", () => {
    const result = parseKeyValuePairs([["zip", "042"] as [string, string]]);
    expect(result).toEqual({ zip: "042" });
  });

  it("coerces '0' to number 0", () => {
    const result = parseKeyValuePairs([["count", "0"] as [string, string]]);
    expect(result).toEqual({ count: 0 });
  });

  it("treats keys with leading zeros as object properties, not array indices", () => {
    const result = parseKeyValuePairs([
      ["a.01", "first"],
      ["a.02", "second"],
    ]);
    expect(result).toEqual({ a: { "01": "first", "02": "second" } });
  });

  it("skips prototype-polluting keys", () => {
    const result = parseKeyValuePairs([
      ["__proto__", "polluted"],
      ["constructor", "polluted"],
      ["prototype", "polluted"],
      ["nested.__proto__.foo", "polluted"],
      ["safe", "value"],
    ]);
    expect((result as any).__proto__).not.toBe("polluted");
    expect((result as any).constructor).not.toBe("polluted");
    expect((result as any).prototype).toBeUndefined();
    expect(result).toEqual({ safe: "value" });
  });

  it("returns a null-prototype object when no target is provided", () => {
    const result = parseKeyValuePairs([["foo", "bar"]]);
    expect(Object.getPrototypeOf(result)).toBe(null);
  });
});
