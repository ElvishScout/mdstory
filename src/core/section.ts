import type { Env, Scope } from "./definitions.js";
import { renderTemplate } from "./renderer.js";
import type { RenderOptions, RenderResult } from "./renderer.js";
import type { ParsedSection } from "./parser.js";
import { mergeScripts } from "../utils/index.js";

export type { ParsedSection } from "./parser.js";

/** Return type of section lifecycle hooks: a value or a promise of it. */
export type HookResult<T = void> = T | Promise<T>;

/** Parameters passed to section lifecycle hooks. */
export interface HookParam {
  /** Layered scope for the current section (reads cascade up to ancestors). */
  scope: Scope;
  /**
   * Host-provided environment objects (from {@link PlayOptions.env}), shared
   * by all hooks for the duration of a play loop.
   */
  env: Env;
}

/** Parameters passed to the `onLeave` hook. */
export interface LeaveHookParam extends HookParam {
  /** Dot-separated path of the navigation target, or `null` if the story is ending. */
  target: string | null;
}

/** Section-level lifecycle hooks — unified, no globals/locals distinction. */
export interface SectionHooks {
  /** Returns variables that take effect within this section's scope and cascade to descendants. */
  data?: (param: HookParam) => HookResult<Scope | undefined>;
  /** Called when the section is entered, after `data` has been applied. */
  onEnter?: (param: HookParam) => HookResult;
  /** Called when the section is left, before navigating to `target`. */
  onLeave?: (param: LeaveHookParam) => HookResult;
}

/** Structured representation of a section for runtime construction. */
export interface SectionInit {
  /** Unique section identifier within its parent. */
  id: string;
  /** Heading title text. */
  title?: string;
  /** Raw Markdown/Handlebars template body of the section. */
  template?: string;
  /** Stylesheets scoped to this section. */
  stylesheets?: string[];
  /** Lifecycle hooks for this section. */
  hooks?: SectionHooks;
  /** Nested child sections. */
  children: Section[];
}

/** A recursive section node — the core unit of an MdStory. */
export class Section {
  /** Unique section identifier within its parent. */
  id: string;
  /** Heading title text (empty for the root section). */
  title: string;
  /** Raw Markdown/Handlebars template body of the section. */
  template: string;
  /** Stylesheets scoped to this section. */
  stylesheets: string[];
  /** Lifecycle hooks for this section. */
  hooks: SectionHooks;
  /** Nested child sections. */
  children: Section[];
  /** Parent section, or `null` for the root. */
  parent: Section | null;

  constructor({ id, title, template, stylesheets, hooks, children }: SectionInit, parent?: Section | null) {
    this.id = id;
    this.title = title ?? "";
    this.template = template ?? "";
    this.stylesheets = stylesheets ?? [];
    this.hooks = hooks ?? {};
    this.children = children;
    this.parent = parent ?? null;

    // Set parent reference on all children
    for (const child of this.children) {
      child.parent = this;
    }
  }

  /** Construct a Section tree recursively from parser output. */
  static async fromParsed(parsed: ParsedSection, parentPath?: string[]): Promise<Section> {
    // Root scripts use no sectionPath so module IDs match parser validation,
    // avoiding double execution via ES module cache dedup.
    const hooks = parentPath
      ? await mergeScripts(parsed.scripts, [...parentPath, parsed.id])
      : await mergeScripts(parsed.scripts);
    const children = await Promise.all(
      parsed.children.map((child) => Section.fromParsed(child, parentPath ? [...parentPath, parsed.id] : [parsed.id])),
    );
    return new Section({
      id: parsed.id,
      title: parsed.title,
      template: parsed.template,
      stylesheets: parsed.stylesheets,
      hooks,
      children,
    });
  }

  /** Renders the section template with the given scope and render options. */
  render(scope: Scope, options: RenderOptions): RenderResult {
    return renderTemplate(this.template, scope, options);
  }

  /** Find a direct child by id. */
  getChild(id: string): Section | null {
    return this.children.find((child) => child.id === id) ?? null;
  }

  /** Walk a path array from this section, returning the section at the end (or null). */
  walk(path: string[]): Section | null {
    let current: Section = this;
    for (const segment of path) {
      const child = current.getChild(segment);
      if (!child) {
        return null;
      }
      current = child;
    }
    return current;
  }

  /** Recursively find a section by id in the entire subtree (depth-first). */
  findById(id: string): Section | null {
    if (this.id === id) {
      return this;
    }
    for (const child of this.children) {
      const found = child.findById(id);
      if (found) {
        return found;
      }
    }
    return null;
  }

  /** Get the path from root to this section as an array of ids (root itself returns []). */
  getPath(): string[] {
    const path: string[] = [];
    let current: Section | null = this;
    // Stop before root — root has no parent
    while (current && current.parent) {
      path.unshift(current.id);
      current = current.parent;
    }
    return path;
  }

  /** Find the next sibling in the parent's children array. */
  findNextSibling(): Section | null {
    if (!this.parent) {
      return null;
    }
    const idx = this.parent.children.indexOf(this);
    if (idx !== -1 && idx + 1 < this.parent.children.length) {
      return this.parent.children[idx + 1];
    }
    return null;
  }

  /**
   * Find the next section in depth-first pre-order. Returns null if this is the
   * last section in the entire tree.
   */
  findNextInTree(): Section | null {
    // If this section has children, the next is the first child
    if (this.children.length) {
      return this.children[0];
    }

    // Otherwise, look for the next sibling; if none, go up and repeat
    let current: Section = this;
    while (current.parent) {
      const nextSibling = current.findNextSibling();
      if (nextSibling) {
        return nextSibling;
      }
      current = current.parent;
    }

    return null;
  }
}
