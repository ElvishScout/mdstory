import readline from "node:readline";
import { input, confirm as confirmPrompt, number, select } from "@inquirer/prompts";
import type MarkdownIt from "markdown-it";
import type { StoryPrompt, Scope } from "../../index.js";
import { fromPath } from "../../index.js";
import { createMarkdownRenderer } from "../markdown.js";
import { GameMenu } from "../menu.js";

export interface PlayOptions {
  debug?: boolean;
}

/** The currently active AbortController, if a prompt is in progress. */
let activeController: AbortController | null = null;

function createPrompt(md: MarkdownIt): StoryPrompt {
  return async ({ text, inputs: fields, navs }) => {
    console.log(md.render(text).trim());
    console.log();

    let inputReplies: Record<string, unknown> = {};
    let targetReplies: { target: string | null | undefined };

    try {
      const controller = new AbortController();
      activeController = controller;

      // Dynamic multi-field prompts — loop sequentially.
      if (fields.length) {
        for (const { name, type, value } of fields) {
          if (type === "number") {
            inputReplies[name] = await number({ message: name, default: Number(value) }, { signal: controller.signal });
          } else if (type === "boolean") {
            inputReplies[name] = await confirmPrompt(
              { message: name, default: Boolean(value) },
              { signal: controller.signal },
            );
          } else {
            inputReplies[name] = await input({ message: name, default: String(value) }, { signal: controller.signal });
          }
        }
      }

      if (navs.length) {
        targetReplies = {
          target: await select(
            {
              message: "Choose target",
              choices: navs.map(({ text: name, target: value }) => ({ name, value })),
            },
            { signal: controller.signal },
          ),
        };
      } else {
        targetReplies = { target: undefined };
      }
    } finally {
      activeController = null;
    }

    const target = targetReplies.target;
    const inputs = Object.fromEntries(fields.map(({ name }) => [name, inputReplies[name]])) as Scope;

    return { type: "continue" as const, data: { target, inputs } };
  };
}

export async function playCommand(storyPath: string, options: PlayOptions): Promise<void> {
  const story = await fromPath(storyPath);
  const md = createMarkdownRenderer();
  const session = story.session();
  const menu = new GameMenu(session);

  const prompt = createPrompt(md);

  // Monitor ESC key to cancel the active inquirer prompt.
  if (process.stdin.isTTY) {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.on("keypress", (_str, key) => {
      if (key?.name === "escape" && activeController) {
        // Pause stdin before aborting so the internal readline cleanup
        // doesn't leave a stale flowing stream competing with the next prompt.
        process.stdin.pause();
        activeController.abort();
        activeController = null;
      }
    });
  }

  // Outer loop — restarts the session when the player loads a save.
  while (true) {
    let restart = false;

    const wrappedPrompt: StoryPrompt = async (props) => {
      while (true) {
        try {
          return await prompt(props);
        } catch (err) {
          if (err instanceof Error && err.name === "AbortPromptError") {
            // @inquirer/prompts internal readline cleanup may still be
            // in-flight when the AbortPromptError is caught. Deferring by
            // one event-loop tick lets rl.close() / setRawMode(false) finish,
            // then we resume stdin for the next prompt.
            await new Promise((r) => setImmediate(r));
            process.stdin.resume();
            const action = await menu.prompt();
            restart = await menu.handle(action);
            if (restart) {
              return { type: "end" };
            }
            continue;
          }
          throw err;
        }
      }
    };

    await session.play(wrappedPrompt, { adapter: "markdown", debug: options.debug });

    if (!restart) {
      break;
    }
  }
}
