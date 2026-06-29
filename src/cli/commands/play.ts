import { fromPath } from "../../index.js";
import { createMarkdownRenderer } from "../markdown.js";
import { createPrompt } from "../prompt.js";

export interface PlayOptions {
  debug?: boolean;
}

export async function playCommand(storyPath: string, options: PlayOptions): Promise<void> {
  const story = await fromPath(storyPath);
  const md = createMarkdownRenderer();
  const prompt = createPrompt(md);
  await story.play(prompt, { renderer: "markdown", debug: options.debug });
}
