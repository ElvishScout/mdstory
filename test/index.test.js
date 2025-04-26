import fs from "node:fs/promises";
import path from "node:path";
import inquirer from "inquirer";
import MarkdownIt from "markdown-it";
import pluginAttrs from "markdown-it-attrs";
import pluginTerminal from "markdown-it-terminal";

import { Story } from "../dist/index.js";

const STORY_PATH = path.resolve(import.meta.dirname, "story.md");

const md = new MarkdownIt().use(pluginAttrs).use(pluginTerminal);
const prompt = async ({ text, inputs, sets, navs }) => {
  console.log(md.render(text).trim());
  console.log();

  let inputReplies;
  let targetReplies;

  try {
    inputReplies = await inquirer.prompt(
      inputs.map(({ name, type, value }) => {
        if (type === "number") {
          return {
            type: "number",
            name,
            message: name,
            default: Number(value),
          };
        } else if (type === "boolean") {
          return {
            type: "confirm",
            name,
            message: name,
            default: Boolean(value),
          };
        } else if (type === "object") {
          return {
            type: "input",
            name,
            message: name,
            default: JSON.stringify(value),
          };
        } else {
          return {
            type: "input",
            name,
            message: name,
            default: String(value),
          };
        }
      })
    );
    targetReplies = await inquirer.prompt([
      {
        type: "list",
        name: "target",
        message: "Choose target",
        choices: navs.map(({ text, target }) => ({ name: text, value: target })),
      },
    ]);
  } catch (err) {
    if (err instanceof Error && err.name === "ExitPromptError") {
      process.exit(0);
    }
    throw err;
  }

  const { target } = targetReplies;
  const updates = Object.fromEntries([
    ...inputs.map(({ name, type }) => {
      const answer = inputReplies[name];
      const value = type === "object" ? JSON.parse(answer) : answer;
      return [name, value];
    }),
    ...sets.map(({ name, value }) => {
      return [name, value];
    }),
  ]);

  return { target, updates };
};

const main = async () => {
  const content = (await fs.readFile(STORY_PATH)).toString();
  const story = new Story(content);

  story.play(prompt, {
    format: "markdown",
  });
};

main();
