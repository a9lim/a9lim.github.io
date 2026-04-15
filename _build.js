#!/usr/bin/env node
'use strict';

const { readFileSync, writeFileSync, existsSync } = require('fs');
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
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => `<img src="${mdSafeUrl(url)}" alt="${alt}" loading="lazy">`)
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
      const code = [];
      i++;
      while (i < len && lines[i].indexOf(fence) !== 0) { code.push(mdEsc(lines[i])); i++; }
      i++;
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

// Image map: sim paths → [card image, OG image]
const IMAGE_MAP = {
  '/':          ['og-image.webp'],
  '/geon':      ['img/geon.webp', 'geon/og-image.webp'],
  '/cyano':     ['img/cyano.webp', 'cyano/og-image.webp'],
  '/gerry':     ['img/gerry.webp', 'gerry/og-image.webp'],
  '/shoals':    ['img/shoals.webp', 'shoals/og-image.webp'],
  '/scripture/': ['img/scripture.webp', 'scripture/og-image.webp'],
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
};

// 1. Static routes
const staticRoutes = [
  { path: '/',          file: 'index.html',           changefreq: 'weekly',  priority: 1.0 },
  { path: '/projects',  file: 'index.html',           changefreq: 'monthly', priority: 0.8 },
  { path: '/blog',      file: 'index.html',           changefreq: 'monthly', priority: 0.8 },
  { path: '/about',     file: 'index.html',           changefreq: 'monthly', priority: 0.8 },
  { path: '/resume',    file: 'index.html',           changefreq: 'monthly', priority: 0.7 },
  { path: '/geon',      file: 'geon/index.html',      changefreq: 'monthly', priority: 0.9 },
  { path: '/cyano',     file: 'cyano/index.html',     changefreq: 'monthly', priority: 0.9 },
  { path: '/gerry',     file: 'gerry/index.html',     changefreq: 'monthly', priority: 0.9 },
  { path: '/shoals',    file: 'shoals/index.html',    changefreq: 'monthly', priority: 0.9 },
  { path: '/scripture/', file: 'scripture/index.html', changefreq: 'monthly', priority: 0.9 },
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
      <uri>${SITE}/about</uri>
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
    <uri>${SITE}/about</uri>
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
