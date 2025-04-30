import Handlebars, { HelperDeclareSpec, HelperOptions } from "handlebars";
import MarkdownIt from "markdown-it";
import pluginAttrs from "markdown-it-attrs";

import { ValueType, Value, ChapterHooks, Scope, Asset } from "./definitions.js";

type HtmlAttrs = Record<string, string | boolean | undefined>;

const escapeHtml = (text: string) => text.replace(/[<>&'"]/g, (ch) => `&#${ch.charCodeAt(0)};`);

const valueType = (value: Value): ValueType => {
  if (typeof value === "string") {
    return "string";
  }
  if (typeof value === "number" || value === null) {
    return "number";
  }
  if (typeof value === "boolean") {
    return "boolean";
  }
  return "object";
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

const createInputHtml = ({ name, type, value }: { name: string; type: ValueType; value: Value }) => {
  const inputType = type === "boolean" ? "checkbox" : "text";
  const inputAttrs: HtmlAttrs = {
    name,
    type: inputType,
    value: inputType !== "checkbox" ? (type === "object" ? JSON.stringify(value) : String(value)) : undefined,
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

export type Renderer = {
  input?: ({ name, type, value }: { name: string; type: ValueType; value: string }) => string;
  nav?: ({ target, children }: { target: string | null; children: string }) => string;
};

const markdownRenderer: Renderer = {
  input({ name, type }) {
    if (type === "boolean") {
      return `[? _${name}_]`;
    } else {
      return `[> _${name}_]`;
    }
  },
  nav({ children }) {
    return `[@ __${children}__]`;
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

export type RenderOptions = {
  format: "markdown" | "html" | Renderer;
  html?: boolean;
};

export type RenderResult = { text: string } & Fields;

type Fields = {
  inputs: { name: string; type: ValueType; value: Value }[];
  sets: { name: string; type: ValueType; value: Value }[];
  navs: { text: string; target: string | null }[];
};

const useHelper = (
  { inputs, sets, navs }: Fields,
  assets: Record<string, Asset>,
  renderer: Renderer
): HelperDeclareSpec => {
  return {
    input(type: ValueType, opt: HelperOptions) {
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

export type ChapterOptions = {
  id: string;
  title: string;
  template: string;
  hooks: ChapterHooks;
};

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
      const md = new MarkdownIt({ html: true }).use(pluginAttrs);
      text = Handlebars.compile(this.template)(scope, { helpers });
      text = md.render(text);
    } else {
      text = Handlebars.compile(this.template, { noEscape: true })(scope, { helpers });
    }

    return { text, ...fields };
  }
}
