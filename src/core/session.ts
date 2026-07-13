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

function applyInputScopes(targets: Scope, inputs: Scope) {
  for (const [name, value] of Object.entries(inputs)) {
    targets[name] = value;
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

  /** Builds the merged scope from root to the given path. */
  private buildScope(path: string[]): Scope {
    const result: Scope = {};
    // Always start with root scope
    const rootScope = this.data.scopes[""];
    if (rootScope) {
      Object.assign(result, rootScope);
    }
    for (let i = 0; i < path.length; i++) {
      const key = path.slice(0, i + 1).join(".");
      const sectionScope = this.data.scopes[key];
      if (sectionScope) {
        Object.assign(result, sectionScope);
      }
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

    // Apply inputs to the deepest section's scope
    if (result.inputs) {
      const pathKey = currentPath.join(".");
      if (!this.data.scopes[pathKey]) {
        this.data.scopes[pathKey] = {};
      }
      applyInputScopes(this.data.scopes[pathKey], result.inputs);
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
  }

  /**
   * Runs the "enter stage" for a section (runs once when first entering).
   * Sets up scope, runs onEnter hook, renders template, prompts.
   * Returns the destination if the user navigated away, or null to fall through.
   */
  private async runEnterStage(
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

    // onEnter
    if (section.hooks.onEnter) {
      const enterScope = this.buildScope(path);
      await section.hooks.onEnter({ scope: enterScope });
    }

    // Render + prompt
    const renderScope = this.buildScope(path);
    const renderResult = section.render({ ...this.story.assets, ...renderScope }, options);
    const rawResult = await prompt({ ...renderResult, type: "section" });
    const { destination, isEnd } = this.ingestPrompt(rawResult, renderResult, path);

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

    const enterScope = this.buildScope(path);

    // onEnter (fires every visit to target)
    if (section.hooks.onEnter) {
      await section.hooks.onEnter({ scope: enterScope });
    }

    // view — per-render overrides
    const overrides: Scope = {};
    if (section.hooks.view) {
      const result = await section.hooks.view({ scope: enterScope });
      if (result) {
        Object.assign(overrides, result);
      }
    }

    // Render + prompt
    const renderContext = {
      ...this.story.assets,
      ...enterScope,
      ...overrides,
    };
    const renderResult = section.render(renderContext, options);
    const rawResult = await prompt({ ...renderResult, type: "section" });
    const { destination, isEnd } = this.ingestPrompt(rawResult, renderResult, path);

    // onLeave for current section (always fires when leaving target)
    if (section.hooks.onLeave) {
      const canonicalTarget = destination ? destination.join(".") : null;
      await section.hooks.onLeave({ scope: enterScope, target: canonicalTarget });
    }

    // Fire onLeave for ancestors being left
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

    // If there's nothing to play after root, exit
    if (!this.data.currentPath.length) {
      return;
    }

    while (true) {
      const path = this.data.currentPath;

      // ── Step A: Enter any un-entered ancestors (walk from root) ──────────
      let redirected = false;
      for (let depth = 0; depth < path.length; depth++) {
        const ancestorPath = path.slice(0, depth + 1);
        const ancestorKey = ancestorPath.join(".");

        if (!this.data.enteredPaths.includes(ancestorKey)) {
          const { destination, isEnd } = await this.runEnterStage(ancestorPath, prompt, options);

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
