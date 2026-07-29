import type { TemplateOptions } from "../core/definitions.js";
import type { ParsedStory } from "../core/parser.js";

/**
 * Injects the parsed story and template options into an HTML template by
 * replacing the `"__PARSED_STORY__"` and `"__TEMPLATE_OPTIONS__"` placeholders
 * with JSON (`<` is escaped so the payload is safe to embed inside `<script>`).
 */
export function injectTemplateData(template: string, parsedStory: ParsedStory, options?: TemplateOptions) {
  return template
    .replace('"__PARSED_STORY__"', JSON.stringify(parsedStory).replace(/</g, "\\u003c"))
    .replace('"__TEMPLATE_OPTIONS__"', JSON.stringify(options ?? {}).replace(/</g, "\\u003c"));
}
