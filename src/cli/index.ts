#!/usr/bin/env node
import { Command } from "commander";
import { playCommand } from "./commands/play.js";
import { buildCommand } from "./commands/build.js";
import { skillsCommand } from "./commands/skills.js";
import pkg from "../../package.json" with { type: "json" };

const program = new Command();

program
  .name("mdstory")
  .description("An interactive fiction scripting format based on Markdown and Handlebars.")
  .version(pkg.version);

program
  .command("play")
  .description("Play a story interactively in the terminal")
  .argument("<story>", "Path to the story .md file")
  .option("--debug", "Enable debug output")
  .action(async (storyPath, options) => {
    try {
      await playCommand(storyPath, { debug: options.debug ?? false });
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program
  .command("build")
  .description("Generate a complete HTML page from a story and open it in the browser")
  .argument("<story>", "Path to the story .md file")
  .option("-o, --output <path>", "Output HTML file path")
  .option("-t, --template <name>", 'Template to use (default: "default", or path to custom .html file)')
  .option(
    "-O, --option <key=value>",
    "Pass a template option (repeatable)",
    (v: string, prev: Record<string, string>) => {
      const eq = v.indexOf("=");
      if (eq === -1) {
        throw new Error(`Invalid option format "${v}". Expected key=value.`);
      }
      const key = v.slice(0, eq);
      const value = v.slice(eq + 1);
      return { ...(prev ?? {}), [key]: value };
    },
  )
  .option("--no-open", "Do not open the generated HTML in the browser")
  .option("--debug", "Print debug output to the browser console")
  .action(async (storyPath, options) => {
    try {
      await buildCommand(storyPath, {
        output: options.output,
        template: options.template,
        templateOptions: options.option ?? {},
        open: options.open,
        debug: options.debug ?? false,
      });
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program
  .command("skills")
  .description("Install MdStory skills to a coding agent (Claude Code, Codex, etc.)")
  .option("-a, --agent <name>", "Target agent (repeatable)", (v: string, prev: string[]) => [...(prev ?? []), v], [])
  .option("-d, --dir <path>", "Custom target directory")
  .option("-y, --yes", "Skip confirmation prompt")
  .action(async (options) => {
    try {
      await skillsCommand({
        agents: options.agent,
        dir: options.dir,
        yes: options.yes ?? false,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "ExitPromptError") {
        process.exit(0);
      }
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program.parse();
