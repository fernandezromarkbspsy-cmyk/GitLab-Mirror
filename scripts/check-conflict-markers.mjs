import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const roots = ["backend/app", "backend/routes", "frontend/src", "frontend", "e2e", "tests", "scripts", "supabase/migrations"];
const files = execFileSync("git", ["ls-files", ...roots], { encoding: "utf8" })
  .split(/\r?\n/).filter(Boolean);
const marker = /^(<<<<<<<|=======|>>>>>>>)(?: |$)/m;
const offenders = files.filter((file) => existsSync(file) && marker.test(readFileSync(file, "utf8")));
if (offenders.length) {
  console.error(`Unresolved merge conflict markers found in: ${offenders.join(", ")}`);
  process.exit(1);
}
console.log(`Conflict-marker guard passed for ${files.length} release files.`);
