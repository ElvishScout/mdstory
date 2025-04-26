import Handlebars, { HelperDeclareSpec, HelperOptions } from "handlebars";
import MarkdownIt from "markdown-it";
import pluginAttrs from "markdown-it-attrs";

import { ValueType, Value, ChapterHooks, Scope } from "./definitions.js";

type MarkdownOptions = {};
type HtmlOptions = {
  tagMap?: Record<string, string>;
};

export type RenderOptions = ({ format: "markdown" } & MarkdownOptions) | ({ format: "html" } & HtmlOptions);

type Fields = {
  inputs: { name: string; type: ValueType; value: Value }[];
  sets: { name: string; type: ValueType; value: Value }[];
  navs: { text: string; target: string | null }[];
};

export type RenderResult = { text: string } & Fields;

type HtmlAttrs = Record<string, string | boolean | undefined>;

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

const escapeHtml = (text: string) => text.replace(/[<>&'"]/g, (ch) => `&#${ch.charCodeAt(0)};`);

const createElementHtml = (tag: string, attrs: HtmlAttrs, children?: string) => {
  // prettier-ignore
  const voidTags = [
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
  ];

  const attrText = Object.entries(attrs)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => {
      if (typeof value === "boolean") {
        value = value ? "" : undefined;
      }
      const escapedValue = escapeHtml(value ?? "");
      return `${name}="${escapedValue}"`;
    })
    .join(" ");

  if (voidTags.includes(tag)) {
    return `<${tag} ${attrText}>`;
  }
  return `<${tag} ${attrText}>${children ?? ""}</${tag}>`;
};

const createInputHtml = ({
  tagMap = {},
  name,
  type,
  value,
  required,
  readonly,
}: HtmlOptions & {
  name: string;
  type: ValueType;
  value: Value;
  required?: boolean;
  readonly?: boolean;
}) => {
  const tag = tagMap["input"] ?? "input";
  const inputType = type === "boolean" ? "checkbox" : "text";
  const inputAttrs: HtmlAttrs = {
    name,
    type: inputType,
    value: inputType !== "checkbox" ? (type === "object" ? JSON.stringify(value) : String(value)) : undefined,
    checked: inputType === "checkbox" && value ? "" : undefined,
    required,
    readonly,
    "aria-label": name,
  };

  return createElementHtml(tag, inputAttrs);
};

const createSubmitButtonHtml = ({
  tagMap = {},
  target,
  children,
}: HtmlOptions & { target: string; children: string }) => {
  const tag = tagMap["button"] ?? "button";
  const buttonAttrs: HtmlAttrs = {
    name: "@target",
    type: "submit",
    value: target,
  };
  return createElementHtml(tag, buttonAttrs, children);
};

const createInputMarkdown = ({ name, type }: MarkdownOptions & { name: string; type: ValueType }) => {
  if (type === "boolean") {
    return `[ ${name}? ]`;
  }
  return `[> ${name} <]`;
};

const useHelper = ({ inputs, sets, navs }: Fields, options: RenderOptions): HelperDeclareSpec => {
  return {
    input(type: ValueType, opt: HelperOptions) {
      let result = "";
      for (const name in opt.hash) {
        const value = opt.hash[name];
        inputs.push({ name, type, value });
        if (options.format === "html") {
          result = createInputHtml({ name, type, value, ...options });
        } else {
          result = createInputMarkdown({ name, type });
        }
        break;
      }
      return new Handlebars.SafeString(result);
    },
    set(opt: HelperOptions) {
      const result = Object.entries(opt.hash as Scope)
        .map(([name, value]) => {
          const type = valueType(value);
          sets.push({ name, type, value });
          if (options.format === "html") {
            return createInputHtml({ name, type, value, readonly: true, ...options });
          }
          return "";
        })
        .join("");
      return new Handlebars.SafeString(result);
    },
    nav(target: string | null, opt: HelperOptions) {
      let result = "";
      const text = opt.fn(this).trim();
      navs.push({ text, target });
      if (options.format === "html") {
        result = createSubmitButtonHtml({ target: target ?? "", children: text, ...options });
      }
      return new Handlebars.SafeString(result);
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

  render(scope: Scope, options: RenderOptions): RenderResult {
    const md = new MarkdownIt({ html: true }).use(pluginAttrs);

    const fields: Fields = {
      inputs: [],
      sets: [],
      navs: [],
    };

    const handle = Handlebars.create();
    handle.registerHelper(useHelper(fields, options));

    let text = handle.compile(this.template)(scope);
    if (options.format === "html") {
      text = md.render(text);
      text = createElementHtml("input", { type: "submit", disabled: true, hidden: true }) + text;
    }

    return { text, ...fields };
  }
}
