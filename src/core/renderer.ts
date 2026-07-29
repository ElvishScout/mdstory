import Handlebars from "handlebars";
import type { HelperDeclareSpec, HelperOptions, TemplateDelegate as HandlebarsTemplateDelegate } from "handlebars";
import MarkdownIt from "markdown-it";
import pluginAttrs from "markdown-it-attrs";
import pluginMark from "markdown-it-mark";

import type { Scope } from "./definitions.js";
import { htmlAdapter, markdownAdapter, type RenderAdapter, type InputType, type HelperParam } from "./adapter.js";

/** Rendering options. */
export interface RenderOptions {
  /** Output adapter: a built-in format name or a custom adapter. */
  adapter: "markdown" | "html" | RenderAdapter;
}

/** The rendering result containing rendered text and extracted fields. */
export interface RenderResult {
  /** Rendered output text (Markdown or HTML, depending on the adapter). */
  text: string;
  /** Input fields collected from `{{input}}` helper calls, in order. */
  inputs: { name: string; type: InputType; value: any }[];
  /** Navigation controls collected from `{{nav}}` helper calls, in order. */
  navs: { text: string; target: string | null }[];
}

/**
 * Builds a Handlebars helper spec from the adapter's helpers. The `callback`
 * is invoked with the normalized parameters after every helper call, letting
 * the caller collect structured data (inputs, navs) from built-in helpers.
 */
function useHelpers(adapter: RenderAdapter, callback: (name: string, param: HelperParam) => any): HelperDeclareSpec {
  const helpers: HelperDeclareSpec = {};

  // Register every helper exposed by the adapter. Handlebars passes positional
  // arguments followed by an options object containing `hash` and, for block
  // helpers, `fn`. We normalize that into a `HelperParam` and invoke the adapter.
  for (const [name, handler] of Object.entries(adapter.helpers)) {
    helpers[name] = function (...rawArgs) {
      const args = rawArgs.slice(0, rawArgs.length - 1);
      const opt = rawArgs[rawArgs.length - 1] as HelperOptions;
      const options = opt.hash;
      const children = opt.fn?.(this).trim();
      const param = { args, options, children };
      const result = handler(param);

      callback(name, param);
      return new Handlebars.SafeString(result);
    };
  }

  return helpers;
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

  const inputs: RenderResult["inputs"] = [];
  const navs: RenderResult["navs"] = [];

  // Collect structured data from built-in helpers for session state.
  const helpers = useHelpers(resolvedAdapter, (name, param) => {
    switch (name) {
      case "input": {
        // Expected call shape: {{input type name=value}}
        const type = (param.args[0] as InputType | undefined) ?? "string";
        const option = Object.entries(param.options)[0];
        if (!option) {
          break;
        }
        const [inputName, value] = option;
        inputs.push({ name: inputName, type, value });
        break;
      }
      case "nav": {
        // Expected call shape: {{#nav target}}label{{/nav}}
        const target = (param.args[0] as string | undefined) ?? null;
        const text = param.children ?? "";
        navs.push({ target, text });
        break;
      }
    }
  });

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

  return { text, inputs, navs };
}
