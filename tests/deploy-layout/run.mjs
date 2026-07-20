#!/usr/bin/env node

import { existsSync, readdirSync, statSync } from 'node:fs';
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
  'content/posts/introspection-via-kaomoji.md',
  'shared-base.css',
  'shared-tokens.js',
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
  /(?:^|\/)AGENTS\.md$/,
  /(?:^|\/)CLAUDE\.md$/,
  /^surveys(?:\/|$)/,
  /^migrations(?:\/|$)/,
  /^resume(?:\/|$)/,
  /^og(?:\/|$)/,
  /^scripture\/raw(?:\/|$)/,
  /^_worker\.js$/,
  /^_build\.mjs$/,
]) {
  check(`omits ${forbidden}`, !files.some(file => forbidden.test(file)));
}

console.log(`\ndeploy layout: ${files.length} files validated`);
