import Handlebars from "handlebars";
import type { HelperDeclareSpec, HelperOptions } from "handlebars";
import MarkdownIt from "markdown-it";
import pluginAttrs from "markdown-it-attrs";
import pluginMark from "markdown-it-mark";

import type { InputType, Variable, Scope, Asset } from "./definitions.js";
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

/** Custom renderer for generating output in different formats. */
export interface Renderer {
  /** Whether to convert Markdown to HTML */
  html?: boolean;
  /** Render input area */
  input?(options: { name: string; type: InputType; value: string }): string;
  /** Render navigation area */
  nav?(options: { target: string | null; children: string }): string;
  /** Render line breaks */
  linebreak?(options: { n?: number }): string;
}

const markdownRenderer: Renderer = {
  html: false,
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

const htmlRenderer: Renderer = {
  html: true,
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

/** Rendering options. */
export type RenderOptions = {
  renderer: "markdown" | "html" | Renderer;
};

/** The rendering result containing rendered text and extracted fields. */
export type RenderResult = { text: string } & Fields;

type Fields = {
  inputs: { name: string; type: InputType; value: Variable }[];
  navs: { text: string; target: string | null }[];
};

function useHelper({ inputs, navs }: Fields, assets: Record<string, Asset>, renderer: Renderer): HelperDeclareSpec {
  return {
    input(type: InputType, opt: HelperOptions) {
      for (const name in opt.hash) {
        const value = opt.hash[name];
        inputs.push({ name, type, value });
        const result = renderer.input?.({ name, type, value }) ?? "";
        return new Handlebars.SafeString(result);
      }
      return "";
    },
    nav(target: string | null, opt: HelperOptions) {
      const text = opt.fn(this).trim();
      navs.push({ text, target });
      const result = renderer.nav?.({ target, children: text }) ?? "";
      return new Handlebars.SafeString(result);
    },
    linebreak(n?: number) {
      const result = renderer.linebreak?.({ n }) ?? "";
      return new Handlebars.SafeString(result);
    },
    asset(name: string) {
      return new Handlebars.SafeString(assets[name]?.url ?? "");
    },
    mime(name: string) {
      return new Handlebars.SafeString(assets[name]?.mime ?? "");
    },
  };
}

/**
 * Compiles a Handlebars template with built-in helpers, optionally renders
 * through MarkdownIt, and returns the rendered text with extracted fields.
 */
export function renderTemplate(
  template: string,
  scope: Scope,
  assets: Record<string, Asset>,
  options: RenderOptions,
): RenderResult {
  let resolvedRenderer: Renderer;
  if (options.renderer === "markdown") {
    resolvedRenderer = markdownRenderer;
  } else if (options.renderer === "html") {
    resolvedRenderer = htmlRenderer;
  } else {
    resolvedRenderer = options.renderer;
  }

  const fields: Fields = { inputs: [], navs: [] };
  const helpers = useHelper(fields, assets, resolvedRenderer);

  let text;
  if (resolvedRenderer.html) {
    const md = new MarkdownIt({ html: true }).use(pluginAttrs).use(pluginMark);
    text = Handlebars.compile(template)(scope, { helpers });
    text = md.render(text);
  } else {
    text = Handlebars.compile(template, { noEscape: true })(scope, { helpers });
  }

  return { text, ...fields };
}
