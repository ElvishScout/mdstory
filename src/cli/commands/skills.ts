import { readdir, cp } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import inquirer from "inquirer";

interface AgentConfig {
  name: string;
  /** Project-level skills directory (relative to cwd) */
  projectDir: string;
}

const AGENTS: AgentConfig[] = [
  {
    name: "Claude Code",
    projectDir: ".claude/skills",
  },
  {
    name: "OpenAI Codex",
    projectDir: ".codex/skills",
  },
  {
    name: "Open Code",
    projectDir: ".open-code/skills",
  },
  {
    name: "Cline",
    projectDir: ".cline/skills",
  },
  {
    name: "Cursor",
    projectDir: ".cursor/skills",
  },
];

export async function skillsCommand(): Promise<void> {
  const cliDir = path.dirname(fileURLToPath(import.meta.url));
  const skillsDir = path.resolve(cliDir, "../../../skills");

  // Discover available skills (each subdirectory under skills/ is a skill)
  const entries = await readdir(skillsDir, { withFileTypes: true });
  const skillNames = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  if (!skillNames.length) {
    console.log(`No skills found in ${skillsDir}`);
    return;
  }

  console.log(`Found ${skillNames.length} skill(s): ${skillNames.join(", ")}\n`);

  // Step 1: Choose target agents (multi-select)
  const CUSTOM_KEY = "__custom__";
  const { agentNames } = await inquirer.prompt<{ agentNames: string[] }>([
    {
      type: "checkbox",
      name: "agentNames",
      message: "Select target coding agents",
      choices: [
        ...AGENTS.map((a) => ({ name: a.name, value: a.name })),
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

  const selectedAgents = AGENTS.filter((a) => agentNames.includes(a.name));
  const useCustom = agentNames.includes(CUSTOM_KEY);

  // Step 2: If custom selected, ask for directory
  let customDir = "";
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

  // Step 3: Confirm
  const targets = selectedAgents.map((a) => {
    const dir = path.resolve(process.cwd(), a.projectDir);
    return { agent: a.name, dir };
  });
  if (useCustom) {
    targets.push({ agent: "Custom", dir: customDir });
  }

  console.log(`\nWill copy ${skillNames.length} skill(s) to:`);
  for (const t of targets) {
    console.log(`  ${t.agent}: ${t.dir}`);
  }

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

  // Copy all skills to each target
  for (const { agent, dir: targetDir } of targets) {
    console.log(`\n[${agent}]`);
    for (const skillName of skillNames) {
      const src = path.join(skillsDir, skillName);
      const dest = path.join(targetDir, skillName);
      console.log(`  Copying "${skillName}"...`);
      await cp(src, dest, { recursive: true });
    }
  }

  console.log(`\nDone — ${skillNames.length} skill(s) × ${targets.length} agent(s)`);
}
