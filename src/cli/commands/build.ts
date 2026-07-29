import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import open, { apps } from "open";
import { parseStorySource, TemplateOptions } from "../../index.js";
import { parseKeyValuePairs, injectTemplateData } from "../../utils/index.js";

export interface BuildOptions {
  output?: string;
  template?: string;
  templateOptions?: Record<string, string>;
  open?: boolean;
  debug?: boolean;
}

export async function buildCommand(storyPath: string, options: BuildOptions): Promise<void> {
  // Parse the story to a serializable structure
  const resolvedPath = path.resolve(storyPath);
  const source = await fs.readFile(resolvedPath, "utf-8");
  const parsedStory = await parseStorySource(source, { base: resolvedPath });

  // Build template options
  const templateOptions: TemplateOptions = {
    debug: options.debug,
    ...parseKeyValuePairs(Object.entries(options.templateOptions ?? {})),
  };

  // Resolve the HTML template
  const cliDir = path.dirname(fileURLToPath(import.meta.url));
  const packageRoot = path.resolve(cliDir, "../../..");
  const templatesDir = path.join(packageRoot, "templates");
  const templateName = options.template ?? "default";

  let templatePath: string;

  // 1. Look for a subdirectory under templates/
  const candidateDir = path.join(templatesDir, templateName, "dist", "index.html");
  const exists = await fs
    .access(candidateDir)
    .then(() => true)
    .catch(() => false);

  if (exists) {
    templatePath = candidateDir;
  } else {
    // 2. Try treating the value as a direct path to an HTML file
    const candidateFile = path.resolve(templateName);
    const fileExists = await fs
      .access(candidateFile)
      .then(() => true)
      .catch(() => false);

    if (fileExists) {
      templatePath = candidateFile;
    } else {
      throw new Error(`Template "${templateName}" not found.`);
    }
  }

  const template = await fs.readFile(templatePath, "utf-8");

  // Inject the parsed story JSON and template options into the template
  const html = injectTemplateData(template, parsedStory, templateOptions);

  // Write the output file
  const outputPath = options.output ? path.resolve(options.output) : resolvedPath.replace(/\.[^.]+$/, "") + ".html";
  await fs.writeFile(outputPath, html, "utf-8");
  console.log(`Generated: ${outputPath}`);

  // Open in browser (default: open)
  if (options.open !== false) {
    open(outputPath, { app: { name: apps.browser } });
  }
}
