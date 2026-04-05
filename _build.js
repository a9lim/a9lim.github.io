#!/usr/bin/env node
'use strict';

const { readFileSync, writeFileSync } = require('fs');
const { execFileSync } = require('child_process');
const { join } = require('path');

const ROOT = __dirname;
const SITE = 'https://a9l.im';

// --- helpers ---

function gitLastmod(filePath) {
  try {
    const iso = execFileSync('git', ['log', '-1', '--format=%aI', '--', filePath], {
      cwd: ROOT, encoding: 'utf8'
    }).trim();
    return iso ? iso.slice(0, 10) : null;
  } catch { return null; }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function readJSON(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}

// --- collect URLs ---

const urls = [];

function add(path, lastmod) {
  urls.push({ loc: SITE + path, lastmod: lastmod || today() });
}

// 1. Static routes
const staticRoutes = [
  { path: '/',          file: 'index.html' },
  { path: '/projects',  file: 'index.html' },
  { path: '/blog',      file: 'index.html' },
  { path: '/about',     file: 'index.html' },
  { path: '/geon',      file: 'geon/index.html' },
  { path: '/cyano',     file: 'cyano/index.html' },
  { path: '/gerry',     file: 'gerry/index.html' },
  { path: '/shoals',    file: 'shoals/index.html' },
  { path: '/scripture/', file: 'scripture/index.html' },
];

for (const r of staticRoutes) {
  add(r.path, gitLastmod(r.file));
}

// 2. Blog posts
const posts = readJSON('posts.json');
for (const p of posts) {
  const md = `posts/${p.slug}.md`;
  add(`/blog/${p.slug}`, gitLastmod(md) || p.date);
}

// 3. Scripture deep routes
const workIds = readJSON('scripture/data/works.json');

for (const workId of workIds) {
  const manifest = readJSON(`scripture/data/${workId}/manifest.json`);
  // lastmod for the whole work = manifest file date
  const workLastmod = gitLastmod(`scripture/data/${workId}/manifest.json`);

  for (const book of manifest.books) {
    const start = book.start || 1;
    for (let i = 0; i < book.chapters; i++) {
      const chapterId = `${book.id}-${start + i}`;
      add(`/scripture/${workId}/${chapterId}`, workLastmod);
    }
  }
}

// --- generate XML ---

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map(u =>
    `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`
  ),
  '</urlset>',
  ''
].join('\n');

writeFileSync(join(ROOT, 'sitemap.xml'), xml);
console.log(`sitemap.xml: ${urls.length} URLs`);
