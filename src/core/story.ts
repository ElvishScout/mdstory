import type { StoryInit, StoryHooks, Scope, Metadata, Asset } from "./definitions.js";
import { Scene } from "./scene.js";
import { Chapter } from "./chapter.js";
import { renderTemplate } from "./render.js";
import type { RenderOptions, RenderResult } from "./render.js";
import type { ParsedStory, ParseStoryOptions } from "./parser.js";
import { parseStorySource, resolveParseOptions } from "./parser.js";
import { mergeScripts, normalizePath } from "./utils.js";
import { PlayOptions, StoryPrompt, StorySession } from "./session.js";

/**
 * Story runtime containing core playback logic.
 * Construct via `fromSource(source)`, `fromPath(path)`,
 * `fromParsed(parsedStory)`, or manually with a parsed StoryInit.
 */
export class Story {
  metadata: Metadata;
  title: string;
  template: string;
  globals: Scope;
  assets: Record<string, Asset>;
  hooks: StoryHooks;
  stylesheet: string;
  chapters: Chapter[];

  constructor(init: StoryInit) {
    this.title = (init.title || init.metadata?.title) ?? "";
    this.template = init.template ?? "";
    this.chapters = init.chapters;
    this.metadata = init.metadata ?? {};
    this.globals = this.metadata.globals ?? {};
    this.assets = this.metadata.assets ?? {};
    this.hooks = init.hooks ?? {};
    this.stylesheet = init.stylesheet ?? "";
  }

  /** Get chapter by chapter id */
  getChapter(id: string) {
    return this.chapters.find((chapter) => chapter.id === id) ?? null;
  }

  resolveTarget(target: string, currentChapter: Chapter): { chapter: Chapter; scene: Scene } | null {
    const dot = target.indexOf(".");
    if (dot !== -1) {
      // Cross-chapter scene: "chapterId.sceneId"
      const chapterId = target.slice(0, dot);
      const sceneId = target.slice(dot + 1);
      const chapter = this.getChapter(chapterId);
      if (chapter) {
        const scene = chapter.getScene(sceneId);
        if (scene) {
          return { chapter, scene };
        }
      }
      return null;
    }

    // Local scene in current chapter
    {
      const chapter = currentChapter.getScene(target);
      if (chapter) {
        return { chapter: currentChapter, scene: chapter };
      }
    }

    // Global scene lookup across all chapters
    for (const chapter of this.chapters) {
      const scene = chapter.getScene(target);
      if (scene) {
        return { chapter: chapter, scene: scene };
      }
    }

    // Chapter id → entry scene
    {
      const chapter = this.getChapter(target);
      if (chapter && chapter.scenes.length > 0) {
        return { chapter, scene: chapter.scenes[0] };
      }
    }

    return null;
  }

  /** Renders the story template with the given scope and render options. */
  render(scope: Scope, options: RenderOptions): RenderResult {
    return renderTemplate(this.template, scope, options);
  }

  /**
   * Plays the story interactively.
   *
   * Creates a new {@link StorySession} and delegates playback to it.
   * Returns the session so callers can inspect the final state (globals,
   * locals, last chapter / scene, etc.).
   */
  play(prompt: StoryPrompt, options: PlayOptions) {
    const session = new StorySession(this);
    session.play(prompt, options);
    return session;
  }
}

/** Creates a Story instance from a parsed story object. */
export async function fromParsed(story: ParsedStory) {
  return new Story({
    metadata: story.metadata,
    title: story.title,
    template: story.template,
    chapters: await Promise.all(story.chapters.map((chapter) => Chapter.fromParsed(chapter))),
    stylesheet: story.stylesheet,
    hooks: await mergeScripts(story.scripts),
  });
}

/** Parses a story source string and creates a Story instance. */
export async function fromSource(source: string, options?: Partial<ParseStoryOptions>) {
  const parseOptions = await resolveParseOptions(options);
  const parsedStory = await parseStorySource(source, parseOptions);

  return fromParsed(parsedStory);
}

/** Loads a story from a path or URL and resolves includes relative to each containing resource. */
export async function fromPath(path: string, options?: Partial<ParseStoryOptions>) {
  const normalizedPath = await normalizePath(path, options?.base);
  const parseOptions = await resolveParseOptions({ ...options, base: normalizedPath });
  const source = await parseOptions.resolveInclude(normalizedPath);
  const parsedStory = await parseStorySource(source, parseOptions);

  return fromParsed(parsedStory);
}
