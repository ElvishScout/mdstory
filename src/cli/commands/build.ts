import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import open, { apps } from "open";
import { parseStorySource, resolveParseOptions, TemplateOptions } from "../../index.js";

export interface BuildOptions {
  output?: string;
  template?: string;
  open?: boolean;
  debug?: boolean;
}

export async function buildCommand(storyPath: string, options: BuildOptions): Promise<void> {
  // Parse the story to a serializable structure
  const resolvedPath = path.resolve(storyPath);
  const parseOptions = await resolveParseOptions({ base: resolvedPath });
  const source = await readFile(resolvedPath, "utf-8");
  const parsedStory = await parseStorySource(source, parseOptions);

  // Build template options
  const templateOptions: TemplateOptions = {
    debug: options.debug,
  };

  // Resolve the HTML template
  const cliDir = path.dirname(fileURLToPath(import.meta.url));
  const packageRoot = path.resolve(cliDir, "../../..");
  const templatesDir = path.join(packageRoot, "templates");
  const templateName = options.template ?? "default";

  let templatePath: string;

  // 1. Look for a subdirectory under templates/
  const candidateDir = path.join(templatesDir, templateName, "dist", "index.html");
  const exists = await access(candidateDir)
    .then(() => true)
    .catch(() => false);

  if (exists) {
    templatePath = candidateDir;
  } else {
    // 2. Try treating the value as a direct path to an HTML file
    const candidateFile = path.resolve(templateName);
    const fileExists = await access(candidateFile)
      .then(() => true)
      .catch(() => false);

    if (fileExists) {
      templatePath = candidateFile;
    } else {
      throw new Error(`Template "${templateName}" not found.`);
    }
  }

  const template = await readFile(templatePath, "utf-8");

  // Inject the parsed story JSON and template options into the template
  const html = template
    .replace('"__PARSED_STORY__"', JSON.stringify(parsedStory))
    .replace('"__TEMPLATE_OPTIONS__"', JSON.stringify(templateOptions));

  // Write the output file
  const outputPath = options.output ?? resolvedPath.replace(/\.[^.]+$/, "") + ".html";
  await writeFile(outputPath, html, "utf-8");
  console.log(`Generated: ${outputPath}`);

  // Open in browser (default: open)
  if (options.open !== false) {
    open(outputPath, { app: { name: apps.browser } });
  }
}
