// Runs Vitest in a child process with a canonical working directory.
// On Windows, a lowercase drive letter ("c:\…", as VS Code terminals open) makes Node load
// Vitest twice and every suite fails with "Cannot read properties of undefined (reading 'config')".
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const upperDrive = (p) => p.replace(/^[a-z]:/, (d) => d.toUpperCase());
const cwd = upperDrive(process.cwd());
const cli = upperDrive(fileURLToPath(new URL("../node_modules/vitest/vitest.mjs", import.meta.url)));

const { status } = spawnSync(process.execPath, [cli, "run", ...process.argv.slice(2)], { cwd, stdio: "inherit" });
process.exit(status ?? 1);
