import Handlebars, { HelperDeclareSpec, HelperOptions } from "handlebars";
import MarkdownIt from "markdown-it";
import pluginAttrs from "markdown-it-attrs";
import pluginMark from "markdown-it-mark";

import { InputType, Variable, ChapterHooks, Scope, Asset } from "./definitions.js";
import { escapeHtml } from "./utils.js";

type HtmlAttrs = Record<string, string | boolean | undefined>;

const valueType = (value: Variable): InputType => {
  if (typeof value === "number" || value === null) {
    return "number";
  }
  if (typeof value === "boolean") {
    return "boolean";
  }
  return "string";
};

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

/** Custom renderer interface for generating output in different formats. */
export type Renderer = {
  /** Renders an input field. */
  input?: ({ name, type, value }: { name: string; type: InputType; value: string }) => string;
  /** Renders a navigation button. */
  nav?: ({ target, children }: { target: string | null; children: string }) => string;
};

const markdownRenderer: Renderer = {
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
};

const htmlRenderer: Renderer = {
  input({ type, name, value }) {
    return createInputHtml({ name, type, value });
  },
  nav({ target, children }) {
    return createSubmitButtonHtml({ target: target ?? "", children });
  },
};

/** Rendering options. */
export type RenderOptions = {
  /** The rendering format: "markdown", "html", or a custom Renderer. */
  format: "markdown" | "html" | Renderer;
  /** Whether to parse Markdown into HTML (defaults to false). */
  html?: boolean;
};

/** The rendering result containing rendered text and extracted fields. */
export type RenderResult = { text: string } & Omit<Fields, "sets">;

type Fields = {
  inputs: { name: string; type: InputType; value: Variable }[];
  sets: { name: string; type: InputType; value: Variable }[];
  navs: { text: string; target: string | null }[];
};

const useHelper = (
  { inputs, sets, navs }: Fields,
  assets: Record<string, Asset>,
  renderer: Renderer,
): HelperDeclareSpec => {
  return {
    input(type: InputType, opt: HelperOptions) {
      for (const name in opt.hash) {
        const value = opt.hash[name];
        inputs.push({ name, type, value });
        const result = renderer.input ? renderer.input({ name, type, value }) : "";
        return new Handlebars.SafeString(result);
      }
      return "";
    },
    set(opt: HelperOptions) {
      for (const name in opt.hash) {
        const value = opt.hash[name];
        const type = valueType(value);
        sets.push({ name, type, value });
      }
      return "";
    },
    nav(target: string | null, opt: HelperOptions) {
      const text = opt.fn(this).trim();
      navs.push({ text, target });
      const result = renderer.nav ? renderer.nav({ target, children: text }) : "";
      return new Handlebars.SafeString(result);
    },
    asset(name: string) {
      return new Handlebars.SafeString(assets[name]?.url ?? "");
    },
    mime(name: string) {
      return new Handlebars.SafeString(assets[name]?.mime ?? "");
    },
    linebreak(n?: number) {
      return new Handlebars.SafeString("<br>".repeat(n ?? 1));
    },
  };
};

/** Initialization options for a Chapter. */
export type ChapterOptions = {
  /** Unique identifier for the chapter. */
  id: string;
  /** The chapter title. */
  title: string;
  /** The Handlebars template. */
  template: string;
  /** Lifecycle hooks for the chapter. */
  hooks: ChapterHooks;
};

/**
 * Defines a chapter with a Handlebars template and lifecycle hooks.
 */
export class Chapter {
  id: string;
  title: string;
  template: string;
  hooks: ChapterHooks;

  constructor({ id, title, template, hooks }: ChapterOptions) {
    this.id = id;
    this.title = title;
    this.template = template;
    this.hooks = hooks;
  }

  /**
   * Renders the chapter content using the given scope and render options.
   * @param scope - Variables available to the Handlebars template.
   * @param assets - Asset objects keyed by name.
   * @param options - Rendering options (format, html).
   */
  render(scope: Scope, assets: Record<string, Asset> = {}, { format, html }: RenderOptions): RenderResult {
    let renderer: Renderer;
    if (format === "markdown") {
      renderer = markdownRenderer;
    } else if (format === "html") {
      renderer = htmlRenderer;
    } else {
      renderer = format;
    }

    const fields: Fields = {
      inputs: [],
      sets: [],
      navs: [],
    };

    const helpers = useHelper(fields, assets, renderer);

    let text;
    if (html) {
      const md = new MarkdownIt({ html: true }).use(pluginAttrs).use(pluginMark);
      text = Handlebars.compile(this.template)(scope, { helpers });
      text = md.render(text);
    } else {
      text = Handlebars.compile(this.template, { noEscape: true })(scope, { helpers });
    }

    return { text, ...fields };
  }
}
