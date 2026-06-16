import yaml from "js-yaml";
import MarkdownIt from "markdown-it";
import pluginFrontMatter from "markdown-it-front-matter";
import pluginAttrs from "markdown-it-attrs";

import { StoryInit, ChapterInit, MetadataSchema, StoryHooksSchema, ChapterHooksSchema } from "./definitions.js";
import { DuplicateIdError, EmptyChapterIdError, InvalidMetadataError } from "./error.js";

async function importScriptModule(script: string) {
  const uint8 = new TextEncoder().encode(script);
  const binary = String.fromCharCode(...uint8);
  const url = "data:text/javascript;base64," + btoa(binary);
  const module = await import(url);
  return module.default ?? {};
}

async function parseStoryScript(script: string) {
  return script.trim() ? StoryHooksSchema.parse(await importScriptModule(script)) : {};
}

async function parseChapterScript(script: string) {
  return script.trim() ? ChapterHooksSchema.parse(await importScriptModule(script)) : {};
}

/**
 * Parses a Markdown-formatted story source string into a structured StoryInit.
 * Supports YAML front-matter, level-one heading chapters, Handlebars templates,
 * `<script>` tags for hooks, and `<style>` tags for stylesheets.
 */
export async function parseStorySource(source: string): Promise<StoryInit> {
  type Division = { id: string; title: string; lineno: number; script: string };

  const md = new MarkdownIt({ html: true }).use(pluginAttrs).use(pluginFrontMatter, () => {});
  const tokens = md.parse(source, {});

  let metadata = MetadataSchema.parse({});
  let storyScript = "";
  let stylesheet = "";

  const ignoredRanges: [number, number][] = [];
  const divisions: Division[] = [];

  tokens.forEach((token, i) => {
    if (token.type === "front_matter" && token.meta) {
      try {
        const frontMatter = MetadataSchema.parse(yaml.load(token.meta));
        metadata = Object.assign(metadata, frontMatter);
      } catch {
        throw new InvalidMetadataError(token.meta);
      }
    } else if (token.type === "heading_open" && token.tag === "h1" && token.level === 0 && token.map) {
      const lineno = token.map[0];
      let id = token.attrs?.find(([key]) => key === "id")?.[1] ?? "";
      let title = "";
      const nextToken = tokens[i + 1];
      if (nextToken && nextToken.type === "inline") {
        const content = nextToken.content.trim();
        id ||= content;
        title = content;
      }
      if (!id) {
        throw new EmptyChapterIdError();
      }
      if (divisions.find(({ id: _id }) => id === _id)) {
        throw new DuplicateIdError(id);
      }
      divisions.push({ id, title, lineno, script: "" });
    } else if (token.type === "html_block" && token.map) {
      let regres;
      if ((regres = /^[\s]*<script>(.*)<\/script>[\s]*$/s.exec(token.content))) {
        const script = regres[1].trim();
        if (script) {
          if (divisions.length === 0) {
            storyScript = script;
          } else {
            divisions[divisions.length - 1].script = script;
          }
          ignoredRanges.push(token.map);
        }
      } else if ((regres = /^[\s]*<style>(.*)<\/style>[\s]*$/s.exec(token.content))) {
        const style = regres[1].trim();
        stylesheet += style;
        ignoredRanges.push(token.map);
      }
    }
  });

  const lines = source.split("\n").map((line, i) => {
    if (ignoredRanges.find(([from, to]) => i >= from && i < to)) {
      return null;
    }
    return line;
  });

  const chapters = Object.fromEntries(
    await Promise.all(
      divisions.map(async ({ id, title, lineno, script }, i): Promise<[string, ChapterInit]> => {
        const template = lines
          .slice(lineno, divisions[i + 1]?.lineno)
          .filter((line): line is string => line !== null)
          .join("\n");
        const hooks = await parseChapterScript(script);
        return [id, { title, template, hooks }];
      }),
    ),
  );
  const entry = divisions[0].id ?? null;

  const hooks = await parseStoryScript(storyScript);

  return {
    metadata,
    chapters,
    entry,
    hooks,
    stylesheet,
  };
}
