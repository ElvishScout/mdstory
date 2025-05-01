import yaml from "js-yaml";
import MarkdownIt from "markdown-it";
import pluginFrontMatter from "markdown-it-front-matter";
import pluginAttrs from "markdown-it-attrs";

import { StoryBody, ChapterBody, MetadataSchema } from "./definitions.js";
import { DuplicateIdError, EmptyChapterIdError, InvalidMetadataError } from "./error.js";

export const parseStorySource = (source: string): StoryBody => {
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

  const chapterEntries = divisions.map(({ id, title, lineno, script }, i): [string, ChapterBody] => {
    const template = lines
      .slice(lineno, divisions[i + 1]?.lineno)
      .filter((line): line is string => line !== null)
      .join("\n");
    return [id, { title, template, script }];
  });

  const chapters = Object.fromEntries(chapterEntries);
  const entry = chapterEntries[0]?.[0] || null;

  return {
    metadata,
    chapters,
    entry,
    script: storyScript,
    stylesheet,
  };
};
