import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const roots = ['src'];
const mojibakePatterns = ['â€“', 'â€”', 'â€¦', 'â€', 'Â·', 'Ã', '�'];
const allowedExtensions = new Set(['.css', '.ts', '.tsx', '.js', '.jsx', '.html']);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(path));
      continue;
    }

    if ([...allowedExtensions].some(extension => entry.name.endsWith(extension))) {
      files.push(path);
    }
  }

  return files;
}

const findings = [];

for (const root of roots) {
  for (const file of await collectFiles(root)) {
    const text = await readFile(file, 'utf8');

    for (const pattern of mojibakePatterns) {
      const index = text.indexOf(pattern);

      if (index !== -1) {
        const line = text.slice(0, index).split('\n').length;
        findings.push(`${file}:${line} contains "${pattern}"`);
      }
    }
  }
}

if (findings.length) {
  console.error('Visible text encoding check failed:');
  console.error(findings.join('\n'));
  process.exit(1);
}

console.log('Visible text encoding check passed.');
