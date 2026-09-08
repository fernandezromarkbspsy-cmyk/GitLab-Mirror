import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoot = fileURLToPath(new URL("../src", import.meta.url));
const generatedExtensions = new Set([".js", ".jsx"]);
const findings = [];

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(path);
      continue;
    }
    const isGeneratedDeclaration =
      entry.name.endsWith(".d.ts") && entry.name !== "vite-env.d.ts";
    if (
      generatedExtensions.has(entry.name.slice(entry.name.lastIndexOf("."))) ||
      isGeneratedDeclaration
    ) {
      findings.push(relative(sourceRoot, path));
    }
  }
}

await visit(sourceRoot);

if (findings.length > 0) {
  console.error(
    "Generated JavaScript and declaration files are not allowed in frontend/src:",
  );
  console.error(findings.join("\n"));
  process.exitCode = 1;
}
