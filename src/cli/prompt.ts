import inquirer from "inquirer";
import type MarkdownIt from "markdown-it";
import type { StoryPrompt, Scope } from "../index.js";

export function createPrompt(md: MarkdownIt): StoryPrompt {
  return async ({ text, inputs: fields, navs }) => {
    console.log(md.render(text).trim());
    console.log();

    let inputReplies: Record<string, unknown>;
    let targetReplies: { target: string } | null;

    try {
      inputReplies = await inquirer.prompt(
        fields.map(({ name, type, value }) => {
          if (type === "number") {
            return { type: "number" as const, name, message: name, default: Number(value) };
          } else if (type === "boolean") {
            return { type: "confirm" as const, name, message: name, default: Boolean(value) };
          } else {
            return { type: "input" as const, name, message: name, default: String(value) };
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
    const inputs = Object.fromEntries(
      fields.map(({ name }) => [name, inputReplies[name]]),
    ) as Scope;

    return { target, inputs };
  };
}
