import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = fileURLToPath(new URL("../src", import.meta.url));
const findings = [];
const unversionedApiPath = /["'`]\/api\/(?!v1(?:\/|["'`]))/;

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(path);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;

    const source = await readFile(path, "utf8");
    if (unversionedApiPath.test(source)) {
      findings.push(relative(sourceRoot, path));
    }
  }
}

await visit(sourceRoot);

if (findings.length > 0) {
  console.error("Unversioned frontend API paths are not allowed in frontend/src:");
  console.error(findings.join("\n"));
  process.exitCode = 1;
}
