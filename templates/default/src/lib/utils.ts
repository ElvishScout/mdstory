/**
 * Replace <input> with <fc-input> custom elements.
 * The browser upgrades <fc-input> to the FcInput Svelte web component.
 */
export function processHtml(html: string, disabled?: boolean): string {
  const doc = new DOMParser().parseFromString(html, "text/html");

  for (const input of doc.querySelectorAll("input")) {
    if (disabled) {
      input.disabled = true;
    }

    const fcInput = doc.createElement("fc-input");
    for (const attr of input.attributes) {
      fcInput.setAttribute(attr.name, attr.value);
    }
    input.replaceWith(fcInput);
  }

  if (disabled) {
    for (const button of doc.querySelectorAll("button")) {
      button.disabled = true;
    }
  }

  return doc.body.innerHTML;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Deep merge two objects. Arrays are overwritten (not merged).
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceVal = source[key];
    const targetVal = result[key];

    if (isPlainObject(sourceVal) && isPlainObject(targetVal)) {
      result[key] = deepMerge(targetVal as Record<string, unknown>, sourceVal as Record<string, unknown>) as T[keyof T];
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal as T[keyof T];
    }
  }

  return result;
}
