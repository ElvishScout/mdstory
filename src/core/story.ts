import type { StoryInit, StoryHooks, Scope, InputType, Metadata, Asset } from "./definitions.js";
import { Scene } from "./scene.js";
import { Chapter } from "./chapter.js";
import { renderTemplate } from "./render.js";
import type { RenderOptions, RenderResult } from "./render.js";
import type { ParsedStory, ParseStoryOptions } from "./parser.js";
import { parseStorySource, resolveParseOptions } from "./parser.js";
import { mergeScripts, normalizePath } from "./utils.js";

export type PromptProps = { type: "story" | "chapter" | "scene" } & RenderResult;

/**
 * Prompt function for handling user input during story playback.
 * Receives the current scene and render result, returns navigation target and submitted input values.
 * Return `void` or a result with `target` set to `undefined` to advance to the next scene in sequence.
 */
export type StoryPrompt = (props: PromptProps) => Promise<{ target?: string | null; inputs?: Scope } | FormData | void>;

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
  // `has` distinguishes "key not present" (→ undefined, fall through) from
  // "key present but empty" (→ null, explicit end).  `get` alone can't tell
  // them apart because both cases return `null`.
  const rawTarget = formData.get("@target") as string;
  const target = formData.has("@target") ? rawTarget || null : undefined;
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
   * Resolves a user-supplied target into a concrete destination.
   *
   * - `string` → delegated to {@link resolveTarget} (throws if not found).
   * - `null` → end of story.
   * - `undefined` → next scene in sequence when `scene` is provided;
   *   otherwise null (caller should interpret as "fall through to next stage").
   */
  private resolveDestination(
    target: string | null | undefined,
    chapter: Chapter,
    scene: Scene | null,
  ): { chapter: Chapter; scene: Scene } | null {
    if (target === null || target === undefined) {
      return scene ? this.findNextScene(chapter, scene) : null;
    }
    const resolved = this.resolveTarget(target, chapter);
    if (!resolved) {
      throw new Error(`Target not found: ${target}`);
    }
    return resolved;
  }

  /**
   * Normalises a raw prompt result, applies submitted inputs to the current
   * scope, and resolves the target into a concrete destination.
   *
   * Returns `isEnd: true` when the user explicitly passed `target: null`.
   * When `isEnd` is false but `destination` is null the target was
   * `undefined` — meaning "fall through" (story / chapter stage) or
   * "no more scenes" (scene stage).
   */
  private ingestPrompt(
    rawResult: Awaited<ReturnType<StoryPrompt>>,
    renderResult: RenderResult,
    chapter: Chapter,
    scene: Scene | null,
  ): {
    destination: { chapter: Chapter; scene: Scene } | null;
    isEnd: boolean;
  } {
    // Normalise: void → undefined target, FormData → plain object
    const result = !rawResult
      ? { target: undefined as string | null | undefined, inputs: undefined as Scope | undefined }
      : rawResult instanceof FormData
        ? parseFormData(rawResult, renderResult)
        : rawResult;

    // Apply any submitted inputs to the current scope
    if (result.inputs) {
      applyInputScopes({ globals: this.globals, locals: chapter.locals }, result.inputs);
    }

    const destination = this.resolveDestination(result.target, chapter, scene);
    return { destination, isEnd: result.target === null };
  }

  /**
   * Plays the story interactively.
   *
   * ## State machine
   *
   * Two flags drive the loop:
   * - `storyStarted` — ensures Stage 1 runs exactly once.
   * - `activeChapterId` — tracks which chapter last completed Stage 2, so we
   *   only re-enter a chapter when `chapter.id` changes.
   *
   * ## Stage structure
   *
   * Each iteration attempts up to three stages in order.  A stage is guarded
   * so it only fires when its condition is met.  Inside each stage:
   *
   * 1. Run lifecycle hooks (if any).
   * 2. Render the template.
   * 3. Call `prompt()` so the user / AI can react to the rendered output.
   * 4. Normalise the return value (void → undefined target, FormData → object).
   * 5. Apply any submitted inputs to the current scope.
   * 6. Resolve the target into a concrete `{chapter, scene}` destination
   *    (or `null` when there is nowhere to go).
   *
   * After resolution, each stage handles three outcomes:
   *
   * | target      | destination       | behaviour                                |
   * |-------------|-------------------|------------------------------------------|
   * | `string`    | `{chapter,scene}` | jump there, `continue` to next iteration |
   * | `null`      | `null`            | end the story (`break`)                  |
   * | `undefined` | `null`            | fall through to the next stage           |
   *
   * The **scene stage** is the exception: when `target` is `undefined` it
   * delegates to `findNextScene`, so `destination` is only `null` when there
   * are no more scenes (→ end of story).
   */
  async play(prompt: StoryPrompt, options: PlayOptions) {
    const entryChapter = this.chapters[0];
    const entryScene = entryChapter?.scenes[0];
    if (!entryChapter || !entryScene) {
      return;
    }

    // Current position in the story.  These are updated by every stage when a
    // target redirects, and read by the guards at the top of each iteration.
    let chapter = entryChapter;
    let scene = entryScene;

    // ---- state-machine flags -------------------------------------------
    // `storyStarted` becomes true after Stage 1 completes (or redirects).
    let storyStarted = false;

    // `activeChapterId` tracks which chapter has already gone through Stage 2.
    // Starts as `null` so the entry chapter always triggers Stage 2 on the
    // first visit.  Updated to `chapter.id` when Stage 2 falls through
    // (undefined target), or immediately on a same-chapter redirect (see below).
    let activeChapterId: string | null = null;

    // ── Main loop ────────────────────────────────────────────────────────
    while (true) {
      if (options.debug) {
        console.log("--- [debug] chapter:", chapter.id);
        console.log("--- [debug] scene:", scene.id);
        console.log("--- [debug] globals:", JSON.stringify(this.globals, null, 2));
        console.log("--- [debug] locals:", JSON.stringify(chapter.locals, null, 2));
      }

      // ═══════════════════════════════════════════════════════════════════
      // Stage 1 — Story template (runs exactly once, at the very beginning)
      // ═══════════════════════════════════════════════════════════════════
      if (!storyStarted) {
        // --- story-level lifecycle hooks ---
        if (this.hooks.globals) {
          const result = await this.hooks.globals();
          if (result) {
            Object.assign(this.globals, result);
          }
        }

        if (this.hooks.onStart) {
          await this.hooks.onStart({ globals: this.globals });
        }

        // --- render → prompt → ingest → resolve ---
        // `null` for scene means "no current scene", so `undefined` target
        // returns `destination: null` (fall through) rather than `findNextScene`.
        const renderResult = this.render({ ...this.assets, ...this.globals }, options);
        const rawResult = await prompt({ ...renderResult, type: "story" });
        const { destination, isEnd } = this.ingestPrompt(rawResult, renderResult, chapter, null);

        // --- outcome: jump to a specific scene ---
        if (destination) {
          // Leaving the current chapter?  Fire its onLeave hook.
          if (destination.chapter !== chapter && chapter.hooks.onLeave) {
            await chapter.hooks.onLeave({
              globals: this.globals,
              locals: chapter.locals,
              target: `${destination.chapter.id}.${destination.scene.id}`,
            });
          }

          // Same-chapter redirect → mark as active so Stage 2 won't re-enter
          // and reset `chapter.locals` on the next iteration.
          if (destination.chapter === chapter) {
            activeChapterId = chapter.id;
          }

          chapter = destination.chapter;
          scene = destination.scene;
          storyStarted = true;
          continue;
        }

        // --- outcome: explicit end (target === null) ---
        if (isEnd) {
          if (chapter.hooks.onLeave) {
            await chapter.hooks.onLeave({
              globals: this.globals,
              locals: chapter.locals,
              target: null,
            });
          }
          break;
        }

        // --- outcome: fall through (target === undefined) ---
        storyStarted = true;
      }

      // ═══════════════════════════════════════════════════════════════════
      // Stage 2 — Chapter template (runs when `chapter.id` changes)
      // ═══════════════════════════════════════════════════════════════════
      //
      // Guard: `chapter.id !== activeChapterId` ensures we only render the
      // chapter template and fire its hooks once per chapter entry.
      // - On the very first iteration `activeChapterId` is `null`, so the
      //   entry chapter always triggers this stage.
      // - After a cross-chapter redirect from Stage 1, `activeChapterId` is
      //   still the old value (or `null`), so the new chapter triggers here.
      // - After a same-chapter redirect we set `activeChapterId` above, so
      //   this stage is **skipped** and we go straight to Stage 3.
      if (chapter.id !== activeChapterId) {
        // Fresh chapter — reset its local scope.
        chapter.locals = {};

        // --- chapter-level lifecycle hooks ---
        if (chapter.hooks.locals) {
          const result = await chapter.hooks.locals({ globals: this.globals });
          if (result) {
            Object.assign(chapter.locals, result);
          }
        }

        if (chapter.hooks.onEnter) {
          await chapter.hooks.onEnter({ globals: this.globals, locals: chapter.locals });
        }

        // --- render → prompt → ingest → resolve ---
        const renderResult = chapter.render({ ...this.assets, ...this.globals, ...chapter.locals }, options);
        const rawResult = await prompt({ ...renderResult, type: "chapter" });
        const { destination, isEnd } = this.ingestPrompt(rawResult, renderResult, chapter, null);

        // --- outcome: jump to a specific scene ---
        if (destination) {
          if (destination.chapter !== chapter && chapter.hooks.onLeave) {
            await chapter.hooks.onLeave({
              globals: this.globals,
              locals: chapter.locals,
              target: `${destination.chapter.id}.${destination.scene.id}`,
            });
          }

          // Same-chapter redirect → mark as active to avoid re-entering
          // this stage and resetting `chapter.locals` next iteration.
          if (destination.chapter === chapter) {
            activeChapterId = chapter.id;
          }

          chapter = destination.chapter;
          scene = destination.scene;
          continue;
        }

        // --- outcome: explicit end ---
        if (isEnd) {
          if (chapter.hooks.onLeave) {
            await chapter.hooks.onLeave({
              globals: this.globals,
              locals: chapter.locals,
              target: null,
            });
          }
          break;
        }

        // --- outcome: fall through (target === undefined) ---
        // Record that this chapter has completed Stage 2, then drop into
        // Stage 3.  Future iterations will skip Stage 2 until `chapter.id`
        // changes again.
        activeChapterId = chapter.id;
      }

      // ═══════════════════════════════════════════════════════════════════
      // Stage 3 — Scene (runs every iteration that reaches it)
      // ═══════════════════════════════════════════════════════════════════
      //
      // This is the only stage that never falls through — it always produces
      // a concrete navigation decision (jump, next scene, or end).

      // --- scene-level lifecycle hooks ---
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

      // --- render → prompt → ingest → resolve ---
      // Unlike Stages 1 & 2, we pass the current `scene` so `undefined`
      // target triggers `findNextScene` (sequential advance).
      const renderContext = { ...this.assets, ...this.globals, ...chapter.locals, ...overrides };
      const renderResult = scene.render(renderContext, options);
      const rawResult = await prompt({ ...renderResult, type: "scene" });
      const { destination } = this.ingestPrompt(rawResult, renderResult, chapter, scene);
      const canonicalTarget = destination ? `${destination.chapter.id}.${destination.scene.id}` : null;

      // --- leave hooks (scene first, then chapter) ---

      // Scene onLeave always fires — we are leaving this scene regardless of
      // where we go next (even if the story ends).
      if (scene.hooks.onLeave) {
        await scene.hooks.onLeave({
          globals: this.globals,
          locals: chapter.locals,
          target: canonicalTarget,
        });
      }

      // Chapter onLeave fires when we leave the *current* chapter — either
      // because the story ends (`!destination`) or we are jumping to a
      // different chapter.  Staying in the same chapter skips this hook.
      if (!destination || destination.chapter !== chapter) {
        if (chapter.hooks.onLeave) {
          await chapter.hooks.onLeave({
            globals: this.globals,
            locals: chapter.locals,
            target: canonicalTarget,
          });
        }
      }

      // --- navigation ---

      // No destination means end of story (explicit `null` target, or
      // `undefined` with no more scenes in sequence).
      if (!destination) {
        break;
      }

      // Update position for the next iteration.  If we changed chapters the
      // next iteration's Stage 2 guard (`chapter.id !== activeChapterId`)
      // will detect it and fire the new chapter's hooks.
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
