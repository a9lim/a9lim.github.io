#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const DIST = join(ROOT, 'dist');

function check(label, condition) {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`  ok: ${label}`);
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(relative(DIST, path));
  }
  return out;
}

check('dist exists', existsSync(DIST));

const files = walk(DIST);
const fileSet = new Set(files);
for (const required of [
  'index.html',
  'main.js',
  'styles.css',
  'posts.json',
  'src/route-meta.js',
  'content/posts/introspection-via-kaomoji.md',
  'shared/base.css',
  'shared/tokens.js',
  'shared-base.css',
  'shared-tokens.js',
  'fonts/fonts.css',
  'fonts/noto-emoji-variable.woff2',
  'fonts/OFL-NotoEmoji.txt',
  'geon/index.html',
  'scripture/index.html',
  'scripture/data/works.json',
  'resume.pdf',
  '_headers',
]) {
  check(`stages ${required}`, fileSet.has(required));
}

for (const forbidden of [
  /^\.git(?:\/|$)/,
  /(?:^|\/)\.git(?:\/|$)/,
  /(?:^|\/)node_modules(?:\/|$)/,
  /(?:^|\/)\.(?:gitignore|gitkeep|DS_Store)$/,
  /(?:^|\/)AGENTS\.md$/,
  /(?:^|\/)CLAUDE\.md$/,
  /(?:^|\/)(?:AUDIT|HANDOFF)\.md$/,
  /(?:^|\/)(?:docs|tests|extract)(?:\/|$)/,
  /(?:^|\/)test_.*\.mjs$/,
  /^surveys(?:\/|$)/,
  /^migrations(?:\/|$)/,
  /^resume(?:\/|$)/,
  /^og(?:\/|$)/,
  /^site(?:\/|$)/,
  /^static(?:\/|$)/,
  /^projects(?:\/|$)/,
  /^features(?:\/|$)/,
  /^db(?:\/|$)/,
  /^worker(?:\/|$)/,
  /^lib(?:\/|$)/,
  /^tools(?:\/|$)/,
  /^scripture\/raw(?:\/|$)/,
  /^_worker\.js$/,
  /^_build\.mjs$/,
  /^_routes\.json$/,
]) {
  check(`omits ${forbidden}`, !files.some(file => forbidden.test(file)));
}

for (const generated of [
  '_content.generated.mjs',
  '_routes.json',
  'about.md',
  'feed.atom',
  'feed.xml',
  'home-data.json',
  'llms-full.txt',
  'llms.txt',
  'posts.json',
  'resume.pdf',
  'sitemap-main.xml',
  'sitemap-scripture.xml',
  'sitemap.xml',
  'site/src/projects.js',
]) {
  check(`keeps ${generated} out of the source tree`, !existsSync(join(ROOT, generated)));
}

const headers = readFileSync(join(DIST, '_headers'), 'utf8');
const browserCacheLines = headers.split('\n').filter(line => /^  Cache-Control:/.test(line));
check(
  'all static assets revalidate at the browser boundary',
  browserCacheLines.length === 1 && browserCacheLines[0] === '  Cache-Control: public, max-age=0, must-revalidate'
);

const workerHttp = readFileSync(join(ROOT, 'worker/http.js'), 'utf8');
check(
  'Worker responses use the same browser revalidation policy',
  workerHttp.includes("secured.headers.set('Cache-Control', 'public, max-age=0, must-revalidate')")
);

const wrangler = JSON.parse(readFileSync(join(ROOT, 'wrangler.jsonc'), 'utf8'));
check('Worker caching is enabled', wrangler.cache?.enabled === true);
check('Worker cache is isolated per deploy', wrangler.cache?.cross_version_cache === false);

console.log(`\ndeploy layout: ${files.length} files validated`);
