import { createElementHtml, type HtmlAttrs } from "../utils/html";

/** Type indicator for input fields. */
export type InputType = "string" | "number" | "boolean";

function createInputHtml({ name, type, value }: { name: string; type: InputType; value: any }) {
  const inputType = type === "boolean" ? "checkbox" : "text";
  const inputAttrs: HtmlAttrs = {
    name,
    type: inputType,
    value: inputType !== "checkbox" ? String(value) : undefined,
    checked: inputType === "checkbox" && value ? "" : undefined,
    "aria-label": name,
  };

  return createElementHtml("input", inputAttrs);
}

function createSubmitButtonHtml({ target, children }: { target: string; children: string }) {
  const buttonAttrs: HtmlAttrs = {
    name: "@target",
    type: "submit",
    value: target,
  };
  return createElementHtml("button", buttonAttrs, children);
}

/** Parameters passed to every adapter helper registered with Handlebars. */
export interface HelperParam {
  /** Positional arguments supplied by the template (e.g. the input type). */
  args: any[];
  /** Named arguments (hash) supplied by the template (e.g. `{ name: value }`). */
  options: Record<string, any>;
  /** Trimmed block content for block helpers; undefined for inline helpers. */
  children?: string;
}

/** Built-in helpers every adapter must provide. */
interface BuiltinHelpers {
  /**
   * Render an input placeholder.
   * Expected `args[0]` is the input type (defaults to `"string"`);
   * `options` should contain a single `{ name: value }` pair.
   */
  input(param: HelperParam): string;

  /**
   * Render a navigation/submit control.
   * Expected `args[0]` is the navigation target;
   * `children` is the visible label text for block usage.
   */
  nav(param: HelperParam): string;

  /** Render line breaks. Expected `args[0]` is the number of breaks (defaults to 1). */
  linebreak(param: HelperParam): string;
}

/** Custom render adapter for generating output in different formats. */
export interface RenderAdapter {
  /** Whether to convert Markdown to HTML */
  format: "markdown" | "html";
  /** Built-in and custom Handlebars helpers used during rendering. */
  helpers: BuiltinHelpers & Record<string, (param: HelperParam) => string>;
}

export const markdownAdapter: RenderAdapter = {
  format: "markdown",
  helpers: {
    input({ args: [type], options }) {
      const option = Object.entries(options)[0];
      if (!option) {
        return "";
      }
      const [name] = option;
      return type === "boolean" ? `<u>[? ${name}]</u>` : `<u>[> ${name}]</u>`;
    },
    nav({ children }) {
      return `<u>[@ ${children ?? ""}]</u>`;
    },
    linebreak({ args: [n] }) {
      return "<br>".repeat(n ?? 1);
    },
  },
};

export const htmlAdapter: RenderAdapter = {
  format: "html",
  helpers: {
    input({ args: [type], options }) {
      const option = Object.entries(options)[0];
      if (!option) {
        return "";
      }
      const [name, value] = option;
      return createInputHtml({ name, type: type ?? "string", value });
    },
    nav({ args: [target], children }) {
      return createSubmitButtonHtml({ target: target ?? "", children: children ?? "" });
    },
    linebreak({ args: [n] }) {
      return "<br>".repeat(n ?? 1);
    },
  },
};
