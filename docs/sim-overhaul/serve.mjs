// A static server for working on the sims without the parent build.
// usage: node docs/sim-overhaul/serve.mjs [port=8790]
//
// /shared/* and /<project>/* come live from the working tree (untracked files
// included); everything else (fonts, logo, favicon) from dist/, which one
// earlier `npm run build` populated. Several agents can each run their own
// port at once, and nobody has to rebuild dist/ (the parent build deletes and
// recreates it, so it must not run while others are reading it).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const PROJECTS = ['worldline', 'lumen', 'miasma', 'shoals'];
const port = +(process.argv[2] || 8790);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.wgsl': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.pdf': 'application/pdf',
};

function map(path) {
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'shared') return join(ROOT, path);
  if (PROJECTS.includes(parts[0])) return join(ROOT, 'projects', path);
  return join(ROOT, 'dist', path);
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const path = normalize(decodeURIComponent(url.pathname));
  if (path.includes('..')) { res.writeHead(400).end(); return; }
  const top = path.split('/').filter(Boolean);
  if (top.length === 1 && PROJECTS.includes(top[0]) && !path.endsWith('/')) {
    res.writeHead(308, { Location: path + '/' + url.search }).end(); return;
  }
  let file = map(path);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    const headers = { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' };
    if (top[0] === 'worldline') headers['Cross-Origin-Embedder-Policy'] = 'credentialless';
    res.writeHead(200, headers).end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found: ' + path);
  }
}).listen(port, () => console.log(`serving ${ROOT} on http://localhost:${port}`));
