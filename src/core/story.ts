import { StoryInit, StoryHooks, Scope, InputType, Metadata, Asset, StoryHooksSchema } from "./definitions.js";
import { Scene } from "./scene.js";
import { Chapter } from "./chapter.js";
import { renderTemplate, RenderOptions, RenderResult } from "./render.js";
import { ParsedStory, ParseStoryOptions, parseStorySource, resolveParseOptions } from "./parser.js";
import { normalizePath, parseScript } from "./utils.js";

/**
 * Prompt function for handling user input during story playback.
 * Receives the current scene and render result, returns navigation target and submitted input values.
 */
export type StoryPrompt = (
  props: { scene: Scene } & RenderResult,
) => Promise<{ target: string | null; inputs: Scope } | FormData>;

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
  /** @internal */ _storyTitleShown = false;

  constructor(init: StoryInit) {
    this.title = init.title ?? init.metadata?.title ?? "";
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
  render(scope: Scope, assets: Record<string, Asset>, options: RenderOptions): RenderResult {
    return renderTemplate(this.template, scope, assets, options);
  }

  private async enterChapter(chapter: Chapter) {
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
  }

  private async leaveChapter(chapter: Chapter, target: string | null) {
    if (chapter.hooks.onLeave) {
      await chapter.hooks.onLeave({
        globals: this.globals,
        locals: chapter.locals,
        target,
      });
    }
  }

  /** Starts playing the story, looping through chapters and scenes until navigation ends. */
  async play(prompt: StoryPrompt, options: PlayOptions) {
    if (this.hooks.globals) {
      const result = await this.hooks.globals();
      if (result) {
        Object.assign(this.globals, result);
      }
    }

    if (this.hooks.onStart) {
      await this.hooks.onStart({ globals: this.globals });
    }

    const assetUrlMap = Object.fromEntries(Object.entries(this.assets).map(([name, { url }]) => [name, url]));

    const entryChapter = this.chapters[0];
    const entryScene = entryChapter?.scenes[0];
    if (!entryChapter || !entryScene) {
      return;
    }

    let chapter = entryChapter;
    let scene = entryScene;
    let currentChapterId: string | symbol | null = null;
    await this.enterChapter(chapter);

    while (true) {
      // Scene onEnter + render-only view data
      if (scene.hooks.onEnter) {
        await scene.hooks.onEnter({ globals: this.globals, locals: chapter.locals });
      }

      let sceneOverrides: Scope = {};
      if (scene.hooks.view) {
        const result = await scene.hooks.view({
          globals: this.globals,
          locals: chapter.locals,
        });
        if (result) {
          Object.assign(sceneOverrides, result);
        }
      }

      if (options.debug) {
        console.log("--- [debug] scene:", scene.id);
        console.log("--- [debug] globals:", JSON.stringify(this.globals, null, 2));
        console.log("--- [debug] locals:", JSON.stringify(chapter.locals, null, 2));
      }

      const renderContext = { ...this.globals, ...assetUrlMap, ...chapter.locals, ...sceneOverrides };
      const renderResult = scene.render(renderContext, this.assets, options);

      // Prepend chapter and story templates to rendered text
      let { text } = renderResult;
      let prefix = "";

      if (!this._storyTitleShown) {
        const rendered = this.render(renderContext, this.assets, options);
        if (rendered.text) {
          prefix += rendered.text;
        }
        this._storyTitleShown = true;
      }

      if (chapter.id !== currentChapterId) {
        const rendered = chapter.render(renderContext, this.assets, options);
        if (rendered.text) {
          prefix += rendered.text;
        }
        currentChapterId = chapter.id;
      }

      text = prefix + text;

      const promptResult = await prompt({ scene, ...renderResult, text });
      const normalizedPromptResult =
        promptResult instanceof FormData ? parseFormData(promptResult, renderResult) : promptResult;

      applyInputScopes(
        {
          globals: this.globals,
          locals: chapter.locals,
        },
        normalizedPromptResult.inputs,
      );

      // Scene onLeave (side effect only)
      if (scene.hooks.onLeave) {
        await scene.hooks.onLeave({
          globals: this.globals,
          locals: chapter.locals,
          target: normalizedPromptResult.target,
        });
      }

      const finalTarget = normalizedPromptResult.target;

      if (finalTarget === null) {
        await this.leaveChapter(chapter, finalTarget);
        break;
      }

      // Resolve target
      const resolved = this.resolveTarget(finalTarget, chapter);
      if (!resolved) {
        throw new Error(`Target not found: ${finalTarget}`);
      }

      // Chapter transition
      if (resolved.chapter !== chapter) {
        await this.leaveChapter(chapter, finalTarget);
        await this.enterChapter(resolved.chapter);
      }

      chapter = resolved.chapter;
      scene = resolved.scene;
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
    hooks: await parseScript(story.script, StoryHooksSchema),
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
