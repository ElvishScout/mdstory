import type { Asset, Scope, InputType } from "./definitions.js";
import type { Story } from "./story.js";
import type { Chapter } from "./chapter.js";
import type { Scene } from "./scene.js";
import type { RenderOptions, RenderResult } from "./render.js";

export interface StorySessionData {
  assets: Record<string, Asset>;
  globals: Scope;
  locals: Record<string, Scope>;
  chapterId: string;
  sceneId: string;
  /** Whether Stage 1 (story template) has completed. */
  storyStarted: boolean;
  /** Whether the current chapter has completed Stage 2 (entered). */
  chapterStarted: boolean;
}

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

function parseInput(type: InputType, text: string | null) {
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
        return [name, parseInput(type, value)];
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

export class StorySession {
  story: Story;
  data: StorySessionData;

  constructor(story: Story, data?: StorySessionData) {
    this.story = story;
    this.data = data ?? {
      assets: structuredClone(story.assets),
      globals: structuredClone(story.globals),
      locals: Object.fromEntries(story.chapters.map((chapter) => [chapter.id, {}])),
      chapterId: story.chapters[0]?.id ?? "",
      sceneId: story.chapters[0]?.scenes[0]?.id ?? "",
      storyStarted: false,
      chapterStarted: false,
    };
  }

  /** Finds the next scene in sequential order across chapters. Returns null if no more scenes exist. */
  private findNextScene(currentChapter: Chapter, currentScene: Scene): { chapter: Chapter; scene: Scene } | null {
    // Try next scene in the current chapter
    const sceneIndex = currentChapter.scenes.indexOf(currentScene);
    if (sceneIndex !== -1 && sceneIndex + 1 < currentChapter.scenes.length) {
      return { chapter: currentChapter, scene: currentChapter.scenes[sceneIndex + 1] };
    }

    // Try the first scene of the next non-empty chapter
    const chapterIndex = this.story.chapters.indexOf(currentChapter);
    for (let i = chapterIndex + 1; i < this.story.chapters.length; i++) {
      const nextChapter = this.story.chapters[i];
      if (nextChapter.scenes.length > 0) {
        return { chapter: nextChapter, scene: nextChapter.scenes[0] };
      }
    }

    return null;
  }

  /**
   * Resolves a user-supplied target into a concrete destination.
   *
   * - `string` → delegated to {@link Story.resolveTarget} (throws if not found).
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
    const resolved = this.story.resolveTarget(target, chapter);
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
      applyInputScopes({ globals: this.data.globals, locals: this.data.locals[chapter.id] }, result.inputs);
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
   * - `chapterStarted` — ensures Stage 2 runs at most once per chapter.
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
    const entryChapter = this.story.chapters[0];
    const entryScene = entryChapter?.scenes[0];
    if (!entryChapter || !entryScene) {
      return;
    }

    // Resolve current position from session data.  If the stored IDs are
    // no longer valid (e.g. story changed), fall back to the entry point
    // so the session is always in a playable state.
    let chapter = this.story.getChapter(this.data.chapterId);
    let scene = chapter?.getScene(this.data.sceneId) ?? null;
    if (!chapter || !scene) {
      chapter = entryChapter;
      scene = entryScene;
      this.data.chapterId = chapter.id;
      this.data.sceneId = scene.id;
    }

    // State-machine flags live on `data` so they survive pause / resume.
    // The guards below read them directly; mutations write back immediately.
    // `chapter` and `scene` are local object refs for fast comparison, but
    // `data.chapterId` / `data.sceneId` are kept in sync on every position
    // change so `dump()` always reflects the current position.

    // ── Main loop ────────────────────────────────────────────────────────
    while (true) {
      if (options.debug) {
        console.log("--- [debug] chapter:", chapter.id);
        console.log("--- [debug] scene:", scene.id);
        console.log("--- [debug] globals:", JSON.stringify(this.data.globals, null, 2));
        console.log("--- [debug] locals:", JSON.stringify(this.data.locals[chapter.id], null, 2));
      }

      const currentLocals = this.data.locals[chapter.id];

      // ═══════════════════════════════════════════════════════════════════
      // Stage 1 — Story template (runs exactly once, at the very beginning)
      // ═══════════════════════════════════════════════════════════════════
      if (!this.data.storyStarted) {
        // --- story-level lifecycle hooks ---
        if (this.story.hooks.globals) {
          const result = await this.story.hooks.globals();
          if (result) {
            Object.assign(this.data.globals, result);
          }
        }

        if (this.story.hooks.onStart) {
          await this.story.hooks.onStart({ globals: this.data.globals });
        }

        // --- render → prompt → ingest → resolve ---
        // `null` for scene means "no current scene", so `undefined` target
        // returns `destination: null` (fall through) rather than `findNextScene`.
        const renderResult = this.story.render({ ...this.data.assets, ...this.data.globals }, options);
        const rawResult = await prompt({ ...renderResult, type: "story" });
        const { destination, isEnd } = this.ingestPrompt(rawResult, renderResult, chapter, null);

        // --- outcome: jump to a specific scene ---
        if (destination) {
          // Leaving the current chapter?  Fire its onLeave hook.
          if (destination.chapter !== chapter && chapter.hooks.onLeave) {
            await chapter.hooks.onLeave({
              globals: this.data.globals,
              locals: currentLocals,
              target: `${destination.chapter.id}.${destination.scene.id}`,
            });
          }

          // Same-chapter redirect → mark chapter as started so Stage 2
          // won't re-enter and reset session locals on the next iteration.
          // Cross-chapter redirect → reset so the new chapter's Stage 2 fires.
          this.data.chapterStarted = destination.chapter === chapter;

          chapter = destination.chapter;
          scene = destination.scene;
          this.data.chapterId = chapter.id;
          this.data.sceneId = scene.id;
          this.data.storyStarted = true;
          continue;
        }

        // --- outcome: explicit end (target === null) ---
        if (isEnd) {
          if (chapter.hooks.onLeave) {
            await chapter.hooks.onLeave({
              globals: this.data.globals,
              locals: currentLocals,
              target: null,
            });
          }
          break;
        }

        // --- outcome: fall through (target === undefined) ---
        this.data.storyStarted = true;
      }

      // ═══════════════════════════════════════════════════════════════════
      // Stage 2 — Chapter template (runs at most once per chapter)
      // ═══════════════════════════════════════════════════════════════════
      if (!this.data.chapterStarted) {
        // Fresh chapter — reset its local scope.
        this.data.locals[chapter.id] = {};

        // --- chapter-level lifecycle hooks ---
        if (chapter.hooks.locals) {
          const result = await chapter.hooks.locals({ globals: this.data.globals });
          if (result) {
            Object.assign(this.data.locals[chapter.id], result);
          }
        }

        if (chapter.hooks.onEnter) {
          await chapter.hooks.onEnter({ globals: this.data.globals, locals: this.data.locals[chapter.id] });
        }

        // --- render → prompt → ingest → resolve ---
        const renderResult = chapter.render(
          { ...this.data.assets, ...this.data.globals, ...this.data.locals[chapter.id] },
          options,
        );
        const rawResult = await prompt({ ...renderResult, type: "chapter" });
        const { destination, isEnd } = this.ingestPrompt(rawResult, renderResult, chapter, null);

        // --- outcome: jump to a specific scene ---
        if (destination) {
          if (destination.chapter !== chapter && chapter.hooks.onLeave) {
            await chapter.hooks.onLeave({
              globals: this.data.globals,
              locals: this.data.locals[chapter.id],
              target: `${destination.chapter.id}.${destination.scene.id}`,
            });
          }

          // Same-chapter redirect → mark as started to avoid re-entering
          // this stage and resetting session locals next iteration.
          // Cross-chapter redirect → reset so the new chapter's Stage 2 fires.
          this.data.chapterStarted = destination.chapter === chapter;

          chapter = destination.chapter;
          scene = destination.scene;
          this.data.chapterId = chapter.id;
          this.data.sceneId = scene.id;
          continue;
        }

        // --- outcome: explicit end ---
        if (isEnd) {
          if (chapter.hooks.onLeave) {
            await chapter.hooks.onLeave({
              globals: this.data.globals,
              locals: this.data.locals[chapter.id],
              target: null,
            });
          }
          break;
        }

        // --- outcome: fall through (target === undefined) ---
        // Mark this chapter as started so future iterations skip Stage 2
        // until the chapter changes.
        this.data.chapterStarted = true;
      }

      // ═══════════════════════════════════════════════════════════════════
      // Stage 3 — Scene (runs every iteration that reaches it)
      // ═══════════════════════════════════════════════════════════════════
      //
      // This is the only stage that never falls through — it always produces
      // a concrete navigation decision (jump, next scene, or end).

      // --- scene-level lifecycle hooks ---
      if (scene.hooks.onEnter) {
        await scene.hooks.onEnter({ globals: this.data.globals, locals: this.data.locals[chapter.id] });
      }

      const overrides: Scope = {};
      if (scene.hooks.view) {
        const result = await scene.hooks.view({ globals: this.data.globals, locals: this.data.locals[chapter.id] });
        if (result) {
          Object.assign(overrides, result);
        }
      }

      // --- render → prompt → ingest → resolve ---
      // Unlike Stages 1 & 2, we pass the current `scene` so `undefined`
      // target triggers `findNextScene` (sequential advance).
      const renderContext = {
        ...this.data.assets,
        ...this.data.globals,
        ...this.data.locals[chapter.id],
        ...overrides,
      };
      const renderResult = scene.render(renderContext, options);
      const rawResult = await prompt({ ...renderResult, type: "scene" });
      const { destination } = this.ingestPrompt(rawResult, renderResult, chapter, scene);
      const canonicalTarget = destination ? `${destination.chapter.id}.${destination.scene.id}` : null;

      // --- leave hooks (scene first, then chapter) ---

      // Scene onLeave always fires — we are leaving this scene regardless of
      // where we go next (even if the story ends).
      if (scene.hooks.onLeave) {
        await scene.hooks.onLeave({
          globals: this.data.globals,
          locals: this.data.locals[chapter.id],
          target: canonicalTarget,
        });
      }

      // Chapter onLeave fires when we leave the *current* chapter — either
      // because the story ends (`!destination`) or we are jumping to a
      // different chapter.  Staying in the same chapter skips this hook.
      if (!destination || destination.chapter !== chapter) {
        if (chapter.hooks.onLeave) {
          await chapter.hooks.onLeave({
            globals: this.data.globals,
            locals: this.data.locals[chapter.id],
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

      // Update position for the next iteration.  If we changed chapters,
      // reset `chapterStarted` so the new chapter's Stage 2 fires.
      this.data.chapterStarted = destination.chapter === chapter;
      chapter = destination.chapter;
      scene = destination.scene;
      this.data.chapterId = chapter.id;
      this.data.sceneId = scene.id;
    }
  }

  /** Dumps session data */
  dump() {
    return structuredClone(this.data);
  }
}
