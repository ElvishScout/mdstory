/**
 * @file Builds all HTML templates in parallel.
 *
 * Scans the `templates/` directory for subdirectories and runs `npm run build`
 * in each one concurrently. Output from each build is prefixed with the
 * template name so it stays readable. Exits with code 1 if any build fails.
 *
 * @example
 *   node templates/build.cjs
 */

const { spawn } = require("child_process");
const { readdir } = require("fs/promises");
const path = require("path");
const { createInterface } = require("readline");

const TEMPLATES_DIR = __dirname;

/**
 * @typedef {Object} BuildResult
 * @property {string}  dir    - Template directory name.
 * @property {boolean} ok     - Whether the build succeeded (exit code 0).
 * @property {number?} code   - Exit code from npm (only when `ok` is false).
 * @property {string?} stderr - Accumulated stderr output (only when `ok` is false).
 */

/**
 * Runs `npm run build` inside a single template directory.
 *
 * @param {string} dir - The name of a subdirectory inside `templates/`.
 * @returns {Promise<BuildResult>} Resolves when the build process exits.
 */
function buildTemplate(dir) {
  return new Promise((resolve) => {
    const cwd = path.join(TEMPLATES_DIR, dir);
    const child = spawn("npm", ["run", "build"], {
      cwd,
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });

    const rl = createInterface({ input: child.stdout });

    rl.on("line", (line) => {
      console.log(`[${dir}] ${line}`);
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ dir, ok: true });
      } else {
        resolve({ dir, ok: false, code, stderr: stderr.trim() });
      }
    });

    child.on("error", (err) => {
      resolve({ dir, ok: false, code: null, stderr: err.message });
    });
  });
}

/**
 * Entry point. Discovers template subdirectories, builds them in parallel,
 * then prints a summary. Exits with code 1 when any template fails.
 *
 * @returns {Promise<void>}
 */
async function main() {
  const entries = await readdir(TEMPLATES_DIR, { withFileTypes: true });
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  if (!dirs.length) {
    console.log("No template directories found.");
    return;
  }

  console.log(`Building ${dirs.length} template(s): ${dirs.join(", ")}\n`);

  const results = await Promise.all(dirs.map(buildTemplate));

  const failed = results.filter((r) => !r.ok);

  console.log("");
  if (!failed.length) {
    console.log(`All ${results.length} template(s) built successfully.`);
  } else {
    console.error(`${failed.length} template(s) failed:`);
    for (const f of failed) {
      console.error(`  ✗ ${f.dir} (exit code: ${f.code})`);
      if (f.stderr) {
        console.error(`    ${f.stderr}`);
      }
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
