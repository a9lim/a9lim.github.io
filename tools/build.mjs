#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parseMarkdown, mdEsc, splitMarkdownTableRow } from '../site/src/markdown.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, 'dist');
const BUILD = join(ROOT, '.build');
const SITE = 'https://a9l.im';

// --check: verify the deterministic content-derived artifacts are current
// instead of writing them, then exit (nothing is modified in this mode).
const CHECK = process.argv.includes('--check');
const checkFailures = [];

// Write a content-derived artifact — or, under --check, diff it against disk.
function emit(rel, content) {
  const output = join(DIST, rel);
  if (!CHECK) {
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, content);
    return;
  }
  let current = null;
  try { current = readFileSync(output, 'utf8'); } catch { /* missing counts as stale */ }
  if (current !== content) checkFailures.push(rel);
}

function emitInternal(rel, content) {
  const output = join(BUILD, rel);
  if (!CHECK) {
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, content);
    return;
  }
  let current = null;
  try { current = readFileSync(output, 'utf8'); } catch { /* missing counts as stale */ }
  if (current !== content) checkFailures.push(`.build/${rel}`);
}

// --- helpers ---

function gitLastmod(filePath) {
  const parts = filePath.split('/');
  let cwd = ROOT;
  let trackedPath = filePath;
  for (let i = parts.length - 1; i > 0; i--) {
    const candidate = join(ROOT, ...parts.slice(0, i));
    if (!existsSync(join(candidate, '.git'))) continue;
    cwd = candidate;
    trackedPath = parts.slice(i).join('/');
    break;
  }
  try {
    const iso = execFileSync('git', ['log', '-1', '--format=%aI', '--', trackedPath], {
      cwd, encoding: 'utf8'
    }).trim();
    return iso ? iso.slice(0, 10) : null;
  } catch { return null; }
}

function projectSource(slug, rel = '') {
  return ['projects', slug, rel].filter(Boolean).join('/');
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function readJSON(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}

function readText(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

function rfc2822(isoDate) {
  return new Date(isoDate + 'T00:00:00Z').toUTCString();
}

function isoTimestamp(isoDate) {
  return isoDate + 'T00:00:00Z';
}

function escXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Markdown rendering comes from src/markdown.js — the single parser shared
// by the blog client, the worker's edge SSR, and this build.

// ═══ content/ pipeline ═══
// content/ is the hand-edited source of truth for blog posts, project
// cards, and homepage copy. This section parses it and emits the derived
// artifacts (posts.json, src/projects.js, .build/content.generated.mjs, discovery
// files, and submodule SEO metadata). Canonical post markdown is served from
// content/posts/ directly; no stripped duplicate tree is generated.
// Generated files carry a banner — edit content/, never them.

function fmValue(v) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+$/.test(v)) return Number(v);
  return v;
}

// Minimal YAML subset: `key: value` scalars (string / bool / integer) and
// `key:` followed by indented `- item` lists. Nothing else — parse errors
// are loud so a typo can't silently drop content.
function parseFrontmatter(rel) {
  const raw = readText(rel);
  if (!raw.startsWith('---\n')) throw new Error(rel + ': missing frontmatter');
  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) throw new Error(rel + ': unterminated frontmatter');
  const meta = {};
  let listKey = null;
  for (const line of raw.slice(4, end).split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const item = line.match(/^\s+-\s+(.+)$/);
    if (item) {
      if (!listKey) throw new Error(rel + ': list item outside a list: ' + line);
      meta[listKey].push(fmValue(item[1]));
      continue;
    }
    const kv = line.match(/^([A-Za-z][\w]*):(?:\s+(.*))?$/);
    if (!kv) throw new Error(rel + ': bad frontmatter line: ' + line);
    if (kv[2] === undefined || kv[2] === '') { listKey = kv[1]; meta[listKey] = []; }
    else { listKey = null; meta[kv[1]] = fmValue(kv[2].trim()); }
  }
  return { meta, body: raw.slice(end + 5) };
}

function contentSlugs(dir) {
  return readdirSync(join(ROOT, dir))
    .filter(f => f.endsWith('.md') && !f.endsWith('.ja.md'))
    .map(f => f.replace(/\.md$/, ''));
}

// Each content file may have a parallel `{slug}.ja.md` translation.
function loadContentPair(dir, slug) {
  const en = parseFrontmatter(`${dir}/${slug}.md`);
  const jaRel = `${dir}/${slug}.ja.md`;
  const ja = existsSync(join(ROOT, jaRel)) ? parseFrontmatter(jaRel) : null;
  return { slug, meta: en.meta, body: en.body, ja };
}

// --- posts: content/posts/*.md → posts.json ---

const postEntries = contentSlugs('content/posts')
  .map(slug => loadContentPair('content/posts', slug))
  .sort((a, b) => (a.meta.date < b.meta.date ? 1 : -1));
const postEntryBySlug = new Map(postEntries.map(p => [p.slug, p]));

const posts = [];
for (const p of postEntries) {
  for (const req of ['title', 'date', 'tag', 'excerpt']) {
    if (p.meta[req] == null) throw new Error(`content/posts/${p.slug}.md: missing ${req}`);
  }
  posts.push({
    slug: p.slug,
    title: p.meta.title,
    ...(p.ja && p.ja.meta.title && { title_ja: p.ja.meta.title }),
    date: p.meta.date,
    ...(p.meta.updated && { updated: p.meta.updated }),
    tag: p.meta.tag,
    ...(p.ja && p.ja.meta.tag && { tag_ja: p.ja.meta.tag }),
    excerpt: p.meta.excerpt,
    ...(p.ja && p.ja.meta.excerpt && { excerpt_ja: p.ja.meta.excerpt }),
    ...(p.ja && { translations: ['ja'] }),
  });
}
emit('posts.json', JSON.stringify(posts, null, 2) + '\n');
console.log(`posts.json: ${posts.length} posts (from content/posts/)`);

// --- projects: content/projects/*.md → src/projects.js + worker SSR data ---

const projectEntries = contentSlugs('content/projects')
  .map(slug => loadContentPair('content/projects', slug))
  .sort((a, b) => (a.meta.order ?? 1e9) - (b.meta.order ?? 1e9));

// Package distributions are intentionally a flat frontmatter list because
// the content parser only accepts scalar values and scalar lists. Each entry
// is `Registry | package-name | https://registry.example/package | install`.
function parsePackages(value, rel) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error(`${rel}: packages must be a list`);
  return value.map((spec, i) => {
    if (typeof spec !== 'string') throw new Error(`${rel}: packages item ${i + 1} must be a string`);
    const [registry, name, href, install, ...extra] = spec.split('|').map(s => s.trim());
    if (extra.length || !registry || !name || !href || !install) {
      throw new Error(`${rel}: packages item ${i + 1} must be Registry | name | URL | install command`);
    }
    let url;
    try { url = new URL(href); } catch { throw new Error(`${rel}: packages item ${i + 1} has an invalid URL`); }
    if (url.protocol !== 'https:') throw new Error(`${rel}: packages item ${i + 1} must use an HTTPS URL`);
    return { registry, name, href, install };
  });
}

const projectsData = projectEntries.map(p => {
  for (const req of ['title', 'external', 'emoji', 'tags']) {
    if (p.meta[req] == null) throw new Error(`content/projects/${p.slug}.md: missing ${req}`);
  }
  if (typeof p.meta.external !== 'boolean') {
    throw new Error(`content/projects/${p.slug}.md: external must be true or false`);
  }
  if (Object.hasOwn(p.meta, 'kind')) {
    throw new Error(`content/projects/${p.slug}.md: kind is redundant; external is authoritative`);
  }
  if (typeof p.meta.emoji !== 'string' || !p.meta.emoji.trim()) {
    throw new Error(`content/projects/${p.slug}.md: emoji must be a non-empty string`);
  }
  if (!p.ja) throw new Error(`content/projects/${p.slug}.md: missing .ja.md sibling`);
  const longDesc = p.body.trim();
  const longDescJa = p.ja.body.trim();
  if (!longDesc) throw new Error(`content/projects/${p.slug}.md: missing description body`);
  if (!longDescJa) throw new Error(`content/projects/${p.slug}.ja.md: missing description body`);
  return {
    slug: p.slug,
    ...(p.meta.href && { href: p.meta.href }),
    title: p.meta.title,
    longDesc,
    longDesc_ja: longDescJa,
    packages: parsePackages(p.meta.packages, `content/projects/${p.slug}.md`),
    tags: p.meta.tags,
    tags_ja: p.ja.meta.tags,
    emoji: p.meta.emoji,
    external: p.meta.external,
    ...(p.meta.major && { major: true }),
    ...(p.meta.planned && { planned: true }),
    seoName: p.meta.seoName || null,
    seoUrl: p.meta.seoUrl || null,
  };
});

// --- submodule SEO: {sim}/about.md frontmatter → index + about-panel date ---

function regexEsc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function setMetaContent(html, attr, value, rel) {
  const re = new RegExp(`<meta(?=[^>]*\\s${regexEsc(attr)}(?:\\s|/?>))[^>]*>`, 'i');
  const match = html.match(re);
  if (!match) throw new Error(`${rel}: missing ${attr}`);
  if (!/\scontent="[^"]*"/i.test(match[0])) throw new Error(`${rel}: ${attr} has no content attribute`);
  return html.replace(re, match[0].replace(/\scontent="[^"]*"/i, ` content="${mdEsc(value)}"`));
}

const simDocs = projectsData
  .filter(p => !p.external && !p.planned)
  .map(project => {
    const rel = projectSource(project.slug, 'about.md');
    const doc = parseFrontmatter(rel);
    for (const req of ['name', 'title', 'description', 'updated']) {
      if (doc.meta[req] == null) throw new Error(`${rel}: missing ${req}`);
    }
    if (doc.meta.name !== project.title) {
      throw new Error(`${rel}: name must match content/projects/${project.slug}.md title`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(doc.meta.updated)) {
      throw new Error(`${rel}: updated must be YYYY-MM-DD`);
    }
    if (!doc.body.trim()) throw new Error(`${rel}: missing documentation body`);
    return { ...doc, project };
  });

for (const doc of simDocs) {
  const slug = doc.project.slug;
  const indexRel = `${slug}/index.html`;
  let html = readText(projectSource(slug, 'index.html'));
  const titleRe = /<title([^>]*)>[\s\S]*?<\/title>/i;
  if (!titleRe.test(html)) throw new Error(`${indexRel}: missing title`);
  html = html.replace(titleRe, `<title$1>${mdEsc(doc.meta.title)} | a9l.im</title>`);
  for (const attr of ['name="description"', 'property="og:description"', 'name="twitter:description"']) {
    html = setMetaContent(html, attr, doc.meta.description, indexRel);
  }
  for (const attr of ['property="og:title"', 'name="twitter:title"']) {
    html = setMetaContent(html, attr, doc.meta.title, indexRel);
  }
  const i18nMetaKeys = {
    'name="description"': 'meta.description',
    'property="og:title"': 'meta.ogTitle',
    'property="og:description"': 'meta.ogDescription',
    'name="twitter:title"': 'meta.twitterTitle',
    'name="twitter:description"': 'meta.twitterDescription',
  };
  for (const [attr, key] of Object.entries(i18nMetaKeys)) {
    const tagRe = new RegExp(`<meta(?=[^>]*\\s${regexEsc(attr)}(?:\\s|/?>))[^>]*>`, 'i');
    const match = html.match(tagRe);
    if (match && /data-i18n-content="[^"]*"/.test(match[0])) {
      html = html.replace(tagRe, match[0].replace(/data-i18n-content="[^"]*"/, `data-i18n-content="${key}"`));
    }
  }
  if (!/"description"\s*:\s*"[^"]*"/.test(html)) throw new Error(`${indexRel}: missing JSON-LD description`);
  html = html.replace(/("description"\s*:\s*)"[^"]*"/, `$1${JSON.stringify(doc.meta.description)}`);
  if (!/"dateModified"\s*:\s*"[^"]*"/.test(html)) throw new Error(`${indexRel}: missing JSON-LD dateModified`);
  html = html.replace(/("dateModified"\s*:\s*)"[^"]*"/, `$1${JSON.stringify(doc.meta.updated)}`);
  emit(indexRel, html);

  const uiCandidates = [`${slug}/main.js`, `${slug}/src/ui.js`]
    .filter(rel => existsSync(join(ROOT, projectSource(slug, rel.slice(slug.length + 1)))))
    .filter(rel => /lastUpdated\s*:/.test(readText(projectSource(slug, rel.slice(slug.length + 1)))));
  if (uiCandidates.length !== 1) {
    throw new Error(`${slug}: expected exactly one UI source with lastUpdated, found ${uiCandidates.length}`);
  }
  const uiRel = uiCandidates[0];
  const ui = readText(projectSource(slug, uiRel.slice(slug.length + 1))).replace(
    /(lastUpdated\s*:\s*['"])[^'"]+(['"])/,
    `$1${doc.meta.updated}$2`,
  );
  emit(uiRel, ui);

  const stringsRel = `${slug}/i18n/strings.js`;
  const stringsSource = projectSource(slug, 'i18n/strings.js');
  if (existsSync(join(ROOT, stringsSource))) {
    let strings = readText(stringsSource);
    const values = {
      'meta.title': `${doc.meta.title} | a9l.im`,
      'meta.description': doc.meta.description,
      'meta.ogTitle': doc.meta.title,
      'meta.ogDescription': doc.meta.description,
      'meta.twitterTitle': doc.meta.title,
      'meta.twitterDescription': doc.meta.description,
    };
    for (const [key, value] of Object.entries(values)) {
      const re = new RegExp(`^(\\s*['"]${regexEsc(key)}['"]\\s*:\\s*).*$`, 'm');
      if (!re.test(strings)) throw new Error(`${stringsRel}: missing English ${key}`);
      strings = strings.replace(re, `$1${JSON.stringify(value)},`);
    }
    emit(stringsRel, strings);
  }
}
console.log(`submodule SEO: ${simDocs.length} about pages synchronized`);

{
  const lines = [];
  for (const p of projectsData) {
    const o = ['    {'];
    if (p.href) o.push(`        href: ${JSON.stringify(p.href)},`);
    o.push(`        title: ${JSON.stringify(p.title)},`);
    o.push(`        longDesc: ${JSON.stringify(p.longDesc)},`);
    o.push(`        longDesc_ja: ${JSON.stringify(p.longDesc_ja)},`);
    if (p.packages.length) o.push(`        packages: ${JSON.stringify(p.packages)},`);
    o.push(`        tags: ${JSON.stringify(p.tags)},`);
    o.push(`        tags_ja: ${JSON.stringify(p.tags_ja)},`);
    o.push(`        emoji: ${JSON.stringify(p.emoji)},`);
    o.push(`        external: ${p.external},`);
    if (p.major) o.push('        major: true,');
    if (p.planned) o.push('        planned: true,');
    o.push('    },');
    lines.push(o.join('\n'));
  }
  const projectsJs = `// GENERATED by tools/build.mjs from content/projects/*.md — do not hand-edit.
// Single source of truth for the /sims and /projects grids (split by external,
// then by major/minor), consumed by projects-page.js. The worker's SSR
// mirrors and JSON-LD item lists are generated from the same content files
// into .build/content.generated.mjs, so the two can no longer drift.
export const PROJECTS = [
${lines.join('\n')}
];
`;
  emit('src/projects.js', projectsJs);
  console.log(`src/projects.js: ${projectsData.length} cards (from content/projects/)`);
}

// --- homepage: content/home/*.md → index.html regions + i18n dict + home-data ---
//
// Each card is one file (+ optional .ja.md). The build renders the EN
// markdown into `<!-- content:{name} -->…<!-- /content:{name} -->` regions
// in index.html and emits matching dictionary entries into the generated
// sections of i18n.js. Paragraphs with inline links/emphasis are split into
// per-segment spans mechanically — the old hand-maintained pre/link/post
// keys, but machine-made and structurally validated against the JA text.

const homeCards = {};
for (const slug of contentSlugs('content/home')) homeCards[slug] = loadContentPair('content/home', slug);
for (const req of ['site', 'bio', 'contact', 'now', 'hyperfixation', 'predictions',
  'ask-me-about', 'other-things']) {
  if (!homeCards[req]) throw new Error(`content/home/${req}.md missing`);
}

function mdBlocksOf(body) {
  return body.split(/\n{2,}/).map(b => b.replace(/^\n+|\n+$/g, '')).filter(b => b.trim());
}

function parseTableBlock(block, rel) {
  const lines = block.split('\n').filter(l => l.trim());
  if (!/^\|.*\|\s*$/.test(lines[0]) || !/^\|[\s:|-]+\|\s*$/.test(lines[1] || '')) {
    throw new Error(rel + ': expected a pipe table, got: ' + lines[0]);
  }
  const header = splitMarkdownTableRow(lines[0]);
  const rows = lines.slice(2).map((line, index) => {
    const row = splitMarkdownTableRow(line);
    if (row.length !== header.length) {
      throw new Error(`${rel}:${index + 3}: expected ${header.length} table cells, got ${row.length}`);
    }
    return row;
  });
  return { header, rows };
}

function parseListBlock(block, rel) {
  return block.split('\n').filter(l => l.trim()).map(l => {
    const m = l.match(/^[-*+]\s+(.*)$/);
    if (!m) throw new Error(rel + ': expected a list item, got: ' + l);
    return m[1];
  });
}

const i18nEn = {};
const i18nJa = {};

function i18nScalar(key, en, ja) {
  i18nEn[key] = en;
  if (ja != null) i18nJa[key] = ja;
}

// Tokenize markdown inline syntax into translatable segments.
function segmentInline(text) {
  const tokens = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) tokens.push({ type: 'text', text: text.slice(last, m.index) });
    if (m[1] !== undefined) tokens.push({ type: 'link', text: m[1], href: m[2] });
    else if (m[3] !== undefined) tokens.push({ type: 'strong', text: m[3] });
    else if (m[4] !== undefined) tokens.push({ type: 'em', text: m[4] });
    else tokens.push({ type: 'code', text: m[5] });
    last = re.lastIndex;
  }
  if (last < text.length) tokens.push({ type: 'text', text: text.slice(last) });
  return tokens;
}

// Render one translatable inline block as an element with data-i18n hooks,
// registering EN/JA dictionary entries. Multi-segment blocks are validated:
// the JA translation must have the same segment structure (and link targets)
// as the EN source, so a dropped link in a translation fails the build.
function i18nBlock(tag, key, en, ja, rel, attrs = '') {
  const enToks = segmentInline(en);
  const jaToks = ja != null ? segmentInline(ja) : null;
  if (jaToks) {
    if (jaToks.length !== enToks.length) {
      throw new Error(`${rel}: EN/JA segment count mismatch for ${key} (${enToks.length} vs ${jaToks.length})`);
    }
    enToks.forEach((t, i) => {
      if (t.type !== jaToks[i].type) throw new Error(`${rel}: EN/JA segment type mismatch at ${key}.s${i} (${t.type} vs ${jaToks[i].type})`);
      if (t.type === 'link' && t.href !== jaToks[i].href) throw new Error(`${rel}: EN/JA link href mismatch at ${key}.s${i}`);
    });
  }
  if (enToks.length === 1 && enToks[0].type === 'text') {
    i18nScalar(key, enToks[0].text, jaToks ? jaToks[0].text : null);
    return `<${tag}${attrs} data-i18n="${key}">${mdEsc(enToks[0].text)}</${tag}>`;
  }
  let inner = '';
  enToks.forEach((t, i) => {
    const k = `${key}.s${i}`;
    i18nScalar(k, t.text, jaToks ? jaToks[i].text : null);
    if (t.type === 'link') {
      const ext = /^https?:\/\//.test(t.href) ? ' target="_blank" rel="noopener noreferrer"' : '';
      inner += `<a href="${t.href}"${ext} data-i18n="${k}">${mdEsc(t.text)}</a>`;
    } else if (t.type === 'text') {
      inner += `<span data-i18n="${k}">${mdEsc(t.text)}</span>`;
    } else {
      const tg = t.type === 'strong' ? 'strong' : t.type === 'em' ? 'em' : 'code';
      inner += `<${tg} data-i18n="${k}">${mdEsc(t.text)}</${tg}>`;
    }
  });
  return `<${tag}${attrs}>${inner}</${tag}>`;
}

const regions = {};
const IND = '                '; // base indent inside home cards (4 levels)

// bio — prose paragraphs
{
  const c = homeCards['bio'];
  const en = mdBlocksOf(c.body), ja = mdBlocksOf(c.ja.body);
  if (en.length !== ja.length) throw new Error('content/home/bio: EN/JA paragraph count mismatch');
  regions.bio = en.map((p, i) => IND + '    ' + i18nBlock('p', `c.bio.p${i + 1}`, p, ja[i], 'content/home/bio.md')).join('\n');
}

// contact — heading + blurb (socials list stays hand-edited in index.html)
{
  const c = homeCards['contact'];
  i18nScalar('c.contact.h', c.meta.heading, c.ja.meta.heading);
  const en = mdBlocksOf(c.body), ja = mdBlocksOf(c.ja.body);
  regions.contact = [
    IND + `<h3 id="home-contact-h" data-i18n="c.contact.h">${mdEsc(c.meta.heading)}</h3>`,
    IND + i18nBlock('p', 'c.contact.p1', en[0], ja[0], 'content/home/contact.md'),
  ].join('\n');
}

// now — heading + 2-col table → SSR fallback <dl> rows + home-data pairs
let homeNow, homeNowJa;
{
  const c = homeCards['now'];
  i18nScalar('c.now.h', c.meta.heading, c.ja.meta.heading);
  const t = parseTableBlock(c.body, 'content/home/now.md');
  const tja = parseTableBlock(c.ja.body, 'content/home/now.ja.md');
  if (t.rows.length !== tja.rows.length) throw new Error('content/home/now: EN/JA row count mismatch');
  homeNow = t.rows;
  homeNowJa = tja.rows;
  const dl = t.rows.map(([k, v], i) => {
    i18nScalar(`c.now.r${i}.k`, k, tja.rows[i][0]);
    i18nScalar(`c.now.r${i}.v`, v, tja.rows[i][1]);
    return IND + `        <dt class="home-now-k" data-i18n="c.now.r${i}.k">${mdEsc(k)}</dt><dd class="home-now-v" data-i18n="c.now.r${i}.v">${mdEsc(v)}</dd>`;
  }).join('\n');
  regions.now = [
    IND + `    <h2 class="home-h" id="home-now-heading" data-i18n="c.now.h">${mdEsc(c.meta.heading)}</h2>`,
    IND + '    <!-- home.js re-renders this dl from home-data.json on hydration; these rows are the SSR fallback. -->',
    IND + '    <dl class="home-now" id="home-now">',
    dl,
    IND + '    </dl>',
  ].join('\n');
}

// hyperfixation — heading label from frontmatter; card body is JS-hydrated
let homeFix, homeFixJa;
{
  const c = homeCards['hyperfixation'];
  i18nScalar('c.fix.label', c.meta.label, c.ja.meta.label);
  const body = mdBlocksOf(c.body).join('\n\n');
  const bodyJa = mdBlocksOf(c.ja.body).join('\n\n');
  homeFix = { label: c.meta.label, title: c.meta.title, body, link: c.meta.link, linkLabel: c.meta.linkLabel };
  homeFixJa = { label: c.ja.meta.label, title: c.ja.meta.title, body: bodyJa, link: c.ja.meta.link, linkLabel: c.ja.meta.linkLabel };
  regions.hyperfixation = IND + `    <h2 class="home-h" id="home-fix-heading"><span id="home-fix-label" data-i18n="c.fix.label">${mdEsc(c.meta.label)}</span></h2>`;
}

// predictions — heading, rows, and column labels from table
let homePred, homePredJa;
{
  const c = homeCards['predictions'];
  i18nScalar('c.pred.h', c.meta.heading, c.ja.meta.heading);
  const t = parseTableBlock(c.body, 'content/home/predictions.md');
  const tja = parseTableBlock(c.ja.body, 'content/home/predictions.ja.md');
  if (t.rows.length !== tja.rows.length) throw new Error('content/home/predictions: EN/JA row count mismatch');
  homePred = t.rows;
  homePredJa = tja.rows;
  const ths = t.header.map((h, i) => {
    i18nScalar(`c.pred.th${i}`, h, tja.header[i]);
    return `<th scope="col" data-i18n="c.pred.th${i}">${mdEsc(h)}</th>`;
  }).join('');
  regions.predictions = [
    IND + `    <h2 class="home-h" id="home-pred-heading" data-i18n="c.pred.h">${mdEsc(c.meta.heading)}</h2>`,
    IND + '    <table class="home-pred" id="home-pred">',
    IND + '        <thead>',
    IND + `            <tr>${ths}</tr>`,
    IND + '        </thead>',
    IND + '        <tbody></tbody>',
    IND + '    </table>',
  ].join('\n');
}

// ask-me-about — chips list (JS-hydrated) + optional contact hint paragraph
let homeChips, homeChipsJa;
{
  const c = homeCards['ask-me-about'];
  i18nScalar('c.ama.h', c.meta.heading, c.ja.meta.heading);
  const [listEn, hintEn] = mdBlocksOf(c.body);
  const [listJa, hintJa] = mdBlocksOf(c.ja.body);
  homeChips = parseListBlock(listEn, 'content/home/ask-me-about.md');
  homeChipsJa = parseListBlock(listJa, 'content/home/ask-me-about.ja.md');
  if (homeChips.length !== homeChipsJa.length) throw new Error('content/home/ask-me-about: EN/JA chip count mismatch');
  if ((hintEn === undefined) !== (hintJa === undefined)) {
    throw new Error('content/home/ask-me-about: EN/JA hint presence mismatch');
  }
  const region = [
    IND + `    <h2 class="home-h" id="home-ama-heading" data-i18n="c.ama.h">${mdEsc(c.meta.heading)}</h2>`,
    IND + '    <div class="home-chips" id="home-chips"></div>',
  ];
  if (hintEn !== undefined) {
    region.push(IND + '    ' + i18nBlock('p', 'c.ama.hint', hintEn, hintJa, 'content/home/ask-me-about.md', ' class="home-chips-hint"'));
  }
  regions['ask-me-about'] = region.join('\n');
}

// other-things — heading + list
{
  const c = homeCards['other-things'];
  i18nScalar('c.other.h', c.meta.heading, c.ja.meta.heading);
  const en = parseListBlock(mdBlocksOf(c.body)[0], 'content/home/other-things.md');
  const ja = parseListBlock(mdBlocksOf(c.ja.body)[0], 'content/home/other-things.ja.md');
  if (en.length !== ja.length) throw new Error('content/home/other-things: EN/JA item count mismatch');
  regions['other-things'] = [
    IND + `    <h2 class="home-h" id="home-other-heading" data-i18n="c.other.h">${mdEsc(c.meta.heading)}</h2>`,
    IND + '    <ul class="home-other">',
    ...en.map((li, i) => IND + '        ' + i18nBlock('li', `c.other.li${i + 1}`, li, ja[i], 'content/home/other-things.md')),
    IND + '    </ul>',
  ].join('\n');
}

// site — <head> metadata + per-route titles/descriptions
const site = homeCards['site'].meta;
const siteJa = homeCards['site'].ja.meta;
for (const req of ['titleShort', 'title', 'description', 'descriptionShort', 'ogImageAlt',
  'discoveryDescription', 'aboutIntro', 'updated', 'simsTitle', 'simsDesc',
  'projectsTitle', 'projectsDesc', 'blogTitle', 'blogDesc']) {
  if (site[req] == null) throw new Error('content/home/site.md: missing ' + req);
}
i18nScalar('c.site.titleShort', site.titleShort, siteJa.titleShort);
i18nScalar('c.site.title', site.title, siteJa.title);
i18nScalar('c.site.description', site.description, siteJa.description);
i18nScalar('c.site.descriptionShort', site.descriptionShort, siteJa.descriptionShort);
i18nScalar('c.site.ogImageAlt', site.ogImageAlt, siteJa.ogImageAlt);

const ROUTE_META_GEN = {
  '/sims': { title: site.simsTitle, desc: site.simsDesc, ogTitle: site.simsTitle },
  '/projects': { title: site.projectsTitle, desc: site.projectsDesc, ogTitle: site.projectsTitle },
  '/blog': { title: site.blogTitle, desc: site.blogDesc, ogTitle: site.blogTitle },
};

const HOME_META_GEN = {
  title: site.titleShort,
  desc: site.description,
  ogTitle: site.title,
  twitterDesc: site.descriptionShort,
  title_ja: siteJa.titleShort,
  desc_ja: siteJa.description,
  ogTitle_ja: siteJa.title,
  twitterDesc_ja: siteJa.descriptionShort,
};

// Inject regions + head metadata into index.html (in place, idempotent).
{
  let html = readText('site/index.html');
  for (const [name, content] of Object.entries(regions)) {
    const re = new RegExp(`(<!-- content:${name} [^>]*-->)[\\s\\S]*?(<!-- /content:${name} -->)`);
    if (!re.test(html)) throw new Error('index.html: missing region markers for ' + name);
    html = html.replace(re, (_, open, close) => `${open}\n${content}\n${IND}${close}`);
  }
  const headTag = (re, replacement, what) => {
    if (!re.test(html)) throw new Error('index.html <head>: could not find ' + what);
    html = html.replace(re, replacement);
  };
  headTag(/<title[^>]*>[^<]*<\/title>/,
    `<title data-i18n="c.site.titleShort">${mdEsc(site.titleShort)}</title>`, 'title');
  headTag(/<meta name="description"[^>]*>/,
    `<meta name="description" data-i18n-content="c.site.description" content="${mdEsc(site.description)}">`, 'meta description');
  headTag(/<meta property="og:title"[^>]*>/,
    `<meta property="og:title" data-i18n-content="c.site.title" content="${mdEsc(site.title)}">`, 'og:title');
  headTag(/<meta property="og:description"[^>]*>/,
    `<meta property="og:description" data-i18n-content="c.site.description" content="${mdEsc(site.description)}">`, 'og:description');
  headTag(/<meta property="og:image:alt"[^>]*>/,
    `<meta property="og:image:alt" data-i18n-content="c.site.ogImageAlt" content="${mdEsc(site.ogImageAlt)}">`, 'og:image:alt');
  headTag(/<meta name="twitter:image:alt"[^>]*>/,
    `<meta name="twitter:image:alt" data-i18n-content="c.site.ogImageAlt" content="${mdEsc(site.ogImageAlt)}">`, 'twitter:image:alt');
  headTag(/<meta name="twitter:title"[^>]*>/,
    `<meta name="twitter:title" data-i18n-content="c.site.title" content="${mdEsc(site.title)}">`, 'twitter:title');
  headTag(/<meta name="twitter:description"[^>]*>/,
    `<meta name="twitter:description" data-i18n-content="c.site.descriptionShort" content="${mdEsc(site.descriptionShort)}">`, 'twitter:description');

  const rootLdRe = /<script type="application\/ld\+json">\s*(\{[\s\S]*?\})\s*<\/script>/;
  const rootLdMatch = html.match(rootLdRe);
  if (!rootLdMatch) throw new Error('index.html: missing root JSON-LD graph');
  const rootLd = JSON.parse(rootLdMatch[1]);
  const website = rootLd['@graph']?.find(node => node['@type'] === 'WebSite');
  const simList = rootLd['@graph']?.find(node => node['@type'] === 'ItemList' && node.name === 'Simulations');
  if (!website || !simList) throw new Error('index.html: root JSON-LD graph is missing WebSite or Simulations ItemList');
  website.description = site.discoveryDescription;
  website.dateModified = site.updated;
  simList.itemListElement = projectsData
    .filter(p => !p.external && !p.planned && p.seoName)
    .map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: p.seoUrl || SITE + p.href,
      name: p.seoName,
    }));
  html = html.replace(rootLdRe, `<script type="application/ld+json">\n${JSON.stringify(rootLd, null, 2)}\n    </script>`);
  emit('index.html', html);
  console.log(`index.html: ${Object.keys(regions).length} content regions + head metadata injected`);
}

// Inject generated dictionary sections into i18n.js (in place, idempotent).
{
  let js = readText('site/i18n.js');
  const inject = (lang, entries) => {
    const start = `// == GENERATED CONTENT (${lang}) — from content/home/, via tools/build.mjs; edit there ==`;
    const end = `// == END GENERATED CONTENT (${lang}) ==`;
    const re = new RegExp(`(${start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})[\\s\\S]*?(${end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`);
    if (!re.test(js)) throw new Error(`i18n.js: missing generated-content markers for ${lang}`);
    const body = Object.entries(entries).map(([k, v]) => `        ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join('\n');
    js = js.replace(re, (_, open, close) => `${open}\n${body}\n        ${close}`);
  };
  inject('en', i18nEn);
  inject('ja', i18nJa);
  emit('i18n.js', js);
  console.log(`i18n.js: ${Object.keys(i18nEn).length} EN + ${Object.keys(i18nJa).length} JA generated entries`);
}

// Validate: every data-i18n key referenced in index.html must exist in the
// final dictionary (hand-written sections + generated ones).
{
  const html = readFileSync(join(DIST, 'index.html'), 'utf8');
  const js = readFileSync(join(DIST, 'i18n.js'), 'utf8');
  const dictKeys = new Set([...js.matchAll(/^\s*(?:'([^']+)'|"([^"]+)"):/gm)].map(m => m[1] || m[2]));
  const used = [...html.matchAll(/data-i18n(?:-title|-aria|-content|-alt|-href)?="([^"]+)"/g)].map(m => m[1]);
  const missing = used.filter(k => !dictKeys.has(k));
  if (missing.length) throw new Error('index.html references i18n keys missing from i18n.js: ' + missing.join(', '));
}

// --- worker content module: SSR mirrors + blog/route metadata ---

function ssrCard(p) {
  const tagSpans = p.tags.map(t => `<span class="tag">${mdEsc(t)}</span>`).join('');
  const emoji = `<span class="project-emoji" aria-hidden="true">${mdEsc(p.emoji)}</span>`;
  const packageCards = p.packages.length
    ? `<div class="project-packages" aria-label="Available package registries">${p.packages.map(pkg => `<a class="project-package" href="${mdEsc(pkg.href)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${mdEsc(pkg.name)} on ${mdEsc(pkg.registry)}"><code class="project-package-install">${mdEsc(pkg.install)}</code></a>`).join('')}</div>`
    : '';
  const footer = `<div class="project-card-footer">${packageCards}<div class="project-tags">${tagSpans}</div></div>`;
  if (p.planned) {
    return `<article class="project-card project-card-planned"><div class="project-card-main"><div class="project-card-top">${emoji}<h3 class="project-title">${mdEsc(p.title)}</h3><span class="project-planned-tag">planned</span></div><p>${mdEsc(p.longDesc)}</p></div>${footer}</article>`;
  }
  const ext = p.external ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `<article class="project-card fade-in visible"><a class="project-card-main" href="${p.href}"${ext}><div class="project-card-top">${emoji}<h3 class="project-title">${mdEsc(p.title)}</h3></div><p>${mdEsc(p.longDesc)}</p></a>${footer}</article>`;
}

function ssrGrid(list) {
  const major = list.filter(p => p.major);
  const minor = list.filter(p => !p.major);
  const parts = (major.length && minor.length)
    ? ['<h2 class="section-label">Major</h2>', ...major.map(ssrCard), '<h2 class="section-label">Minor</h2>', ...minor.map(ssrCard)]
    : list.map(ssrCard);
  return '\n' + parts.join('\n') + '\n';
}

// JSON-LD ItemList entries; planned cards and cards without seoName are skipped.
function itemList(list) {
  return list.filter(p => !p.planned && p.seoName).map((p, i) => ({
    position: i + 1,
    name: p.seoName,
    url: p.seoUrl || (p.external ? p.href : SITE + p.href),
  }));
}

const simsData = projectsData.filter(p => !p.external);
const projsData = projectsData.filter(p => p.external);

const blogMeta = {};
for (const p of posts) {
  blogMeta[p.slug] = {
    title: `${p.title} | a9l.im`,
    desc: p.excerpt,
    ogTitle: `${p.title} | a9l.im`,
    ...(p.title_ja && {
      title_ja: `${p.title_ja} | a9l.im`,
      desc_ja: p.excerpt_ja,
      ogTitle_ja: `${p.title_ja} | a9l.im`,
    }),
  };
}

{
  const mod = `// GENERATED by tools/build.mjs from content/ — do not hand-edit.
// Browser-side metadata for SPA navigation. The Worker consumes the same
// ROUTE_META and BLOG_META values from .build/content.generated.mjs.

export const HOME_META = ${JSON.stringify(HOME_META_GEN, null, 2)};

export const ROUTE_META = ${JSON.stringify(ROUTE_META_GEN, null, 2)};

export const BLOG_META = ${JSON.stringify(blogMeta, null, 2)};
`;
  emit('src/route-meta.js', mod);
  console.log('src/route-meta.js: generated SPA metadata');
}

{
  const mod = `// GENERATED by tools/build.mjs from content/ — do not hand-edit.
// Imported by worker/index.js and bundled into the deployed Worker. Carries the
// SSR mirrors of the project grids, per-route and per-post SEO metadata,
// and the JSON-LD item lists for /sims and /projects.

export const ROUTE_META = ${JSON.stringify(ROUTE_META_GEN, null, 2)};

export const BLOG_META = ${JSON.stringify(blogMeta, null, 2)};

export const SIMS_SSR = ${JSON.stringify(ssrGrid(simsData))};

export const PROJECTS_SSR = ${JSON.stringify(ssrGrid(projsData))};

export const SIMS_ITEMLIST = ${JSON.stringify(itemList(simsData), null, 2)};

export const PROJECTS_ITEMLIST = ${JSON.stringify(itemList(projsData), null, 2)};
`;
  emitInternal('content.generated.mjs', mod);
  console.log('.build/content.generated.mjs: generated');
}

function projectUrl(p) {
  return p.seoUrl || (p.external ? p.href : SITE + p.href);
}

function projectDescription(p) {
  const doc = simDocs.find(d => d.project.slug === p.slug);
  return doc ? doc.meta.description : p.longDesc;
}

function discoveryList(list) {
  return list.map(p => `- [${p.title}](${projectUrl(p)}): ${projectDescription(p)}`).join('\n');
}

const shippedSims = projectsData.filter(p => !p.external && !p.planned);
const shippedProjects = projectsData.filter(p => p.external && !p.planned);
const rootAboutBody = [
  '# About a9l.im',
  '',
  site.aboutIntro,
  '',
  '## Simulations',
  '',
  discoveryList(shippedSims),
  '',
  '## Open-source projects',
  '',
  discoveryList(shippedProjects),
  '',
  '## Technical approach',
  '',
  'The portfolio uses vanilla JavaScript, HTML, and CSS with a shared root design system. Cloudflare Workers + Assets provides SPA routing, edge-rendered crawler content, security headers, and caching. Hand-edited copy lives in `content/`; `tools/build.mjs` derives the browser, feed, sitemap, and machine-readable surfaces.',
  '',
  '## Contact',
  '',
  'mx@a9l.im | [GitHub](https://github.com/a9lim) | [Twitter](https://twitter.com/_a9lim)',
  '',
  '## License',
  '',
  'The portfolio and its projects are licensed under AGPL-3.0.',
  '',
].join('\n');

const discoveryFrontmatter = (title, url, description) => [
  '---',
  `title: ${title}`,
  `url: ${url}`,
  `description: ${description}`,
  'language: en',
  'license: AGPL-3.0',
  `updated: ${site.updated}`,
  '---',
  '',
  '',
].join('\n');

emit('about.md', discoveryFrontmatter('About a9l.im', `${SITE}/about.md`, site.discoveryDescription) + rootAboutBody);

const llms = [
  discoveryFrontmatter('a9l.im', SITE, site.discoveryDescription).trimEnd(),
  '',
  '# a9l.im',
  '',
  `> ${site.discoveryDescription}`,
  '',
  '## Simulations',
  '',
  discoveryList(shippedSims),
  '',
  '## Projects',
  '',
  discoveryList(shippedProjects),
  '',
  '## Blog',
  '',
  ...posts.map(p => `- [${p.title}](${SITE}/blog/${p.slug}): ${p.excerpt}`),
  '',
  '## Full documentation',
  '',
  `- [llms-full.txt](${SITE}/llms-full.txt): Expanded simulation documentation and complete blog posts`,
  '',
].join('\n');
emit('llms.txt', llms);
console.log(`about.md + llms.txt: ${shippedSims.length} simulations, ${shippedProjects.length} projects`);

{
  const rows = simDocs.map(doc => {
    const description = doc.meta.description.replace(/\|/g, '\\|');
    return `| [${doc.meta.name}](${projectUrl(doc.project)}) | ${description} |`;
  });
  const table = ['| Project | Description |', '|---------|-------------|', ...rows].join('\n');
  let readme = readText('README.md');
  const re = /(<!-- content:sim-table [^>]*-->)[\s\S]*?(<!-- \/content:sim-table -->)/;
  if (!re.test(readme)) throw new Error('README.md: missing generated sim-table markers');
  readme = readme.replace(re, `$1\n${table}\n$2`);
  emit('README.md', readme);
}

// --- collect URLs ---

const urls = [];

const simPath = doc => new URL(projectUrl(doc.project)).pathname;

// Every route has a social image, but only major simulations own a bespoke
// card. Smaller simulations deliberately share the root card.
const IMAGE_MAP = { '/': ['og-image.webp'] };
const IMAGE_CAPTIONS = { '/': site.discoveryDescription };
for (const doc of simDocs) {
  const hasBespokeCard = doc.project.major === true;
  IMAGE_MAP[simPath(doc)] = [hasBespokeCard ? `${doc.project.slug}/og-image.webp` : 'og-image.webp'];
  IMAGE_CAPTIONS[simPath(doc)] = hasBespokeCard ? doc.meta.description : site.discoveryDescription;
}

function add(path, lastmod, images, changefreq, priority, imageCaption) {
  urls.push({ loc: SITE + path, lastmod: lastmod || today(), images: images || null, changefreq: changefreq || null, priority: priority != null ? priority : null, imageCaption: imageCaption || null });
}

// 1. Static routes
const staticRoutes = [
  { path: '/',         lastmod: site.updated, changefreq: 'weekly',  priority: 1.0 },
  { path: '/sims',     lastmod: site.updated, changefreq: 'monthly', priority: 0.8 },
  { path: '/projects', lastmod: site.updated, changefreq: 'monthly', priority: 0.8 },
  { path: '/blog',     lastmod: site.updated, changefreq: 'monthly', priority: 0.8 },
  ...simDocs.map(doc => ({ path: simPath(doc), lastmod: doc.meta.updated, changefreq: 'monthly', priority: 0.9 })),
];

for (const r of staticRoutes) {
  add(r.path, r.lastmod, IMAGE_MAP[r.path] || null, r.changefreq, r.priority, IMAGE_CAPTIONS[r.path] || null);
}

// 1b. Scripture work-level routes
const workIds = readJSON('projects/scripture/data/works.json');
for (const workId of workIds) {
  const workLastmod = gitLastmod(`projects/scripture/data/${workId}/manifest.json`);
  add(`/scripture/${workId}`, workLastmod, null, 'monthly', 0.7);
}

// 2. Blog posts (loaded from content/posts/ above)
for (const p of posts) {
  add(`/blog/${p.slug}`, p.updated || p.date, null, 'yearly', 0.6);
}

// 3. Scripture deep routes

for (const workId of workIds) {
  const manifest = readJSON(`projects/scripture/data/${workId}/manifest.json`);
  const workLastmod = gitLastmod(`projects/scripture/data/${workId}/manifest.json`);

  for (const book of manifest.books) {
    const start = book.start || 1;
    for (let i = 0; i < book.chapters; i++) {
      const chapterId = `${book.id}-${start + i}`;
      add(`/scripture/${workId}/${chapterId}`, workLastmod, null, 'yearly', 0.65);
    }
  }
}

// --- generate sitemaps ---

// Split URLs into main (root, projects, blog, sims) and scripture (work-level + chapters)
const scriptureChapterPattern = /^https:\/\/a9l\.im\/scripture\/[^/]+\/.+$/;
const scriptureWorkPattern = /^https:\/\/a9l\.im\/scripture\/[^/]+$/;
const scriptureIndexPattern = /^https:\/\/a9l\.im\/scripture\/$/;

const mainUrls = [];
const scriptureUrls = [];

for (const u of urls) {
  if ((scriptureChapterPattern.test(u.loc) || scriptureWorkPattern.test(u.loc)) && !scriptureIndexPattern.test(u.loc)) {
    scriptureUrls.push(u);
  } else {
    mainUrls.push(u);
  }
}

function renderUrlset(urlList) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...urlList.map(u => {
      const parts = [`  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>${u.changefreq ? `\n    <changefreq>${u.changefreq}</changefreq>` : ''}${u.priority != null ? `\n    <priority>${u.priority}</priority>` : ''}`];
      if (u.images) {
        for (const img of u.images) {
          const imgTitle = u.loc.replace(SITE, '').replace(/\/$/, '').slice(1) || 'a9l.im';
          const captionTag = u.imageCaption ? `\n      <image:caption>${escXml(u.imageCaption)}</image:caption>` : '';
          parts.push(`    <image:image>\n      <image:loc>${SITE}/${img}</image:loc>\n      <image:title>${escXml(imgTitle)}</image:title>${captionTag}\n    </image:image>`);
        }
      }
      parts.push('  </url>');
      return parts.join('\n');
    }),
    '</urlset>',
    ''
  ].join('\n');
}

emit('sitemap-main.xml', renderUrlset(mainUrls));
console.log(`sitemap-main.xml: ${mainUrls.length} URLs`);

emit('sitemap-scripture.xml', renderUrlset(scriptureUrls));
console.log(`sitemap-scripture.xml: ${scriptureUrls.length} URLs`);

// Sitemap index
const mainLastmod = mainUrls.reduce((max, u) => u.lastmod > max ? u.lastmod : max, mainUrls[0]?.lastmod || today());
const scriptureLastmod = scriptureUrls.reduce((max, u) => u.lastmod > max ? u.lastmod : max, scriptureUrls[0]?.lastmod || today());

const sitemapIndex = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  `  <sitemap>`,
  `    <loc>${SITE}/sitemap-main.xml</loc>`,
  `    <lastmod>${mainLastmod}</lastmod>`,
  `  </sitemap>`,
  `  <sitemap>`,
  `    <loc>${SITE}/sitemap-scripture.xml</loc>`,
  `    <lastmod>${scriptureLastmod}</lastmod>`,
  `  </sitemap>`,
  '</sitemapindex>',
  ''
].join('\n');

emit('sitemap.xml', sitemapIndex);
console.log(`sitemap.xml: sitemap index (${urls.length} total URLs)`);

// --- generate feed.xml (RSS 2.0) ---

const postItems = posts.map(p => {
  const mdSrc = postEntryBySlug.get(p.slug).body;
  const htmlContent = parseMarkdown(mdSrc);
  const firstPara = p.excerpt || mdSrc.split(/\n\n/)[0].replace(/[*_`\[\]()#>!]/g, '').trim();
  return `    <item>
      <title>${escXml(p.title)}</title>
      <link>${SITE}/blog/${p.slug}</link>
      <guid isPermaLink="true">${SITE}/blog/${p.slug}</guid>
      <pubDate>${rfc2822(p.date)}</pubDate>
      ${(Array.isArray(p.tag) ? p.tag : [p.tag]).filter(Boolean).map(t => `<category>${escXml(t)}</category>`).join('\n      ')}
      <description>${escXml(firstPara)}</description>
      <content:encoded><![CDATA[${htmlContent}]]></content:encoded>
    </item>`;
});

const latestDate = rfc2822(posts.reduce((max, p) => {
  const d = p.updated || p.date;
  return d > max ? d : max;
}, posts[0]?.date || today()));

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>a9l.im</title>
    <link>${SITE}</link>
    <description>${escXml(site.discoveryDescription)}</description>
    <language>en-us</language>
    <lastBuildDate>${latestDate}</lastBuildDate>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE}/icon-192.png</url>
      <title>a9l.im</title>
      <link>${SITE}</link>
    </image>
    <managingEditor>mx@a9l.im (a9lim)</managingEditor>
    <ttl>60</ttl>
${postItems.join('\n')}
  </channel>
</rss>
`;

emit('feed.xml', rss);
console.log(`feed.xml: ${posts.length} items`);

// --- generate feed.atom ---

const atomEntries = posts.map(p => {
  const mdSrc = postEntryBySlug.get(p.slug).body;
  const htmlContent = parseMarkdown(mdSrc);
  const firstPara = p.excerpt || mdSrc.split(/\n\n/)[0].replace(/[*_`\[\]()#>!]/g, '').trim();
  const categories = (Array.isArray(p.tag) ? p.tag : [p.tag]).filter(Boolean).map(t => `    <category term="${escXml(t)}"/>`).join('\n');
  return `  <entry>
    <title>${escXml(p.title)}</title>
    <link href="${SITE}/blog/${p.slug}" rel="alternate"/>
    <id>${SITE}/blog/${p.slug}</id>
    <published>${isoTimestamp(p.date)}</published>
    <updated>${isoTimestamp(p.updated || p.date)}</updated>
    <author>
      <name>a9lim</name>
      <uri>${SITE}/</uri>
    </author>
    <summary>${escXml(firstPara)}</summary>${categories ? '\n' + categories : ''}
    <content type="html"><![CDATA[${htmlContent}]]></content>
  </entry>`;
});

const latestIso = isoTimestamp(posts.reduce((max, p) => {
  const d = p.updated || p.date;
  return d > max ? d : max;
}, posts[0]?.date || today()));

const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>a9l.im</title>
  <subtitle>${escXml(site.discoveryDescription)}</subtitle>
  <link href="${SITE}/feed.atom" rel="self" type="application/atom+xml"/>
  <link href="${SITE}" rel="alternate" type="text/html"/>
  <id>${SITE}/</id>
  <updated>${latestIso}</updated>
  <author>
    <name>a9lim</name>
    <uri>${SITE}/</uri>
  </author>
${atomEntries.join('\n')}
</feed>
`;

emit('feed.atom', atom);
console.log(`feed.atom: ${posts.length} entries`);

// --- generate llms-full.txt ---

const llmsParts = [
  discoveryFrontmatter('a9l.im Full Documentation', `${SITE}/llms-full.txt`, site.discoveryDescription).trimEnd(),
  '',
  '# a9l.im — Full Documentation',
  '',
  `> ${site.discoveryDescription}`,
  '',
  'See also: [llms.txt](https://a9l.im/llms.txt)',
  '',
  rootAboutBody,
  '',
];

// Project about pages
for (const doc of simDocs) {
  llmsParts.push('---', '', doc.body.trim(), '');
}

// Blog posts
llmsParts.push('---', '', '# Blog Posts', '');
for (const p of posts) {
  llmsParts.push(`## ${p.title}`, '', `*${p.date}*`, '');
  llmsParts.push(postEntryBySlug.get(p.slug).body.trim(), '');
}

emit('llms-full.txt', llmsParts.join('\n'));
console.log('llms-full.txt: generated');

if (CHECK) {
  if (checkFailures.length) {
    console.error('STALE generated artifacts — canonical content was not followed by `node tools/build.mjs`:');
    for (const f of [...new Set(checkFailures)]) console.error('  ' + f);
    process.exit(1);
  }
  console.log('--check: all deterministic content and SEO artifacts are current');
  process.exit(0);
}

// --- generate home-data.json (content fields + last-deploy marker) ---

function gitLastDeploy() {
  try {
    const raw = execFileSync(
      'git',
      ['log', '-1', '--format=%h\x1f%aI\x1f%s'],
      { cwd: ROOT, encoding: 'utf8' }
    ).trim();
    if (!raw) return null;
    const [hash, iso, subject] = raw.split('\x1f');
    return { hash, iso, subject };
  } catch { return null; }
}

const lastDeploy = gitLastDeploy();
const homeData = {
  generatedAt: new Date().toISOString(),
  lastDeploy,
  // Content-sourced homepage fields (from content/home/), hydrated by src/home.js.
  now: homeNow,
  now_ja: homeNowJa,
  hyperfixation: homeFix,
  hyperfixation_ja: homeFixJa,
  predictions: homePred,
  predictions_ja: homePredJa,
  askMeAbout: homeChips,
  askMeAbout_ja: homeChipsJa,
};

writeFileSync(join(DIST, 'home-data.json'), JSON.stringify(homeData, null, 2) + '\n');
console.log('home-data.json: homepage content + deploy marker');

// --- build resume.pdf via Tectonic ---

const resumeOutput = join(DIST, 'resume.pdf');
const resumeBuild = spawnSync('bash', [join(ROOT, 'content/resume/build.sh'), resumeOutput], { stdio: 'inherit' });
if (resumeBuild.error) throw resumeBuild.error;
if (resumeBuild.status !== 0) throw new Error('resume.pdf: build failed (exit ' + resumeBuild.status + ')');
if (!existsSync(resumeOutput)) throw new Error('resume.pdf: build reported success without producing an artifact');
