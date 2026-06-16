import { StoryInit, StoryHooks, Scope, InputType, Metadata, Asset } from "./definitions.js";
import { Chapter, RenderOptions, RenderResult } from "./chapter.js";
import { ChapterNotFoundError, InvalidInputError } from "./error.js";
import { parseStorySource } from "./parser.js";

export type StoryPrompt = (
  props: { chapter: Chapter } & RenderResult,
) => Promise<{ target: string | null; updates: Scope } | FormData>;

function parstInput(type: InputType, text: string | null) {
  switch (type) {
    case "boolean": {
      return text === "on";
    }
    case "number": {
      return text ? Number(text) : null;
    }
    default: {
      return text;
    }
  }
}

function parseFormData(formData: FormData, { inputs }: Pick<RenderResult, "inputs">) {
  const target = (formData.get("@target") as string) || null;
  const updates = Object.fromEntries(
    inputs.map(({ name, type }) => {
      const value = formData.get(name) as string | null;
      try {
        return [name, parstInput(type, value)];
      } catch {
        throw new InvalidInputError(name, value);
      }
    }),
  );
  return { target, updates };
}

export class Story {
  metadata: Metadata;
  globals: Scope;
  assets: Record<string, Asset>;
  hooks: StoryHooks;
  stylesheet: string;
  chapters: Record<string, Chapter>;
  entry: Chapter | null;

  constructor(init: StoryInit) {
    const chapters = Object.fromEntries(
      Object.entries(init.chapters).map(([id, { title, template, hooks }]) => {
        return [id, new Chapter({ id, title, template, hooks })];
      }),
    );

    this.metadata = init.metadata;
    this.globals = init.metadata.globals ?? {};
    this.assets = init.metadata.assets ?? {};
    this.hooks = init.hooks;
    this.stylesheet = init.stylesheet;
    this.chapters = chapters;
    this.entry = (init.entry && chapters[init.entry]) || null;
  }

  static async fromSource(source: string) {
    return new Story(await parseStorySource(source));
  }

  async play(prompt: StoryPrompt, options: RenderOptions) {
    if (this.hooks.onStart) {
      this.hooks.onStart({ globals: this.globals });
    }
    const assetUrlMap = Object.fromEntries(Object.entries(this.assets).map(([name, { url }]) => [name, url]));

    let chapter = this.entry;
    while (chapter) {
      let overrideData = {};
      if (chapter.hooks.onEnter) {
        const result = await chapter.hooks.onEnter({ globals: this.globals });
        if (result?.data) {
          Object.assign(overrideData, result.data);
        }
      }

      const renderContext = { ...this.globals, ...assetUrlMap, ...overrideData };

      const renderResult = chapter.render(renderContext, this.assets, options);

      const promptResult = await prompt({ chapter, ...renderResult });
      const normalizedPromptResult =
        promptResult instanceof FormData ? parseFormData(promptResult, renderResult) : promptResult;

      let overrideTarget = undefined;
      if (chapter.hooks.onLeave) {
        const result = await chapter.hooks.onLeave({
          globals: this.globals,
          updates: normalizedPromptResult.updates,
          target: normalizedPromptResult.target,
        });
        if (result?.target !== undefined) {
          overrideTarget = result.target;
        }
      }

      const finalTarget = overrideTarget !== undefined ? overrideTarget : normalizedPromptResult.target;

      if (finalTarget !== null && !(finalTarget in this.chapters)) {
        throw new ChapterNotFoundError(finalTarget);
      }
      chapter = finalTarget !== null ? this.chapters[finalTarget] : null;
    }
  }
}
