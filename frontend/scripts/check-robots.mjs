import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const robotsPath = fileURLToPath(
  new URL("../public/robots.txt", import.meta.url),
);
const content = await readFile(robotsPath, "utf8");

if (
  !/^User-agent:\s*\*\s*$/m.test(content) ||
  !/^Disallow:\s*\/\s*$/m.test(content)
) {
  console.error(
    "frontend/public/robots.txt must disallow indexing for this internal application.",
  );
  process.exitCode = 1;
}
