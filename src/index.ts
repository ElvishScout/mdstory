export * from "./base/index.js";

import { StoryBase, parseStoryContent } from "./base/index.js";

export class Story extends StoryBase {
  constructor(content: string) {
    super(parseStoryContent(content));
  }
}
