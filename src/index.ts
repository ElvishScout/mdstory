export * from "./base/index.js";

import { StoryBase, parseStorySource } from "./base/index.js";

export class Story extends StoryBase {
  constructor(source: string) {
    super(parseStorySource(source));
  }
}
