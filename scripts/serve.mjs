/* Tiny static server to preview the production build locally: node scripts/serve.mjs public 3000
   Mirrors Vercel: /api/stt runs api/stt.js (needs STT_API_KEY in the environment), real files next, any other path → index.html. */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve, normalize, dirname } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const stt = require(join(dirname(new URL(import.meta.url).pathname), '..', 'api', 'stt.js'));   // same function Vercel runs at /api/stt
const dir = resolve(process.argv[2] || 'public'), port = +(process.argv[3] || 3000);
const TYPES = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml',
  '.mp4':'video/mp4', '.webm':'video/webm', '.mp3':'audio/mpeg', '.jpg':'image/jpeg', '.png':'image/png', '.woff':'font/woff', '.woff2':'font/woff2', '.vtt':'text/vtt', '.txt':'text/plain; charset=utf-8' };
createServer(async (req, res) => {
  if (req.url.split('?')[0] === '/api/stt') return stt(req, res);
  let p = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  let file = join(dir, p);
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); } catch { file = join(dir, 'index.html'); }
  try {
    const body = await readFile(file); const type = TYPES[extname(file)] || 'application/octet-stream';
    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    if (range && /video|audio/.test(type)) {
      const start = +range[1] || 0, end = range[2] ? +range[2] : body.length - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${body.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
      return res.end(body.subarray(start, end + 1));
    }
    res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes' }); res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, () => console.log(`Sakeenah preview → http://localhost:${port}`));
