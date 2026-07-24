import type { TemplateOptions } from "../core/definitions.js";
import type { ParsedStory } from "../core/parser.js";

export function injectTemplateData(template: string, parsedStory: ParsedStory, options?: TemplateOptions) {
  return template
    .replace('"__PARSED_STORY__"', JSON.stringify(parsedStory).replace(/</g, "\\u003c"))
    .replace('"__TEMPLATE_OPTIONS__"', JSON.stringify(options ?? {}).replace(/</g, "\\u003c"));
}
