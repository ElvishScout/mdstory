import yaml from "js-yaml";
import MarkdownIt from "markdown-it";
import pluginFrontMatter from "markdown-it-front-matter";
import pluginAttrs from "markdown-it-attrs";

import { MetadataSchema, SectionHooksSchema } from "./schema.js";
import type { Metadata } from "./definitions.js";
import { loadSource, mergeScripts, normalizePath, StableIdGenerator } from "../utils/index.js";

interface Heading {
  depth: number;
  id: string;
  title: string;
  lineno: number;
}
interface ScriptBlock {
  from: number;
  to: number;
  content: string;
}
interface StyleBlock {
  from: number;
  to: number;
  content: string;
}

export type IncludeResolver = (path: string) => string | Promise<string>;
export interface ParseStoryOptions {
  base: string;
  resolveInclude: IncludeResolver;
}

/** A parsed section node — recursive, mirrors the heading hierarchy. */
export interface ParsedSection {
  id: string;
  title: string;
  template: string;
  stylesheets: string[];
  scripts: string[];
  children: ParsedSection[];
}

/** Top-level parse result. */
export interface ParsedStory {
  metadata: Metadata;
  root: ParsedSection;
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

    const includedSource = await options.resolveInclude(normalizedPath);
    expanded.push(
      await expandIncludes(includedSource, { ...options, base: normalizedPath }, [...stack, normalizedPath]),
    );
  }

  return expanded.join("\n");
}

export async function resolveParseOptions(options?: Partial<ParseStoryOptions>): Promise<ParseStoryOptions> {
  return {
    base: options?.base ?? (await normalizePath("./")),
    resolveInclude: options?.resolveInclude ?? ((path) => loadSource(path)),
  };
}

/** Recursively validates scripts in a ParsedSection tree after placeholder IDs are replaced. */
async function validateScripts(section: ParsedSection, parentPath?: string[]): Promise<void> {
  const path = parentPath ? [...parentPath, section.id] : undefined;
  if (section.scripts.length) {
    SectionHooksSchema.parse(await mergeScripts(section.scripts, path));
  }
  for (const child of section.children) {
    await validateScripts(child, parentPath ? [...parentPath, section.id] : [section.id]);
  }
}

/** Validates that every full-path (dot-joined ancestor → descendant) is unique. */
function validatePaths(section: ParsedSection, parentPath: string, seen: Set<string>): void {
  const fullPath = parentPath ? `${parentPath}.${section.id}` : section.id;
  if (seen.has(fullPath)) {
    throw new Error(`Duplicated section path found: ${fullPath}`);
  }
  seen.add(fullPath);
  for (const child of section.children) {
    validatePaths(child, fullPath, seen);
  }
}

/**
 * Parses a Markdown-formatted story source into a recursive Section tree.
 *
 * Heading levels map to nesting depth:
 * - h1 → depth 1 (child of root)
 * - h2 → depth 2 (child of h1)
 * - h3 → depth 3 (child of h2)
 * - ... and so on (h4/h5/h6 supported)
 *
 * Content before the first h1 belongs to the root section.
 */
export async function parseStorySource(source: string, options?: Partial<ParseStoryOptions>): Promise<ParsedStory> {
  const parseOptions = await resolveParseOptions(options);

  const PLACEHOLDER_PREFIX = "PLACEHOLDER_";
  const idGenerator = new StableIdGenerator();
  let placeholderIndex = 0;

  source = await expandIncludes(source, parseOptions);
  source = source.replace(/^﻿/, "").replace(/\r\n?/g, "\n");

  const md = new MarkdownIt({ html: true }).use(pluginAttrs).use(pluginFrontMatter, () => {});
  const tokens = md.parse(source, {});

  let metadata = MetadataSchema.parse({});

  const headings: Heading[] = [];
  const scripts: ScriptBlock[] = [];
  const styleBlocks: StyleBlock[] = [];
  const frontMatterRanges: [number, number][] = [];

  // ── Pass 1: collect tokens ──────────────────────────────────────────────
  tokens.forEach((token, i) => {
    if (token.type === "front_matter" && token.meta) {
      const frontMatter = MetadataSchema.parse(yaml.load(token.meta));
      Object.assign(metadata, frontMatter);
      if (token.map) {
        frontMatterRanges.push([token.map[0], token.map[1]]);
      }
    } else if (token.type === "heading_open" && /^h[1-6]$/.test(token.tag) && token.level === 0 && token.map) {
      const depth = parseInt(token.tag.charAt(1), 10);
      let id = token.attrGet("id");
      let title = "";
      const nextToken = tokens[i + 1];
      if (nextToken && nextToken.type === "inline") {
        const content = nextToken.content.trim();
        title = content.replace(/(\s*\{[^{}]*\})+$/, "").trim();
        if (!id) {
          id = title;
        }
      }

      if (id) {
        if (id.includes(".")) {
          throw new Error(`Section id must not contain "." to avoid ambiguity: ${id}`);
        }
        idGenerator.reserve(id);
      } else {
        id = `${PLACEHOLDER_PREFIX}${placeholderIndex++}`;
      }

      headings.push({ depth, id, title, lineno: token.map[0] });
    } else if (token.type === "html_block" && token.map) {
      const matchScript = /^[\s]*<script>(.*)<\/script>[\s]*$/s.exec(token.content);
      if (matchScript) {
        const content = matchScript[1].trim();
        if (content) {
          scripts.push({ from: token.map[0], to: token.map[1], content });
        }
      } else {
        const matchStyle = /^[\s]*<style>(.*)<\/style>[\s]*$/s.exec(token.content);
        if (matchStyle) {
          const content = matchStyle[1].trim();
          if (content) {
            styleBlocks.push({ from: token.map[0], to: token.map[1], content });
          }
        }
      }
    }
  });

  // Filter out headings that fall within frontmatter ranges
  // (markdown-it may still tokenize frontmatter content as setext headings)
  const filteredHeadings = headings.filter((h) => {
    return !frontMatterRanges.some(([from, to]) => h.lineno >= from && h.lineno < to);
  });

  // ── Pass 2: build heading tree ───────────────────────────────────────────
  type HeadingNode = { heading: Heading; children: HeadingNode[] };

  const rootChildren: HeadingNode[] = [];
  const stack: { depth: number; node: HeadingNode }[] = [];

  for (const heading of filteredHeadings) {
    // Pop until we find a parent (stack top has depth < heading.depth)
    while (stack.length && stack[stack.length - 1].depth >= heading.depth) {
      stack.pop();
    }

    const node: HeadingNode = { heading, children: [] };

    if (!stack.length) {
      rootChildren.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ depth: heading.depth, node });
  }

  // ── Pass 3: build ParsedSection tree ──────────────────────────────────────
  // Compute ignored line set (scripts + styles + frontmatter)
  const ignoredLines = new Set<number>();
  for (const [from, to] of [
    ...scripts.map(({ from, to }) => [from, to] as [number, number]),
    ...styleBlocks.map(({ from, to }) => [from, to] as [number, number]),
    ...frontMatterRanges,
  ]) {
    for (let i = from; i < to; i++) {
      ignoredLines.add(i);
    }
  }

  const lines = source.split("\n");

  async function buildSection(
    heading: Heading,
    childNodes: HeadingNode[],
    parentPath: string[],
  ): Promise<ParsedSection> {
    const path = [...parentPath, heading.id];

    // Compute template end line:
    // - If this section has children, end at the first child's heading line
    // - Otherwise, find the next heading at same or higher level
    let endLine: number;
    if (childNodes.length) {
      endLine = childNodes[0].heading.lineno;
    } else {
      // Find the next heading after this one with depth <= this depth
      const nextSibling = filteredHeadings.find((h) => h.lineno > heading.lineno && h.depth <= heading.depth);
      endLine = nextSibling ? nextSibling.lineno : lines.length;
    }

    const templateStart = heading.title ? heading.lineno : heading.lineno + 1;
    const template = lines
      .slice(templateStart, endLine)
      .filter((_, i) => !ignoredLines.has(templateStart + i))
      .join("\n")
      .replace(/^\n+/, "");

    // Scope scripts and styles to this section
    const sectionScripts = getBlocksInScope(scripts, heading.lineno, endLine);
    const sectionStyles = getBlocksInScope(styleBlocks, heading.lineno, endLine);

    // Build children recursively
    const children = await Promise.all(
      childNodes.map(({ heading: childHeading, children: grandChildren }) =>
        buildSection(childHeading, grandChildren, path),
      ),
    );

    return {
      id: heading.id,
      title: heading.title,
      template,
      stylesheets: sectionStyles,
      scripts: sectionScripts,
      children,
    };
  }

  // ── Root section ──────────────────────────────────────────────────────────
  const firstHeadingLine = filteredHeadings.length ? filteredHeadings[0].lineno : lines.length;
  const rootTemplateStart = 0;
  const rootTemplate = lines
    .slice(rootTemplateStart, firstHeadingLine)
    .filter((_, i) => !ignoredLines.has(rootTemplateStart + i))
    .join("\n")
    .replace(/^\n+/, "");

  const rootScripts = getBlocksInScope(scripts, 0, firstHeadingLine);
  const rootStyles = getBlocksInScope(styleBlocks, 0, firstHeadingLine);

  const rootChildren2 = await Promise.all(
    rootChildren.map(({ heading, children }) => buildSection(heading, children, [])),
  );

  // ── Pass 4: replace placeholder IDs ──────────────────────────────────────
  function replacePlaceholderIds(section: ParsedSection): void {
    if (section.id.startsWith(PLACEHOLDER_PREFIX)) {
      section.id = idGenerator.next();
    }
    for (const child of section.children) {
      replacePlaceholderIds(child);
    }
  }

  const root: ParsedSection = {
    id: idGenerator.next(),
    title: "",
    template: rootTemplate,
    stylesheets: rootStyles,
    scripts: rootScripts,
    children: rootChildren2,
  };
  replacePlaceholderIds(root);

  // Validate scripts with replaced IDs (matching Section.fromParsed paths)
  await validateScripts(root);

  // ── Pass 5: validate full-path uniqueness ──────────────────────────────────
  validatePaths(root, "", new Set());

  return { metadata, root };
}

function getBlocksInScope(
  blocks: { from: number; to: number; content: string }[],
  scopeStart: number,
  scopeEnd: number,
): string[] {
  return blocks.filter((block) => block.from >= scopeStart && block.to <= scopeEnd).map((block) => block.content);
}
