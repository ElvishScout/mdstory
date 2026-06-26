/**
 * Replace <input> with <fc-input> custom elements.
 * The browser upgrades <fc-input> to the FcInput Svelte web component.
 */
export function processHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");

  for (const input of Array.from(doc.querySelectorAll("input"))) {
    const fcInput = doc.createElement("fc-input");
    for (const attr of input.attributes) {
      fcInput.setAttribute(attr.name, attr.value);
    }
    input.replaceWith(fcInput);
  }

  return doc.body.innerHTML;
}
