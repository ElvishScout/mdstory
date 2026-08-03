import type { Env, JsonValue, Scope } from "./definitions.js";
import type { InputType } from "./adapter.js";
import type { Story } from "./story.js";
import type { RenderOptions, RenderResult } from "./renderer.js";
import type { HookParam } from "./section.js";
import { unwrap, wrap } from "../utils/index.js";

/** Reason a play loop was aborted. */
export type StorySessionAbortReason = "restart" | "load";

/** Error thrown when a running play loop is aborted (e.g. on restart or load). */
export class StorySessionAbortError extends Error {
  /** Why the loop was aborted, if a reason was supplied. */
  reason?: StorySessionAbortReason;

  constructor(reason?: StorySessionAbortReason, message?: string) {
    super(message);
    this.name = "StorySessionAbortError";
    this.reason = reason;
  }
}

/** Mutable state of a play session. */
export interface StorySessionData {
  /** Scope layers keyed by dot-separated section path (`""` is the root scope). */
  scopes: Record<string, Scope>;
  /** `null` = nowhere (session not started / finished); `""` = root; `"a.b"` = nested section. */
  currentPath: string | null;
}

/**
 * Serialized session data as returned by {@link StorySession.save}.
 * Safe to pass to `JSON.stringify` and to `Story.session()` / `StorySession`.
 */
export interface StorySessionSavedData extends StorySessionData {
  scopes: Record<string, Record<string, JsonValue>>;
}

/** Props passed to the prompt function for each rendered section. */
export interface PromptProps extends RenderResult {
  /** Path to the rendered section. */
  path: string[];
}

/** Raw result data accepted from a prompt: explicit fields or form data. */
export type PromptResultData = { target?: string | null; inputs?: Scope } | FormData;

/**
 * Normalised result returned by the prompt function after each render.
 */
export type PromptResult =
  | { type: "end" }
  | { type: "continue"; data?: PromptResultData }
  | { type: "abort"; reason?: StorySessionAbortReason };

/**
 * Callback invoked after each section render. Receives the rendered output and
 * extracted fields, and resolves with the user's navigation decision.
 */
export type StoryPrompt = (props: PromptProps) => Promise<PromptResult>;

/** Options for interactive playback. */
export interface PlayOptions extends RenderOptions {
  /**
   * Arbitrary host-provided objects made available to every section hook as
   * {@link HookParam.env}. Defaults to an empty object.
   */
  env?: Env;
  /** Log the current path and merged scope before each render. */
  debug?: boolean;
}

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
  const rawTarget = formData.get("@target") as string;
  const target = formData.has("@target") ? rawTarget || null : undefined;
  const parsedInputs = Object.fromEntries(
    inputs.map(({ name, type }) => {
      const value = formData.get(name) as string | null;
      return [name, parseInput(type, value)];
    }),
  );
  return { target, inputs: parsedInputs };
}

/**
 * Applies input values to the nearest scope layer that owns each key.
 * If no layer owns the key, writes to the leaf layer.
 */
const hasOwn = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

/** Returns the index of the nearest layer (from leaf upward) that owns `key`, or -1. */
function findOwningLayerIndex(layers: Scope[], key: string): number {
  for (let i = layers.length - 1; i >= 0; i--) {
    if (hasOwn(layers[i], key)) {
      return i;
    }
  }
  return -1;
}

/** Length of the longest common prefix between two string arrays. */
function commonPrefixLength(a: string[], b: string[]): number {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) {
    n++;
  }
  return n;
}

/** Convert a path array to a dot-separated key. `[]` → `""`, `["a","b"]` → `"a.b"` */
function pathToKey(path: string[]): string {
  return path.join(".");
}

/** Convert a dot-separated key back to a path array. `""` → `[]`, `"a.b"` → `["a","b"]` */
function keyToPath(key: string): string[] {
  return key ? key.split(".") : [];
}

/** Write `value` to the nearest layer that owns `key`, or to the leaf layer. */
function writeToLayer(layers: Scope[], key: string, value: unknown): void {
  const idx = findOwningLayerIndex(layers, key);
  if (idx !== -1) {
    layers[idx][key] = value;
  } else {
    layers[layers.length - 1][key] = value;
  }
}

/**
 * Interactive play session for a {@link Story}.
 *
 * Holds the mutable playback state (scope layers + current position) and drives
 * the enter/render/prompt/leave loop. Create via `new StorySession(story)`,
 * `Story.session()`, or restore a saved session via {@link StorySession.fromSaved}.
 */
export class StorySession {
  /** The story being played. */
  story: Story;
  /** Mutable session state (scope layers and current position). */
  data: StorySessionData;
  /** Host-provided environment shared by all hooks during the current play loop (empty when idle; not saved). */
  env: Env;
  /** In-flight play loop promise, or `null` when no loop is running. */
  promise: Promise<void> | null;

  constructor(story: Story, data?: StorySessionData) {
    this.story = story;
    this.env = {};
    this.promise = null;

    if (data) {
      this.data = data;
    } else {
      this.data = {
        scopes: { "": { ...story.metadata.scope } },
        currentPath: null,
      };
    }
  }

  /** Creates a session restored from previously {@link StorySession.save saved} data. */
  static fromSaved(story: Story, savedData: StorySessionSavedData): StorySession {
    return new StorySession(story, unwrap(structuredClone(savedData)));
  }

  /** Collects scope layers from root to the given path. */
  private collectScopes(path: string[]): Scope[] {
    const layers: Scope[] = [];
    const rootScope = this.data.scopes[""];
    if (rootScope) {
      layers.push(rootScope);
    }
    for (let i = 0; i < path.length; i++) {
      const key = path.slice(0, i + 1).join(".");
      const sectionScope = this.data.scopes[key];
      if (sectionScope) {
        layers.push(sectionScope);
      }
    }
    return layers;
  }

  /**
   * Builds a Proxy scope that reads from the nearest layer upwards,
   * and writes to the layer that already owns the key (or the leaf layer).
   */
  private buildScope(path: string[], layers?: Scope[]): Scope {
    layers ??= this.collectScopes(path);
    if (!layers.length) {
      return {};
    }

    return new Proxy({} as Scope, {
      get(_target, prop) {
        const idx = findOwningLayerIndex(layers, prop as string);
        return idx !== -1 ? layers[idx][prop as string] : undefined;
      },
      set(_target, prop, value) {
        writeToLayer(layers, prop as string, value);
        return true;
      },
      has(_target, prop) {
        return findOwningLayerIndex(layers, prop as string) !== -1;
      },
      deleteProperty(_target, prop) {
        const idx = findOwningLayerIndex(layers, prop as string);
        if (idx !== -1) {
          delete layers[idx][prop as string];
        }
        return true;
      },
      ownKeys(_target) {
        const keys = new Set<string>();
        for (const layer of layers) {
          for (const key of Object.keys(layer)) {
            keys.add(key);
          }
        }
        return [...keys];
      },
      getOwnPropertyDescriptor(_target, prop) {
        const idx = findOwningLayerIndex(layers, prop as string);
        if (idx !== -1) {
          return {
            configurable: true,
            enumerable: true,
            value: layers[idx][prop as string],
            writable: true,
          };
        }
        return undefined;
      },
    });
  }

  /** Builds a flat merged object for Handlebars rendering (not a proxy). */
  private buildRenderScope(path: string[], layers?: Scope[]): Scope {
    layers ??= this.collectScopes(path);
    const result: Scope = {};
    for (const layer of layers) {
      Object.assign(result, layer);
    }
    return result;
  }

  /** Resolves a user-supplied target into a concrete path from root. */
  private resolveDestination(target: string | null | undefined, currentPath: string[]): string[] | null {
    if (target === null) {
      return null;
    }
    if (target === undefined) {
      // Fall through: find next section in tree
      const current = this.story.root.walk(currentPath);
      if (!current) {
        return null;
      }
      const next = current.findNextInTree();
      return next ? next.getPath() : null;
    }
    return this.story.resolveTarget(target, currentPath);
  }

  /**
   * Normalises a PromptResult into a concrete navigation decision.
   * Returns the destination path array, or `null` to end the story.
   */
  private ingestPrompt(
    rawResult: Awaited<ReturnType<StoryPrompt>>,
    renderResult: RenderResult,
    currentPath: string[],
  ): string[] | null {
    if (rawResult.type === "end") {
      return null;
    } else if (rawResult.type === "abort") {
      throw new StorySessionAbortError(rawResult.reason);
    }

    let result: { target?: string | null; inputs?: Scope };
    if (!rawResult.data) {
      result = { target: undefined, inputs: undefined };
    } else if (rawResult.data instanceof FormData) {
      result = parseFormData(rawResult.data, renderResult);
    } else {
      result = rawResult.data;
    }

    // Normalize empty string target to null (equivalent to "end story")
    if (result.target === "") {
      result.target = null;
    }

    // Apply inputs to the nearest owning scope layer
    if (result.inputs) {
      const layers = this.collectScopes(currentPath);
      if (!layers.length) {
        this.data.scopes[""] = {};
        layers.push(this.data.scopes[""]);
      }
      for (const [name, value] of Object.entries(result.inputs)) {
        writeToLayer(layers, name, value);
      }
    }

    return this.resolveDestination(result.target, currentPath);
  }

  /**
   * Invokes a section hook with the section's layered scope bound as `this`,
   * and the same scope plus the session env merged into its param.
   */
  private invokeHook<P extends HookParam, R>(
    path: string[],
    hook: (this: Scope, param: P) => R,
    param: Omit<P, "env" | "scope">,
  ): R {
    const scope = this.buildScope(path);
    // TypeScript can't verify the merged object against generic P, but `param`
    // already carries every other field of P, so the runtime shape is exact.
    return hook.call(scope, { ...param, scope, env: this.env } as P);
  }

  /**
   * Init a section: reset scope, data(), onEnter.  No render.
   * Called on every entry — whether first visit or re-visit.
   */
  private async initSection(path: string[]): Promise<void> {
    const pathKey = path.join(".");
    const section = this.story.root.walk(path);
    if (!section) {
      return;
    }

    // Reset scope for this section (skip root — initialized from metadata)
    if (pathKey !== "") {
      this.data.scopes[pathKey] = {};
    }

    if (section.hooks.data) {
      const result = await this.invokeHook(path, section.hooks.data, {});
      if (result) {
        Object.assign(this.data.scopes[pathKey], result);
      }
    }

    if (section.hooks.onEnter) {
      await this.invokeHook(path, section.hooks.onEnter, {});
    }
  }

  /**
   * Render + prompt a section.  Returns the navigation result.
   * Does NOT fire onLeave — the play loop handles all leaving.
   */
  private async renderSection(path: string[], prompt: StoryPrompt, options: PlayOptions): Promise<string[] | null> {
    const section = this.story.root.walk(path);
    if (!section) {
      return null;
    }

    if (options.debug) {
      const renderScope = this.buildRenderScope(path);
      console.log("--- [debug] path:", path.join(".") || "(root)");
      console.log("--- [debug] scope:", JSON.stringify(renderScope, null, 2));
    }

    const renderResult = section.render({ ...this.story.assets, ...this.buildRenderScope(path) }, options);
    const promptResult = await prompt({ ...renderResult, path });
    return this.ingestPrompt(promptResult, renderResult, path);
  }

  /** Fire onLeave for a single section. */
  private async leaveSection(path: string[], targetPath: string[] | null): Promise<void> {
    const section = this.story.root.walk(path);
    if (section?.hooks.onLeave) {
      await this.invokeHook(path, section.hooks.onLeave, { target: targetPath ? targetPath.join(".") : null });
    }
  }

  /** Main play loop — each iteration either enters or leaves one section. */
  private async runLoop(prompt: StoryPrompt, options: PlayOptions): Promise<void> {
    // Resume from saved position: start at the parent of the recorded path so
    // the first iteration enters the saved section through normal enter logic.
    // `null` → enter root; `""` → enter root; `"a"` → enter "a" from root.
    this.env = options.env ?? {};
    const savedKey = this.data.currentPath;
    const savedPath: string[] | null = savedKey !== null ? keyToPath(savedKey) : null;
    let currentPath: string[] | null = savedPath && savedPath.length > 0 ? savedPath.slice(0, -1) : null;
    let targetPath: string[] | null = savedPath ?? [];
    // When resuming, skip initSection on the first entry to preserve saved scope.
    let resuming = savedPath !== null;

    while (true) {
      // ── Enter: walk deeper along targetPath ──
      // A null targetPath means the story is ending — fall through to leave.
      if (
        targetPath !== null &&
        (currentPath === null ||
          (currentPath.length < targetPath.length &&
            commonPrefixLength(currentPath, targetPath) === currentPath.length))
      ) {
        const nextPath: string[] = currentPath ? targetPath.slice(0, currentPath.length + 1) : [];
        this.data.currentPath = pathToKey(nextPath);
        if (resuming) {
          resuming = false;
        } else {
          await this.initSection(nextPath);
        }
        const destination = await this.renderSection(nextPath, prompt, options);
        currentPath = nextPath;
        targetPath = destination; // null → story end, string[] → navigate
      } else if (currentPath) {
        // ── Leave: step back one section, deepest first ──
        // Handles both cross-branch jumps and story ending (targetPath === null).
        await this.leaveSection(currentPath, targetPath);
        currentPath = currentPath.length > 0 ? currentPath.slice(0, -1) : null;
      } else {
        // currentPath is null and targetPath is null — nowhere to go
        break;
      }
    }
  }

  /**
   * Plays the story interactively.
   *
   * At most one play loop may be running at a time — re-entrant calls return
   * the in-flight promise rather than starting a second loop. This means if
   * the running loop is aborted (via {@link StorySessionAbortError}), any
   * waiter that joined mid-flight will also receive the abort rejection.
   * Callers that intend to restart should create a fresh session instead.
   */
  async play(prompt: StoryPrompt, options: PlayOptions): Promise<void> {
    this.promise ??= this.runLoop(prompt, options).finally(() => {
      this.env = {};
      this.promise = null;
    });
    return this.promise;
  }

  /**
   * Saves session data to a JSON-safe object.
   *
   * The returned value can be passed directly to `JSON.stringify` and later
   * restored via `Story.session(savedData)` or the `StorySession` constructor.
   */
  save(): StorySessionSavedData {
    return structuredClone(wrap(this.data));
  }
}
