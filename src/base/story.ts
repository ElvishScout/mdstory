import yaml from "js-yaml";
import MarkdownIt from "markdown-it";
import pluginFrontMatter from "markdown-it-front-matter";
import pluginAttrs from "markdown-it-attrs";

import {
  MetadataSchema,
  StoryHooksSchema,
  StoryHooks,
  Scope,
  ValueType,
  Value,
  Metadata,
  ChapterHooksSchema,
  ChapterHooks,
} from "./definitions.js";
import { Chapter, RenderOptions, RenderResult } from "./chapter.js";
import {
  ChapterNotFoundError,
  DuplicateIdError,
  EmptyChapterIdError,
  InvalidInputError,
  InvalidMetadataError,
} from "./error.js";

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

const parseFormData = (formData: FormData, { inputs, sets }: Pick<RenderResult, "inputs" | "sets">) => {
  const target = (formData.get("@target") as string) || null;
  const updates = Object.fromEntries(
    [...inputs, ...sets].map(({ name, type }) => {
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

type ChapterBody = {
  title: string;
  template: string;
  hooks: ChapterHooks;
};

type StoryBody = {
  metadata: Metadata;
  chapters: Record<string, ChapterBody>;
  entry: string | null;
  hooks: StoryHooks;
  stylesheet: string;
};

export const parseStoryContent = (content: string): StoryBody => {
  type Division = { id: string; title: string; lineno: number; script: string };

  const md = new MarkdownIt({ html: true }).use(pluginAttrs).use(pluginFrontMatter, () => {});
  const tokens = md.parse(content, {});

  let metadata = MetadataSchema.parse({});
  let storyScript = "";
  let stylesheet = "";

  const ignoredRanges: [number, number][] = [];
  const divisions: Division[] = [];

  tokens.forEach((token, i) => {
    if (token.type === "front_matter" && token.meta) {
      try {
        const frontMatter = MetadataSchema.parse(yaml.load(token.meta));
        metadata = { ...metadata, ...frontMatter };
      } catch {
        throw new InvalidMetadataError(token.meta);
      }
    } else if (token.type === "heading_open" && token.tag === "h1" && token.level === 0 && token.map) {
      const lineno = token.map[0];
      let id = token.attrs?.find(([key]) => key === "id")?.[1] ?? "";
      let title = "";
      const nextToken = tokens[i + 1];
      if (nextToken && nextToken.type === "inline") {
        const content = nextToken.content.trim();
        id ||= content;
        title = content;
      }
      if (!id) {
        throw new EmptyChapterIdError();
      }
      if (divisions.find(({ id: _id }) => id === _id)) {
        throw new DuplicateIdError(id);
      }
      divisions.push({ id, title, lineno, script: "" });
    } else if (token.type === "html_block" && token.map) {
      let regres;
      if ((regres = /^[\s]*<script>(.*)<\/script>[\s]*$/s.exec(token.content))) {
        const script = regres[1].trim();
        if (script) {
          if (divisions.length === 0) {
            storyScript = script;
          } else {
            divisions[divisions.length - 1].script = script;
          }
          ignoredRanges.push(token.map);
        }
      } else if ((regres = /^[\s]*<style>(.*)<\/style>[\s]*$/s.exec(token.content))) {
        const style = regres[1].trim();
        stylesheet += style;
        ignoredRanges.push(token.map)
      }
    }
  });

  const lines = content.split("\n").map((line, i) => {
    if (ignoredRanges.find(([from, to]) => i >= from && i < to)) {
      return null;
    }
    return line;
  });

  const chapterEntries = divisions.map(({ id, title, lineno, script }, i): [string, ChapterBody] => {
    const template = lines
      .slice(lineno, divisions[i + 1]?.lineno)
      .filter((line): line is string => line !== null)
      .join("\n");
    const hooks = script ? ChapterHooksSchema.parse(new Function(script)()) : {};
    return [id, { title, template, hooks }];
  });

  const chapters = Object.fromEntries(chapterEntries);
  const entry = chapterEntries[0]?.[0] || null;
  const hooks = storyScript ? StoryHooksSchema.parse(new Function(storyScript)()) : {};

  return {
    metadata,
    chapters,
    entry,
    hooks,
    stylesheet,
  };
};

export class StoryBase {
  metadata: Metadata;
  globals: Scope;
  chapters: Record<string, Chapter>;
  entry: Chapter | null;
  hooks: StoryHooks;
  stylesheet: string;

  constructor({ metadata, chapters, entry, hooks, stylesheet }: StoryBody) {
    const realChapters = Object.fromEntries(
      Object.entries(chapters).map(([id, options]) => {
        return [id, new Chapter({ id, ...options })];
      })
    );

    this.metadata = metadata;
    this.globals = metadata.globals;
    this.chapters = realChapters;
    this.entry = (entry && realChapters[entry]) || null;
    this.hooks = hooks;
    this.stylesheet = stylesheet;
  }

  async play(prompt: StoryPrompt, options: RenderOptions) {
    if (this.hooks.onStart) {
      this.hooks.onStart(this.globals);
    }

    let chapter = this.entry;
    while (chapter) {
      let modifiedGlobals = this.globals;

      if (chapter.hooks.onEnter) {
        const modified = chapter.hooks.onEnter(this.globals);
        if (modified !== undefined) {
          modifiedGlobals = Object.assign(modifiedGlobals, modified);
        }
      }

      const renderResult = chapter.render(modifiedGlobals, options);
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
