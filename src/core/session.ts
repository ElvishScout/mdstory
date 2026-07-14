import type { Scope, InputType } from "./definitions.js";
import type { Story } from "./story.js";
import type { Section } from "./section.js";
import type { RenderOptions, RenderResult } from "./render.js";

export interface StorySessionData {
  scopes: Record<string, Scope>;
  currentPath: string[];
  enteredPaths: string[];
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
      try {
        return [name, parseInput(type, value)];
      } catch {
        throw new Error(`Invalid input from FormData: ${name}, ${value}`);
      }
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

function applyInputs(layers: Scope[], inputs: Scope) {
  if (!layers.length) {
    return;
  }
  const leaf = layers[layers.length - 1];
  for (const [name, value] of Object.entries(inputs)) {
    const idx = findOwningLayerIndex(layers, name);
    if (idx !== -1) {
      layers[idx][name] = value;
    } else {
      leaf[name] = value;
    }
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
      const firstLeaf = findFirstLeaf(story.root);
      const initialPath = firstLeaf ? firstLeaf.getPath() : [];
      this.data = {
        scopes: { "": story.metadata.scope ? { ...story.metadata.scope } : {} },
        currentPath: initialPath,
        enteredPaths: [],
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
  private buildScope(path: string[]): Scope {
    const layers = this.collectScopes(path);
    if (!layers.length) {
      return {};
    }

    const leafIdx = layers.length - 1;

    return new Proxy({} as Scope, {
      get(_target, prop) {
        const idx = findOwningLayerIndex(layers, prop as string);
        return idx !== -1 ? layers[idx][prop as string] : undefined;
      },
      set(_target, prop, value) {
        const idx = findOwningLayerIndex(layers, prop as string);
        if (idx !== -1) {
          layers[idx][prop as string] = value;
        } else {
          // Key doesn't exist anywhere — set on leaf
          layers[leafIdx][prop as string] = value;
        }
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
  private buildRenderScope(path: string[], overrides?: Scope): Scope {
    const result: Scope = {};
    for (const layer of this.collectScopes(path)) {
      Object.assign(result, layer);
    }
    if (overrides) {
      Object.assign(result, overrides);
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

  /** Normalises a PromptResult into a concrete navigation decision. */
  private ingestPrompt(
    rawResult: Awaited<ReturnType<StoryPrompt>>,
    renderResult: RenderResult,
    currentPath: string[],
  ): {
    destination: string[] | null;
    isEnd: boolean;
  } {
    if (rawResult.type === "end") {
      return { destination: null, isEnd: true };
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

    // Apply inputs to the nearest owning scope layer (no $ prefix needed)
    if (result.inputs) {
      const layers = this.collectScopes(currentPath);
      if (!layers.length) {
        this.data.scopes[""] = {};
        layers.push(this.data.scopes[""]);
      }
      applyInputs(layers, result.inputs);
    }

    const destination = this.resolveDestination(result.target, currentPath);
    return { destination, isEnd: result.target === null };
  }

  /**
   * Fires onLeave hooks for sections being left (from deepest to common ancestor).
   * Also removes left sections from enteredPaths so they re-enter on return.
   */
  private async fireLeaveHooks(oldPath: string[], newPath: string[] | null): Promise<void> {
    // Find common prefix length
    let commonLen = 0;
    if (newPath) {
      while (commonLen < oldPath.length && commonLen < newPath.length && oldPath[commonLen] === newPath[commonLen]) {
        commonLen++;
      }
    }

    const canonicalTarget = newPath ? newPath.join(".") : null;

    // Fire onLeave from deepest to the one just after common prefix
    for (let i = oldPath.length - 1; i >= commonLen; i--) {
      const leavingPath = oldPath.slice(0, i + 1);
      const leavingKey = leavingPath.join(".");
      const section = this.story.root.walk(leavingPath);
      if (!section) {
        continue;
      }

      if (section.hooks.onLeave) {
        const leaveScope = this.buildScope(leavingPath);
        await section.hooks.onLeave({ scope: leaveScope, target: canonicalTarget });
      }

      // Remove from entered so re-entry triggers enter stage again
      const enteredIdx = this.data.enteredPaths.indexOf(leavingKey);
      if (enteredIdx !== -1) {
        this.data.enteredPaths.splice(enteredIdx, 1);
      }
    }

    // Fire root's onLeave when story ends (root is never in oldPath)
    if (newPath === null && this.story.root.hooks.onLeave) {
      const rootScope = this.buildScope([]);
      await this.story.root.hooks.onLeave({ scope: rootScope, target: null });
      const enteredIdx = this.data.enteredPaths.indexOf("");
      if (enteredIdx !== -1) {
        this.data.enteredPaths.splice(enteredIdx, 1);
      }
    }
  }

  /**
   * Runs the "enter stage" for a section (runs once when first entering).
   * Sets up scope, runs onEnter hook, renders template, prompts.
   * When initOnly is true, only initializes scope — lifecycle hooks and
   * render are deferred to the target stage (avoids double onEnter).
   * Returns the destination if the user navigated away, or null to fall through.
   */
  private async runEnterStage(
    path: string[],
    prompt: StoryPrompt,
    options: PlayOptions,
    initOnly = false,
  ): Promise<{ destination: string[] | null; isEnd: boolean }> {
    const pathKey = path.join(".");
    const section = this.story.root.walk(path);
    if (!section) {
      return { destination: null, isEnd: false };
    }

    if (options.debug) {
      console.log("--- [debug] enter stage:", pathKey);
    }

    // Reset scope for this section (skip root — initialized from metadata)
    if (pathKey !== "") {
      this.data.scopes[pathKey] = {};
    }

    if (section.hooks.scope) {
      const parentPath = path.slice(0, -1);
      const parentScope = this.buildScope(parentPath);
      const result = await section.hooks.scope({ scope: parentScope });
      if (result) {
        Object.assign(this.data.scopes[pathKey], result);
      }
    }

    // When initOnly, skip lifecycle hooks and render — target stage handles them
    if (initOnly) {
      this.data.enteredPaths.push(pathKey);
      return { destination: null, isEnd: false };
    }

    // onEnter + render + prompt
    const { destination, isEnd } = await this.enterAndRender(section, path, prompt, options);

    // Handle nav
    if (destination) {
      // Mark current as entered if navigating deeper (descendant path)
      const destKey = destination.join(".");
      if (destKey.startsWith(pathKey + ".")) {
        this.data.enteredPaths.push(pathKey);
      }
      await this.fireLeaveHooks(path, destination);
      return { destination, isEnd: false };
    }

    if (isEnd) {
      await this.fireLeaveHooks(path, null);
      return { destination: null, isEnd: true };
    }

    // Fall through — mark as entered
    this.data.enteredPaths.push(pathKey);
    return { destination: null, isEnd: false };
  }

  /** Shared helper: runs onEnter hook then renders + prompts. */
  private async enterAndRender(
    section: Section,
    path: string[],
    prompt: StoryPrompt,
    options: PlayOptions,
  ): Promise<{ destination: string[] | null; isEnd: boolean }> {
    if (section.hooks.onEnter) {
      const enterScope = this.buildScope(path);
      await section.hooks.onEnter({ scope: enterScope });
    }

    const renderResult = section.render({ ...this.story.assets, ...this.buildRenderScope(path) }, options);
    const rawResult = await prompt({ ...renderResult, type: "section" });
    return this.ingestPrompt(rawResult, renderResult, path);
  }

  /**
   * Runs the "target stage" for the deepest section (runs every visit).
   */
  private async runTargetStage(
    path: string[],
    prompt: StoryPrompt,
    options: PlayOptions,
  ): Promise<{ destination: string[] | null; isEnd: boolean }> {
    const pathKey = path.join(".");
    const section = this.story.root.walk(path);
    if (!section) {
      return { destination: null, isEnd: false };
    }

    if (options.debug) {
      console.log("--- [debug] target stage:", pathKey);
      console.log("--- [debug] scopes:", JSON.stringify(this.data.scopes, null, 2));
    }

    // onEnter + render + prompt
    const { destination, isEnd } = await this.enterAndRender(section, path, prompt, options);

    // Fire onLeave for current section and ancestors being left
    if (destination) {
      await this.fireLeaveHooks(path, destination);
    } else {
      await this.fireLeaveHooks(path, null);
    }

    return { destination, isEnd };
  }

  /** Main play loop. */
  private async runLoop(prompt: StoryPrompt, options: PlayOptions): Promise<void> {
    // Ensure root has been entered before descending into children
    if (!this.data.enteredPaths.includes("")) {
      const rootResult = await this.runEnterStage([], prompt, options);
      if (rootResult.isEnd) {
        return;
      }
      if (rootResult.destination) {
        this.data.currentPath = rootResult.destination;
      }
    }

    while (true) {
      const path = this.data.currentPath;

      // ── Step A: Enter any un-entered ancestors (walk from root) ──────────
      let redirected = false;
      for (let depth = 0; depth < path.length; depth++) {
        const ancestorPath = path.slice(0, depth + 1);
        const ancestorKey = ancestorPath.join(".");

        if (!this.data.enteredPaths.includes(ancestorKey)) {
          // Deepest element is the target — scope-only init; lifecycle deferred to target stage
          const isTarget = depth === path.length - 1;
          const { destination, isEnd } = await this.runEnterStage(ancestorPath, prompt, options, isTarget);

          if (isEnd) {
            return;
          }

          if (destination) {
            this.data.currentPath = destination;
            redirected = true;
            break;
          }
          // fall through: already marked as entered in runEnterStage
        }
      }

      if (redirected) {
        continue;
      }

      // ── Step B: Render the target (deepest) section ──────────────────────
      const { destination, isEnd } = await this.runTargetStage(path, prompt, options);

      if (isEnd) {
        return;
      }

      if (destination) {
        this.data.currentPath = destination;
        continue;
      }

      // No destination — try findNextInTree
      const current = this.story.root.walk(path);
      if (!current) {
        return;
      }
      const next = current.findNextInTree();
      if (!next) {
        return;
      }
      this.data.currentPath = next.getPath();
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
    return {
      scopes: structuredClone(this.data.scopes),
      currentPath: [...this.data.currentPath],
      enteredPaths: [...this.data.enteredPaths],
    };
  }
}

/** Find the first leaf section (no children) in depth-first order. */
function findFirstLeaf(root: Section): Section | null {
  if (!root.children.length) {
    return root;
  }
  return findFirstLeaf(root.children[0]);
}
