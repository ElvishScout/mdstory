import { createRequire } from "module";
import { fromPath } from "../../index.js";
import type { Section } from "../../core/section.js";

const require = createRequire(import.meta.url);
const { wordsCount } = require("words-count") as { wordsCount: (text: string) => number };

export interface OverviewOptions {
  /** Show cumulative word counts. Default: false. */
  words?: boolean;
  /** Show explicit `#id` suffixes. Default: false. */
  ids?: boolean;
  /** Maximum tree depth (1-based). Omit for unlimited. */
  depth?: number;
}

/** Count words in text after stripping Handlebars templates. */
function countWords(text: string): number {
  const cleanText = text.replace(/\{\{\{.*?\}\}\}/g, "").replace(/\{\{.*?\}\}/g, "");
  return wordsCount(cleanText);
}

/**
 * Compute cumulative word counts for every section in a single bottom-up pass.
 * Returns a map from Section → cumulative word count.
 */
function computeWordCounts(root: Section): WeakMap<Section, number> {
  const counts = new WeakMap<Section, number>();

  function walk(section: Section): number {
    let count = countWords(section.template);
    for (const child of section.children) {
      count += walk(child);
    }
    counts.set(section, count);
    return count;
  }

  walk(root);
  return counts;
}

/** Format a word count for display. */
function formatWordCount(count: number): string {
  return count.toLocaleString();
}

export async function overviewCommand(storyPath: string, options: OverviewOptions = {}): Promise<void> {
  const showWords = options.words ?? false;
  const showIds = options.ids ?? false;
  const maxDepth = options.depth;

  const story = await fromPath(storyPath);

  // Compute all word counts once
  const wordCounts = showWords ? computeWordCounts(story.root) : null;

  // Print story title (with total word count if enabled)
  if (wordCounts) {
    const total = wordCounts.get(story.root)!;
    console.log(`${story.title || storyPath}  —  ${formatWordCount(total)} words`);
  } else {
    console.log(story.title || storyPath);
  }

  // Print children recursively (skip root — it's an auto-generated container).
  // maxDepth === 0 means show nothing below the story title.
  if (maxDepth === undefined || maxDepth > 0) {
    for (let i = 0; i < story.root.children.length; i++) {
      const isLast = i === story.root.children.length - 1;
      printTree(story.root.children[i], "", isLast, showIds, wordCounts, maxDepth, 1);
    }
  }
}

function printTree(
  section: Section,
  prefix: string,
  isLast: boolean,
  showIds: boolean,
  wordCounts: WeakMap<Section, number> | null,
  maxDepth: number | undefined,
  depth: number,
): void {
  const connector = isLast ? "└── " : "├── ";
  const wordCount = wordCounts?.get(section);
  console.log(prefix + connector + formatLabel(section, showIds, wordCount));

  // Stop recursing if we've reached the depth limit
  if (maxDepth !== undefined && depth >= maxDepth) {
    return;
  }

  const childPrefix = prefix + (isLast ? "    " : "│   ");
  for (let i = 0; i < section.children.length; i++) {
    const childIsLast = i === section.children.length - 1;
    printTree(section.children[i], childPrefix, childIsLast, showIds, wordCounts, maxDepth, depth + 1);
  }
}

/**
 * Formats a section label for tree display.
 *
 * With `showIds: true`:
 *   - Explicit `{#id}`  →  `Title #id`
 *   - Title-used-as-id  →  `Title`
 *   - Auto-generated    →  `#id`
 *
 * With `showIds: false`:
 *   - Always just the title (or `#id` for auto-generated).
 *
 * Word count is appended when `wordCount` is provided.
 */
function formatLabel(section: Section, showIds: boolean, wordCount?: number): string {
  const { title, id } = section;

  let label: string;
  if (!title) {
    label = `#${id}`;
  } else if (!showIds || id === title) {
    label = title;
  } else {
    label = `${title} #${id}`;
  }

  if (wordCount !== undefined) {
    label += `  —  ${formatWordCount(wordCount)} words`;
  }

  return label;
}
