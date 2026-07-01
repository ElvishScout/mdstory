import yaml from "js-yaml";
import MarkdownIt from "markdown-it";
import pluginFrontMatter from "markdown-it-front-matter";
import pluginAttrs from "markdown-it-attrs";
import { nanoid } from "nanoid";

import { MetadataSchema, SceneHooksSchema, ChapterHooksSchema, StoryHooksSchema } from "./schema.js";
import { DEFAULT_CHAPTER } from "./definitions.js";
import type { Metadata } from "./definitions.js";
import { loadSource, mergeScripts, normalizePath } from "./utils.js";

type Heading = { tag: "h1" | "h2" | "h3"; id: string; title: string; lineno: number };
type ScriptBlock = { from: number; to: number; content: string };

export type IncludeResolver = (path: string) => string | Promise<string>;
export type ParseStoryOptions = {
  base: string;
  resolveInclude: IncludeResolver;
};

export type ParsedScene = {
  id: string;
  title: string;
  template: string;
  scripts: string[];
};

export type ParsedChapter = {
  id: string | typeof DEFAULT_CHAPTER;
  title: string;
  template: string;
  scripts: string[];
  scenes: ParsedScene[];
};

export type ParsedStory = {
  metadata: Metadata;
  title: string;
  template: string;
  chapters: ParsedChapter[];
  stylesheet: string;
  scripts: string[];
};

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

export async function resolveParseOptions(options?: Partial<ParseStoryOptions>): Promise<ParseStoryOptions> {
  return {
    base: options?.base ?? (await normalizePath("./")),
    resolveInclude: options?.resolveInclude ?? ((path) => loadSource(path)),
  };
}

/**
 * Parses a Markdown-formatted story source string into a structured StoryInit.
 *
 * Document structure:
 * - `#` (h1): Optional story title — its `<script>` is story hooks
 * - `##` (h2): Chapters — with chapter hooks, contain scenes
 * - `###` (h3): Scenes — with scene hooks and Handlebars templates
 */
export async function parseStorySource(source: string, options?: Partial<ParseStoryOptions>): Promise<ParsedStory> {
  const parseOptions = await resolveParseOptions(options);
  source = await expandIncludes(source, parseOptions);
  source = source.replace(/\r\n?/g, "\n");

  const md = new MarkdownIt({ html: true }).use(pluginAttrs).use(pluginFrontMatter, () => {});
  const tokens = md.parse(source, {});

  let metadata = MetadataSchema.parse({});
  let stylesheet = "";

  const headings: Heading[] = [];
  const scripts: ScriptBlock[] = [];
  const styleRanges: [number, number][] = [];
  const frontMatterRanges: [number, number][] = [];

  // Track seen IDs across all headings so duplicates are caught immediately.
  // The chapter-id state is scoped tightly — it is only valid during the token
  // pass below and must not be read after the forEach completes.
  {
    let chapterId: string | null = null;
    const chapterIdSet = new Set<string>();
    const fullSceneIdSet = new Set<string>();

    tokens.forEach((token, i) => {
      if (token.type === "front_matter" && token.meta) {
        const frontMatter = MetadataSchema.parse(yaml.load(token.meta));
        Object.assign(metadata, frontMatter);
        if (token.map) {
          frontMatterRanges.push([token.map[0], token.map[1]]);
        }
      } else if (
        token.type === "heading_open" &&
        ["h1", "h2", "h3"].includes(token.tag) &&
        token.level === 0 &&
        token.map
      ) {
        let id = token.attrGet("id");
        let title = "";
        const nextToken = tokens[i + 1];
        if (nextToken && nextToken.type === "inline") {
          const content = nextToken.content.trim();
          title = content.replace(/(\s*\{[^{}]*\})+$/, "").trim();
          id ||= title;
        }

        id ||= nanoid();
        if (id.includes(".")) {
          throw new Error(`Chapter or scene id must not contain "." to avoid ambiguity: ${id}`);
        }

        if (token.tag === "h2") {
          if (chapterIdSet.has(id)) {
            throw new Error(`Duplicated chapter id found: ${id}`);
          }
          chapterId = id;
          chapterIdSet.add(id);
        } else if (token.tag === "h3") {
          const fullSceneId = `${chapterId ?? ""}.${id}`;
          if (fullSceneIdSet.has(fullSceneId)) {
            throw new Error(`Duplicated scene id found: ${fullSceneId}`);
          }
          fullSceneIdSet.add(fullSceneId);
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
  }

  const storyHeading = headings.find((h) => h.tag === "h1");
  const chapterHeadings = headings.filter((h) => h.tag === "h2");
  const sceneHeadings = headings.filter((h) => h.tag === "h3");

  // Collect all script ranges and style ranges into a set for filtering
  const ignoredLines = new Set<number>();
  for (const [from, to] of [
    ...scripts.map(({ from, to }) => [from, to] as [number, number]),
    ...styleRanges,
    ...frontMatterRanges,
  ]) {
    for (let i = from; i < to; i++) ignoredLines.add(i);
  }

  const lines = source.split("\n");
  const storyEnd = chapterHeadings[0]?.lineno ?? sceneHeadings[0]?.lineno ?? lines.length;

  // Story template from h1 heading to the first h2 or h3 (whichever comes first)
  const storyTemplateEnd = Math.min(chapterHeadings[0]?.lineno ?? Infinity, sceneHeadings[0]?.lineno ?? Infinity);
  const storyTemplate = (() => {
    if (!isFinite(storyTemplateEnd)) return "";
    const start = storyHeading?.lineno ?? 0;
    return lines
      .slice(start, storyTemplateEnd)
      .filter((_, i) => !ignoredLines.has(start + i))
      .join("\n")
      .replace(/^\n+/, "");
  })();

  // Story scripts
  const storyScripts = getScriptsInScope(scripts, storyHeading?.lineno ?? 0, storyEnd);
  StoryHooksSchema.parse(await mergeScripts(storyScripts));

  // Orphan h3s before the first h2 get a default chapter
  const firstChapterLine = chapterHeadings[0]?.lineno ?? Infinity;
  const defaultScenes = sceneHeadings.filter((sh) => sh.lineno < firstChapterLine);

  // Build all chapters (default first, then parsed ones)
  const chapters: ParsedChapter[] = [];
  let chapterOrder: Heading[] = [];

  if (defaultScenes.length > 0) {
    const scenes: ParsedScene[] = [];
    let entryScene: string | null = null;

    for (let si = 0; si < defaultScenes.length; si++) {
      const sh = defaultScenes[si];
      const seEnd = defaultScenes[si + 1]?.lineno ?? firstChapterLine;
      const scScripts = getScriptsInScope(scripts, sh.lineno, seEnd);
      SceneHooksSchema.parse(await mergeScripts(scScripts, DEFAULT_CHAPTER, sh.id));

      const templateStart = sh.title ? sh.lineno : sh.lineno + 1;
      const template = lines
        .slice(templateStart, seEnd)
        .filter((_, i) => !ignoredLines.has(templateStart + i))
        .join("\n")
        .replace(/^\n+/, "");

      scenes.push({ id: sh.id, title: sh.title, template, scripts: scScripts });
      if (entryScene === null) {
        entryScene = sh.id;
      }
    }

    chapters.push({
      id: DEFAULT_CHAPTER,
      title: "",
      template: "",
      scripts: [],
      scenes,
    });
  }

  for (let ci = 0; ci < chapterHeadings.length; ci++) {
    const ch = chapterHeadings[ci];
    const chEnd = chapterHeadings[ci + 1]?.lineno ?? lines.length;
    const chapterScenes = sceneHeadings.filter((sh) => sh.lineno > ch.lineno && sh.lineno < chEnd);
    // Chapter script ends before the first scene heading
    const chScriptEnd = chapterScenes[0]?.lineno ?? chEnd;
    const chTemplateStart = ch.title ? ch.lineno : ch.lineno + 1;
    const chTemplate = lines
      .slice(chTemplateStart, chScriptEnd)
      .filter((_, i) => !ignoredLines.has(chTemplateStart + i))
      .join("\n")
      .replace(/^\n+/, "");
    const chScripts = getScriptsInScope(scripts, ch.lineno, chScriptEnd);
    ChapterHooksSchema.parse(await mergeScripts(chScripts, ch.id));

    const scenes: ParsedScene[] = [];
    let entryScene: string | null = null;

    for (let si = 0; si < chapterScenes.length; si++) {
      const sh = chapterScenes[si];
      const seEnd = chapterScenes[si + 1]?.lineno ?? chEnd;
      const scScripts = getScriptsInScope(scripts, sh.lineno, seEnd);
      SceneHooksSchema.parse(await mergeScripts(scScripts, ch.id, sh.id));

      const templateStart = sh.title ? sh.lineno : sh.lineno + 1;
      const template = lines
        .slice(templateStart, seEnd)
        .filter((_, i) => !ignoredLines.has(templateStart + i))
        .join("\n")
        .replace(/^\n+/, "");

      scenes.push({ id: sh.id, title: sh.title, template, scripts: scScripts });
      if (entryScene === null) {
        entryScene = sh.id;
      }
    }

    chapters.push({
      id: ch.id,
      title: ch.title,
      template: chTemplate,
      scripts: chScripts,
      scenes,
    });
    chapterOrder.push(ch);
  }

  return {
    metadata,
    title: storyHeading?.title ?? "",
    template: storyTemplate,
    chapters,
    stylesheet,
    scripts: storyScripts,
  };
}

function getScriptsInScope(scripts: ScriptBlock[], from: number, to: number) {
  const scopedScripts = scripts
    .filter((script) => script.from >= from && script.to <= to)
    .map((script) => script.content);
  return scopedScripts;
}
