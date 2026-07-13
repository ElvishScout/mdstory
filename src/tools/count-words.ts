import { createRequire } from "module";
import { fromPath, type Section } from "../index.js";

const require = createRequire(import.meta.url);
const { wordsCount } = require("words-count");

function countWords(text: string) {
  const cleanText = text.replace(/\{\{\{.*?\}\}\}/g, "").replace(/\{\{.*?\}\}/g, "");
  return wordsCount(cleanText) as number;
}

function countSectionWords(section: Section): number {
  let count = 0;
  count += countWords(section.template);
  for (const child of section.children) {
    count += countSectionWords(child);
  }
  return count;
}

async function main() {
  const entryPath = process.argv[2];
  const story = await fromPath(entryPath);

  const total = countSectionWords(story.root);
  console.log("Total words:", total);
}

main();
