/**
 * Convert a data URL to a Blob, so it can be served via URL.createObjectURL.
 * Supports both base64 and percent-encoded data URLs.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const commaIndex = dataUrl.indexOf(",");
  const header = dataUrl.slice(0, commaIndex);
  const data = dataUrl.slice(commaIndex + 1);
  const mime = /^data:([^;,]*)/.exec(header)?.[1] ?? "";

  if (header.endsWith(";base64")) {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  }

  return new Blob([decodeURIComponent(data)], { type: mime });
}

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
