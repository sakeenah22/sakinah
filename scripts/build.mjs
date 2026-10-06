/* Production build for static hosting (Vercel / any CDN).
   Copies index.html + src/ + assets/ into public/ and FAILS the build if any referenced file is missing.
   No dependencies, no network, no environment variables. */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve, posix } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const OUT = join(ROOT, 'public');
const problems = [];

const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const rel = p => p.slice(ROOT.length + 1).split('\\').join('/');

// 1) every <script src> / stylesheet in index.html exists
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
for (const [, ref] of html.matchAll(/(?:src|href)="((?:src|assets)\/[^"]+)"/g))
  if (!existsSync(join(ROOT, ref))) problems.push(`index.html → missing ${ref}`);

// 2) every media file referenced in code exists (documentation comments are ignored)
for (const file of walk(join(ROOT, 'src')).filter(f => /\.(js|css)$/.test(f))) {
  const code = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [, ref] of code.matchAll(/['"(]((?:\.\.\/)?assets\/[^'")\s]+)['")]/g)) {
    const target = ref.startsWith('../') ? posix.normalize(posix.join(posix.dirname(rel(file)), ref)) : ref;
    if (!existsSync(join(ROOT, target))) problems.push(`${rel(file)} → missing ${ref}`);
  }
}
// 3) no machine-local paths
for (const file of [join(ROOT, 'index.html'), ...walk(join(ROOT, 'src'))]) {
  const code = readFileSync(file, 'utf8');
  if (/file:\/\/|[A-Z]:\\\\Users|\/Users\/|\/home\/|\/mnt\//.test(code)) problems.push(`${rel(file)} → contains a local file path`);
}
if (problems.length) { console.error('✗ Build failed:\n  ' + problems.join('\n  ')); process.exit(1); }

rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });
// deep links (e.g. /journey after a refresh) are rewritten to index.html, so relative src/ and assets/ must resolve from the site root
writeFileSync(join(OUT, 'index.html'), html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<base href="/">'));
cpSync(join(ROOT, 'src'), join(OUT, 'src'), { recursive: true });
cpSync(join(ROOT, 'assets'), join(OUT, 'assets'), { recursive: true });
cpSync(join(ROOT, 'favicon.svg'), join(OUT, 'favicon.svg'));
const files = walk(OUT); const bytes = files.reduce((n, f) => n + statSync(f).size, 0);
console.log(`✓ public/ ready — ${files.length} files, ${(bytes / 1048576).toFixed(1)} MB`);
