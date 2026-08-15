#!/usr/bin/env node
// Consistency checks for the content/ pipeline. Verifies that the generated
// artifacts agree with each other and with the content/ source tree.
// Run: node tests/content-pipeline/run.mjs
// (`node tools/build.mjs --check` separately verifies the artifacts are current.)

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMarkdown, splitMarkdownTableRow } from '../../site/src/markdown.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = join(ROOT, 'dist');
const BUILD = join(ROOT, '.build');
let failures = 0;
function check(name, ok, detail = '') {
  if (ok) { console.log('  ok: ' + name); return; }
  failures++;
  console.error('  FAIL: ' + name + (detail ? ' — ' + detail : ''));
}

const escapedPipeRow = '| Dogs uplifted \\| no doom | ~0.0 | 2030-01-01 |';
check('table rows preserve escaped pipes inside cells',
  JSON.stringify(splitMarkdownTableRow(escapedPipeRow))
    === JSON.stringify(['Dogs uplifted | no doom', '~0.0', '2030-01-01']));
check('markdown table rendering preserves escaped pipes inside cells',
  parseMarkdown(`| Item | P | By |\n| --- | --- | --- |\n${escapedPipeRow}`)
    .includes('<tr><td>Dogs uplifted | no doom</td><td>~0.0</td><td>2030-01-01</td></tr>'));
// ─── Math, theorem environments, and cross-references ───
// The parser is re-entered for blockquotes and theorem bodies, and its math
// stash, switcher counter, and label table are module-level. Each of these
// guards a way that state has broken or could break across a nested parse.

check('math survives a nested parse',
  parseMarkdown('> The form $Q(x)=0$ holds.').includes('$Q(x)=0$'));

// `<` is common in math (`j<k`, `0\le i<m`). Reinserted raw it would be
// parsed as markup and swallow the rest of the formula.
const mathWithLt = parseMarkdown('Let $j<k$ hold.');
check('math escapes < so the HTML parser cannot eat the formula',
  mathWithLt.includes('$j&lt;k$') && !mathWithLt.includes('$j<k$'));

const thmDoc = [
  '## First {#sec:one}', '',
  '::: theorem number="A" name="Main result"', 'Overview.', ':::', '',
  '::: definition id="def:a" name="Local realization"', 'Body $x<y$.', ':::', '',
  '## Second {#sec:two}', '',
  '::: theorem id="thm:a" name="Public matching"', 'Statement.', ':::', '',
  '::: proof', 'Uses [[def:a]].', ':::', '',
  '::: corollary id="cor:a"', 'Follows.', ':::', '',
  'See [[thm:a]], sections [[#sec:one]]–[[#sec:two]], and [[nope:x]].', '',
  '- {#ref-key}**[Key]** A cited work.',
].join('\n');
const thmHtml = parseMarkdown(thmDoc);

check('theorem counter resets per section and is shared across kinds',
  thmHtml.includes('Definition&nbsp;1.1')
  && thmHtml.includes('Theorem&nbsp;2.1')
  && thmHtml.includes('Corollary&nbsp;2.2'),
  thmHtml.match(/theorem-kind">[^<]*/g)?.join(' | '));
check('proofs are unnumbered', thmHtml.includes('<span class="theorem-kind">Proof</span>'));
check('explicit theorem numbers do not advance the section counter',
  thmHtml.includes('Theorem&nbsp;A') && thmHtml.includes('Definition&nbsp;1.1'));
check('theorem carries its label as an anchor', thmHtml.includes('<div class="theorem theorem-theorem" id="thm-a">'));
check('qualified cross-reference renders kind and number',
  thmHtml.includes('<a href="#def-a" class="xref">Definition&nbsp;1.1</a>'));
check('bare cross-reference renders the number alone',
  thmHtml.includes('<a href="#sec-one" class="xref">1</a>'));
check('forward cross-reference resolves', thmHtml.includes('<a href="#thm-a" class="xref">Theorem&nbsp;2.1</a>'));
check('unknown label stays visible rather than failing silently',
  thmHtml.includes('<span class="xref-missing">[[nope:x]]</span>'));
check('explicit heading id becomes the anchor', thmHtml.includes('<h2 id="sec-one">First</h2>'));
check('list item anchor becomes an id', thmHtml.includes('<li id="ref-key">'));
check('math inside a theorem body survives and is escaped', thmHtml.includes('$x&lt;y$'));

// Front matter (an authorship note, an abstract) must not renumber the paper
// it sits above — the same role LaTeX gives \section*.
const unnumbered = parseMarkdown([
  '## Preface {.unnumbered}', '', 'Framing.', '',
  '## First {#sec:x}', '',
  '::: theorem id="thm:y"', 'Claim.', ':::', '',
  'See [[thm:y]] in [[#sec:x]].',
].join('\n'));
check('unnumbered headings do not advance the section counter',
  unnumbered.includes('Theorem&nbsp;1.1') && unnumbered.includes('class="xref">1</a>'),
  unnumbered.match(/theorem-kind">[^<]*/)?.[0]);
check('unnumbered attribute does not leak into the heading text',
  unnumbered.includes('<h2 id="preface">Preface</h2>'));
check('renders identically on a repeat parse (SSR and client must agree)',
  parseMarkdown(thmDoc) === thmHtml);
check('same-page links do not open a new tab',
  parseMarkdown('See [it](#ref-key).').includes('<a href="#ref-key">it</a>'));
check('outbound links still open a new tab',
  parseMarkdown('See [it](https://example.com).').includes('target="_blank"'));
const unknownDirective = parseMarkdown('::: custom\nBody.\n:::\nAfter.');
check('unknown directives stay visible and cannot trap the parser',
  unknownDirective.includes('::: custom') && unknownDirective.includes('After.'));

// Optional post byline: `authors:` and `links:` reach posts.json parsed, and
// both the client and the Worker render them opposite the date/tag line.
const bylinePost = JSON.parse(readFileSync(join(DIST, 'posts.json'), 'utf8'))
  .find(p => Array.isArray(p.links));
if (bylinePost) {
  check('post links parse into label/href pairs',
    bylinePost.links.every(l => typeof l.label === 'string' && typeof l.href === 'string'),
    JSON.stringify(bylinePost.links));
  check('post link hrefs are site-absolute or https',
    bylinePost.links.every(l => l.href.startsWith('/') || l.href.startsWith('https://')));
}

const enSlugs = dir => readdirSync(join(ROOT, dir))
  .filter(f => f.endsWith('.md') && !f.endsWith('.ja.md'))
  .map(f => f.replace(/\.md$/, ''));

const { PROJECTS } = await import(join(DIST, 'src/projects.js'));
const clientMeta = await import(join(DIST, 'src/route-meta.js'));
const gen = await import(join(BUILD, 'content.generated.mjs'));
const posts = JSON.parse(readFileSync(join(DIST, 'posts.json'), 'utf8'));
const paperPost = readFileSync(join(DIST, 'content/posts/quadratic-refinements-in-games.md'), 'utf8');
check('custom Theorem A is normalized into the supported paper dialect',
  paperPost.includes('::: theorem number="A"') && !paperPost.includes('::: thmA'));

console.log('content/projects ↔ dist/src/projects.js ↔ .build/content.generated.mjs');
const projSlugs = enSlugs('content/projects');
check('card count matches content files', PROJECTS.length === projSlugs.length,
  `${PROJECTS.length} vs ${projSlugs.length}`);
for (const p of PROJECTS) {
  const ssr = p.external ? gen.PROJECTS_SSR : gen.SIMS_SSR;
  check(`${p.title} has a decorative mark`, typeof p.emoji === 'string' && p.emoji.trim().length > 0);
  check(`SSR mirror carries ${p.title}`, ssr.includes(`<h3 class="project-title">${p.title.replace(/&/g, '&amp;')}</h3>`));
  check(`SSR mirror carries ${p.title}'s emoji`, ssr.includes(`<span class="project-emoji" aria-hidden="true">${p.emoji}</span>`));
  for (const pkg of p.packages || []) {
    check(`SSR mirror carries ${p.title}'s ${pkg.registry} link`, ssr.includes(`href="${pkg.href}"`));
  }
}
check('project data contains no legacy SVG icon field', PROJECTS.every(p => !Object.hasOwn(p, 'icon')));
check('external is the sole project/simulation discriminator', PROJECTS.every(p =>
  typeof p.external === 'boolean' && !Object.hasOwn(p, 'kind')));
check('project marks avoid platform color-presentation selectors',
  PROJECTS.every(p => !p.emoji.includes('\uFE0F')));
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
// Entries flagged `draft` come from draft/posts/ and only exist in a DRAFTS=1
// dev build; a deploy build has none, and then these two checks are the old
// exact-count check.
const postSlugs = enSlugs('content/posts');
check('every content/posts file appears in posts.json',
  postSlugs.every(slug => posts.some(p => p.slug === slug)));
check('every published post has a content/posts file',
  posts.filter(p => !p.draft).every(p => postSlugs.includes(p.slug)));
for (const p of posts) {
  const dir = p.draft ? 'draft' : 'content';
  check(`${dir}/posts/${p.slug}.md is canonical and carries frontmatter`,
    readFileSync(join(ROOT, dir, 'posts', p.slug + '.md'), 'utf8').startsWith('---\n'));
  check(`BLOG_META carries ${p.slug}`, gen.BLOG_META[p.slug]?.desc === p.excerpt);
}
check('browser and Worker route metadata agree',
  JSON.stringify(clientMeta.ROUTE_META) === JSON.stringify(gen.ROUTE_META));
check('browser and Worker blog metadata agree',
  JSON.stringify(clientMeta.BLOG_META) === JSON.stringify(gen.BLOG_META));
check('legacy generated posts/ directory is gone', !existsSync(join(ROOT, 'posts')));
const blogClient = readFileSync(join(ROOT, 'site', 'src', 'blog.js'), 'utf8');
const worker = readFileSync(join(ROOT, 'worker', 'index.js'), 'utf8');
check('blog client loads canonical markdown', blogClient.includes('/content/posts/'));
check('worker loads canonical markdown', worker.includes('/content/posts/'));
// The byline is rendered twice, once per surface; a change to one that skips
// the other shows up as a header that differs between SSR and hydration.
for (const marker of ['blog-post-meta', 'blog-post-byline', 'blog-post-authors', 'blog-post-links']) {
  check(`client and worker both render .${marker}`,
    blogClient.includes(marker) && worker.includes(marker));
}

console.log('submodule about.md ↔ HTML metadata ↔ about-panel date');
for (const p of PROJECTS.filter(p => !p.external && !p.planned)) {
  const slug = p.href.replace(/^\//, '').replace(/\/$/, '');
  const about = readFileSync(join(ROOT, 'projects', slug, 'about.md'), 'utf8');
  const meta = Object.fromEntries([...about.matchAll(/^([A-Za-z][\w]*):\s+(.+)$/gm)].map(m => [m[1], m[2]]));
  const index = readFileSync(join(DIST, slug, 'index.html'), 'utf8');
  check(`${p.title} about metadata is complete`, ['name', 'title', 'description', 'updated'].every(k => meta[k]));
  check(`${p.title} JSON-LD date is current`, index.includes(`"dateModified": "${meta.updated}"`));
  check(`${p.title} canonical description reaches HTML`, index.includes(meta.description.replace(/&/g, '&amp;').replace(/"/g, '&quot;')));
  const uiFiles = ['main.js', join('src', 'ui.js')]
    .map(rel => join(DIST, slug, rel)).filter(existsSync);
  check(`${p.title} about panel date is current`, uiFiles.some(rel => readFileSync(rel, 'utf8').includes(`lastUpdated: '${meta.updated}'`)));

  const expectedImage = p.major
    ? `https://a9l.im/${slug}/og-image.webp?v=20260725f`
    : 'https://a9l.im/og-image.webp?v=20260725f';
  const ogImage = index.match(/<meta property="og:image" content="([^"]+)">/)?.[1];
  const twitterImage = index.match(/<meta name="twitter:image" content="([^"]+)">/)?.[1];
  const ogAlt = index.match(/<meta property="og:image:alt" content="([^"]+)">/)?.[1];
  const twitterAlt = index.match(/<meta name="twitter:image:alt" content="([^"]+)">/)?.[1];
  check(`${p.title} uses the ${p.major ? 'bespoke' : 'root fallback'} social card`,
    ogImage === expectedImage && twitterImage === expectedImage);
  check(`${p.title} social card alt metadata agrees`,
    Boolean(ogAlt) && ogAlt === twitterAlt);
  check(`${p.title} ${p.major ? 'owns' : 'does not own'} a project OG asset`,
    existsSync(join(ROOT, 'projects', slug, 'og-image.webp')) === Boolean(p.major));
}

const ogTemplates = readdirSync(join(ROOT, 'tools', 'og'))
  .filter(name => name.endsWith('.html') && name !== 'icon.html')
  .sort();
check('OG source templates are limited to root and major simulations',
  JSON.stringify(ogTemplates) === JSON.stringify(['a9lim.html', 'geon.html', 'shoals.html']));
const ogArt = readdirSync(join(ROOT, 'tools', 'og', 'art')).sort();
check('OG aquarelle sources are limited to root and major simulations',
  JSON.stringify(ogArt) === JSON.stringify(['geon.webp', 'root.webp', 'shoals.webp']));
for (const [template, art] of [['a9lim.html', 'root.webp'], ['geon.html', 'geon.webp'], ['shoals.html', 'shoals.webp']]) {
  check(`${template} uses its aquarelle source`,
    readFileSync(join(ROOT, 'tools', 'og', template), 'utf8').includes(`art/${art}`));
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
check('prediction rows keep conditional labels in one cell',
  hd.predictions.every(row => row.length === 3)
  && hd.predictions_ja.every(row => row.length === 3)
  && hd.predictions[3][0] === 'Dogs uplifted | no doom'
  && hd.predictions_ja[3][0] === '犬の知性向上 | 破滅なし');
check('EN/JA chips align', hd.askMeAbout.length === hd.askMeAbout_ja.length);

if (failures) { console.error(`\n${failures} failure(s)`); process.exit(1); }
console.log('\nall content-pipeline checks passed');
