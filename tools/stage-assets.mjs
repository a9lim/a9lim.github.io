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

const ROOT_FILES = ['LICENSE', 'README.md'];
const SITE_FILES = ['404.html', 'i18n.js', 'main.js', 'styles.css'];

// draft/posts/*.md is staged over content/posts/*.md — same public path, so a
// draft renders exactly like a published post. DRAFTS=1 (./dev.sh) only; a
// deploy build never sees it. See tools/build.mjs for the rest of the draft/ tree.
const DRAFTS = process.env.DRAFTS === '1';

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

// Drafts are copied by directory scan, not `git ls-files`, so the tree works
// whether or not draft/ is tracked.
function copyDraftTree(sourceRel, destinationRoot) {
  const source = join(ROOT, sourceRel);
  if (!existsSync(source)) return 0;
  let count = 0;
  for (const name of readdirSync(source)) {
    if (!name.endsWith('.md')) continue;
    copyPath(join(source, name), join(destinationRoot, name));
    count += 1;
  }
  return count;
}

function isDeployableProjectFile(rel) {
  const parts = rel.split('/');
  if (parts.some(part => part.startsWith('.'))) return false;
  if (parts.includes('node_modules')) return false;
  if (parts.includes('docs') || parts.includes('tests') || parts.includes('extract')) return false;
  if (rel === 'AGENTS.md' || rel === 'CLAUDE.md') return false;
  if (rel === 'AUDIT.md' || rel === 'HANDOFF.md') return false;
  if (/^test_.*\.mjs$/.test(rel)) return false;
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

for (const rel of SITE_FILES) {
  copyPath(join(ROOT, 'site', rel), join(DIST, rel));
  copied += 1;
}

copied += copyTrackedTree(ROOT, 'site/src', join(DIST, 'src'), rel => rel !== 'site/src/projects.js');
copied += copyTrackedTree(ROOT, 'static', DIST);
copied += copyTrackedTree(ROOT, 'shared', join(DIST, 'shared'));
copied += copyTrackedTree(ROOT, 'content/posts', join(DIST, 'content/posts'));

if (DRAFTS) {
  const drafts = copyDraftTree('draft/posts', join(DIST, 'content/posts'));
  copied += drafts;
  console.log(`drafts: staged ${drafts} draft post file(s) — this tree must not be deployed`);
}

// Keep the former public URLs for one migration cycle. Source and consumers
// use /shared/*; these aliases can be removed after caches and inbound links age.
for (const name of readdirSync(join(ROOT, 'shared')).filter(name => /\.(?:css|js)$/.test(name))) {
  copyPath(join(ROOT, 'shared', name), join(DIST, `shared-${name}`));
  copied += 1;
}

for (const project of PROJECTS) {
  const source = join(ROOT, 'projects', project);
  copied += copyTrackedTree(source, '.', join(DIST, project), isDeployableProjectFile);
}

console.log(`dist: staged ${copied} tracked deploy assets`);
