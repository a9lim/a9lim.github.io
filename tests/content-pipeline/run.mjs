#!/usr/bin/env node
// Consistency checks for the content/ pipeline. Verifies that the generated
// artifacts agree with each other and with the content/ source tree.
// Run: node tests/content-pipeline/run.mjs
// (`node _build.mjs --check` separately verifies the artifacts are current.)

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
let failures = 0;
function check(name, ok, detail = '') {
  if (ok) { console.log('  ok: ' + name); return; }
  failures++;
  console.error('  FAIL: ' + name + (detail ? ' — ' + detail : ''));
}
const enSlugs = dir => readdirSync(join(ROOT, dir))
  .filter(f => f.endsWith('.md') && !f.endsWith('.ja.md'))
  .map(f => f.replace(/\.md$/, ''));

const { PROJECTS } = await import(join(ROOT, 'src/projects.js'));
const gen = await import(join(ROOT, '_content.generated.mjs'));
const posts = JSON.parse(readFileSync(join(ROOT, 'posts.json'), 'utf8'));

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
const itemNames = [...gen.SIMS_ITEMLIST, ...gen.PROJECTS_ITEMLIST].map(i => i.name);
for (const p of PROJECTS.filter(p => !p.planned)) {
  check(`ItemList carries ${p.title}`, itemNames.some(n => n.startsWith(p.title)));
}
check('planned cards stay out of ItemLists',
  !PROJECTS.filter(p => p.planned).some(p => itemNames.some(n => n.startsWith(p.title))));

console.log('content/posts ↔ posts.json ↔ posts/ ↔ BLOG_META');
const postSlugs = enSlugs('content/posts');
check('post count matches content files', posts.length === postSlugs.length);
for (const p of posts) {
  check(`posts/${p.slug}.md exists and is frontmatter-free`,
    !readFileSync(join(ROOT, 'posts', p.slug + '.md'), 'utf8').startsWith('---'));
  check(`BLOG_META carries ${p.slug}`, gen.BLOG_META[p.slug]?.desc === p.excerpt);
}

console.log('index.html ↔ i18n.js');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const i18n = readFileSync(join(ROOT, 'i18n.js'), 'utf8');
const dictKeys = new Set([...i18n.matchAll(/^\s*(?:'([^']+)'|"([^"]+)"):/gm)].map(m => m[1] || m[2]));
const used = [...html.matchAll(/data-i18n(?:-title|-aria|-content|-alt|-href)?="([^"]+)"/g)].map(m => m[1]);
const missing = [...new Set(used.filter(k => !dictKeys.has(k)))];
check('every data-i18n key in index.html resolves', missing.length === 0, missing.join(', '));

console.log('home-data.json shape');
const hd = JSON.parse(readFileSync(join(ROOT, 'home-data.json'), 'utf8'));
for (const k of ['now', 'now_ja', 'hyperfixation', 'hyperfixation_ja', 'predictions',
  'predictions_ja', 'askMeAbout', 'askMeAbout_ja', 'scriptureRotation', 'stats']) {
  check(`home-data has ${k}`, hd[k] != null);
}
check('EN/JA now rows align', hd.now.length === hd.now_ja.length);
check('EN/JA predictions align', hd.predictions.length === hd.predictions_ja.length);
check('EN/JA chips align', hd.askMeAbout.length === hd.askMeAbout_ja.length);

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1); }
console.log('\nall content-pipeline checks passed');
