#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { transpileWGSL } from './shared-wgsl-transpile.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
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

// --- Markdown renderer (duplicated from _worker.js — update both when changing) ---

let _mdMathStash = [];
let _switcherCounter = 0;
function mdStashMath(s) {
  _mdMathStash = [];
  return s.replace(/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g, m => { _mdMathStash.push(m); return '\x00MATH' + (_mdMathStash.length - 1) + '\x00'; });
}
function mdUnstashMath(s) {
  return s.replace(/\x00MATH(\d+)\x00/g, (_, i) => _mdMathStash[i]);
}
function mdEsc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mdSafeUrl(u) {
  const l = u.trim().toLowerCase();
  if (l.startsWith('javascript:') || l.startsWith('vbscript:') || l.startsWith('data:text/html')) return '';
  return u;
}

function mdInline(src) {
  return src
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
      const pi = url.indexOf('|');
      if (pi !== -1) {
        const l = mdSafeUrl(url.slice(0, pi).trim());
        const d = mdSafeUrl(url.slice(pi + 1).trim());
        return `<img src="${l}" alt="${alt}" loading="lazy" class="theme-light"><img src="${d}" alt="${alt}" loading="lazy" class="theme-dark">`;
      }
      return `<img src="${mdSafeUrl(url)}" alt="${alt}" loading="lazy">`;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => { const s = mdSafeUrl(url); return s ? `<a href="${s}" target="_blank" rel="noopener noreferrer">${text}</a>` : text; })
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*{3}(.+?)\*{3}/g, '<strong><em>$1</em></strong>')
    .replace(/_{3}(.+?)_{3}/g, '<strong><em>$1</em></strong>')
    .replace(/\*{2}(.+?)\*{2}/g, '<strong>$1</strong>')
    .replace(/_{2}(.+?)_{2}/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/(^|[\s(])_(.+?)_([\s).,!?]|$)/g, '$1<em>$2</em>$3');
}

function renderMarkdown(src) {
  _switcherCounter = 0;
  src = mdStashMath(src);
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let i = 0;
  const len = lines.length;
  while (i < len) {
    const line = lines[i];
    const fenceMatch = line.match(/^(`{3,}|~{3,})(.*)$/);
    if (fenceMatch) {
      const fence = fenceMatch[1];
      const lang = fenceMatch[2].trim();
      const isIframe = /^iframe(\s|$)/.test(lang);
      const code = [];
      i++;
      while (i < len && lines[i].indexOf(fence) !== 0) { code.push(isIframe ? lines[i] : mdEsc(lines[i])); i++; }
      i++;
      if (isIframe) {
        const PATH_RE = /^\/[A-Za-z0-9_./?&=%#-]*$/;
        const paths = code.map(l => l.trim()).filter(Boolean).filter(l => PATH_RE.test(l));
        if (paths.length) {
          const h = (lang.match(/height=(\d+)/) || [])[1] || '720';
          const t = (lang.match(/title="([^"]*)"/) || [])[1] || '';
          const c = (lang.match(/caption="([^"]*)"/) || [])[1] || t;
          if (paths.length === 1) {
            html.push('<figure class="iframe-figure">'
              + '<iframe src="' + mdEsc(paths[0]) + '" title="' + mdEsc(t) + '" height="' + h + '" loading="lazy"></iframe>'
              + (c ? '<figcaption>' + mdInline(mdEsc(c)) + '</figcaption>' : '')
              + '</figure>');
          } else {
            let inner = '';
            for (const p of paths) {
              inner += '<div class="iframe-pair-item"><iframe src="' + mdEsc(p) + '" title="' + mdEsc(t) + '" height="' + h + '" loading="lazy"></iframe></div>';
            }
            html.push('<figure class="iframe-figure iframe-figure-pair">'
              + inner
              + (c ? '<figcaption>' + mdInline(mdEsc(c)) + '</figcaption>' : '')
              + '</figure>');
          }
        }
        continue;
      }
      if (/^switcher(\s|$)/.test(lang)) {
        const labelsMatch = lang.match(/labels="([^"]*)"/);
        const captionMatch = lang.match(/caption="([^"]*)"/);
        const labels = (labelsMatch ? labelsMatch[1] : '').split('|').map(l => l.trim()).filter(Boolean);
        const caption = captionMatch ? captionMatch[1] : '';
        const tabs = code.map(l => l.trim()).filter(Boolean);
        if (tabs.length) {
          _switcherCounter++;
          let out = '<figure class="switcher-figure"><div class="mode-toggles">';
          for (let n = 0; n < tabs.length; n++) {
            const label = labels[n] || ('panel ' + (n + 1));
            out += '<button class="mode-btn' + (n === 0 ? ' active' : '') + '" data-panel="' + n + '">' + mdEsc(label) + '</button>';
          }
          out += '</div><div class="switcher-panels">';
          for (let n = 0; n < tabs.length; n++) {
            const urls = tabs[n].split('|').map(u => u.trim()).map(mdSafeUrl);
            const lt = urls[0];
            const dk = urls[1] || urls[0];
            const altText = (labels[n] || '') + (caption ? ' — ' + caption : '');
            const cls = 'switcher-panel' + (n === 0 ? ' active' : '');
            if (lt === dk) {
              out += '<div class="' + cls + '"><img src="' + lt + '" alt="' + mdEsc(altText) + '" loading="lazy"></div>';
            } else {
              out += '<div class="' + cls + '">'
                + '<img src="' + lt + '" alt="' + mdEsc(altText) + '" loading="lazy" class="theme-light">'
                + '<img src="' + dk + '" alt="' + mdEsc(altText) + '" loading="lazy" class="theme-dark">'
                + '</div>';
            }
          }
          out += '</div>';
          if (caption) out += '<figcaption>' + mdInline(mdEsc(caption)) + '</figcaption>';
          out += '</figure>';
          html.push(out);
        }
        continue;
      }
      const langAttr = lang ? ' class="language-' + mdEsc(lang) + '"' : '';
      html.push('<pre><code' + langAttr + '>' + code.join('\n') + '</code></pre>');
      continue;
    }
    if (/^\s*$/.test(line)) { i++; continue; }
    if (/^\$\$/.test(line) && !/^\$\$.*\$\$/.test(line)) {
      const ml = [line]; i++;
      while (i < len && !/\$\$\s*$/.test(lines[i])) { ml.push(lines[i]); i++; }
      if (i < len) { ml.push(lines[i]); i++; }
      html.push('<p>' + mdUnstashMath(ml.join('\n')) + '</p>');
      continue;
    }
    const hm = line.match(/^(#{1,6})\s+(.+)$/);
    if (hm) { const slug = hm[2].toLowerCase().replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, ''); html.push('<h' + hm[1].length + ' id="' + slug + '">' + mdInline(mdEsc(hm[2])) + '</h' + hm[1].length + '>'); i++; continue; }
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { html.push('<hr>'); i++; continue; }
    if (/^>\s?/.test(line)) {
      const bq = [];
      while (i < len && /^>\s?/.test(lines[i])) { bq.push(lines[i].replace(/^>\s?/, '')); i++; }
      html.push('<blockquote>' + renderMarkdown(bq.join('\n')) + '</blockquote>');
      continue;
    }
    if (/^[\-*+]\s+/.test(line)) {
      const items = [];
      while (i < len && /^[\-*+]\s+/.test(lines[i])) { items.push(lines[i].replace(/^[\-*+]\s+/, '')); i++; }
      html.push('<ul>' + items.map(it => '<li>' + mdInline(mdEsc(it)) + '</li>').join('') + '</ul>');
      continue;
    }
    if (/^\|.+\|\s*$/.test(line) && i + 1 < len && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const splitRow = (s) => s.replace(/^\||\|\s*$/g, '').split('|').map(c => c.trim());
      const headers = splitRow(line);
      i += 2;
      const bodyRows = [];
      while (i < len && /^\|.+\|\s*$/.test(lines[i])) { bodyRows.push(splitRow(lines[i])); i++; }
      html.push('<table><thead><tr>'
        + headers.map(h => '<th>' + mdInline(mdEsc(h)) + '</th>').join('')
        + '</tr></thead><tbody>'
        + bodyRows.map(row => '<tr>' + row.map(c => '<td>' + mdInline(mdEsc(c)) + '</td>').join('') + '</tr>').join('')
        + '</tbody></table>');
      continue;
    }
    if (/^\d+[.)]\s+/.test(line)) {
      const ol = [];
      while (i < len && /^\d+[.)]\s+/.test(lines[i])) { ol.push(lines[i].replace(/^\d+[.)]\s+/, '')); i++; }
      html.push('<ol>' + ol.map(it => '<li>' + mdInline(mdEsc(it)) + '</li>').join('') + '</ol>');
      continue;
    }
    const p = [];
    while (i < len && !/^\s*$/.test(lines[i])
      && !/^(#{1,6}\s|>\s?|[\-*+]\s|`{3,}|~{3,}|\d+[.)]\s|(-{3,}|\*{3,}|_{3,})\s*$)/.test(lines[i])) {
      p.push(lines[i]); i++;
    }
    if (p.length) html.push('<p>' + mdInline(mdEsc(p.join('\n'))) + '</p>');
  }
  return mdUnstashMath(html.join('\n'));
}

// --- collect URLs ---

const urls = [];

// Image map: sim paths → [OG image(s)]
const IMAGE_MAP = {
  '/':          ['og-image.webp'],
  '/geon':      ['geon/og-image.webp'],
  '/cyano':     ['cyano/og-image.webp'],
  '/gerry':     ['gerry/og-image.webp'],
  '/shoals':    ['shoals/og-image.webp'],
  '/scripture/': ['scripture/og-image.webp'],
  '/miasma':    ['miasma/og-image.webp'],
  '/pile':      ['pile/og-image.webp'],
  '/plasma':    ['plasma/og-image.webp'],
};

function add(path, lastmod, images, changefreq, priority, imageCaption) {
  urls.push({ loc: SITE + path, lastmod: lastmod || today(), images: images || null, changefreq: changefreq || null, priority: priority != null ? priority : null, imageCaption: imageCaption || null });
}

const IMAGE_CAPTIONS = {
  '/': 'a9l.im — interactive educational simulations for physics, biology, finance, and political science',
  '/geon': 'Geon — relativistic N-body particle physics simulator with 11 forces and WebGPU compute shaders',
  '/cyano': 'Cyano — cellular metabolism simulator with twelve biochemical pathways and electron transport',
  '/gerry': 'Gerry — gerrymandering and electoral fairness simulator with Monte Carlo elections',
  '/shoals': 'Shoals — options trading simulator with stochastic volatility and 400+ market scenarios',
  '/scripture/': 'Scripture — sacred text reader with sixteen works from multiple traditions',
  '/miasma': 'Miasma — stochastic spatial epidemic simulator with multi-strain evolution and intervention painting',
  '/pile': 'Pile — semi-realistic nuclear reactor simulator with PWR, RBMK, and molten-salt reactor types',
  '/plasma': 'Plasma — 2D resistive magnetohydrodynamics simulator with HLLD, PPM, and constrained transport',
};

// 1. Static routes
const staticRoutes = [
  { path: '/',          file: 'index.html',           changefreq: 'weekly',  priority: 1.0 },
  { path: '/sims',      file: 'index.html',           changefreq: 'monthly', priority: 0.8 },
  { path: '/projects',  file: 'index.html',           changefreq: 'monthly', priority: 0.8 },
  { path: '/blog',      file: 'index.html',           changefreq: 'monthly', priority: 0.8 },
  { path: '/resume',    file: 'index.html',           changefreq: 'monthly', priority: 0.7 },
  { path: '/geon',      file: 'geon/index.html',      changefreq: 'monthly', priority: 0.9 },
  { path: '/cyano',     file: 'cyano/index.html',     changefreq: 'monthly', priority: 0.9 },
  { path: '/gerry',     file: 'gerry/index.html',     changefreq: 'monthly', priority: 0.9 },
  { path: '/shoals',    file: 'shoals/index.html',    changefreq: 'monthly', priority: 0.9 },
  { path: '/scripture/', file: 'scripture/index.html', changefreq: 'monthly', priority: 0.9 },
  { path: '/miasma',    file: 'miasma/index.html',    changefreq: 'monthly', priority: 0.9 },
  { path: '/pile',      file: 'pile/index.html',      changefreq: 'monthly', priority: 0.9 },
  { path: '/plasma',    file: 'plasma/index.html',    changefreq: 'monthly', priority: 0.9 },
];

for (const r of staticRoutes) {
  add(r.path, gitLastmod(r.file), IMAGE_MAP[r.path] || null, r.changefreq, r.priority, IMAGE_CAPTIONS[r.path] || null);
}

// 1b. Scripture work-level routes
const workIds = readJSON('scripture/data/works.json');
for (const workId of workIds) {
  const workLastmod = gitLastmod(`scripture/data/${workId}/manifest.json`);
  add(`/scripture/${workId}`, workLastmod, null, 'monthly', 0.7);
}

// 2. Blog posts
const posts = readJSON('posts.json');
for (const p of posts) {
  const md = `posts/${p.slug}.md`;
  add(`/blog/${p.slug}`, gitLastmod(md) || p.date, null, 'yearly', 0.6);
}

// 3. Scripture deep routes

for (const workId of workIds) {
  const manifest = readJSON(`scripture/data/${workId}/manifest.json`);
  const workLastmod = gitLastmod(`scripture/data/${workId}/manifest.json`);

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

writeFileSync(join(ROOT, 'sitemap-main.xml'), renderUrlset(mainUrls));
console.log(`sitemap-main.xml: ${mainUrls.length} URLs`);

writeFileSync(join(ROOT, 'sitemap-scripture.xml'), renderUrlset(scriptureUrls));
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

writeFileSync(join(ROOT, 'sitemap.xml'), sitemapIndex);
console.log(`sitemap.xml: sitemap index (${urls.length} total URLs)`);

// --- generate feed.xml (RSS 2.0) ---

const postItems = posts.map(p => {
  const mdSrc = readText(`posts/${p.slug}.md`);
  const htmlContent = renderMarkdown(mdSrc);
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
    <description>Interactive educational simulations for physics, biology, finance, and political science.</description>
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

writeFileSync(join(ROOT, 'feed.xml'), rss);
console.log(`feed.xml: ${posts.length} items`);

// --- generate feed.atom ---

const atomEntries = posts.map(p => {
  const mdSrc = readText(`posts/${p.slug}.md`);
  const htmlContent = renderMarkdown(mdSrc);
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
  <subtitle>Interactive educational simulations for physics, biology, finance, and political science.</subtitle>
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

writeFileSync(join(ROOT, 'feed.atom'), atom);
console.log(`feed.atom: ${posts.length} entries`);

// --- generate llms-full.txt ---

const aboutFiles = [
  { heading: 'Geon', path: 'geon/about.md' },
  { heading: 'Cyano', path: 'cyano/about.md' },
  { heading: 'Gerry', path: 'gerry/about.md' },
  { heading: 'Shoals', path: 'shoals/about.md' },
  { heading: 'Scripture', path: 'scripture/about.md' },
  { heading: 'Miasma', path: 'miasma/about.md' },
  { heading: 'Pile', path: 'pile/about.md' },
  { heading: 'Plasma', path: 'plasma/about.md' },
];

const llmsParts = [
  '# a9l.im — Full Documentation',
  '',
  '> Free interactive educational simulations for physics, biology, finance, political science, and sacred texts.',
  '',
  'See also: [llms.txt](https://a9l.im/llms.txt)',
  '',
];

// Site about
if (existsSync(join(ROOT, 'about.md'))) {
  llmsParts.push(readText('about.md'), '');
}

// Project about pages
for (const a of aboutFiles) {
  const p = join(ROOT, a.path);
  if (existsSync(p)) {
    llmsParts.push(readText(a.path), '');
  }
}

// Blog posts
llmsParts.push('---', '', '# Blog Posts', '');
for (const p of posts) {
  llmsParts.push(`## ${p.title}`, '', `*${p.date}*`, '');
  llmsParts.push(readText(`posts/${p.slug}.md`), '');
}

writeFileSync(join(ROOT, 'llms-full.txt'), llmsParts.join('\n'));
console.log('llms-full.txt: generated');

// --- generate home-data.json (baked-in commit feed + live-ish stats) ---

function gitCommits(n) {
  try {
    const raw = execFileSync(
      'git',
      ['log', `-${n}`, '--format=%h\x1f%aI\x1f%s'],
      { cwd: ROOT, encoding: 'utf8' }
    ).trim();
    if (!raw) return [];
    return raw.split('\n').map(line => {
      const [hash, iso, subject] = line.split('\x1f');
      return { hash, iso, subject };
    });
  } catch { return []; }
}

function countScriptureChapters() {
  let total = 0;
  try {
    for (const workId of workIds) {
      const manifest = readJSON(`scripture/data/${workId}/manifest.json`);
      for (const book of manifest.books) total += book.chapters;
    }
  } catch { /* ignore */ }
  return total;
}

function countSourceLines() {
  try {
    const files = execFileSync(
      'git',
      ['ls-files', '*.js', '*.css', '*.html'],
      { cwd: ROOT, encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);
    let total = 0;
    for (const f of files) {
      try {
        total += readText(f).split('\n').length;
      } catch { /* ignore */ }
    }
    return total;
  } catch { return 0; }
}

const commits = gitCommits(6);
const lastDeploy = commits[0] || null;
const homeData = {
  generatedAt: new Date().toISOString(),
  lastDeploy,
  commits,
  stats: {
    sims: 8,
    posts: posts.length,
    scriptureWorks: workIds.length,
    scriptureChapters: countScriptureChapters(),
    sourceLines: countSourceLines(),
  },
};

writeFileSync(join(ROOT, 'home-data.json'), JSON.stringify(homeData, null, 2) + '\n');
console.log(`home-data.json: ${commits.length} commits, ${homeData.stats.scriptureChapters} scripture chapters, ${homeData.stats.sourceLines} source lines`);

// --- build resume.pdf via tectonic (skips gracefully if absent) ---

const resumeBuild = spawnSync('bash', [join(ROOT, 'resume/build.sh')], { stdio: 'inherit' });
if (resumeBuild.status !== 0) {
  console.error('resume.pdf: build failed (exit ' + resumeBuild.status + ')');
}

// --- WGSL → JS transpile (build-time artifact writer) ---
//
// For each configured shader dir, walk .wgsl files, classify into helpers
// (no @compute/@vertex/@fragment entry point) vs entries, and write a
// `.transpiled.js` artifact for each entry under `transpiled/<source-
// relative-path>.transpiled.js`. The unit transpiled is (helpers ++
// entry source), matching the assembly pattern plasma/geon use before
// createShaderModule.
//
// Output goes under the parent-tracked `transpiled/` root rather than
// next to the source so submodule-shaped sims (plasma, etc. — see
// .gitmodules) can have their artifacts committed by the parent repo
// without requiring the submodule itself to track them. Plasma's CPU
// fallback fetches them as static assets from `/transpiled/plasma/...`.
//
// Skip-on-unchanged: each artifact carries a sha256 source-hash header.
// Re-runs read the existing artifact, compare hashes, and skip the
// transpile work when nothing changed. Pass `--force-wgsl` to override.
//
// Add a sim dir below when you want its shaders pre-transpiled. Geon's
// 54 shaders are deferred until plasma integration (B3) shakes out the
// adapter shape — see tests/wgsl-transpile/README.md.

const SWEEP_AXIS_HELPERS = [
  'fast_mag_speed',
  'mhd_flux',
  'normal_velocity_mhd',
  'permute_prim',
  'pack_prim_pair_from_vec7',
  'unpack_edge_prim',
  'prim_to_axis_state',
  'pack_flux',
  'hll_flux_mhd',
];

const RK3_STAGE_WEIGHTS = [
  { name: 's1', a0: 1.0,     a1: 0.0,     dt_w: 1.0 },
  { name: 's2', a0: 3.0/4.0, a1: 1.0/4.0, dt_w: 1.0/4.0 },
  { name: 's3', a0: 1.0/3.0, a1: 2.0/3.0, dt_w: 2.0/3.0 },
];

const VIEW_FIELD_MODES = [
  { name: 'rho',      mode: 0 },
  { name: 'pressure', mode: 1 },
  { name: 'speed',    mode: 2 },
  { name: 'bmag',     mode: 3 },
  { name: 'jz',       mode: 4 },
];

const PLASMA_WORKGROUP = 8;
const PLASMA_GHOST = 2;
const PLASMA_NOISE_N = 1024;
const PLASMA_GRID_VARIANTS = [256, 512, 1024];
const PLASMA_BC_MODES = [
  { name: 'periodic',   mode: 0 },
  { name: 'outflow',    mode: 1 },
  { name: 'reflecting', mode: 2 },
  { name: 'driven',     mode: 3 },
];

function sweepVariantOpts(axis) {
  return {
    specializeUniforms: { sweep: { sweep_dir: axis } },
    specializeFunctionParams: Object.fromEntries(
      SWEEP_AXIS_HELPERS.map(name => [name, { axis }]),
    ),
  };
}

function stageVariantOpts({ a0, a1, dt_w }) {
  return {
    specializeUniforms: { stage_params: { a0, a1, dt_w } },
  };
}

function viewFieldVariantOpts(mode) {
  return {
    specializeUniforms: { U_uniforms: { view_mode: mode } },
  };
}

function plasmaGridUniforms(n, extra = {}) {
  return {
    grid_n: n,
    grid_n_total: n + 2 * PLASMA_GHOST,
    ghost_w: PLASMA_GHOST,
    ...extra,
  };
}

function plasmaFixedWorkgroups(width, height = width) {
  return [
    Math.ceil(width / PLASMA_WORKGROUP),
    Math.ceil(height / PLASMA_WORKGROUP),
    1,
  ];
}

function gridVariantOpts(n, extraUniforms = {}, width = n, height = width) {
  return {
    specializeUniforms: { U_uniforms: plasmaGridUniforms(n, extraUniforms) },
    fixedWorkgroups: plasmaFixedWorkgroups(width, height),
  };
}

function gridVariants(widthFn = n => n, heightFn = widthFn, extraUniforms = {}) {
  return PLASMA_GRID_VARIANTS.map(n => ({
    name: `n${n}`,
    opts: gridVariantOpts(n, extraUniforms, widthFn(n), heightFn(n)),
  }));
}

function etaZeroGridVariants(widthFn = n => n, heightFn = widthFn) {
  return PLASMA_GRID_VARIANTS.map(n => ({
    name: `n${n}.eta0`,
    opts: gridVariantOpts(n, { eta_anom_alpha: 0 }, widthFn(n), heightFn(n)),
  }));
}

function bcModeGridVariants() {
  return PLASMA_GRID_VARIANTS.flatMap(n => PLASMA_BC_MODES.map(({ name, mode }) => ({
    name: `n${n}.bc-${name}`,
    opts: mergeWGslOpts(
      gridVariantOpts(n, {}, n + 2 * PLASMA_GHOST + 1),
      { specializeUniforms: { bc: {
        mode_n: mode,
        mode_s: mode,
        mode_e: mode,
        mode_w: mode,
      } } },
    ),
  })));
}

// Geon prepends a generated WGSL const block (config.js values + palette
// colors) to every shader at runtime via buildWGSLConstants(). Those consts
// (EPSILON, GRID, FLAG_*, capacity limits, …) live in no .wgsl file, so the
// build-time transpile needs the same block injected as `prependSource`.
// buildWGSLConstants() is browser-oriented; shim the two globals it needs so
// it runs headless. config.js is pure (no DOM); shared-tokens.js sets the
// palette globals at import time.
async function geonWGSLConstants() {
  globalThis.window = globalThis.window || {};
  globalThis.document = globalThis.document || {
    createElement: () => ({ style: {}, appendChild() {} }),
    head: { appendChild() {} },
  };
  await import('./shared-tokens.js');
  const { buildWGSLConstants } = await import('./geon/src/gpu/gpu-constants.js');
  let block = buildWGSLConstants();
  // Spin-ring colors derive from palette hue fields (spinPos/spinNeg) that are
  // injected only by browser-side project setup; headless they evaluate to
  // non-finite. No compute shader references COLOR_SPIN_*, so sanitize the
  // non-finite literals to keep the prepended block parseable.
  block = block.replace(/\bNaN(\.0)?\b/g, '0.0').replace(/-?\bInfinity(\.0)?\b/g, '0.0');
  return block;
}

const WGSL_SHADER_DIRS = [
  {
    dir: 'plasma/src/gpu/shaders',
    opts: {
      flatStorage: true,        // array<vecN<f32>> storage bindings flow as Float32Array
      collectErrors: true,      // aggregate all failures into one report
    },
    // solve-poisson.reduce_mean is a `loop {}` tree reduction whose loop
    // counter `stride` is a stateful uniform declared OUTSIDE the loop. The
    // barrier-schedule emitter can't prove it uniform (it's not a for-header
    // var, and it mutates), so it fails closed (Class 2). It was silently
    // wrong before this (flat-phase no-op barrier). The default Poisson solver
    // is the barrier-free multigrid (solve-poisson-mg); this Jacobi fallback
    // stays GPU-only until uniform-local hoisting lands.
    exclude: ['solve-poisson.wgsl'],
    shaderOpts: {
      // Profile-shaped per-shader defaults. These helpers sit in hot
      // per-cell paths and are cheap enough to duplicate after profiling,
      // while larger branchy helpers still need explicit opt-in.
      'compute-dt.wgsl':  { inlineHotFns: ['jz_mag_at'] },
      'view-field.wgsl':  { inlineHotFns: ['bx_at', 'by_at'] },
      'lic-advect.wgsl':  { inlineHotFns: ['sample_noise', 'bx_at_cell', 'by_at_cell', 'sample_b_unit'] },
    },
    variants: {
      // CPU fallback can choose the static x/y sweep artifacts instead
      // of reading the tiny SweepDir uniform inside the hot loop.
      'reconstruct-ppm.wgsl': [
        { name: 'x', opts: sweepVariantOpts(0) },
        { name: 'y', opts: sweepVariantOpts(1) },
      ],
      'riemann-hlld.wgsl': [
        { name: 'x', opts: sweepVariantOpts(0) },
        { name: 'y', opts: sweepVariantOpts(1) },
      ],
      // Grid/ghost/noise/eta fields are effectively constants for a
      // running plasma instance. Keep generic artifacts for dynamic use,
      // but fan out the hot CPU fallback paths for the three UI-supported
      // resolutions so uniform reads, padding guards, and workgroup
      // destructuring can fold away.
      'colormap.wgsl': gridVariants(),
      'compute-emf.wgsl': gridVariants(n => n + 1),
      'energy-floor.wgsl': gridVariants(),
      'lic-advect.wgsl': gridVariants(n => n, n => n, { noise_n: PLASMA_NOISE_N }),
      'lic-normalize.wgsl': gridVariants(),
      'compute-dt.wgsl': etaZeroGridVariants(),
      'apply-bcs.wgsl': bcModeGridVariants(),
      'apply-resistivity-init.wgsl': etaZeroGridVariants(n => n + 3),
      'apply-resistivity-prev.wgsl': etaZeroGridVariants(n => n + 3),
      // Render fallback can pick the current scalar-field mode without
      // carrying the `view_mode` branch through every interior cell.
      'view-field.wgsl': [
        ...VIEW_FIELD_MODES.map(v => ({
          name: v.name,
          opts: viewFieldVariantOpts(v.mode),
        })),
        ...VIEW_FIELD_MODES.flatMap(v => PLASMA_GRID_VARIANTS.map(n => ({
          name: `${v.name}.n${n}`,
          opts: mergeWGslOpts(viewFieldVariantOpts(v.mode), gridVariantOpts(n)),
        }))),
      ],
      // Stage params are immutable RK3 uniform buffers. Prebake the
      // three common SSP stages so CPU fallback can avoid per-cell
      // uniform field aliases and fold the stage-1 zero coefficient.
      'update-conserved-weighted.wgsl': RK3_STAGE_WEIGHTS.map(v => ({
        name: v.name,
        opts: stageVariantOpts(v),
      })),
      'update-b-weighted.wgsl': RK3_STAGE_WEIGHTS.map(v => ({
        name: v.name,
        opts: stageVariantOpts(v),
      })),
    },
  },
  {
    dir: 'geon/src/gpu/shaders',
    prependSource: geonWGSLConstants,   // resolved (awaited) before the loop
    opts: {
      flatStorage: true,
      collectErrors: true,
    },
    // Class 2 loop-carried barriers: per-invocation locals live across the
    // barrier (a tiled accumulator), which needs privatization (per-lane
    // arrays) the transpiler doesn't do yet. The barrier-schedule emitter
    // fails closed on these (runtime-throwing stub, never silently wrong), so
    // the exclusion here just keeps them out of artifact generation.
    // Class 1 loop-carried barriers (tree reductions — compute-stats,
    // quadrupole) ARE handled now via barrier-schedule fission.
    exclude: [
      'collision.wgsl',      // Class 2: tiled scan, per-invocation values across barrier
      'pair-force.wgsl',     // Class 2: tiled force accumulation (&accum across barrier)
    ],
  },
];

const WGSL_FORCE = process.argv.includes('--force-wgsl');

function sha256Hex(s) {
  return createHash('sha256').update(s).digest('hex');
}

const WGSL_TRANSPILER_SHA = sha256Hex(readFileSync(join(ROOT, 'shared-wgsl-transpile.js'), 'utf8'));

function hasComputeEntryPointWGSL(src) {
  // Quick textual check — same intent as run.js's hasEntryPoint(ast)
  // but avoids re-parsing here. False positives are harmless (a comment
  // mentioning @compute would just transpile the helper as an entry,
  // which transpileWGSL handles fine).
  return /@compute\b/.test(src);
}

function hasAnyEntryPointWGSL(src) {
  return /@(compute|vertex|fragment)\b/.test(src);
}

function mergeWGslOpts(base, extra = {}) {
  const out = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    if (key === 'specializeUniforms') {
      const merged = { ...(out.specializeUniforms || {}) };
      for (const [binding, fields] of Object.entries(value || {})) {
        merged[binding] = { ...(merged[binding] || {}), ...(fields || {}) };
      }
      out.specializeUniforms = merged;
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = { ...(out[key] || {}), ...value };
    } else {
      out[key] = value;
    }
  }
  return out;
}

function artifactPathFor(srcRel, variantName = null) {
  const suffix = variantName ? `.${variantName}` : '';
  return join(ROOT, 'transpiled', srcRel).replace(/\.wgsl$/, `${suffix}.transpiled.js`);
}

function artifactJobsFor(rec, baseOpts, shaderOpts = {}, variants = {}) {
  const perShaderOpts = mergeWGslOpts(baseOpts, shaderOpts[rec.f] || {});
  const jobs = [{ name: null, opts: perShaderOpts }];
  for (const variant of (variants[rec.f] || [])) {
    jobs.push({
      name: variant.name,
      opts: mergeWGslOpts(perShaderOpts, variant.opts || {}),
    });
  }
  return jobs;
}

function transpileOneDir({ dir, opts, shaderOpts = {}, variants, prependSource, exclude = [] }) {
  const dirAbs = join(ROOT, dir);
  if (!existsSync(dirAbs)) {
    console.log(`wgsl-transpile: skipping ${dir} (not present)`);
    return { entries: 0, written: 0, skipped: 0, errors: [], excluded: [] };
  }
  // prependSource (a generated const block injected ahead of every unit) is
  // carried in opts so it serializes into the artifact header — build-smoke
  // reproduces the exact transpile from opts alone, and the on-disk source
  // hash stays over the real helpers+entry unit.
  const baseOpts = prependSource ? { ...opts, prependSource } : opts;
  const excludeSet = new Set(exclude);
  const files = readdirSync(dirAbs)
    .filter(f => f.endsWith('.wgsl'))
    .sort();
  const records = files.map(f => {
    const abs = join(dirAbs, f);
    const src = readFileSync(abs, 'utf8');
    return {
      f,
      abs,
      src,
      isEntry: hasComputeEntryPointWGSL(src),
      isHelper: !hasAnyEntryPointWGSL(src),
    };
  });
  const helpers = records.filter(r => r.isHelper);
  const helperSrc = helpers.map(h => h.src).join('\n');
  const helperHash = sha256Hex(helperSrc);

  let entries = 0, written = 0, skipped = 0;
  const allErrors = [];
  const excluded = [];

  for (const rec of records) {
    if (!rec.isEntry) continue;  // helpers don't get standalone artifacts
    if (excludeSet.has(rec.f)) { excluded.push(rec.f); continue; }
    // Mirror the source path under transpiled/ so the parent repo
    // tracks artifacts even when the source lives in a submodule.
    const srcRel = relative(ROOT, rec.abs);
    const unitSrc = helpers.length ? helperSrc + '\n' + rec.src : rec.src;
    const unitHash = sha256Hex(unitSrc);

    for (const job of artifactJobsFor(rec, baseOpts, shaderOpts, variants)) {
      entries++;
      const outPath = artifactPathFor(srcRel, job.name);
      mkdirSync(dirname(outPath), { recursive: true });
      const headerOpts = JSON.stringify(job.opts);

      // Skip if the existing artifact matches source, transpiler, and opts.
      if (!WGSL_FORCE && existsSync(outPath)) {
        try {
          const existing = readFileSync(outPath, 'utf8');
          const m = existing.match(/^\/\/ wgsl-transpile sha256: ([0-9a-f]+)/m);
          const tm = existing.match(/^\/\/ wgsl-transpiler-sha256: ([0-9a-f]+)/m);
          const om = existing.match(/^\/\/ wgsl-opts: (.+)$/m);
          if (m && m[1] === unitHash &&
              tm && tm[1] === WGSL_TRANSPILER_SHA &&
              om && om[1] === headerOpts) {
            skipped++;
            continue;
          }
        } catch { /* fall through to regen */ }
      }

      let result;
      try {
        result = transpileWGSL(unitSrc, job.opts);
      } catch (err) {
        // Hard failure (parser/tokenizer/resolver) — still want to keep
        // building other shaders. Collect and report at the end.
        allErrors.push({
          file: relative(ROOT, rec.abs) + (job.name ? `#${job.name}` : ''),
          phase: 'fatal',
          message: err && err.message || String(err),
        });
        continue;
      }
      if (result.errors && result.errors.length) {
        for (const e of result.errors) {
          allErrors.push({ file: relative(ROOT, rec.abs) + (job.name ? `#${job.name}` : ''), ...e });
        }
      }

      // Opts are encoded in the header so build-smoke.js can reproduce
      // the transpile call from the artifact alone — keeps the test
      // data-driven instead of needing to duplicate WGSL_SHADER_DIRS.
      const header = [
        '// Auto-generated from WGSL by _build.mjs — DO NOT EDIT.',
        `// source: ${relative(ROOT, rec.abs)}`,
        job.name ? `// wgsl-variant: ${job.name}` : null,
        `// helpers-sha256: ${helperHash}`,
        `// wgsl-transpile sha256: ${unitHash}`,
        `// wgsl-transpiler-sha256: ${WGSL_TRANSPILER_SHA}`,
        `// wgsl-opts: ${headerOpts}`,
        `// wgsl-metrics: ${JSON.stringify(result.metrics)}`,
        `// generated: ${new Date().toISOString()}`,
        '',
      ].filter(x => x != null).join('\n');
      // Strip the transpiler's own banner since we're prepending our own.
      const body = result.jsSource.replace(
        /^\/\/ Auto-generated from WGSL[^\n]*\n\/\/ DO NOT EDIT[^\n]*\n\n/,
        ''
      );
      writeFileSync(outPath, header + body);
      written++;
    }
  }

  return { entries, written, skipped, errors: allErrors, excluded };
}

console.log('');
// Resolve any prependSource thunks (e.g. geon's generated const block) once,
// up front — they may dynamic-import browser-shaped modules under a shim.
for (const cfg of WGSL_SHADER_DIRS) {
  if (typeof cfg.prependSource === 'function') cfg.prependSource = await cfg.prependSource();
}
let totalEntries = 0, totalWritten = 0, totalSkipped = 0;
const allWgslErrors = [];
for (const cfg of WGSL_SHADER_DIRS) {
  const r = transpileOneDir(cfg);
  totalEntries += r.entries;
  totalWritten += r.written;
  totalSkipped += r.skipped;
  for (const e of r.errors) allWgslErrors.push(e);
  const exTail = r.excluded && r.excluded.length
    ? `; excluded ${r.excluded.length} (${r.excluded.join(', ')})`
    : '';
  console.log(`wgsl-transpile: ${cfg.dir} — ${r.entries} entries (${r.written} written, ${r.skipped} skipped${r.errors.length ? `, ${r.errors.length} errors` : ''})${exTail}`);
}
if (totalEntries) {
  console.log(`wgsl-transpile: ${totalEntries} total entries (${totalWritten} written, ${totalSkipped} skipped)`);
}
if (allWgslErrors.length) {
  console.error('');
  console.error(`wgsl-transpile: ${allWgslErrors.length} error${allWgslErrors.length === 1 ? '' : 's'}:`);
  for (const e of allWgslErrors) {
    const where = e.line ? `:${e.line}:${e.col || 0}` : '';
    console.error(`  ${e.file}${where}  [${e.phase}${e.kind ? '/' + e.kind : ''}]  ${e.message}`);
  }
  process.exitCode = 1;
}
