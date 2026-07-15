interface Handler {
  match: (value: any) => boolean;
  wrap: (value: any) => any;
  unwrap: (value: any) => any;
}

const handlers: Record<string, Handler> = {
  Undefined: {
    match: (value) => value === undefined,
    wrap: () => null,
    unwrap: () => undefined,
  },
  Number: {
    match: (value) => (typeof value === "number" || value instanceof Number) && !Number.isFinite(Number(value)),
    wrap: (value) => value.toString(),
    unwrap: (value) => Number(value),
  },
  BigInt: {
    match: (value) => typeof value === "bigint",
    wrap: (value) => value.toString(),
    unwrap: (value) => BigInt(value),
  },
  RegExp: {
    match: (value) => value instanceof RegExp,
    wrap: (value) => ({ pattern: value.source, flags: value.flags }),
    unwrap: (value) => new RegExp(value.pattern, value.flags),
  },
  Set: {
    match: (value) => value instanceof Set,
    wrap: (value) => [...value],
    unwrap: (value) => new Set(value),
  },
  Map: {
    match: (value) => value instanceof Map,
    wrap: (value) => [...value],
    unwrap: (value) => new Map(value),
  },
  Date: {
    match: (value) => value instanceof Date,
    wrap: (value) => value.toISOString(),
    unwrap: (value) => new Date(value),
  },
  URL: {
    match: (value) => value instanceof URL,
    wrap: (value) => value.href,
    unwrap: (value) => new URL(value),
  },
};

/**
 * Recursively wrap special JS types into JSON-safe `{ $type, value }` objects.
 * After wrapping, the result can be passed to `JSON.stringify` directly.
 *
 * Circular references are handled by returning the previously-converted object.
 */
export function wrap(data: any): any {
  const seen = new WeakMap<object, any>();

  function _wrap(value: any): any {
    // Check circular references for objects/arrays BEFORE any handler processing
    if (value !== null && typeof value === "object") {
      if (seen.has(value)) {
        return seen.get(value);
      }
    }

    // Primitives that can never match any handler — return as-is.
    if (value === null || ["string", "boolean", "symbol", "function"].includes(typeof value)) {
      return value;
    }

    if (Array.isArray(value)) {
      const result: any[] = [];
      seen.set(value, result);
      for (let i = 0; i < value.length; i++) {
        result[i] = _wrap(value[i]);
      }
      return result;
    }

    if (typeof value === "object") {
      const proto = Object.getPrototypeOf(value);
      if (proto === Object.prototype || proto === null) {
        const result: Record<string, any> = {};
        seen.set(value, result);
        for (const key of Object.keys(value)) {
          result[key] = _wrap(value[key]);
        }
        return result;
      }
    }

    for (const [name, handler] of Object.entries(handlers)) {
      if (handler.match(value)) {
        const result: Record<string, any> = { $type: name };
        if (typeof value === "object") {
          seen.set(value, result);
        }
        result.value = _wrap(handler.wrap(value));
        return result;
      }
    }

    return value;
  }

  return _wrap(data);
}

/**
 * Recursively unwrap `{ $type, value }` objects back into native JS types.
 * Feed it the result of `JSON.parse` on a wrapped structure.
 *
 * Circular references are handled by returning the previously-unwrapped object.
 */
export function unwrap(data: any): any {
  const seen = new WeakMap<object, any>();

  function _unwrap(value: any): any {
    if (value === null || typeof value !== "object") {
      return value;
    }

    if (seen.has(value)) {
      return seen.get(value);
    }

    if (Array.isArray(value)) {
      const result: any[] = [];
      seen.set(value, result);
      for (let i = 0; i < value.length; i++) {
        result[i] = _unwrap(value[i]);
      }
      return result;
    }

    if (typeof value.$type === "string" && "value" in value) {
      const handler = handlers[value.$type];
      if (handler) {
        const result = handler.unwrap(_unwrap(value.value));
        seen.set(value, result);
        return result;
      }
    }

    const result: Record<string, any> = {};
    seen.set(value, result);
    for (const key of Object.keys(value)) {
      result[key] = _unwrap(value[key]);
    }
    return result;
  }

  return _unwrap(data);
}
