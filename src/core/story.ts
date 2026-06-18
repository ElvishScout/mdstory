import Handlebars from "handlebars";
import { StoryInit, StoryHooks, Scope, InputType, Metadata, Asset } from "./definitions.js";
import { Scene } from "./scene.js";
import { Chapter } from "./chapter.js";
import { RenderOptions, RenderResult } from "./scene.js";
import { ParseStoryOptions, parseStorySource } from "./parser.js";
import { loadSource, normalizePath } from "./utils.js";

/**
 * Prompt function for handling user input during story playback.
 * Receives the current scene and render result, returns navigation target and submitted input values.
 */
export type StoryPrompt = (
  props: { scene: Scene } & RenderResult,
) => Promise<{ target: string | null; inputs: Scope } | FormData>;

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

async function resolveParseOptions(
  options: Partial<ParseStoryOptions> | undefined,
  defaultBase: string,
): Promise<ParseStoryOptions> {
  return {
    base: options?.base ?? defaultBase,
    resolveInclude: options?.resolveInclude ?? ((path) => loadSource(path)),
  };
}

/**
 * Story runtime containing core playback logic.
 * Parse via `Story.fromSource()`, or construct manually with a parsed StoryInit.
 */
export class Story {
  metadata: Metadata;
  title: string;
  globals: Scope;
  assets: Record<string, Asset>;
  hooks: StoryHooks;
  stylesheet: string;
  chapters: Record<string | symbol, Chapter>;
  entry: Chapter | null;
  /** @internal */ _storyTitleShown = false;

  resolveTarget(target: string, currentChapter: Chapter): { chapter: Chapter; scene: Scene } | null {
    const dot = target.indexOf(".");
    if (dot !== -1) {
      // Cross-chapter scene: "chapterId.sceneId"
      const chId = target.slice(0, dot);
      const scId = target.slice(dot + 1);
      const ch = this.chapters[chId];
      if (ch) {
        const sc = ch.scenes[scId];
        if (sc) {
          return { chapter: ch, scene: sc };
        }
      }
      return null;
    }
    // Local scene in current chapter
    const local = currentChapter.scenes[target];
    if (local) return { chapter: currentChapter, scene: local };
    // Global scene lookup across all chapters
    const allChKeys = Reflect.ownKeys(this.chapters) as (string | symbol)[];
    for (const chKey of allChKeys) {
      const ch = this.chapters[chKey]!;
      const sc = ch.scenes[target];
      if (sc) return { chapter: ch, scene: sc };
    }
    // Chapter id → entry scene
    const ch = this.chapters[target];
    if (ch?.entry) return { chapter: ch, scene: ch.entry };
    return null;
  }

  constructor(init: StoryInit) {
    this.title = init.title ?? init.metadata?.title ?? "";
    this.chapters = init.chapters;
    this.metadata = init.metadata ?? {};
    this.globals = this.metadata.globals ?? {};
    this.assets = this.metadata.assets ?? {};
    this.hooks = init.hooks ?? {};
    this.stylesheet = init.stylesheet ?? "";
    this.entry = init.entry ? (init.chapters[init.entry as string | symbol] ?? null) : null;
  }

  /** Renders the story title with Handlebars using the current globals. */
  renderTitle(): string {
    return this.title ? Handlebars.compile(this.title)(this.globals) : "";
  }

  /** Parses a story source string and creates a Story instance. */
  static async fromSource(source: string, options?: Partial<ParseStoryOptions>) {
    return new Story(await parseStorySource(source, await resolveParseOptions(options, await normalizePath("./"))));
  }

  /** Loads a story from a path or URL and resolves includes relative to each containing resource. */
  static async fromPath(path: string, options?: Partial<ParseStoryOptions>) {
    const normalizedPath = await normalizePath(path, options?.base);
    const parseOptions = await resolveParseOptions(options, normalizedPath);
    const source = await parseOptions.resolveInclude(normalizedPath);

    return new Story(await parseStorySource(source, parseOptions));
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
  async play(prompt: StoryPrompt, options: RenderOptions) {
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

    const entryChapter = this.entry;
    const entryScene = entryChapter?.entry;
    if (!entryChapter || !entryScene) {
      return;
    }

    let chapter: Chapter = entryChapter;
    let scene: Scene = entryScene;
    let currentChapterId: string | symbol | null = null;
    await this.enterChapter(chapter);

    // eslint-disable-next-line no-constant-condition
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

      // Prepend chapter and story titles to rendered text
      let { text } = renderResult;
      let prefix = "";

      if (chapter.title && chapter.id !== currentChapterId) {
        const rendered = chapter.renderTitle(renderContext);
        if (rendered) {
          prefix += `## ${rendered}\n\n`;
        }
        currentChapterId = chapter.id;
      }

      if (!this._storyTitleShown) {
        const rendered = this.renderTitle();
        if (rendered) {
          prefix = `# ${rendered}\n\n${prefix}`;
        }
        this._storyTitleShown = true;
      }

      if (prefix) {
        text = prefix + text;
      }

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
        throw new Error(`Chapter not found: ${finalTarget}`);
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
