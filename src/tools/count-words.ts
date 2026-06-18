import { createRequire } from "module";
import { Story } from "../index.js";

const require = createRequire(import.meta.url);
const { wordsCount } = require("words-count");

function countWords(text: string) {
  const cleanText = text.replace(/\{\{\{.*?\}\}\}/g, "").replace(/\{\{.*?\}\}/g, "");
  return wordsCount(cleanText) as number;
}

async function main() {
  const entryPath = process.argv[2];
  const story = await Story.fromPath(entryPath);

  let count = 0;
  count += countWords(story.title);
  for (const chapter of Object.values(story.chapters)) {
    count += countWords(chapter.title);
    for (const scene of Object.values(chapter.scenes)) {
      count += countWords(scene.template);
    }
  }

  console.log("Total words:", count);
}

main();
