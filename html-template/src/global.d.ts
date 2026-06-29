import type { ParsedStory, TemplateOptions } from "../../types";

declare global {
  const __PLACEHOLDER_STORY__: ParsedStory;

  interface Window {
    PARSED_STORY: ParsedStory | string;
    PLACEHOLDER_STORY: ParsedStory;
    TEMPLATE_OPTIONS: TemplateOptions | string;
  }
}

export {};
