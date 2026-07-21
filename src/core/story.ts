import type { Metadata } from "./definitions.js";
import { Section } from "./section.js";
import type { ParsedStory, ParseStoryOptions } from "./parser.js";
import { parseStorySource, resolveParseOptions } from "./parser.js";
import { normalizePath, unwrap } from "../utils/index.js";
import { PlayOptions, StoryPrompt, StorySession } from "./session.js";
import type { StorySessionSavedData } from "./session.js";

/**
 * Story runtime containing core playback logic.
 * Wraps a root Section tree. Construct via `fromSource(source)`,
 * `fromPath(path)`, `fromParsed(parsedStory)`, or manually.
 */
export class Story {
  metadata: Metadata;
  root: Section;
  assets: Record<string, { url: string; mime?: string }>;

  get title(): string {
    return this.metadata.title ?? this.root.title;
  }

  constructor(root: Section, metadata?: Metadata) {
    this.root = root;
    this.metadata = metadata ?? {};
    this.assets = this.metadata.assets ?? {};
  }

  /**
   * Resolves a target string into a section path from root.
   *
   * - `"a.b.c"` → walked from root as an absolute path
   * - `"b.c"`   → tried relative to current path first, then absolute
   * - `"c"`     → searched: current children → siblings → global
   * - `null`    → end of story (returns null)
   *
   * Returns the path array (from root) or null for end-of-story.
   */
  resolveTarget(target: string | null, currentPath: string[]): string[] | null {
    if (target === null) {
      return null;
    }

    const segments = target.split(".");

    // Multi-segment: try as absolute path from root, then relative, then up ancestors
    if (segments.length > 1) {
      const resolved = this.root.walk(segments);
      if (resolved) {
        return segments;
      }
      // Try relative to current, then walk up ancestors
      const current = this.root.walk(currentPath);
      if (current) {
        const fromCurrent = current.walk(segments);
        if (fromCurrent) {
          return [...currentPath, ...segments];
        }
        // Walk up ancestors to find a match (handles sibling targets like "sibling.child")
        let ancestor = current.parent;
        while (ancestor) {
          const fromAncestor = ancestor.walk(segments);
          if (fromAncestor) {
            return [...ancestor.getPath(), ...segments];
          }
          ancestor = ancestor.parent;
        }
      }
      throw new Error(`Target not found: ${target}`);
    }

    // Single segment
    const id = segments[0];
    const current = this.root.walk(currentPath);

    // 1. Search current section's children
    if (current) {
      const child = current.getChild(id);
      if (child) {
        return [...currentPath, id];
      }

      // 2. Search current's siblings
      if (current.parent) {
        const sibling = current.parent.getChild(id);
        if (sibling) {
          const parentPath = currentPath.slice(0, -1);
          return [...parentPath, id];
        }
      }
    }

    // 3. Search globally across the entire tree
    const globalMatch = this.root.findById(id);
    if (globalMatch) {
      return globalMatch.getPath();
    }

    // 4. Not found — ambiguous or non-existent
    throw new Error(`Target not found: ${target}`);
  }

  /** Creates and returns a new {@link StorySession} for this story. */
  session(savedData?: StorySessionSavedData): StorySession {
    return new StorySession(this, savedData ? unwrap(structuredClone(savedData)) : undefined);
  }

  /**
   * Plays the story interactively.
   *
   * Creates a new session via {@link session} and delegates playback to it.
   * Returns a promise that resolves when playback completes.
   */
  play(prompt: StoryPrompt, options: PlayOptions): Promise<void> {
    return this.session().play(prompt, options);
  }
}

/** Creates a Story instance from a parsed story object. */
export async function fromParsed(parsed: ParsedStory): Promise<Story> {
  const root = await Section.fromParsed(parsed.root);
  return new Story(root, parsed.metadata);
}

/** Parses a story source string and creates a Story instance. */
export async function fromSource(source: string, options?: Partial<ParseStoryOptions>): Promise<Story> {
  const parseOptions = await resolveParseOptions(options);
  const parsedStory = await parseStorySource(source, parseOptions);
  return fromParsed(parsedStory);
}

/** Loads a story from a path or URL and resolves includes relative to each containing resource. */
export async function fromPath(path: string, options?: Partial<ParseStoryOptions>): Promise<Story> {
  const normalizedPath = await normalizePath(path, options?.base);
  const parseOptions = await resolveParseOptions({ ...options, base: normalizedPath });
  const source = await parseOptions.resolveInclude(normalizedPath);
  const parsedStory = await parseStorySource(source, parseOptions);
  return fromParsed(parsedStory);
}
