#!/usr/bin/env node
// Consistency checks for the content/ pipeline. Verifies that the generated
// artifacts agree with each other and with the content/ source tree.
// Run: node tests/content-pipeline/run.mjs
// (`node tools/build.mjs --check` separately verifies the artifacts are current.)

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = join(ROOT, 'dist');
const BUILD = join(ROOT, '.build');
let failures = 0;
function check(name, ok, detail = '') {
  if (ok) { console.log('  ok: ' + name); return; }
  failures++;
  console.error('  FAIL: ' + name + (detail ? ' — ' + detail : ''));
}
const enSlugs = dir => readdirSync(join(ROOT, dir))
  .filter(f => f.endsWith('.md') && !f.endsWith('.ja.md'))
  .map(f => f.replace(/\.md$/, ''));

const { PROJECTS } = await import(join(DIST, 'src/projects.js'));
const gen = await import(join(BUILD, 'content.generated.mjs'));
const posts = JSON.parse(readFileSync(join(DIST, 'posts.json'), 'utf8'));

console.log('content/projects ↔ src/projects.js ↔ _content.generated.mjs');
const projSlugs = enSlugs('content/projects');
check('card count matches content files', PROJECTS.length === projSlugs.length,
  `${PROJECTS.length} vs ${projSlugs.length}`);
for (const p of PROJECTS) {
  const ssr = p.kind === 'sim' ? gen.SIMS_SSR : gen.PROJECTS_SSR;
  check(`${p.title} has a decorative mark`, typeof p.emoji === 'string' && p.emoji.trim().length > 0);
  check(`SSR mirror carries ${p.title}`, ssr.includes(`<h3 class="project-title">${p.title.replace(/&/g, '&amp;')}</h3>`));
  check(`SSR mirror carries ${p.title}'s emoji`, ssr.includes(`<span class="project-emoji" aria-hidden="true">${p.emoji}</span>`));
  for (const pkg of p.packages || []) {
    check(`SSR mirror carries ${p.title}'s ${pkg.registry} link`, ssr.includes(`href="${pkg.href}"`));
  }
}
check('project data contains no legacy SVG icon field', PROJECTS.every(p => !Object.hasOwn(p, 'icon')));
check('project data uses one description field', PROJECTS.every(p =>
  typeof p.longDesc === 'string' && typeof p.longDesc_ja === 'string'
  && !Object.hasOwn(p, 'shortDesc') && !Object.hasOwn(p, 'shortDesc_ja')));
const itemNames = [...gen.SIMS_ITEMLIST, ...gen.PROJECTS_ITEMLIST].map(i => i.name);
for (const p of PROJECTS.filter(p => !p.planned)) {
  check(`ItemList carries ${p.title}`, itemNames.some(n => n.startsWith(p.title)));
}
check('planned cards stay out of ItemLists',
  !PROJECTS.filter(p => p.planned).some(p => itemNames.some(n => n.startsWith(p.title))));

console.log('content/posts ↔ posts.json ↔ BLOG_META');
const postSlugs = enSlugs('content/posts');
check('post count matches content files', posts.length === postSlugs.length);
for (const p of posts) {
  check(`content/posts/${p.slug}.md is canonical and carries frontmatter`,
    readFileSync(join(ROOT, 'content', 'posts', p.slug + '.md'), 'utf8').startsWith('---\n'));
  check(`BLOG_META carries ${p.slug}`, gen.BLOG_META[p.slug]?.desc === p.excerpt);
}
check('legacy generated posts/ directory is gone', !existsSync(join(ROOT, 'posts')));
const blogClient = readFileSync(join(ROOT, 'site', 'src', 'blog.js'), 'utf8');
const worker = readFileSync(join(ROOT, 'worker', 'index.js'), 'utf8');
check('blog client loads canonical markdown', blogClient.includes('/content/posts/'));
check('worker loads canonical markdown', worker.includes('/content/posts/'));

console.log('submodule about.md ↔ HTML metadata ↔ about-panel date');
for (const p of PROJECTS.filter(p => p.kind === 'sim' && !p.external && !p.planned)) {
  const slug = p.href.replace(/^\//, '').replace(/\/$/, '');
  const about = readFileSync(join(ROOT, slug, 'about.md'), 'utf8');
  const meta = Object.fromEntries([...about.matchAll(/^([A-Za-z][\w]*):\s+(.+)$/gm)].map(m => [m[1], m[2]]));
  const index = readFileSync(join(DIST, slug, 'index.html'), 'utf8');
  check(`${p.title} about metadata is complete`, ['name', 'title', 'description', 'updated'].every(k => meta[k]));
  check(`${p.title} JSON-LD date is current`, index.includes(`"dateModified": "${meta.updated}"`));
  check(`${p.title} canonical description reaches HTML`, index.includes(meta.description.replace(/&/g, '&amp;').replace(/"/g, '&quot;')));
  const uiFiles = ['main.js', join('src', 'ui.js')]
    .map(rel => join(DIST, slug, rel)).filter(existsSync);
  check(`${p.title} about panel date is current`, uiFiles.some(rel => readFileSync(rel, 'utf8').includes(`lastUpdated: '${meta.updated}'`)));
}

console.log('project registry ↔ discovery files');
const llms = readFileSync(join(DIST, 'llms.txt'), 'utf8');
const about = readFileSync(join(DIST, 'about.md'), 'utf8');
for (const p of PROJECTS.filter(p => !p.planned)) {
  check(`llms.txt carries ${p.title}`, llms.includes(`[${p.title}](`));
  check(`about.md carries ${p.title}`, about.includes(`[${p.title}](`));
}
check('planned projects stay out of discovery files',
  !PROJECTS.filter(p => p.planned).some(p => llms.includes(`[${p.title}](`) || about.includes(`[${p.title}](`)));

console.log('index.html ↔ i18n.js');
const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const i18n = readFileSync(join(DIST, 'i18n.js'), 'utf8');
const dictKeys = new Set([...i18n.matchAll(/^\s*(?:'([^']+)'|"([^"]+)"):/gm)].map(m => m[1] || m[2]));
const used = [...html.matchAll(/data-i18n(?:-title|-aria|-content|-alt|-href)?="([^"]+)"/g)].map(m => m[1]);
const missing = [...new Set(used.filter(k => !dictKeys.has(k)))];
check('every data-i18n key in index.html resolves', missing.length === 0, missing.join(', '));

console.log('home-data.json shape');
const hd = JSON.parse(readFileSync(join(DIST, 'home-data.json'), 'utf8'));
for (const k of ['now', 'now_ja', 'hyperfixation', 'hyperfixation_ja', 'predictions',
  'predictions_ja', 'askMeAbout', 'askMeAbout_ja']) {
  check(`home-data has ${k}`, hd[k] != null);
}
check('EN/JA now rows align', hd.now.length === hd.now_ja.length);
check('EN/JA predictions align', hd.predictions.length === hd.predictions_ja.length);
check('EN/JA chips align', hd.askMeAbout.length === hd.askMeAbout_ja.length);

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1); }
console.log('\nall content-pipeline checks passed');
