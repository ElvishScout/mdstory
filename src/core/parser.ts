import yaml from "js-yaml";
import MarkdownIt from "markdown-it";
import pluginFrontMatter from "markdown-it-front-matter";
import pluginAttrs from "markdown-it-attrs";
import { nanoid } from "nanoid";

import {
  MetadataSchema,
  DEFAULT_CHAPTER,
  Metadata,
  SceneHooksSchema,
  ChapterHooksSchema,
  StoryHooksSchema,
} from "./definitions.js";
import { getScriptModuleId, loadSource, normalizePath, parseScript } from "./utils.js";

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
  script: string;
};

export type ParsedChapter = {
  id: string | typeof DEFAULT_CHAPTER;
  title: string;
  template: string;
  script: string;
  scenes: ParsedScene[];
};

export type ParsedStory = {
  metadata: Metadata;
  title: string;
  template: string;
  chapters: ParsedChapter[];
  stylesheet: string;
  script: string;
  debug?: boolean;
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
      const id = token.attrs?.find(([key]) => key === "id")?.[1] || nanoid();
      if (id.includes(".")) {
        throw new Error(`Chapter or scene id must not contain "." to avoid ambiguity: ${id}`);
      }

      let title = "";
      const nextToken = tokens[i + 1];
      if (nextToken && nextToken.type === "inline") {
        const content = nextToken.content.trim();
        title = content.replace(/(\s*\{[^{}]*\})+$/, "").trim();
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
      const scScript = getScriptInScope(scripts, sh.lineno, seEnd, `scene "${sh.id}"`);
      await parseScript(scScript, SceneHooksSchema, getScriptModuleId(DEFAULT_CHAPTER, sh.id));

      const templateStart = sh.title ? sh.lineno : sh.lineno + 1;
      const template = lines
        .slice(templateStart, seEnd)
        .filter((_, i) => !ignoredLines.has(templateStart + i))
        .join("\n")
        .replace(/^\n+/, "");

      scenes.push({ id: sh.id, title: sh.title, template, script: scScript });
      if (entryScene === null) {
        entryScene = sh.id;
      }
    }

    chapters.push({
      id: DEFAULT_CHAPTER,
      title: "",
      template: "",
      script: "",
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
    const chScript = getScriptInScope(scripts, ch.lineno, chScriptEnd, `chapter "${ch.id}"`);
    await parseScript(chScript, ChapterHooksSchema, getScriptModuleId(ch.id));

    const scenes: ParsedScene[] = [];
    let entryScene: string | null = null;

    for (let si = 0; si < chapterScenes.length; si++) {
      const sh = chapterScenes[si];
      const seEnd = chapterScenes[si + 1]?.lineno ?? chEnd;
      const scScript = getScriptInScope(scripts, sh.lineno, seEnd, `scene "${sh.id}"`);
      await parseScript(scScript, SceneHooksSchema, getScriptModuleId(ch.id, sh.id));

      const templateStart = sh.title ? sh.lineno : sh.lineno + 1;
      const template = lines
        .slice(templateStart, seEnd)
        .filter((_, i) => !ignoredLines.has(templateStart + i))
        .join("\n")
        .replace(/^\n+/, "");

      scenes.push({ id: sh.id, title: sh.title, template, script: scScript });
      if (entryScene === null) {
        entryScene = sh.id;
      }
    }

    chapters.push({
      id: ch.id,
      title: ch.title,
      template: chTemplate,
      script: chScript,
      scenes,
    });
    chapterOrder.push(ch);
  }

  const storyScript = getScriptInScope(scripts, storyHeading?.lineno ?? 0, storyEnd, "story");
  await parseScript(storyScript, StoryHooksSchema, getScriptModuleId());

  return {
    metadata,
    title: storyHeading?.title ?? "",
    template: storyTemplate,
    chapters,
    stylesheet,
    script: storyScript,
  };
}

function getScriptInScope(scripts: ScriptBlock[], from: number, to: number, scope: string): string {
  const scopedScripts = scripts.filter((script) => script.from >= from && script.to <= to);
  if (scopedScripts.length > 1) {
    throw new Error(`More than one script block found in ${scope}`);
  }
  return scopedScripts[0]?.content ?? "";
}
