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
