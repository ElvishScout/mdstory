import Handlebars from "handlebars";
import type { HelperDeclareSpec, HelperOptions } from "handlebars";
import MarkdownIt from "markdown-it";
import pluginAttrs from "markdown-it-attrs";
import pluginMark from "markdown-it-mark";

import type { InputType, Variable, Scope } from "./definitions.js";
import { htmlAdapter, markdownAdapter, RenderAdapter } from "./adapter.js";

/** Rendering options. */
export type RenderOptions = {
  adapter: "markdown" | "html" | RenderAdapter;
};

/** The rendering result containing rendered text and extracted fields. */
export type RenderResult = { text: string } & Fields;

type Fields = {
  inputs: { name: string; type: InputType; value: Variable }[];
  navs: { text: string; target: string | null }[];
};

function useHelper({ inputs, navs }: Fields, adapter: RenderAdapter): HelperDeclareSpec {
  return {
    input(type: InputType, opt: HelperOptions) {
      for (const name in opt.hash) {
        const value = opt.hash[name];
        inputs.push({ name, type, value });
        const result = adapter.input?.({ name, type, value }) ?? "";
        return new Handlebars.SafeString(result);
      }
      return "";
    },
    nav(target: string | null, opt: HelperOptions) {
      const text = opt.fn(this).trim();
      navs.push({ text, target });
      const result = adapter.nav?.({ target, children: text }) ?? "";
      return new Handlebars.SafeString(result);
    },
    linebreak(n?: number) {
      const result = adapter.linebreak?.({ n }) ?? "";
      return new Handlebars.SafeString(result);
    },
  };
}

/**
 * Compiles a Handlebars template with built-in helpers, optionally renders
 * through MarkdownIt, and returns the rendered text with extracted fields.
 */
export function renderTemplate(template: string, scope: Scope, options: RenderOptions): RenderResult {
  let resolvedAdapter: RenderAdapter;
  if (options.adapter === "markdown") {
    resolvedAdapter = markdownAdapter;
  } else if (options.adapter === "html") {
    resolvedAdapter = htmlAdapter;
  } else {
    resolvedAdapter = options.adapter;
  }

  const fields: Fields = { inputs: [], navs: [] };
  const helpers = useHelper(fields, resolvedAdapter);

  let text;
  if (resolvedAdapter.format === "html") {
    const md = new MarkdownIt({ html: true }).use(pluginAttrs).use(pluginMark);
    text = Handlebars.compile(template)(scope, { helpers });
    text = md.render(text);
  } else {
    text = Handlebars.compile(template, { noEscape: true })(scope, { helpers });
  }

  return { text, ...fields };
}
