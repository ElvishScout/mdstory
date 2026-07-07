import type { StoryInit, StoryHooks, Scope, InputType, Metadata, Asset } from "./definitions.js";
import { Scene } from "./scene.js";
import { Chapter } from "./chapter.js";
import { renderTemplate } from "./render.js";
import type { RenderOptions, RenderResult } from "./render.js";
import type { ParsedStory, ParseStoryOptions } from "./parser.js";
import { parseStorySource, resolveParseOptions } from "./parser.js";
import { mergeScripts, normalizePath } from "./utils.js";

/**
 * Prompt function for handling user input during story playback.
 * Receives the current scene and render result, returns navigation target and submitted input values.
 * Return `void` or a result with `target` set to `undefined` to advance to the next scene in sequence.
 */
export type StoryPrompt = (
  props: RenderResult,
) => Promise<{ target?: string | null; inputs?: Scope } | FormData | void>;

export type PlayOptions = RenderOptions & {
  debug?: boolean;
};

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
  const parsedInputs = Object.fromEntries(
    inputs.map(({ name, type }) => {
      const value = formData.get(name) as string | null;
      try {
        return [name, parstInput(type, value)];
      } catch {
        throw new Error(`Invalid input from FormData: ${name}, ${value}`);
      }
    }),
  );
  return { target, inputs: parsedInputs };
}

function applyInputScopes(targets: { globals: Scope; locals: Scope }, inputs: Scope) {
  for (const [name, value] of Object.entries(inputs)) {
    if (name.startsWith("$")) {
      targets.globals[name.slice(1)] = value;
    } else {
      targets.locals[name] = value;
    }
  }
}

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

  /** Finds the next scene in sequential order across chapters. Returns null if no more scenes exist. */
  private findNextScene(currentChapter: Chapter, currentScene: Scene): { chapter: Chapter; scene: Scene } | null {
    // Try next scene in the current chapter
    const sceneIndex = currentChapter.scenes.indexOf(currentScene);
    if (sceneIndex !== -1 && sceneIndex + 1 < currentChapter.scenes.length) {
      return { chapter: currentChapter, scene: currentChapter.scenes[sceneIndex + 1] };
    }

    // Try the first scene of the next non-empty chapter
    const chapterIndex = this.chapters.indexOf(currentChapter);
    for (let i = chapterIndex + 1; i < this.chapters.length; i++) {
      const nextChapter = this.chapters[i];
      if (nextChapter.scenes.length > 0) {
        return { chapter: nextChapter, scene: nextChapter.scenes[0] };
      }
    }

    return null;
  }

  /**
   * Plays the story interactively, looping through scenes until navigation ends.
   *
   * Each iteration renders the current scene, prompts for user input, then navigates:
   * - A string target jumps to the named scene (resolved via {@link resolveTarget}).
   * - `null` ends the story.
   * - `undefined` (or a void prompt return) advances to the next scene in sequence.
   */
  async play(prompt: StoryPrompt, options: PlayOptions) {
    const entryChapter = this.chapters[0];
    const entryScene = entryChapter?.scenes[0];
    if (!entryChapter || !entryScene) {
      return;
    }

    let chapter = entryChapter;
    let scene = entryScene;
    let storyStarted = false;
    let activeChapterId: string | null = null;

    // ── Main loop ────────────────────────────────────────────
    while (true) {
      if (options.debug) {
        console.log("--- [debug] chapter:", chapter.id);
        console.log("--- [debug] scene:", scene.id);
        console.log("--- [debug] globals:", JSON.stringify(this.globals, null, 2));
        console.log("--- [debug] locals:", JSON.stringify(chapter.locals, null, 2));
      }

      // ── Story hooks & template (once) ──────────────────────
      let prefix = "";

      if (!storyStarted) {
        if (this.hooks.globals) {
          const result = await this.hooks.globals();
          if (result) {
            Object.assign(this.globals, result);
          }
        }

        if (this.hooks.onStart) {
          await this.hooks.onStart({ globals: this.globals });
        }

        prefix += this.render({ ...this.assets, ...this.globals }, options).text;
        storyStarted = true;
      }

      // ── Chapter enter (on id change) ───────────────────────
      if (chapter.id !== activeChapterId) {
        chapter.locals = {};

        if (chapter.hooks.locals) {
          const result = await chapter.hooks.locals({ globals: this.globals });
          if (result) {
            Object.assign(chapter.locals, result);
          }
        }

        if (chapter.hooks.onEnter) {
          await chapter.hooks.onEnter({ globals: this.globals, locals: chapter.locals });
        }

        prefix += chapter.render({ ...this.assets, ...this.globals, ...chapter.locals }, options).text;
        activeChapterId = chapter.id;
      }

      // ── Scene enter & render ───────────────────────────────
      if (scene.hooks.onEnter) {
        await scene.hooks.onEnter({ globals: this.globals, locals: chapter.locals });
      }

      const overrides: Scope = {};
      if (scene.hooks.view) {
        const result = await scene.hooks.view({ globals: this.globals, locals: chapter.locals });
        if (result) {
          Object.assign(overrides, result);
        }
      }

      const renderContext = { ...this.assets, ...this.globals, ...chapter.locals, ...overrides };
      const renderResult = scene.render(renderContext, options);
      const text = prefix + renderResult.text;

      // ── Prompt ─────────────────────────────────────────────
      const rawResult = await prompt({ ...renderResult, text });

      // Normalize: void → advance to next scene (undefined target)
      const promptResult = !rawResult
        ? { target: undefined as string | null | undefined, inputs: undefined as Scope | undefined }
        : rawResult instanceof FormData
          ? parseFormData(rawResult, renderResult)
          : rawResult;

      // Apply user inputs into scope
      if (promptResult.inputs) {
        applyInputScopes({ globals: this.globals, locals: chapter.locals }, promptResult.inputs);
      }

      // ── Resolve destination ────────────────────────────────
      const target = promptResult.target;

      let destination: { chapter: Chapter; scene: Scene } | null;

      if (target === null) {
        destination = null;
      } else if (target === undefined) {
        destination = this.findNextScene(chapter, scene);
      } else {
        const resolved = this.resolveTarget(target, chapter);
        if (!resolved) {
          throw new Error(`Target not found: ${target}`);
        }
        destination = resolved;
      }

      const canonicalTarget = destination ? `${destination.chapter.id}.${destination.scene.id}` : null;

      // ── Scene leave ────────────────────────────────────────
      if (scene.hooks.onLeave) {
        await scene.hooks.onLeave({
          globals: this.globals,
          locals: chapter.locals,
          target: canonicalTarget,
        });
      }

      // ── Navigate ───────────────────────────────────────────
      // Leave current chapter when the story ends or a cross-chapter jump occurs
      if (!destination || destination.chapter !== chapter) {
        if (chapter.hooks.onLeave) {
          await chapter.hooks.onLeave({
            globals: this.globals,
            locals: chapter.locals,
            target: canonicalTarget,
          });
        }
      }

      if (!destination) {
        break;
      }

      chapter = destination.chapter;
      scene = destination.scene;
    }
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
