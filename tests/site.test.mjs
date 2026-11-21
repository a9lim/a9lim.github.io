// What the build can't see for itself. tools/build.mjs already throws on bad
// frontmatter, links, tags, EN/JA mismatches and missed project-metadata sync;
// these cover the markdown parser's nested state, what reaches dist/, and the
// two places security policy is set. Run after `npm run build`.

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseMarkdown, splitMarkdownTableRow } from '../site/src/markdown.js';
import { SECURITY_HEADERS } from '../worker/http.js';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, 'dist');

test('markdown: math and the paper dialect survive nested parses', () => {
  // The math stash, switcher counter and label table belong to the outermost
  // parse; blockquotes and theorem bodies re-enter the parser.
  assert.match(parseMarkdown('> The form $Q(x)=0$ holds.'), /\$Q\(x\)=0\$/);
  // `<` in a formula, restored raw, would be parsed as markup and eat the rest.
  assert.match(parseMarkdown('Let $j<k$ hold.'), /\$j&lt;k\$/);

  const doc = [
    '## Preface {.unnumbered}', '',
    '## First {#sec:one}', '',
    '::: theorem number="A" name="Main"', 'Overview.', ':::', '',
    '::: definition id="def:a"', 'Body $x<y$.', ':::', '',
    '## Second {#sec:two}', '',
    '::: theorem id="thm:a"', 'Statement.', ':::', '',
    '::: proof', 'Uses [[def:a]].', ':::', '',
    'See [[thm:a]], [[#sec:one]] and [[nope:x]].',
  ].join('\n');
  const html = parseMarkdown(doc);
  // One counter for every numbered kind, reset per section; explicit numbers
  // and unnumbered headings don't advance it; forward references resolve.
  assert.match(html, /Theorem&nbsp;A/);
  assert.match(html, /<a href="#def-a" class="xref">Definition&nbsp;1\.1<\/a>/);
  assert.match(html, /<a href="#thm-a" class="xref">Theorem&nbsp;2\.1<\/a>/);
  assert.match(html, /<a href="#sec-one" class="xref">1<\/a>/);
  assert.match(html, /<span class="xref-missing">\[\[nope:x\]\]<\/span>/);
  assert.match(html, /\$x&lt;y\$/);
  // The Worker's SSR and the client must render the same thing.
  assert.equal(parseMarkdown(doc), html);
});

test('markdown: escaped pipes stay inside a table cell', () => {
  assert.deepEqual(splitMarkdownTableRow('| LEV \\| no doom | ~0.4 | 2030 |'), ['LEV | no doom', '~0.4', '2030']);
});

test('dist ships nothing private and the pages it needs', () => {
  const files = [];
  const walk = dir => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else files.push(relative(DIST, path));
    }
  };
  walk(DIST);
  const forbidden = [
    /(?:^|\/)\.[^/]+$/, /(?:^|\/)\.git\//, /(?:^|\/)node_modules\//,
    /(?:^|\/)(?:AGENTS|CLAUDE|AUDIT|HANDOFF)\.md$/,
    /(?:^|\/)(?:docs|tests|tools|extract)\//, /(?:^|\/)test_[^/]*\.mjs$/, /\.test\.mjs$/,
    /^(?:site|static|projects|features|surveys|db|worker|lib|draft|papers)\//,
  ];
  const leaked = files.filter(f => forbidden.some(re => re.test(f)));
  assert.deepEqual(leaked, []);

  const sims = readdirSync(join(ROOT, 'projects'), { withFileTypes: true })
    .filter(d => d.isDirectory()).map(d => d.name);
  for (const rel of ['index.html', 'posts.json', '_headers', 'resume.pdf', 'fonts/fonts.css',
    ...sims.map(s => `${s}/index.html`)]) {
    assert.ok(existsSync(join(DIST, rel)), `missing ${rel}`);
  }
});

test('Worker responses and static assets carry the same security policy', () => {
  // static/_headers' global block, as name → value
  const block = readFileSync(join(ROOT, 'static/_headers'), 'utf8').split('\n/*\n')[1].split('\n\n')[0];
  const statics = Object.fromEntries(block.split('\n')
    .filter(l => l.startsWith('  '))
    .map(l => { const i = l.indexOf(':'); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (name === 'Content-Language') continue; // the Worker's SSR pages only
    assert.equal(statics[name], value, name);
  }
  assert.equal(statics['Cache-Control'], 'public, max-age=0, must-revalidate');
  assert.match(readFileSync(join(ROOT, 'worker/http.js'), 'utf8'), /'Cache-Control', 'public, max-age=0, must-revalidate'/);
});

test('every data-i18n key in the shell resolves', () => {
  const html = readFileSync(join(DIST, 'index.html'), 'utf8');
  const i18n = readFileSync(join(DIST, 'i18n.js'), 'utf8');
  const keys = new Set([...i18n.matchAll(/^\s*(?:'([^']+)'|"([^"]+)"):/gm)].map(m => m[1] || m[2]));
  const used = [...html.matchAll(/data-i18n(?:-title|-aria|-content|-alt|-href)?="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual([...new Set(used.filter(k => !keys.has(k)))], []);
});
