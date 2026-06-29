import { createRequire } from "module";
import { fromPath } from "../index.js";

const require = createRequire(import.meta.url);
const { wordsCount } = require("words-count");

function countWords(text: string) {
  const cleanText = text.replace(/\{\{\{.*?\}\}\}/g, "").replace(/\{\{.*?\}\}/g, "");
  return wordsCount(cleanText) as number;
}

async function main() {
  const entryPath = process.argv[2];
  const story = await fromPath(entryPath);

  let count = 0;
  count += countWords(story.template);
  for (const chapter of story.chapters) {
    count += countWords(chapter.template);
    for (const scene of chapter.scenes) {
      count += countWords(scene.template);
    }
  }

  console.log("Total words:", count);
}

main();
