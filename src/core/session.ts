import type { Scope, InputType, JsonValue } from "./definitions.js";
import type { Story } from "./story.js";
import type { RenderOptions, RenderResult } from "./render.js";

export interface StorySessionData {
  scopes: Record<string, Scope>;
  /** `null` = nowhere (session not started / finished); `[]` = root; `["a","b"]` = nested section. */
  currentPath: string[] | null;
}

export type PromptProps = { type: "section" } & RenderResult;

export type PromptResultData = { target?: string | null; inputs?: Scope } | FormData;

/**
 * Normalised result returned by the prompt function after each render.
 */
export type PromptResult = { type: "end" } | { type: "continue"; data?: PromptResultData };

export type StoryPrompt = (props: PromptProps) => Promise<PromptResult>;

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

/** Write `value` to the nearest layer that owns `key`, or to the leaf layer. */
function writeToLayer(layers: Scope[], key: string, value: JsonValue): void {
  const idx = findOwningLayerIndex(layers, key);
  if (idx !== -1) {
    layers[idx][key] = value;
  } else {
    layers[layers.length - 1][key] = value;
  }
}

export class StorySession {
  story: Story;
  data: StorySessionData;
  promise: Promise<void> | null;

  constructor(story: Story, data?: StorySessionData) {
    this.story = story;
    this.promise = null;

    if (data) {
      this.data = data;
    } else {
      this.data = {
        scopes: { "": story.metadata.scope ? { ...story.metadata.scope } : {} },
        currentPath: null,
      };
    }
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
      const dataScope = this.buildScope(path);
      const result = await section.hooks.data({ scope: dataScope });
      if (result) {
        Object.assign(this.data.scopes[pathKey], result);
      }
    }

    if (section.hooks.onEnter) {
      await section.hooks.onEnter({ scope: this.buildScope(path) });
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
    return this.ingestPrompt(await prompt({ ...renderResult, type: "section" }), renderResult, path);
  }

  /** Fire onLeave for a single section. */
  private async leaveSection(path: string[], targetPath: string[] | null): Promise<void> {
    const section = this.story.root.walk(path);
    if (section?.hooks.onLeave) {
      await section.hooks.onLeave({
        scope: this.buildScope(path),
        target: targetPath ? targetPath.join(".") : null,
      });
    }
  }

  /** Main play loop — each iteration either enters or leaves one section. */
  private async runLoop(prompt: StoryPrompt, options: PlayOptions): Promise<void> {
    // Resume from saved position: start at the parent of the recorded path so
    // the first iteration enters the saved section through normal enter logic.
    // `null` → enter root; `[]` → enter root; `["a"]` → enter "a" from root.
    const savedPath = this.data.currentPath?.slice() ?? null;
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
        this.data.currentPath = nextPath;
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
   * the in-flight promise.
   */
  async play(prompt: StoryPrompt, options: PlayOptions): Promise<void> {
    this.promise ??= this.runLoop(prompt, options).finally(() => {
      this.promise = null;
    });
    return this.promise;
  }

  /** Saves session data */
  save(): StorySessionData {
    return structuredClone(this.data);
  }
}
