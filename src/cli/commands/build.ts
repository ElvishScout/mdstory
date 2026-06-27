import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import open, { apps } from "open";
import { parseStorySource, resolveParseOptions } from "../../index.js";

export interface BuildOptions {
  output?: string;
  open?: boolean;
  debug?: boolean;
}

export async function buildCommand(storyPath: string, options: BuildOptions): Promise<void> {
  // Parse the story to a serializable structure
  const resolvedPath = path.resolve(storyPath);
  const parseOptions = await resolveParseOptions({ base: resolvedPath });
  const source = await readFile(resolvedPath, "utf-8");
  const parsedStory = await parseStorySource(source, parseOptions);

  if (options.debug) {
    parsedStory.debug = true;
  }

  // Read the pre-built HTML template (from html-template workspace)
  const cliDir = path.dirname(fileURLToPath(import.meta.url));
  const templatePath = path.resolve(cliDir, "../../../html-template/dist/index.html");
  const template = await readFile(templatePath, "utf-8");

  // Inject the parsed story JSON into the template
  const html = template.replace('"__PARSED_STORY__"', JSON.stringify(parsedStory));

  // Write the output file
  const outputPath = options.output ?? resolvedPath.replace(/\.[^.]+$/, "") + ".html";
  await writeFile(outputPath, html, "utf-8");
  console.log(`Generated: ${outputPath}`);

  // Open in browser (default: open)
  if (options.open !== false) {
    open(outputPath, { app: { name: apps.browser } });
  }
}
