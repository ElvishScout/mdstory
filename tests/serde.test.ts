import { describe, it, expect } from "vitest";
import { wrap, unwrap } from "../src/core/serde.js";

/** Full round-trip: wrap → JSON.stringify → JSON.parse → unwrap */
function roundTrip(value: any) {
  return unwrap(JSON.parse(JSON.stringify(wrap(value))));
}

// ---------------------------------------------------------------------------
// Primitive pass-through
// ---------------------------------------------------------------------------

describe("wrap / unwrap — primitives", () => {
  it("passes through null", () => {
    expect(wrap(null)).toBe(null);
    expect(unwrap(null)).toBe(null);
  });

  it("passes through booleans", () => {
    expect(roundTrip(true)).toBe(true);
    expect(roundTrip(false)).toBe(false);
  });

  it("passes through finite numbers", () => {
    expect(roundTrip(42)).toBe(42);
    expect(roundTrip(0)).toBe(0);
    expect(roundTrip(-3.14)).toBe(-3.14);
  });

  it("passes through strings", () => {
    expect(roundTrip("hello")).toBe("hello");
    expect(roundTrip("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Special types — single values
// ---------------------------------------------------------------------------

describe("wrap / unwrap — undefined", () => {
  it("round-trips undefined", () => {
    expect(roundTrip(undefined)).toBe(undefined);
  });

  it("preserves undefined as a property value", () => {
    const obj = { a: 1, b: undefined };
    const result = roundTrip(obj);
    expect(result).toEqual({ a: 1, b: undefined });
    expect("b" in result).toBe(true);
  });
});

describe("wrap / unwrap — SpecialNumber (NaN, Infinity)", () => {
  it("round-trips NaN", () => {
    expect(Number.isNaN(roundTrip(NaN))).toBe(true);
  });

  it("round-trips Infinity", () => {
    expect(roundTrip(Infinity)).toBe(Infinity);
  });

  it("round-trips -Infinity", () => {
    expect(roundTrip(-Infinity)).toBe(-Infinity);
  });
});

describe("wrap / unwrap — BigInt", () => {
  it("round-trips a BigInt", () => {
    expect(roundTrip(BigInt(9007199254740991))).toBe(BigInt(9007199254740991));
  });

  it("round-trips BigInt(0)", () => {
    expect(roundTrip(BigInt(0))).toBe(BigInt(0));
  });

  it("round-trips a large BigInt", () => {
    const huge = BigInt("123456789012345678901234567890");
    expect(roundTrip(huge)).toBe(huge);
  });
});

describe("wrap / unwrap — RegExp", () => {
  it("round-trips a RegExp with flags", () => {
    const result = roundTrip(/hello/i);
    expect(result).toBeInstanceOf(RegExp);
    expect(result.source).toBe("hello");
    expect(result.flags).toBe("i");
  });

  it("round-trips a RegExp without flags", () => {
    const result = roundTrip(/world/);
    expect(result.source).toBe("world");
    expect(result.flags).toBe("");
  });

  it("round-trips a RegExp with multiple flags", () => {
    const result = roundTrip(/foo bar/gi);
    expect(result.source).toBe("foo bar");
    expect(result.flags).toBe("gi");
  });

  it("round-trips a RegExp and preserves matching behavior", () => {
    const re = roundTrip(/^abc\d{3}$/i) as RegExp;
    expect(re.test("ABC123")).toBe(true);
    expect(re.test("abc999")).toBe(true);
    expect(re.test("ABC12")).toBe(false);
  });
});

describe("wrap / unwrap — Set", () => {
  it("round-trips an empty Set", () => {
    const result = roundTrip(new Set());
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it("round-trips a Set of primitives", () => {
    const result = roundTrip(new Set([1, "two", true]));
    expect(result).toBeInstanceOf(Set);
    expect(result.has(1)).toBe(true);
    expect(result.has("two")).toBe(true);
    expect(result.has(true)).toBe(true);
  });

  it("round-trips a Set containing undefined", () => {
    const result = roundTrip(new Set([1, undefined]));
    expect(result.has(1)).toBe(true);
    expect(result.has(undefined)).toBe(true);
  });

  it("round-trips a Set with nested special types", () => {
    const s = new Set([new Date("2025-01-01"), /pattern/g]);
    const result = roundTrip(s);
    expect(result).toBeInstanceOf(Set);
    const values = [...result];
    expect(values[0]).toBeInstanceOf(Date);
    expect((values[0] as Date).toISOString()).toBe("2025-01-01T00:00:00.000Z");
    expect(values[1]).toBeInstanceOf(RegExp);
    expect((values[1] as RegExp).source).toBe("pattern");
  });
});

describe("wrap / unwrap — Map", () => {
  it("round-trips an empty Map", () => {
    const result = roundTrip(new Map());
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it("round-trips a Map of string → number", () => {
    const m = new Map([
      ["a", 1],
      ["b", 2],
    ]);
    const result = roundTrip(m) as Map<string, number>;
    expect(result.get("a")).toBe(1);
    expect(result.get("b")).toBe(2);
  });

  it("round-trips a Map with undefined values", () => {
    const m = new Map([["k", undefined]]);
    const result = roundTrip(m) as Map<string, unknown>;
    expect(result.get("k")).toBe(undefined);
    expect(result.has("k")).toBe(true);
  });

  it("round-trips a Map with special type keys", () => {
    const m = new Map([[new Date("2025-06-15"), "summer"]]);
    const result = roundTrip(m) as Map<Date, string>;
    const key = [...result.keys()][0];
    expect(key).toBeInstanceOf(Date);
    expect(key.toISOString()).toBe("2025-06-15T00:00:00.000Z");
    expect(result.get(key)).toBe("summer");
  });
});

describe("wrap / unwrap — Date", () => {
  it("round-trips a Date", () => {
    const result = roundTrip(new Date("2025-01-01T12:00:00Z"));
    expect(result).toBeInstanceOf(Date);
    expect((result as Date).toISOString()).toBe("2025-01-01T12:00:00.000Z");
  });

  it("round-trips a Date at epoch", () => {
    const result = roundTrip(new Date(0));
    expect((result as Date).getTime()).toBe(0);
  });
});

describe("wrap / unwrap — URL", () => {
  it("round-trips a URL", () => {
    const result = roundTrip(new URL("https://example.com/path?a=1#frag"));
    expect(result).toBeInstanceOf(URL);
    expect((result as URL).href).toBe("https://example.com/path?a=1#frag");
    expect((result as URL).pathname).toBe("/path");
    expect((result as URL).search).toBe("?a=1");
    expect((result as URL).hash).toBe("#frag");
  });
});

// ---------------------------------------------------------------------------
// Nested structures
// ---------------------------------------------------------------------------

describe("wrap / unwrap — arrays", () => {
  it("round-trips arrays of primitives", () => {
    expect(roundTrip([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("round-trips arrays with mixed special types", () => {
    const arr = [new Date("2025-03-01"), /test/m, BigInt(42)];
    const result = roundTrip(arr) as any[];
    expect(result[0]).toBeInstanceOf(Date);
    expect((result[0] as Date).toISOString()).toBe("2025-03-01T00:00:00.000Z");
    expect(result[1]).toBeInstanceOf(RegExp);
    expect((result[1] as RegExp).source).toBe("test");
    expect(result[2]).toBe(BigInt(42));
  });
});

describe("wrap / unwrap — nested objects", () => {
  it("round-trips deeply nested objects", () => {
    const obj = {
      level1: {
        level2: {
          date: new Date("2025-04-01"),
          set: new Set([/nested-regex/i]),
        },
      },
    };
    const result = roundTrip(obj) as any;
    expect(result.level1.level2.date).toBeInstanceOf(Date);
    expect(result.level1.level2.set).toBeInstanceOf(Set);
    const inner = [...result.level1.level2.set][0];
    expect(inner).toBeInstanceOf(RegExp);
    expect(inner.source).toBe("nested-regex");
  });

  it("round-trips the smoke-test data", () => {
    const data = {
      ud: undefined,
      url: new URL("https://example.com/foo/bar?tar=1#id"),
      set: new Set([1, undefined, { nested: undefined }]),
      map: new Map([["k", undefined]] as any),
      date: new Date("2025-01-01"),
      reg: /hello/i,
      big: BigInt(9007199254740991),
      nan: NaN,
      inf: Infinity,
    };

    const restored = roundTrip(data) as any;
    expect("ud" in restored && restored.ud === undefined).toBe(true);
    expect(restored.url).toBeInstanceOf(URL);
    expect(restored.url.href).toBe("https://example.com/foo/bar?tar=1#id");
    expect(restored.set.has(undefined)).toBe(true);
    expect(restored.map.get("k")).toBe(undefined);
    expect(restored.date).toBeInstanceOf(Date);
    expect(restored.reg).toBeInstanceOf(RegExp);
    expect(restored.reg.source).toBe("hello");
    expect(restored.reg.flags).toBe("i");
    expect(restored.big).toBe(BigInt(9007199254740991));
    expect(Number.isNaN(restored.nan)).toBe(true);
    expect(restored.inf).toBe(Infinity);
  });
});

// ---------------------------------------------------------------------------
// Complex nesting — cross-container combinations
// ---------------------------------------------------------------------------

describe("wrap / unwrap — complex nesting", () => {
  it("Set containing Maps", () => {
    const m1 = new Map([["a", 1]]);
    const m2 = new Map([["b", new Date("2025-05-01")]]);
    const s = new Set([m1, m2]);
    const result = roundTrip(s) as Set<Map<string, any>>;
    expect(result).toBeInstanceOf(Set);
    const arr = [...result];
    expect(arr[0]).toBeInstanceOf(Map);
    expect(arr[0].get("a")).toBe(1);
    expect(arr[1]).toBeInstanceOf(Map);
    expect(arr[1].get("b")).toBeInstanceOf(Date);
  });

  it("Map containing Sets as values", () => {
    const m = new Map<string, any>([
      ["primitives", new Set([1, 2, 3])],
      ["specials", new Set([/rx/i, new Date("2025-06-01")])],
    ]);
    const result = roundTrip(m) as Map<string, Set<any>>;
    expect(result.get("primitives")).toBeInstanceOf(Set);
    expect(result.get("primitives")!.size).toBe(3);
    expect(result.get("specials")).toBeInstanceOf(Set);
    const specials = [...result.get("specials")!];
    expect(specials[0]).toBeInstanceOf(RegExp);
    expect(specials[1]).toBeInstanceOf(Date);
  });

  it("Map with special-type keys (Date)", () => {
    const key1 = new Date("2025-01-01");
    const key2 = new Date("2025-12-31");
    const m = new Map([
      [key1, "start"],
      [key2, "end"],
    ]);
    const result = roundTrip(m) as Map<Date, string>;
    const keys = [...result.keys()];
    expect(keys[0]).toBeInstanceOf(Date);
    expect(keys[0].toISOString()).toBe("2025-01-01T00:00:00.000Z");
    expect(keys[1]).toBeInstanceOf(Date);
    expect(keys[1].toISOString()).toBe("2025-12-31T00:00:00.000Z");
    expect(result.get(keys[0])).toBe("start");
    expect(result.get(keys[1])).toBe("end");
  });

  it("array of Sets containing Maps", () => {
    const data = [
      new Set([new Map([["deep", /pattern/gi]])]),
      new Set([new Map([["deeper", new URL("https://example.com")]])]),
    ];
    const result = roundTrip(data) as Array<Set<Map<string, any>>>;
    expect(result[0]).toBeInstanceOf(Set);
    const firstMap = [...result[0]][0];
    expect(firstMap).toBeInstanceOf(Map);
    expect(firstMap.get("deep")).toBeInstanceOf(RegExp);
    expect(firstMap.get("deep").source).toBe("pattern");
    expect(result[1]).toBeInstanceOf(Set);
    const secondMap = [...result[1]][0];
    expect(secondMap).toBeInstanceOf(Map);
    expect(secondMap.get("deeper")).toBeInstanceOf(URL);
  });

  it("object → array → Set → Map chain", () => {
    const data = {
      items: [new Set([new Map([["nested-key", BigInt(123456789)]])])],
      meta: {
        created: new Date("2025-03-15T08:30:00Z"),
        pattern: /^test\d+$/,
        url: new URL("https://api.example.com/v1"),
      },
    };
    const result = roundTrip(data) as any;

    // top-level structure
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items[0]).toBeInstanceOf(Set);
    const innerMap = [...result.items[0]][0];
    expect(innerMap).toBeInstanceOf(Map);
    expect(innerMap.get("nested-key")).toBe(BigInt(123456789));

    // meta object
    expect(result.meta.created).toBeInstanceOf(Date);
    expect(result.meta.created.toISOString()).toBe("2025-03-15T08:30:00.000Z");
    expect(result.meta.pattern).toBeInstanceOf(RegExp);
    expect(result.meta.pattern.source).toBe("^test\\d+$");
    expect(result.meta.url).toBeInstanceOf(URL);
    expect(result.meta.url.href).toBe("https://api.example.com/v1");
  });

  it("kitchen sink — all types deeply interleaved", () => {
    const data = {
      title: "complex test",
      undefinedField: undefined,
      stats: {
        visits: Infinity,
        bounceRate: NaN,
        maxId: BigInt("9999999999999999999"),
      },
      registry: new Map<string, any>([
        ["active", new Set([/admin/i, /user/i])],
        ["pending", new Set([new Map([["reason", undefined]])])],
      ]),
      urls: [new URL("https://a.example"), new URL("https://b.example")],
      timeline: [
        { event: "created", at: new Date("2025-01-01T00:00:00Z") },
        { event: "updated", at: new Date("2025-06-15T12:00:00Z") },
      ],
      config: /^cfg_/m,
    };

    const result = roundTrip(data) as any;

    // flat fields
    expect(result.title).toBe("complex test");
    expect("undefinedField" in result).toBe(true);
    expect(result.undefinedField).toBe(undefined);

    // nested special numbers
    expect(result.stats.visits).toBe(Infinity);
    expect(Number.isNaN(result.stats.bounceRate)).toBe(true);
    expect(result.stats.maxId).toBe(BigInt("9999999999999999999"));

    // Map → Set → RegExp
    expect(result.registry).toBeInstanceOf(Map);
    const active = result.registry.get("active");
    expect(active).toBeInstanceOf(Set);
    expect([...active][0]).toBeInstanceOf(RegExp);

    // Map → Set → Map → undefined value
    const pending = result.registry.get("pending");
    const pendingInner = [...pending][0];
    expect(pendingInner).toBeInstanceOf(Map);
    expect(pendingInner.get("reason")).toBe(undefined);

    // URL arrays
    expect(result.urls[0]).toBeInstanceOf(URL);
    expect(result.urls[0].href).toBe("https://a.example/");
    expect(result.urls[1]).toBeInstanceOf(URL);
    expect(result.urls[1].href).toBe("https://b.example/");

    // array of objects with Dates
    expect(result.timeline[0].at).toBeInstanceOf(Date);
    expect(result.timeline[0].at.toISOString()).toBe("2025-01-01T00:00:00.000Z");
    expect(result.timeline[1].at).toBeInstanceOf(Date);

    // top-level RegExp
    expect(result.config).toBeInstanceOf(RegExp);
    expect(result.config.source).toBe("^cfg_");
    expect(result.config.multiline).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("wrap / unwrap — edge cases", () => {
  it("handles an object with a $type property that is not a wrapper (passes through)", () => {
    const obj = { $type: "custom", value: 123 };
    const result = roundTrip(obj);
    expect(result).toEqual({ $type: "custom", value: 123 });
  });

  it("handles an empty object", () => {
    expect(roundTrip({})).toEqual({});
  });

  it("handles an empty array", () => {
    expect(roundTrip([])).toEqual([]);
  });

  it("preserves number 0 (not treated as a special number)", () => {
    expect(roundTrip(0)).toBe(0);
  });

  it("preserves number -1 (not treated as a special number)", () => {
    expect(roundTrip(-1)).toBe(-1);
  });

  it("preserves Number.MAX_VALUE", () => {
    expect(roundTrip(Number.MAX_VALUE)).toBe(Number.MAX_VALUE);
  });
});

// ---------------------------------------------------------------------------
// Circular references
// ---------------------------------------------------------------------------

describe("wrap / unwrap — circular references", () => {
  // wrap tests — verify no stack overflow and circular structure is preserved
  describe("wrap", () => {
    it("handles self-referencing object", () => {
      const obj: any = { name: "test" };
      obj.self = obj;

      const wrapped = wrap(obj);
      expect(wrapped.name).toBe("test");
      expect(wrapped.self).toBe(wrapped); // circular ref preserved
    });

    it("handles two-way references between objects", () => {
      const child: any = { name: "child" };
      const parent: any = { name: "parent", child };
      child.parent = parent;

      const wrapped = wrap(parent);
      expect(wrapped.name).toBe("parent");
      expect(wrapped.child.name).toBe("child");
      expect(wrapped.child.parent).toBe(wrapped); // child.parent → parent
    });

    it("handles array containing itself", () => {
      const arr: any[] = [1, 2];
      arr.push(arr);

      const wrapped = wrap(arr);
      expect(wrapped[0]).toBe(1);
      expect(wrapped[1]).toBe(2);
      expect(wrapped[2]).toBe(wrapped); // self-reference
    });

    it("handles deeply nested circular reference back to root", () => {
      const root: any = { level: 1, child: { level: 2, items: [] as any[] } };
      root.child.items.push(root);

      const wrapped = wrap(root);
      expect(wrapped.level).toBe(1);
      expect(wrapped.child.level).toBe(2);
      expect(wrapped.child.items[0]).toBe(wrapped);
    });

    it("handles three objects in a cycle (A → B → C → A)", () => {
      const a: any = { label: "A" };
      const b: any = { label: "B" };
      const c: any = { label: "C" };
      a.next = b;
      b.next = c;
      c.next = a;

      const wrapped = wrap(a);
      expect(wrapped.label).toBe("A");
      expect(wrapped.next.label).toBe("B");
      expect(wrapped.next.next.label).toBe("C");
      expect(wrapped.next.next.next).toBe(wrapped); // back to A
    });

    it("handles duplicate (===) objects without treating them as circular", () => {
      const shared = { count: 1 };
      const obj = { a: shared, b: shared }; // same object, not circular

      const wrapped = wrap(obj);
      expect(wrapped.a.count).toBe(1);
      expect(wrapped.b.count).toBe(1);
      expect(wrapped.a).toBe(wrapped.b); // preserved identity, not circular
    });

    it("handles Set containing an object that references the Set", () => {
      const set = new Set<unknown>();
      const container: any = { tag: "container", ref: set };
      set.add(container);

      const wrapped = wrap(container);
      expect(wrapped.tag).toBe("container");
      expect(wrapped.ref.$type).toBe("Set");
      expect(wrapped.ref.value[0]).toBe(wrapped); // Set value[0] → container
    });

    it("handles Map with circular reference through containing object", () => {
      const map = new Map<string, unknown>();
      const obj: any = { label: "looped", theMap: map };
      map.set("back", obj);

      const wrapped = wrap(obj);
      expect(wrapped.label).toBe("looped");
      expect(wrapped.theMap.$type).toBe("Map");
      // Map entry's value points back to obj
      const mapValue = wrapped.theMap.value as [string, unknown][];
      expect(mapValue[0][1]).toBe(wrapped);
    });

    it("handles array with mixed codec types inside a cycle", () => {
      const arr: any[] = [new Date("2025-01-01")];
      arr.push({ nested: arr }); // circular back to the array

      const wrapped = wrap(arr);
      expect(wrapped[0].$type).toBe("Date");
      expect(wrapped[1].nested).toBe(wrapped);
    });
  });

  // unwrap tests — in-memory round-trip (no JSON serialization)
  describe("unwrap", () => {
    it("handles self-referencing object round-trip", () => {
      const obj: any = { name: "test" };
      obj.self = obj;

      const result = unwrap(wrap(obj));
      expect(result.name).toBe("test");
      expect(result.self).toBe(result);
    });

    it("handles two-way references round-trip", () => {
      const child: any = { name: "child" };
      const parent: any = { name: "parent", child };
      child.parent = parent;

      const result = unwrap(wrap(parent));
      expect(result.name).toBe("parent");
      expect(result.child.name).toBe("child");
      expect(result.child.parent).toBe(result);
    });

    it("handles array containing itself round-trip", () => {
      const arr: any[] = [1, 2];
      arr.push(arr);

      const result = unwrap(wrap(arr));
      expect(result[0]).toBe(1);
      expect(result[1]).toBe(2);
      expect(result[2]).toBe(result);
    });

    it("handles three-object cycle round-trip", () => {
      const a: any = { label: "A" };
      const b: any = { label: "B" };
      const c: any = { label: "C" };
      a.next = b;
      b.next = c;
      c.next = a;

      const result = unwrap(wrap(a));
      expect(result.label).toBe("A");
      expect(result.next.label).toBe("B");
      expect(result.next.next.label).toBe("C");
      expect(result.next.next.next).toBe(result);
    });

    it("handles duplicate objects (=== identity) round-trip", () => {
      const shared = { count: 1 };
      const obj = { a: shared, b: shared };

      const result = unwrap(wrap(obj));
      expect(result.a.count).toBe(1);
      expect(result.b.count).toBe(1);
      expect(result.a).toBe(result.b);
    });

    it("handles Set containing object that references the Set round-trip", () => {
      const set = new Set<unknown>();
      const container: any = { tag: "container", ref: set };
      set.add(container);

      const result = unwrap(wrap(container));
      expect(result.tag).toBe("container");
      expect(result.ref).toBeInstanceOf(Set);
      const setValues = [...result.ref];
      expect(setValues[0]).toBe(result); // Set contains container
    });

    it("handles Map with circular reference round-trip", () => {
      const map = new Map<string, unknown>();
      const obj: any = { label: "looped", theMap: map };
      map.set("back", obj);

      const result = unwrap(wrap(obj));
      expect(result.label).toBe("looped");
      expect(result.theMap).toBeInstanceOf(Map);
      expect(result.theMap.get("back")).toBe(result);
    });

    it("handles Date inside a circular structure round-trip", () => {
      const date = new Date("2025-07-15T12:00:00Z");
      const obj: any = { created: date };
      (obj as any).ref = obj; // self-reference

      const result = unwrap(wrap(obj));
      expect(result.created).toBeInstanceOf(Date);
      expect(result.created.toISOString()).toBe("2025-07-15T12:00:00.000Z");
      expect(result.ref).toBe(result);
    });

    it("handles deeply nested mixed cycle with codec types", () => {
      const a: any = {
        name: "A",
        date: new Date("2025-06-01"),
        set: new Set([/pattern/gi]),
      };
      const b: any = {
        name: "B",
        url: new URL("https://example.com"),
        back: a,
      };
      a.next = b; // a → b → a cycle

      const result = unwrap(wrap(a));
      expect(result.name).toBe("A");
      expect(result.date).toBeInstanceOf(Date);
      expect(result.set).toBeInstanceOf(Set);
      expect([...result.set][0]).toBeInstanceOf(RegExp);
      expect(result.next.name).toBe("B");
      expect(result.next.url).toBeInstanceOf(URL);
      expect(result.next.back).toBe(result); // circular ref resolved
    });
  });

  // Stress: dozens of objects with shared references (no crash)
  describe("stress", () => {
    it("handles a large chain of objects referencing the same root", () => {
      const root: any = { id: "root", children: [] as any[] };
      for (let i = 0; i < 100; i++) {
        root.children.push({ index: i, root }); // each child points to root
      }

      const wrapped = wrap(root);
      expect(wrapped.id).toBe("root");
      expect(wrapped.children).toHaveLength(100);
      // all children's "root" field is the same wrapped root object
      for (let i = 0; i < 100; i++) {
        expect(wrapped.children[i].root).toBe(wrapped);
      }
    });

    it("handles deeply nested linear chain (no cycles, deep recursion)", () => {
      let current: any = { value: 0 };
      const head = current;
      for (let i = 1; i <= 1000; i++) {
        current.next = { value: i };
        current = current.next;
      }

      const result = unwrap(wrap(head));
      let cursor = result;
      for (let i = 0; i <= 1000; i++) {
        expect(cursor.value).toBe(i);
        cursor = cursor.next;
      }
    });
  });
});
