import Handlebars from "handlebars";
import type { HelperDeclareSpec, HelperOptions, TemplateDelegate as HandlebarsTemplateDelegate } from "handlebars";
import MarkdownIt from "markdown-it";
import pluginAttrs from "markdown-it-attrs";
import pluginMark from "markdown-it-mark";

import type { Variable, Scope } from "./definitions.js";
import { htmlAdapter, markdownAdapter, RenderAdapter, type InputType } from "./adapter.js";

/** Rendering options. */
export interface RenderOptions {
  adapter: "markdown" | "html" | RenderAdapter;
}

/** The rendering result containing rendered text and extracted fields. */
export interface RenderResult {
  text: string;
  inputs: { name: string; type: InputType; value: Variable }[];
  navs: { text: string; target: string | null }[];
}

function useHelper({ inputs, navs }: Pick<RenderResult, "inputs" | "navs">, adapter: RenderAdapter): HelperDeclareSpec {
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

/** Cache compiled Handlebars templates to avoid re-parsing on every render. */
const compiledCache = new Map<string, HandlebarsTemplateDelegate>();

/** Module-level MarkdownIt instance — stateless between .render() calls. */
const mdHtml = new MarkdownIt({ html: true }).use(pluginAttrs).use(pluginMark);

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

  const fields: Pick<RenderResult, "inputs" | "navs"> = { inputs: [], navs: [] };
  const helpers = useHelper(fields, resolvedAdapter);

  // Compile lazily, cache on first use.  The cache key includes the format
  // because markdown disables HTML escaping while html relies on it.
  const cacheKey = `${resolvedAdapter.format}:${template}`;
  let compiled = compiledCache.get(cacheKey);
  if (!compiled) {
    compiled = Handlebars.compile(template, resolvedAdapter.format === "markdown" ? { noEscape: true } : undefined);
    compiledCache.set(cacheKey, compiled);
  }

  let text = compiled(scope, { helpers });
  if (resolvedAdapter.format === "html") {
    text = mdHtml.render(text);
  }

  return { text, ...fields };
}
