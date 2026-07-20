#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readlinkSync,
  readdirSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, 'dist');
const PROJECTS = ['cyano', 'geon', 'gerry', 'miasma', 'pile', 'plasma', 'scripture', 'shoals'];

const ROOT_FILES = [
  '404.html',
  'LICENSE',
  'README.md',
  '_headers',
  '_routes.json',
  'about.md',
  'doggy.JPG',
  'favicon.ico',
  'feed.atom',
  'feed.xml',
  'home-data.json',
  'i18n.js',
  'icon-192.png',
  'icon-512.png',
  'index.html',
  'llms-full.txt',
  'llms.txt',
  'logo.svg',
  'main.js',
  'manifest.json',
  'og-image.webp',
  'opensearch.xml',
  'posts.json',
  'resume.pdf',
  'robots.txt',
  'sitemap-main.xml',
  'sitemap-scripture.xml',
  'sitemap.xml',
  'styles.css',
];

const ROOT_TREES = ['.well-known', 'blog-assets', 'content/posts', 'fonts', 'src'];

function trackedFiles(cwd, pathspec = '.') {
  return execFileSync('git', ['ls-files', '-z', '--', pathspec], { cwd, encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);
}

function copyPath(source, destination) {
  mkdirSync(dirname(destination), { recursive: true });
  const stat = lstatSync(source);
  if (stat.isSymbolicLink()) {
    symlinkSync(readlinkSync(source), destination);
  } else {
    copyFileSync(source, destination);
  }
}

function copyTrackedTree(cwd, pathspec, destinationRoot, filter = () => true) {
  let count = 0;
  for (const rel of trackedFiles(cwd, pathspec)) {
    if (!filter(rel)) continue;
    const outputRel = pathspec === '.' ? rel : rel.slice(pathspec.length + 1);
    copyPath(join(cwd, rel), join(destinationRoot, outputRel));
    count += 1;
  }
  return count;
}

function isDeployableProjectFile(rel) {
  const parts = rel.split('/');
  if (parts.includes('node_modules') || parts.includes('.git')) return false;
  if (parts.includes('.DS_Store')) return false;
  if (rel === 'AGENTS.md' || rel === 'CLAUDE.md') return false;
  if (rel === 'raw' || rel.startsWith('raw/')) return false;
  return true;
}

if (dirname(DIST) !== ROOT || DIST === ROOT || !DIST.endsWith('/dist')) {
  throw new Error(`refusing to replace unsafe output path: ${DIST}`);
}
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

let copied = 0;
for (const rel of ROOT_FILES) {
  const source = join(ROOT, rel);
  if (!existsSync(source)) throw new Error(`missing required deploy asset: ${rel}`);
  copyPath(source, join(DIST, rel));
  copied += 1;
}

for (const rel of ROOT_TREES) {
  copied += copyTrackedTree(ROOT, rel, join(DIST, rel));
}

for (const name of readdirSync(ROOT).filter(name => /^shared-.*\.(?:css|js)$/.test(name))) {
  copyPath(join(ROOT, name), join(DIST, name));
  copied += 1;
}

for (const project of PROJECTS) {
  const source = join(ROOT, project);
  copied += copyTrackedTree(source, '.', join(DIST, project), isDeployableProjectFile);
}

console.log(`dist: staged ${copied} tracked deploy assets`);
