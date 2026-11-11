import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const src = path.join(root, 'node_modules', 'sql.js', 'dist', 'sql-wasm-browser.wasm');
const destDir = path.join(root, 'public');
const dest = path.join(destDir, 'sql-wasm-browser.wasm');

if (fs.existsSync(src)) {
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
}
