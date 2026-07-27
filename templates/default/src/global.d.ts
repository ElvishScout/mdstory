import type { ParsedStory } from "../../../types";

declare global {
  interface Window {
    PARSED_STORY: ParsedStory | string;
    TEMPLATE_OPTIONS: Record<string, unknown> | string;
  }
}

export {};
