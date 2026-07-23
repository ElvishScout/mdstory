export type HtmlAttrs = Record<string, string | number | boolean | undefined>;

function escapeHtml(text: string) {
  return text.replace(/[<>&'"]/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

export function createElementHtml(tag: string, attrs: HtmlAttrs, children?: string) {
  // prettier-ignore
  const voidTags = [
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
  ];

  const attrText = Object.entries(attrs)
    .map(([name, value]) => {
      if (typeof value === "boolean") {
        value = value ? "" : undefined;
      }
      if (value === undefined) {
        return null;
      }
      if (value === "") {
        return name;
      }
      const escapedValue = escapeHtml(String(value) ?? "");
      return `${name}="${escapedValue}"`;
    })
    .filter((attr): attr is string => attr !== null)
    .join(" ");

  if (voidTags.includes(tag)) {
    return `<${tag} ${attrText}>`;
  }
  return `<${tag} ${attrText}>${children ?? ""}</${tag}>`;
}
