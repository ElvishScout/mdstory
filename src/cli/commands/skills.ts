import { readdir, readFile, writeFile, mkdir, cp } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import inquirer from "inquirer";

interface AgentConfig {
  /** CLI tool name used for identification (e.g. "claude", "codex") */
  name: string;
  /** Human-readable display label (e.g. "Claude Code", "OpenAI Codex") */
  label: string;
  /** Project-level skills directory (relative to cwd) */
  dir: string;
}

// ---------------------------------------------------------------------------
// Placeholder resolution
// ---------------------------------------------------------------------------
// Rules: `@!` followed by uppercase letters, underscores, digits; no digit at
// start; optional trailing / for directories.
const PLACEHOLDER_RE = /@!([A-Z][A-Z0-9_]*)/g;

/** Maps placeholder names to project-root-relative paths. */
const PLACEHOLDER_PATHS: Record<string, string> = {
  PACKAGE_ROOT: "./",
};

/**
 * Replace all `@!PLACEHOLDER` occurrences in `content` with real filesystem
 * paths.  When the package is installed inside a project's `node_modules`
 * the paths are relative to `cwd`; for a global install they are absolute.
 */
function resolvePlaceholders(content: string, packageRoot: string, isRelative: boolean): string {
  return content.replace(PLACEHOLDER_RE, (match, name) => {
    const relativePath = PLACEHOLDER_PATHS[name];
    if (relativePath === undefined) {
      console.warn(`  [warn] Unknown placeholder: @!${name}`);
      return match;
    }
    const absolute = path.resolve(packageRoot, relativePath);

    let resolved = isRelative ? path.relative(process.cwd(), absolute) : absolute;
    resolved ||= ".";

    return `@${resolved}`;
  });
}

/**
 * Recursively copy a skill directory tree, replacing `@!PLACEHOLDER` tokens in
 * `.md` (and `.yaml`/`.yml`) files.
 */
async function copySkillTree(srcDir: string, destDir: string, packageRoot: string, isRelative: boolean): Promise<void> {
  await mkdir(destDir, { recursive: true });
  const entries = await readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await copySkillTree(srcPath, destPath, packageRoot, isRelative);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (ext === ".md" || ext === ".yaml" || ext === ".yml") {
        const raw = await readFile(srcPath, "utf-8");
        await writeFile(destPath, resolvePlaceholders(raw, packageRoot, isRelative), "utf-8");
      } else {
        await cp(srcPath, destPath);
      }
    }
  }
}

const AGENTS: AgentConfig[] = [
  {
    name: "claude",
    label: "Claude Code",
    dir: ".claude/skills",
  },
  {
    name: "codex",
    label: "OpenAI Codex",
    dir: ".codex/skills",
  },
  {
    name: "opencode",
    label: "Open Code",
    dir: ".open-code/skills",
  },
  {
    name: "cline",
    label: "Cline",
    dir: ".cline/skills",
  },
  {
    name: "cursor",
    label: "Cursor",
    dir: ".cursor/skills",
  },
];

export interface SkillsOptions {
  /** Pre-selected agent names (bypasses interactive agent selection). */
  agents?: string[];
  /** Custom target directory (bypasses interactive custom-dir prompt). */
  dir?: string;
  /** Skip the final confirmation prompt. */
  yes?: boolean;
}

export async function skillsCommand(options: SkillsOptions = {}): Promise<void> {
  const cliDir = path.dirname(fileURLToPath(import.meta.url));
  const packageRoot = path.resolve(cliDir, "../../../");
  const skillsDir = path.join(packageRoot, "skills");

  // Discover available skills (each subdirectory under skills/ is a skill)
  const entries = await readdir(skillsDir, { withFileTypes: true });
  const skillNames = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  if (!skillNames.length) {
    console.log(`No skills found in ${skillsDir}`);
    return;
  }

  console.log(`Found ${skillNames.length} skill(s): ${skillNames.join(", ")}\n`);

  const hasCliAgents = options.agents && options.agents.length > 0;
  const hasCliDir = !!options.dir;

  // ---- Non-interactive agent selection (CLI args) ----
  let selectedAgents: AgentConfig[] = [];
  let useCustom = false;
  let customDir = "";

  if (hasCliAgents || hasCliDir) {
    // Resolve agent names
    if (hasCliAgents) {
      for (const name of options.agents!) {
        const found = AGENTS.find((a) => a.name === name);
        if (found) {
          selectedAgents.push(found);
        } else {
          throw new Error(`Unknown agent: "${name}". Available agents: ${AGENTS.map((a) => a.name).join(", ")}`);
        }
      }
    }

    if (hasCliDir) {
      useCustom = true;
      customDir = path.resolve(process.cwd(), options.dir!);
    }

    if (!selectedAgents.length && !useCustom) {
      throw new Error("No target agents or directories specified.");
    }
  } else {
    // ---- Interactive agent selection ----
    const CUSTOM_KEY = "__custom__";
    const { agentNames } = await inquirer.prompt<{ agentNames: string[] }>([
      {
        type: "checkbox",
        name: "agentNames",
        message: "Select target coding agents",
        choices: [
          ...AGENTS.map((a) => ({ name: a.label, value: a.name })),
          { name: "Custom directory…", value: CUSTOM_KEY },
        ],
        validate: (input: string[]) => {
          if (!input.length) {
            return "Select at least one agent or custom directory";
          }
          return true;
        },
      },
    ]);

    selectedAgents = AGENTS.filter((a) => agentNames.includes(a.name));
    useCustom = agentNames.includes(CUSTOM_KEY);

    // If custom selected, ask for directory
    if (useCustom) {
      const answer = await inquirer.prompt<{ customDir: string }>([
        {
          type: "input",
          name: "customDir",
          message: "Enter custom directory path:",
          validate: (input: string) => {
            if (!input.trim()) {
              return "Directory path cannot be empty";
            }
            return true;
          },
        },
      ]);
      customDir = path.resolve(process.cwd(), answer.customDir.trim());
    }
  }

  // Build target list
  const targets = selectedAgents.map((a) => {
    const dir = path.resolve(process.cwd(), a.dir);
    return { agent: a.label, dir };
  });
  if (useCustom) {
    targets.push({ agent: "Custom", dir: customDir });
  }

  console.log(`\nWill copy ${skillNames.length} skill(s) to:`);
  for (const t of targets) {
    console.log(`  ${t.agent}: ${t.dir}`);
  }

  // ---- Confirmation ----
  if (!options.yes) {
    const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
      {
        type: "confirm",
        name: "confirmed",
        message: "Proceed?",
        default: true,
      },
    ]);

    if (!confirmed) {
      console.log("Aborted.");
      return;
    }
  }

  // Determine install type for path resolution.
  // If the package root is cwd or a subdirectory of cwd → relative paths.
  // Otherwise (e.g. global install) → absolute paths.
  const relFromCwd = path.relative(process.cwd(), packageRoot);
  const inNodeModules = !relFromCwd.startsWith("..") && !path.isAbsolute(relFromCwd);

  // Copy all skills to each target
  for (const { agent, dir: targetDir } of targets) {
    console.log(`\n[${agent}]`);
    for (const skillName of skillNames) {
      const src = path.join(skillsDir, skillName);
      const dest = path.join(targetDir, skillName);
      console.log(`  Copying "${skillName}"...`);
      await copySkillTree(src, dest, packageRoot, inNodeModules);
    }
  }

  console.log(`\nDone — ${skillNames.length} skill(s) × ${targets.length} agent(s)`);
}
