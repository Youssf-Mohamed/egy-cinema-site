// Fix all import paths in src/ that were broken by the earlier PowerShell pass.
// Rules:
//   - `from '../i18n/ui.ts';`  (with one ..)  → `from '../../i18n/ui.ts';`   (from src/pages/* or src/lib/*)
//
// In short: detect any import of i18n/ui.ts with only one `..` and bump it to two.
// (We only ever import from src/i18n/ui.ts, which is two levels deep from src/pages/*.)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', 'src');

const fix = (file) => {
  const content = fs.readFileSync(file, 'utf8');
  let next = content;
  // The PS bug turned `from '../i18n/ui.ts';`  (one ..) where there used to be ../../i18n/ui.ts;
  // This regex fixes the path to have the right number of ..
  // We need to know the depth from the i18n directory.
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const depth = rel.split('/').length; // number of segments incl. file
  // depth of the file relative to src root
  const fileDepth = rel.split('/').length - 1; // segments above the file
  // We want: from i18n/ui.ts at depth 2, file at depth d needs (d - 1) `../`
  // i18n is at depth 1
  const needed = fileDepth; // since i18n is sibling of fileDepth directories above
  // Build a regex that matches any number of ../
  next = next.replace(
    /from '(\.\.[\/\\])+i18n\/ui\.ts';/g,
    () => {
      const prefix = '../'.repeat(needed);
      return `from '${prefix}i18n/ui.ts';`;
    },
  );
  next = next.replace(
    /from '(\.\.[\/\\])+i18n\/ui';(?!\.)/g,
    () => {
      const prefix = '../'.repeat(needed);
      return `from '${prefix}i18n/ui';`;
    },
  );
  if (next !== content) {
    fs.writeFileSync(file, next);
    console.log('fixed', rel);
  }
};

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && (entry.name.endsWith('.astro') || entry.name.endsWith('.ts'))) fix(full);
  }
};

walk(root);
console.log('done');
