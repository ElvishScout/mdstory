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
import { normalizePath } from "./utils.js";

type Heading = { tag: "h1" | "h2" | "h3"; id: string; title: string; lineno: number };
type ScriptBlock = { from: number; to: number; content: string };
export type IncludeResolver = (path: string) => string | Promise<string>;
export type ParseStoryOptions = {
  base: string;
  resolveInclude: IncludeResolver;
};

async function importScriptModule(script: string) {
  const uint8 = new TextEncoder().encode(script);
  const binary = String.fromCharCode(...uint8);
  const url = "data:text/javascript;base64," + btoa(binary);
  const module = await import(/* @vite-ignore */ url);
  return module.default ?? {};
}

async function parseScript<T>(script: string, schema: Zod.ZodType<T>): Promise<T> {
  return script.trim() ? schema.parse(await importScriptModule(script)) : ({} as T);
}

async function expandIncludes(source: string, options: ParseStoryOptions, stack: string[] = []): Promise<string> {
  const lines = source.split("\n");
  const expanded: string[] = [];

  for (const line of lines) {
    const match = /^!include\(\s*(?:"([^"]+)"|'([^']+)')\s*\)\s*$/.exec(line.trim());
    if (!match) {
      expanded.push(line);
      continue;
    }

    const target = match[1] ?? match[2]!;
    const normalizedPath = await normalizePath(target, options.base);

    if (stack.includes(normalizedPath)) {
      throw new Error(`Circular include detected: ${[...stack, normalizedPath].join(" -> ")}`);
    }

    const source = await options.resolveInclude(normalizedPath);
    expanded.push(await expandIncludes(source, { ...options, base: normalizedPath }, [...stack, normalizedPath]));
  }

  return expanded.join("\n");
}

/**
 * Parses a Markdown-formatted story source string into a structured StoryInit.
 *
 * Document structure:
 * - `#` (h1): Optional story title — its `<script>` is story hooks
 * - `##` (h2): Chapters — with chapter hooks, contain scenes
 * - `###` (h3): Scenes — with scene hooks and Handlebars templates
 */
export async function parseStorySource(source: string, options: ParseStoryOptions): Promise<StoryInit> {
  source = await expandIncludes(source, options);

  const md = new MarkdownIt({ html: true }).use(pluginAttrs).use(pluginFrontMatter, () => {});
  const tokens = md.parse(source, {});

  let metadata = MetadataSchema.parse({});
  let stylesheet = "";

  const headings: Heading[] = [];
  const scripts: ScriptBlock[] = [];
  const styleRanges: [number, number][] = [];

  tokens.forEach((token, i) => {
    if (token.type === "front_matter" && token.meta) {
      const frontMatter = MetadataSchema.parse(yaml.load(token.meta));
      Object.assign(metadata, frontMatter);
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
      if (id.includes(".")) {
        throw new Error(`Chapter or scene id must not contain "." to avoid ambiguity: ${id}`);
      }

      {
        let chapterId = null;
        const chapterIdSet = new Set<string>();
        const fullSceneIdSet = new Set<string>();

        for (const heading of headings) {
          if (heading.tag === "h2") {
            if (chapterIdSet.has(heading.id)) {
              throw new Error(`Duplicated chapter id found: ${heading.id}`);
            }
            chapterId = heading.id;
            chapterIdSet.add(chapterId);
          } else if (heading.tag === "h3") {
            const fullSceneId = `${chapterId ?? ""}.${heading.id}`;
            if (fullSceneIdSet.has(fullSceneId)) {
              throw new Error(`Duplicated scene id found: ${fullSceneId}`);
            }
            fullSceneIdSet.add(fullSceneId);
          }
        }
      }

      headings.push({ tag: token.tag as "h1" | "h2" | "h3", id, title, lineno: token.map[0] });
    } else if (token.type === "html_block" && token.map) {
      let match;
      if ((match = /^[\s]*<script>(.*)<\/script>[\s]*$/s.exec(token.content))) {
        const script = match[1].trim();
        if (script) {
          scripts.push({ from: token.map[0], to: token.map[1], content: script });
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

  const storyHeading = headings.find((h) => h.tag === "h1");
  const chapterHeadings = headings.filter((h) => h.tag === "h2");
  const sceneHeadings = headings.filter((h) => h.tag === "h3");

  // Collect all script ranges and style ranges into a set for filtering
  const ignoredLines = new Set<number>();
  for (const [from, to] of [...scripts.map(({ from, to }) => [from, to] as [number, number]), ...styleRanges]) {
    for (let i = from; i < to; i++) ignoredLines.add(i);
  }

  const lines = source.split("\n");
  const storyEnd = chapterHeadings[0]?.lineno ?? sceneHeadings[0]?.lineno ?? lines.length;

  // Orphan h3s before the first h2 get a default chapter
  const firstChapterLine = chapterHeadings[0]?.lineno ?? Infinity;
  const defaultScenes = sceneHeadings.filter((sh) => sh.lineno < firstChapterLine);

  // Build all chapters (default first, then parsed ones)
  const chapters: Chapter[] = [];
  let chapterOrder: Heading[] = [];

  if (defaultScenes.length > 0) {
    const scenes: Scene[] = [];
    let entryScene: string | null = null;

    for (let si = 0; si < defaultScenes.length; si++) {
      const sh = defaultScenes[si];
      const seEnd = defaultScenes[si + 1]?.lineno ?? firstChapterLine;
      const scScript = getScriptInScope(scripts, sh.lineno, seEnd, `scene "${sh.id}"`);
      const scHooks = await parseScript(scScript, SceneHooksSchema);

      const templateStart = sh.title ? sh.lineno : sh.lineno + 1;
      const template = lines
        .slice(templateStart, seEnd)
        .filter((_, i) => !ignoredLines.has(templateStart + i))
        .join("\n")
        .replace(/^\n+/, "");

      scenes.push(new Scene({ id: sh.id, title: sh.title, template, hooks: scHooks }));
      if (entryScene === null) {
        entryScene = sh.id;
      }
    }

    chapters.push(
      new Chapter({
        id: DEFAULT_CHAPTER,
        title: "",
        scenes,
      }),
    );
  }

  for (let ci = 0; ci < chapterHeadings.length; ci++) {
    const ch = chapterHeadings[ci];
    const chEnd = chapterHeadings[ci + 1]?.lineno ?? lines.length;
    const chapterScenes = sceneHeadings.filter((sh) => sh.lineno > ch.lineno && sh.lineno < chEnd);
    // Chapter script ends before the first scene heading
    const chScriptEnd = chapterScenes[0]?.lineno ?? chEnd;
    const chScript = getScriptInScope(scripts, ch.lineno, chScriptEnd, `chapter "${ch.id}"`);
    const chHooks = await parseScript(chScript, ChapterHooksSchema);
    const scenes: Scene[] = [];
    let entryScene: string | null = null;

    for (let si = 0; si < chapterScenes.length; si++) {
      const sh = chapterScenes[si];
      const seEnd = chapterScenes[si + 1]?.lineno ?? chEnd;
      const scScript = getScriptInScope(scripts, sh.lineno, seEnd, `scene "${sh.id}"`);
      const scHooks = await parseScript(scScript, SceneHooksSchema);

      const templateStart = sh.title ? sh.lineno : sh.lineno + 1;
      const template = lines
        .slice(templateStart, seEnd)
        .filter((_, i) => !ignoredLines.has(templateStart + i))
        .join("\n")
        .replace(/^\n+/, "");

      scenes.push(new Scene({ id: sh.id, title: sh.title, template, hooks: scHooks }));
      if (entryScene === null) {
        entryScene = sh.id;
      }
    }

    chapters.push(
      new Chapter({
        id: ch.id,
        title: ch.title,
        hooks: chHooks,
        scenes,
      }),
    );
    chapterOrder.push(ch);
  }

  const storyScript = getScriptInScope(scripts, storyHeading?.lineno ?? 0, storyEnd, "story");
  const storyHooks = await parseScript(storyScript, StoryHooksSchema);

  return {
    metadata,
    title: storyHeading?.title,
    chapters,
    hooks: storyHooks,
    stylesheet,
  };
}

function getScriptInScope(scripts: ScriptBlock[], from: number, to: number, scope: string): string {
  const scopedScripts = scripts.filter((script) => script.from >= from && script.to <= to);
  if (scopedScripts.length > 1) {
    throw new Error(`More than one script block found in ${scope}`);
  }
  return scopedScripts[0]?.content ?? "";
}
