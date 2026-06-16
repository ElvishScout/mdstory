import fs from "node:fs/promises";
import inquirer from "inquirer";
import MarkdownIt from "markdown-it";
import pluginAttrs from "markdown-it-attrs";
import pluginTerminal from "markdown-it-terminal";
import pluginMark from "markdown-it-mark";

import { Story, StoryPrompt, Scope } from "../src/index";

const md = new MarkdownIt({ html: true }).use(pluginAttrs).use(pluginTerminal).use(pluginMark);

// markdown-it-terminal doesn't support the mark token from markdown-it-mark
md.renderer.rules.mark_open = () => "\x1b[7m";
md.renderer.rules.mark_close = () => "\x1b[27m";
const prompt: StoryPrompt = async ({ text, inputs, navs }) => {
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
        } else {
          return {
            type: "input",
            name,
            message: name,
            default: String(value),
          };
        }
      }),
    );

    if (navs.length) {
      targetReplies = await inquirer.prompt([
        {
          type: "list",
          name: "target",
          message: "Choose target",
          choices: navs.map(({ text, target }) => ({ name: text, value: target })),
        },
      ]);
    } else {
      targetReplies = null;
    }
  } catch (err) {
    if (err instanceof Error && err.name === "ExitPromptError") {
      process.exit(0);
    }
    throw err;
  }

  const { target } = targetReplies ?? { target: null };
  const updates = Object.fromEntries([
    ...inputs.map(({ name, type }) => {
      const answer = inputReplies[name];
      const value = answer;
      return [name, value];
    }),
  ]) as Scope;

  return { target, updates };
};

const main = async () => {
  const storyPath = process.argv[2];
  if (!storyPath) {
    return;
  }
  const content = (await fs.readFile(storyPath)).toString();
  const story = await Story.fromSource(content);

  story.play(prompt, {
    format: "markdown",
  });
};

main();
