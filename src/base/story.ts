import {
  StoryBody,
  StoryHooks,
  Scope,
  ValueType,
  Value,
  Metadata,
  Asset,
  ChapterHooksSchema,
  StoryHooksSchema,
} from "./definitions.js";
import { Chapter, RenderOptions, RenderResult } from "./chapter.js";
import { ChapterNotFoundError, InvalidInputError } from "./error.js";

export type StoryPrompt = (
  props: { chapter: Chapter } & RenderResult
) => Promise<{ target: string | null; updates: Scope } | FormData>;

const parstInput = (type: ValueType, text: string | null) => {
  if (type === "boolean") {
    return text === "on";
  }
  if (type === "number") {
    return text ? Number(text) : null;
  }
  if (type === "object") {
    return text ? (JSON.parse(text) as Value) : null;
  }
  return text;
};

const parseFormData = (formData: FormData, { inputs }: Pick<RenderResult, "inputs">) => {
  const target = (formData.get("@target") as string) || null;
  const updates = Object.fromEntries(
    inputs.map(({ name, type }) => {
      const value = formData.get(name) as string | null;
      try {
        return [name, parstInput(type, value)];
      } catch {
        throw new InvalidInputError(name, value);
      }
    })
  );
  return { target, updates };
};

export class StoryBase {
  metadata: Metadata;
  globals: Scope;
  chapters: Record<string, Chapter>;
  entry: Chapter | null;
  hooks: StoryHooks;
  stylesheet: string;
  assets: Record<string, Asset>;

  constructor({ metadata, chapters, entry, script, stylesheet }: StoryBody) {
    const realChapters = Object.fromEntries(
      Object.entries(chapters).map(([id, { title, template, script }]) => {
        const hooks = (script && ChapterHooksSchema.parse(new Function(script)())) || {};
        return [id, new Chapter({ id, title, template, hooks })];
      })
    );

    this.metadata = metadata;
    this.globals = metadata.globals ?? {};
    this.chapters = realChapters;
    this.entry = (entry && realChapters[entry]) || null;
    this.hooks = (script && StoryHooksSchema.parse(new Function(script)())) || {};
    this.stylesheet = stylesheet;
    this.assets = metadata.assets ?? {};
  }

  async play(prompt: StoryPrompt, options: RenderOptions) {
    if (this.hooks.onStart) {
      this.hooks.onStart(this.globals);
    }
    const assetsUrl = Object.fromEntries(Object.entries(this.assets).map(([name, { url }]) => [name, url]));

    let chapter = this.entry;
    while (chapter) {
      let scope = this.globals;
      scope = Object.assign(scope, assetsUrl);
      if (chapter.hooks.onEnter) {
        const modified = chapter.hooks.onEnter(this.globals);
        if (modified !== undefined) {
          scope = Object.assign(scope, modified);
        }
      }

      const renderResult = chapter.render(scope, this.assets, options);
      const promptResult = await prompt({ chapter, ...renderResult });
      const { target, updates } =
        promptResult instanceof FormData ? parseFormData(promptResult, renderResult) : promptResult;

      let modifiedTarget = target;
      let modifiedUpdates = updates;

      if (chapter.hooks.onLeave) {
        const modified = chapter.hooks.onLeave(updates, this.globals);
        if (modified !== undefined) {
          modifiedUpdates = Object.assign(updates, modified);
        }
      }
      if (chapter.hooks.onNavigate) {
        const modified = chapter.hooks.onNavigate(target, updates, this.globals);
        if (modified !== undefined) {
          modifiedTarget = modified;
        }
      }
      this.globals = Object.assign(this.globals, modifiedUpdates);

      if (modifiedTarget !== null && !(modifiedTarget in this.chapters)) {
        throw new ChapterNotFoundError(modifiedTarget);
      }
      chapter = modifiedTarget !== null ? this.chapters[modifiedTarget] : null;
    }
  }
}
