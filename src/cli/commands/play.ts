import readline from "node:readline";
import inquirer from "inquirer";
import type MarkdownIt from "markdown-it";
import type { StoryPrompt, Scope } from "../../index.js";
import { fromPath } from "../../index.js";
import { createMarkdownRenderer } from "../markdown.js";

export interface PlayOptions {
  debug?: boolean;
}

/** The currently active inquirer runner, if a prompt is in progress. */
let activeRunner: { close(): void } | null = null;

function createPrompt(md: MarkdownIt): StoryPrompt {
  return async ({ text, inputs: fields, navs }) => {
    console.log(md.render(text).trim());
    console.log();

    let inputReplies: Record<string, unknown>;
    let targetReplies: { target: string | null | undefined };

    try {
      if (fields.length) {
        const promptObj = inquirer.prompt<Record<string, unknown>>(
          fields.map(({ name, type, value }) => {
            if (type === "number") {
              return { type: "number", name, message: name, default: Number(value) };
            } else if (type === "boolean") {
              return { type: "confirm", name, message: name, default: Boolean(value) };
            } else {
              return { type: "input", name, message: name, default: String(value) };
            }
          }),
        );
        activeRunner = promptObj.ui;
        inputReplies = await promptObj;
      }

      if (navs.length) {
        const promptObj = inquirer.prompt<{ target: string }>([
          {
            type: "select",
            name: "target",
            message: "Choose target",
            choices: navs.map(({ text, target }) => ({ name: text, value: target })),
          },
        ]);
        activeRunner = promptObj.ui;
        targetReplies = await promptObj;
      } else {
        targetReplies = { target: undefined };
      }
    } finally {
      activeRunner = null;
    }

    const target = targetReplies.target;
    const inputs = Object.fromEntries(fields.map(({ name }) => [name, inputReplies[name]])) as Scope;

    return { type: "continue" as const, data: { target, inputs } };
  };
}

export async function playCommand(storyPath: string, options: PlayOptions): Promise<void> {
  const story = await fromPath(storyPath);
  const md = createMarkdownRenderer();
  const prompt = createPrompt(md);

  const wrappedPrompt: StoryPrompt = async (props) => {
    while (true) {
      try {
        return await prompt(props);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortPromptError") {
          console.log("Show menu");
          // Show menu
        } else {
          throw err;
        }
      }
    }
  };

  // Monitor ESC key to cancel the active inquirer prompt.
  if (process.stdin.isTTY) {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.on("keypress", (_str, key) => {
      if (key?.name === "escape" && activeRunner) {
        activeRunner.close();
        activeRunner = null;
      }
    });
  }

  await story.play(wrappedPrompt, { adapter: "markdown", debug: options.debug });
}
