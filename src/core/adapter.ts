import type { InputType, Variable } from "./definitions.js";
import { escapeHtml } from "./utils.js";

type HtmlAttrs = Record<string, string | boolean | undefined>;

const createElementHtml = (tag: string, attrs: HtmlAttrs, children?: string) => {
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
      if (value) {
        const escapedValue = escapeHtml(value ?? "");
        return `${name}="${escapedValue}"`;
      } else {
        return name;
      }
    })
    .filter((attr): attr is string => attr !== null)
    .join(" ");

  if (voidTags.includes(tag)) {
    return `<${tag} ${attrText}>`;
  }
  return `<${tag} ${attrText}>${children ?? ""}</${tag}>`;
};

const createInputHtml = ({ name, type, value }: { name: string; type: InputType; value: Variable }) => {
  const inputType = type === "boolean" ? "checkbox" : "text";
  const inputAttrs: HtmlAttrs = {
    name,
    type: inputType,
    value: inputType !== "checkbox" ? String(value) : undefined,
    checked: inputType === "checkbox" && value ? "" : undefined,
    "aria-label": name,
  };

  return createElementHtml("input", inputAttrs);
};

const createSubmitButtonHtml = ({ target, children }: { target: string; children: string }) => {
  const buttonAttrs: HtmlAttrs = {
    name: "@target",
    type: "submit",
    value: target,
  };
  return createElementHtml("button", buttonAttrs, children);
};

/** Custom render adapter for generating output in different formats. */
export interface RenderAdapter {
  /** Whether to convert Markdown to HTML */
  format: "markdown" | "html";
  /** Render input area */
  input?(options: { name: string; type: InputType; value: string }): string;
  /** Render navigation area */
  nav?(options: { target: string | null; children: string }): string;
  /** Render line breaks */
  linebreak?(options: { n?: number }): string;
}

export const markdownAdapter: RenderAdapter = {
  format: "markdown",
  input({ name, type }) {
    if (type === "boolean") {
      return `<u>[? ${name}]</u>`;
    } else {
      return `<u>[> ${name}]</u>`;
    }
  },
  nav({ children }) {
    return `<u>[@ ${children}]</u>`;
  },
  linebreak({ n }) {
    return "<br>".repeat(n ?? 1);
  },
};

export const htmlAdapter: RenderAdapter = {
  format: "html",
  input({ type, name, value }) {
    return createInputHtml({ name, type, value });
  },
  nav({ target, children }) {
    return createSubmitButtonHtml({ target: target ?? "", children });
  },
  linebreak({ n }) {
    return "<br>".repeat(n ?? 1);
  },
};
