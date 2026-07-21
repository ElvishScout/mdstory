function toCamelCase(str: string): string {
  return str.replace(/[-_](\p{L})/gu, (_, char: string) => char.toUpperCase());
}

function coerceValue(value: string): string | number | boolean {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  const num = Number(value);
  if (!Number.isNaN(num) && String(num) === value) {
    return num;
  }
  return value;
}

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function isDangerousKey(key: string): boolean {
  return DANGEROUS_KEYS.has(key);
}

function isNumericIndex(key: string): boolean {
  // "0" is a valid array index; "01" is not (it would create an object property).
  return /^(0|[1-9]\d*)$/.test(key);
}

function setNested(target: Record<string, unknown>, keyPath: string, value: unknown): void {
  const rawKeys = keyPath.split(".");
  if (rawKeys.some(isDangerousKey)) {
    return;
  }

  const keys = rawKeys.map(toCamelCase);
  let current: Record<string, unknown> | unknown[] = target;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    if (
      !(key in current) ||
      typeof (current as Record<string, unknown>)[key] !== "object" ||
      (current as Record<string, unknown>)[key] === null
    ) {
      (current as Record<string, unknown>)[key] = isNumericIndex(nextKey) ? [] : {};
    }
    current = (current as Record<string, unknown>)[key] as Record<string, unknown> | unknown[];
  }
  (current as Record<string, unknown>)[keys[keys.length - 1]] = value;
}

export function parseKeyValuePairs(
  pairs: Iterable<[string, string]>,
  target?: Record<string, unknown>,
): Record<string, unknown> {
  const result = target ?? Object.create(null);
  for (const [key, value] of pairs) {
    setNested(result, key, coerceValue(value));
  }
  return result;
}
