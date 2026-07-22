import Handlebars from "handlebars";
import type { HelperDeclareSpec, HelperOptions, TemplateDelegate as HandlebarsTemplateDelegate } from "handlebars";
import MarkdownIt from "markdown-it";
import pluginAttrs from "markdown-it-attrs";
import pluginMark from "markdown-it-mark";

import type { Scope } from "./definitions.js";
import { htmlAdapter, markdownAdapter, type RenderAdapter, type InputType, HelperParam } from "./adapter.js";

/** Rendering options. */
export interface RenderOptions {
  adapter: "markdown" | "html" | RenderAdapter;
}

/** The rendering result containing rendered text and extracted fields. */
export interface RenderResult {
  text: string;
  inputs: { name: string; type: InputType; value: any }[];
  navs: { text: string; target: string | null }[];
}

function useHelpers(
  { inputs, navs }: Pick<RenderResult, "inputs" | "navs">,
  adapter: RenderAdapter,
): HelperDeclareSpec {
  const helpers: HelperDeclareSpec = {};

  /** Collect structured data from built-in helpers for session state. */
  const onHelperCall = (name: string, param: HelperParam) => {
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
  };

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

      onHelperCall(name, param);
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

  const fields: Pick<RenderResult, "inputs" | "navs"> = { inputs: [], navs: [] };
  const helpers = useHelpers(fields, resolvedAdapter);

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
