import yaml from "js-yaml";
import MarkdownIt from "markdown-it";
import pluginFrontMatter from "markdown-it-front-matter";
import pluginAttrs from "markdown-it-attrs";

import {
  StoryInit,
  MetadataSchema,
  StoryHooksSchema,
  ChapterHooksSchema,
  SceneHooksSchema,
  DEFAULT_CHAPTER,
} from "./definitions.js";
import { Scene } from "./scene.js";
import { Chapter } from "./chapter.js";
import { DuplicateIdError, EmptyChapterIdError, InvalidMetadataError } from "./error.js";

async function importScriptModule(script: string) {
  const uint8 = new TextEncoder().encode(script);
  const binary = String.fromCharCode(...uint8);
  const url = "data:text/javascript;base64," + btoa(binary);
  const module = await import(url);
  return module.default ?? {};
}

async function parseScript<T>(script: string, schema: Zod.ZodType<T>): Promise<T> {
  return script.trim() ? schema.parse(await importScriptModule(script)) : ({} as T);
}

type Heading = { tag: "h1" | "h2" | "h3"; id: string; title: string; lineno: number };

/**
 * Parses a Markdown-formatted story source string into a structured StoryInit.
 *
 * Document structure:
 * - `#` (h1): Story title — single heading, its `<script>` is story hooks
 * - `##` (h2): Chapters — with chapter hooks, contain scenes
 * - `###` (h3): Scenes — with scene hooks and Handlebars templates
 */
export async function parseStorySource(source: string): Promise<StoryInit> {
  const md = new MarkdownIt({ html: true }).use(pluginAttrs).use(pluginFrontMatter, () => {});
  const tokens = md.parse(source, {});

  let metadata = MetadataSchema.parse({});
  let stylesheet = "";
  let storyScript = "";

  const headings: Heading[] = [];
  const scriptRanges: [number, number][] = [];
  const styleRanges: [number, number][] = [];

  tokens.forEach((token, i) => {
    if (token.type === "front_matter" && token.meta) {
      try {
        const frontMatter = MetadataSchema.parse(yaml.load(token.meta));
        metadata = Object.assign(metadata, frontMatter);
      } catch {
        throw new InvalidMetadataError(token.meta);
      }
    } else if (
      token.type === "heading_open" &&
      ["h1", "h2", "h3"].includes(token.tag) &&
      token.level === 0 &&
      token.map
    ) {
      let id = token.attrs?.find(([key]) => key === "id")?.[1] ?? "";
      let title = "";
      const nextToken = tokens[i + 1];
      if (nextToken && nextToken.type === "inline") {
        const content = nextToken.content.trim();
        id ||= content;
        title = content.replace(/(\s*\{[^{}]*\})+$/, "").trim();
      }
      if (!id) {
        throw new EmptyChapterIdError();
      }
      if (headings.find((h) => h.id === id)) {
        throw new DuplicateIdError(id);
      }
      headings.push({ tag: token.tag as "h1" | "h2" | "h3", id, title, lineno: token.map[0] });
    } else if (token.type === "html_block" && token.map) {
      let match;
      if ((match = /^[\s]*<script>(.*)<\/script>[\s]*$/s.exec(token.content))) {
        const script = match[1].trim();
        if (script) {
          scriptRanges.push(token.map);
          const parent = getCurrentParent(headings);
          if (parent?.tag === "h1") {
            storyScript = script;
          } else if (parent?.tag === "h2") {
            // Will be handled in chapter processing
          } else if (parent?.tag === "h3") {
            // Will be handled in scene processing
          }
        }
      } else if ((match = /^[\s]*<style>(.*)<\/style>[\s]*$/s.exec(token.content))) {
        const style = match[1].trim();
        if (style) {
          stylesheet += style;
          styleRanges.push(token.map);
        }
      }
    }
  });

  // Filter to only h1-h3
  const storyHeading = headings.find((h) => h.tag === "h1");
  if (!storyHeading) {
    throw new Error("Story must have a single h1 heading.");
  }

  const chapterHeadings = headings.filter((h) => h.tag === "h2");
  const sceneHeadings = headings.filter((h) => h.tag === "h3");

  // Collect all script ranges and style ranges into a set for filtering
  const ignoredLines = new Set<number>();
  for (const [from, to] of [...scriptRanges, ...styleRanges]) {
    for (let i = from; i < to; i++) ignoredLines.add(i);
  }

  const lines = source.split("\n");

  // Orphan h3s before the first h2 get a default chapter
  const firstChapterLine = chapterHeadings[0]?.lineno ?? Infinity;
  const defaultScenes = sceneHeadings.filter((sh) => sh.lineno < firstChapterLine);

  // Build all chapters (default first, then parsed ones)
  const chapters: Record<string | symbol, Chapter> = {};
  let chapterOrder: Heading[] = [];

  if (defaultScenes.length > 0) {
    const scenes: Record<string, Scene> = {};
    let entryScene: string | null = null;

    for (let si = 0; si < defaultScenes.length; si++) {
      const sh = defaultScenes[si];
      const seEnd = defaultScenes[si + 1]?.lineno ?? firstChapterLine;
      const scScript = getScriptBetween(scriptRanges, sh.lineno, seEnd, lines);
      const scHooks = await parseScript(scScript, SceneHooksSchema);

      const templateStart = sh.title ? sh.lineno : sh.lineno + 1;
      const template = lines
        .slice(templateStart, seEnd)
        .filter((_, i) => !ignoredLines.has(templateStart + i))
        .join("\n")
        .replace(/^\n+/, "");

      const scene = new Scene({ id: sh.id, title: sh.title, template, hooks: scHooks });
      scenes[sh.id] = scene;
      if (entryScene === null) {
        entryScene = sh.id;
      }
    }

    chapters[DEFAULT_CHAPTER] = new Chapter({
      id: DEFAULT_CHAPTER,
      title: "",
      scenes,
      entry: entryScene,
    });
  }

  for (let ci = 0; ci < chapterHeadings.length; ci++) {
    const ch = chapterHeadings[ci];
    const chEnd = chapterHeadings[ci + 1]?.lineno ?? lines.length;
    const chapterScenes = sceneHeadings.filter((sh) => sh.lineno > ch.lineno && sh.lineno < chEnd);
    // Chapter script ends before the first scene heading
    const chScriptEnd = chapterScenes[0]?.lineno ?? chEnd;
    const chScript = getScriptBetween(scriptRanges, ch.lineno, chScriptEnd, lines);
    const chHooks = await parseScript(chScript, ChapterHooksSchema);
    const scenes: Record<string, Scene> = {};
    let entryScene: string | null = null;

    for (let si = 0; si < chapterScenes.length; si++) {
      const sh = chapterScenes[si];
      const seEnd = chapterScenes[si + 1]?.lineno ?? chEnd;
      const scScript = getScriptBetween(scriptRanges, sh.lineno, seEnd, lines);
      const scHooks = await parseScript(scScript, SceneHooksSchema);

      const templateStart = sh.title ? sh.lineno : sh.lineno + 1;
      const template = lines
        .slice(templateStart, seEnd)
        .filter((_, i) => !ignoredLines.has(templateStart + i))
        .join("\n")
        .replace(/^\n+/, "");

      const scene = new Scene({ id: sh.id, title: sh.title, template, hooks: scHooks });
      scenes[sh.id] = scene;
      if (entryScene === null) {
        entryScene = sh.id;
      }
    }

    chapters[ch.id] = new Chapter({
      id: ch.id,
      title: ch.title,
      hooks: chHooks,
      scenes,
      entry: entryScene,
    });
    chapterOrder.push(ch);
  }

  const storyHooks = await parseScript(storyScript, StoryHooksSchema);
  const entry = DEFAULT_CHAPTER in chapters ? DEFAULT_CHAPTER : (chapterOrder[0]?.id ?? null);

  return {
    metadata,
    title: storyHeading.title,
    chapters,
    entry,
    hooks: storyHooks,
    stylesheet,
  };
}

function getCurrentParent(headings: Heading[]): Heading | null {
  for (let i = headings.length - 1; i >= 0; i--) {
    return headings[i];
  }
  return null;
}

function getScriptBetween(ranges: [number, number][], from: number, to: number, lines: string[]): string {
  const scripts: string[] = [];
  for (const [start, end] of ranges) {
    if (start >= from && end <= to) {
      const block = lines.slice(start, end).join("\n");
      const match = /^[\s]*<script>(.*)<\/script>[\s]*$/s.exec(block);
      if (match) {
        scripts.push(match[1].trim());
      }
    }
  }
  return scripts.join("\n");
}
