# SEO/GEO Comprehensive Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all actionable SEO and GEO improvements from the April 2026 audit — server-side rendering of SPA content, structured data, sitemap overhaul, cache-busting, meta rewriting, headers, fonts, speculation rules, and manifest.

**Architecture:** The Worker (`_worker.js`) becomes the primary rendering engine for crawlable content: it already rewrites meta tags via HTMLRewriter, and we extend it to inject page bodies (projects grid, blog posts, about section) as static HTML. A new `_build.js` Node script generates `sitemap.xml` (with scripture deep routes and `<lastmod>` dates). Everything else is surgical edits to existing files.

**Tech Stack:** Cloudflare Workers (HTMLRewriter), vanilla JS/HTML/CSS, Node.js (build script)

**No test framework exists in this repo.** Verification is manual: `python -m http.server` for local, `wrangler dev` for Worker behavior, and curl/browser DevTools for headers and markup inspection.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `_worker.js` | SSR blog posts, inject project cards, about body, structured data, `Content-Language`, robots meta, og:image dimensions, title separator consistency |
| Modify | `index.html` | Speculation rules expansion, `og:image` dimensions, robots meta, modulepreload for `main.js`, manifest link, title separator |
| Modify | `_headers` | `Content-Language`, `main.js` modulepreload in Early Hints |
| Modify | `sitemap.xml` | Generated — `<lastmod>` dates, scripture deep routes |
| Modify | `robots.txt` | AI crawler directives, sitemap-index reference |
| Create | `manifest.json` | Web App Manifest (PWA) |
| Create | `_build.js` | Build script: generate sitemap |
| Create | `fonts/` | Self-hosted font files (Merriweather, Lato, Crimson Text, Recursive) |
| Create | `fonts/fonts.css` | `@font-face` declarations for self-hosted fonts |
| Modify | `geon/index.html` | Title separator, self-hosted font references, og:image dimensions, robots meta, Wikidata entities, speakable |
| Modify | `cyano/index.html` | Same |
| Modify | `gerry/index.html` | Same |
| Modify | `shoals/index.html` | Same |
| Modify | `scripture/index.html` | Same |
| Modify | `404.html` | Self-hosted font references |

---

## Task 1: Server-Side Render Blog Posts in Worker (Audit #1, #2)

This is the highest-impact change. The Worker already fetches `index.html` for blog routes and rewrites `<title>`, `<meta>`, and `<link rel="canonical">`. We extend it to also fetch the markdown file from assets, parse it to HTML, and inject it into a content div — so crawlers see the full blog post without executing JS.

**Files:**
- Modify: `_worker.js:1-150`

The client-side `src/markdown.js` is an ES6 module and cannot be imported into the Worker directly. We port the parser into `_worker.js` as a self-contained function. The parser is 118 lines — small enough to inline. The Worker version does not need to be identical to the client version (the client will still hydrate its own rendering on top), but it should produce structurally equivalent HTML so there's no layout shift.

- [ ] **Step 1: Port the markdown parser into `_worker.js`**

Add these functions above the `export default` block in `_worker.js`. This is a direct port of `src/markdown.js` adapted for the Worker environment (no DOM, no ES6 module exports):

```javascript
// --- Markdown parser (SSR) ---
// Ported from src/markdown.js for edge rendering of blog posts.
// Client-side JS hydrates on top — this just needs to produce equivalent HTML.

function mdEsc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mdInline(src) {
  return src
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*{3}(.+?)\*{3}/g, '<strong><em>$1</em></strong>')
    .replace(/_{3}(.+?)_{3}/g, '<strong><em>$1</em></strong>')
    .replace(/\*{2}(.+?)\*{2}/g, '<strong>$1</strong>')
    .replace(/_{2}(.+?)_{2}/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/(^|[\s(])_(.+?)_([\s).,!?]|$)/g, '$1<em>$2</em>$3');
}

function renderMarkdown(src) {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let i = 0;
  const len = lines.length;

  while (i < len) {
    const line = lines[i];

    if (/^(`{3,}|~{3,})(.*)$/.test(line)) {
      const fence = RegExp.$1;
      const lang = RegExp.$2.trim();
      const code = [];
      i++;
      while (i < len && lines[i].indexOf(fence) !== 0) { code.push(mdEsc(lines[i])); i++; }
      i++;
      const langAttr = lang ? ' class="language-' + mdEsc(lang) + '"' : '';
      html.push('<pre><code' + langAttr + '>' + code.join('\n') + '</code></pre>');
      continue;
    }

    if (/^\s*$/.test(line)) { i++; continue; }

    const hm = line.match(/^(#{1,6})\s+(.+)$/);
    if (hm) { html.push('<h' + hm[1].length + '>' + mdInline(mdEsc(hm[2])) + '</h' + hm[1].length + '>'); i++; continue; }

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

  return html.join('\n');
}
```

- [ ] **Step 2: Add `posts.json` reading and blog SSR to the Worker**

In `_worker.js`, modify the blog route handler (the `pathname.startsWith('/blog/')` branch inside the `if` block at line 95) to fetch `posts.json` and the markdown file, render them, and inject the HTML:

Replace the existing blog route section (`if (pathname.startsWith('/blog/')) {` through its closing `}` before `} else {`) with:

```javascript
if (pathname.startsWith('/blog/')) {
  const slug = pathname.slice(6);
  meta = BLOG_META[slug];
  if (!meta) {
    const pretty = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    meta = {
      title: `${pretty} \u2014 a9l.im`,
      desc: 'Articles on simulation design, web development, and educational technology.',
      ogTitle: `${pretty} \u2014 a9l.im`,
    };
  }
  meta = { ...meta, canonical: `https://a9l.im${pathname}` };

  // SSR: fetch markdown and render to HTML for crawlers
  try {
    const [mdRes, postsRes] = await Promise.all([
      env.ASSETS.fetch(new URL(`/posts/${slug}.md`, origin)),
      env.ASSETS.fetch(new URL('/posts.json', origin)),
    ]);
    if (mdRes.ok) {
      const mdText = await mdRes.text();
      const renderedBody = renderMarkdown(mdText);

      let postHeader = '';
      if (postsRes.ok) {
        try {
          const posts = await postsRes.json();
          const postMeta = posts.find(p => p.slug === slug);
          if (postMeta) {
            postHeader = `<span class="blog-post-date">${mdEsc(postMeta.date)}${postMeta.tag ? ' &middot; ' + mdEsc(postMeta.tag) : ''}</span><h1 class="blog-post-title">${mdEsc(postMeta.title)}</h1>`;
          }
        } catch (_) { /* proceed without metadata */ }
      }

      meta.ssrContent = `<div class="blog-post-header">${postHeader}</div><div class="blog-content">${renderedBody}</div>`;
    }
  } catch (_) { /* SSR failed — client JS will hydrate */ }
}
```

- [ ] **Step 3: Extend `rewriteHTML()` to inject SSR content**

Add new HTMLRewriter handlers in `rewriteHTML()` before `.transform(response)`:

```javascript
.on('#blog-post-content', {
  element(el) {
    if (meta.ssrContent) {
      el.setInnerContent(meta.ssrContent, { html: true });
    }
  },
})
.on('#blog-post', {
  element(el) {
    if (meta.ssrContent) el.removeAttribute('style');
  },
})
.on('#blog-listing', {
  element(el) {
    if (meta.ssrContent) el.setAttribute('style', 'display:none');
  },
})
```

- [ ] **Step 4: Verify with `wrangler dev`**

```bash
cd /Users/a9lim/Work/a9lim.github.io && npx wrangler dev
```

Then in another terminal:

```bash
curl -s http://localhost:8787/blog/hello-world | grep -o 'blog-content.*</div>' | head -5
```

Expected: HTML content from the rendered markdown visible in the response body.

Also check with a browser: navigate to `http://localhost:8787/blog/hello-world`, view source, confirm the blog content is in the initial HTML.

- [ ] **Step 5: Commit**

```bash
git add _worker.js
git commit -m "feat: server-side render blog posts in Worker for crawler visibility"
```

---

## Task 2: Server-Side Render Projects Page (Audit #1)

Inject a static HTML version of the project grid into `/projects` so crawlers see project names, descriptions, and links without JS execution.

**Files:**
- Modify: `_worker.js`

The project data lives in `src/projects.js` as an ES6 module. We cannot import it in the Worker. Instead, we define a static HTML string in the Worker that mirrors the project grid. This is a maintenance trade-off: project data is duplicated between `src/projects.js` and `_worker.js`. Since projects change infrequently and the Worker SSR is a crawlability fallback (client JS hydrates on top), this is acceptable.

- [ ] **Step 1: Add SSR project grid HTML to the Worker**

Add this constant after the `BLOG_META` object in `_worker.js`:

```javascript
// Static project grid HTML for SSR. Client JS hydrates on top.
// Duplicated from src/projects.js — update both when adding projects.
const PROJECTS_SSR = `
<div class="project-card fade-in visible"><a href="/geon"><h3>Geon</h3><p>Relativistic N-body simulator with 11 forces, scalar fields, and WebGPU compute shaders.</p><span class="tag">physics</span><span class="tag">webgpu</span><span class="tag">relativity</span><span class="tag">canvas</span></a></div>
<div class="project-card fade-in visible"><a href="/cyano"><h3>Cyano</h3><p>Cellular metabolism simulator with twelve biochemical pathways, allosteric regulation, and cofactor tracking.</p><span class="tag">biology</span><span class="tag">biochemistry</span><span class="tag">canvas</span></a></div>
<div class="project-card fade-in visible"><a href="/gerry"><h3>Gerry</h3><p>Draw districts on a procedural hex map and stress-test them with Monte Carlo elections and fairness metrics.</p><span class="tag">politics</span><span class="tag">svg</span><span class="tag">monte carlo</span></a></div>
<div class="project-card fade-in visible"><a href="/shoals"><h3>Shoals</h3><p>Options trading simulator with stochastic volatility, a multi-leg strategy builder, and narrative market events.</p><span class="tag">finance</span><span class="tag">options pricing</span><span class="tag">canvas</span></a></div>
<div class="project-card fade-in visible"><a href="/scripture"><h3>Scripture</h3><p>Sacred text reader with sixteen works from multiple traditions, full-text search, concordance, and text-to-speech.</p><span class="tag">reader</span><span class="tag">text</span><span class="tag">religion</span></a></div>
<div class="project-card fade-in visible"><a href="https://github.com/a9lim/shannon" target="_blank" rel="noopener noreferrer"><h3>Shannon</h3><p>Autonomous AI agent for Discord and Signal with web browsing, command execution, and task scheduling.</p><span class="tag">python</span><span class="tag">llm</span><span class="tag">automation</span></a></div>
<div class="project-card fade-in visible"><a href="https://github.com/a9lim/Raiko" target="_blank" rel="noopener noreferrer"><h3>Raiko</h3><p>Discord music and chat bot with queue management and conversational AI.</p><span class="tag">discord</span><span class="tag">java</span><span class="tag">music</span></a></div>
<div class="project-card fade-in visible"><a href="https://github.com/a9lim/faithful" target="_blank" rel="noopener noreferrer"><h3>Faithful</h3><p>Discord chatbot that emulates given messages in the style of source material.</p><span class="tag">discord</span><span class="tag">chatbot</span><span class="tag">nlp</span></a></div>
<div class="project-card fade-in visible"><a href="https://github.com/catppuccin/sddm" target="_blank" rel="noopener noreferrer"><h3>Catppuccin for SDDM</h3><p>Soothing pastel theme for the SDDM display manager with all four flavor variants.</p><span class="tag">linux</span><span class="tag">theme</span><span class="tag">catppuccin</span></a></div>
`;
```

- [ ] **Step 2: Add HTMLRewriter handler for projects grid injection**

In `rewriteHTML()`, add before `.transform(response)`:

```javascript
.on('.projects-grid', {
  element(el) {
    if (meta.canonical === 'https://a9l.im/projects') {
      el.setInnerContent(PROJECTS_SSR, { html: true });
    }
  },
})
```

- [ ] **Step 3: Verify**

```bash
curl -s http://localhost:8787/projects | grep -c 'project-card'
```

Expected: `9` (one per project).

- [ ] **Step 4: Commit**

```bash
git add _worker.js
git commit -m "feat: SSR project grid in Worker for /projects crawlability"
```

---

## Task 3: Server-Side Render Active Page Section (Audit #1)

The about page has static content already in `index.html` (bio and contact are hardcoded HTML). But since page sections are toggled by CSS class `active`, crawlers may not reliably see content in non-active sections. Use HTMLRewriter to activate the correct section for each route.

**Files:**
- Modify: `_worker.js`

- [ ] **Step 1: Add HTMLRewriter handlers to activate the correct page section**

In `rewriteHTML()`, add before `.transform(response)`:

```javascript
.on('#page-home', {
  element(el) {
    if (meta.canonical !== 'https://a9l.im' && meta.canonical !== 'https://a9l.im/') {
      el.setAttribute('class', 'page-section');
    }
  },
})
.on('#page-about', {
  element(el) {
    if (meta.canonical === 'https://a9l.im/about') {
      el.setAttribute('class', 'page-section active');
    }
  },
})
.on('#page-projects', {
  element(el) {
    if (meta.canonical === 'https://a9l.im/projects') {
      el.setAttribute('class', 'page-section active');
    }
  },
})
.on('#page-blog', {
  element(el) {
    if (meta.canonical === 'https://a9l.im/blog' || meta.canonical.startsWith('https://a9l.im/blog/')) {
      el.setAttribute('class', 'page-section active');
    }
  },
})
```

- [ ] **Step 2: Verify**

```bash
curl -s http://localhost:8787/about | grep -o 'page-section active' | head -3
```

Expected: `page-section active` appears for `#page-about`, not for `#page-home`.

- [ ] **Step 3: Commit**

```bash
git add _worker.js
git commit -m "feat: activate correct page section in SSR for all SPA routes"
```

---

## Task 4: Sitemap with `<lastmod>` and Scripture Deep Routes (Audit #3, #10)

Replace the static `sitemap.xml` with one generated by a build script. The script reads git log dates for `<lastmod>` and enumerates all scripture chapter routes from manifest files.

**Files:**
- Create: `_build.js`
- Modify: `sitemap.xml` (generated output)

- [ ] **Step 1: Create `_build.js` with sitemap generation**

```javascript
#!/usr/bin/env node
// Build script for a9l.im: generates sitemap.xml with <lastmod> dates
// and scripture deep routes derived from manifest files.
//
// Usage: node _build.js

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { execFileSync } from 'child_process';
import { join } from 'path';

const ORIGIN = 'https://a9l.im';

// --- Git-based lastmod ---
function gitLastmod(path) {
  try {
    const date = execFileSync('git', ['log', '-1', '--format=%aI', '--', path], { encoding: 'utf8' }).trim();
    return date ? date.slice(0, 10) : null;
  } catch (_) { return null; }
}

// --- Static routes with their representative files ---
const STATIC_ROUTES = [
  { loc: '/', file: 'index.html', priority: '1.0' },
  { loc: '/projects', file: 'index.html', priority: '0.9' },
  { loc: '/blog', file: 'posts.json', priority: '0.9' },
  { loc: '/about', file: 'index.html', priority: '0.7' },
  { loc: '/geon', file: 'geon/index.html', priority: '0.8' },
  { loc: '/cyano', file: 'cyano/index.html', priority: '0.8' },
  { loc: '/gerry', file: 'gerry/index.html', priority: '0.8' },
  { loc: '/shoals', file: 'shoals/index.html', priority: '0.8' },
  { loc: '/scripture/', file: 'scripture/index.html', priority: '0.8' },
];

// --- Blog posts from posts.json ---
const posts = JSON.parse(readFileSync('posts.json', 'utf8'));

// --- Scripture deep routes from manifest files ---
const worksFile = 'scripture/data/works.json';
const works = JSON.parse(readFileSync(worksFile, 'utf8'));
const scriptureRoutes = [];
const scriptureLastmod = gitLastmod('scripture/data') || '2026-04-01';

for (const workId of works) {
  const manifest = JSON.parse(readFileSync(`scripture/data/${workId}/manifest.json`, 'utf8'));
  for (const book of manifest.books) {
    const start = book.start || 1;
    for (let i = 0; i < book.chapters; i++) {
      const chapterId = `${book.id}-${start + i}`;
      scriptureRoutes.push(`/scripture/${workId}/${chapterId}`);
    }
  }
}

// --- Build sitemap XML ---
const urls = [];

for (const route of STATIC_ROUTES) {
  const lastmod = gitLastmod(route.file) || '2026-04-01';
  urls.push(`  <url>\n    <loc>${ORIGIN}${route.loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${route.priority}</priority>\n  </url>`);
}

for (const post of posts) {
  const lastmod = gitLastmod(`posts/${post.slug}.md`) || post.date;
  urls.push(`  <url>\n    <loc>${ORIGIN}/blog/${post.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>0.6</priority>\n  </url>`);
}

for (const route of scriptureRoutes) {
  urls.push(`  <url>\n    <loc>${ORIGIN}${route}</loc>\n    <lastmod>${scriptureLastmod}</lastmod>\n    <priority>0.4</priority>\n  </url>`);
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

writeFileSync('sitemap.xml', sitemap);
console.log(`sitemap.xml: ${urls.length} URLs`);
```

- [ ] **Step 2: Run the build script**

```bash
cd /Users/a9lim/Work/a9lim.github.io && node _build.js
```

Expected: `sitemap.xml: NNN URLs` where NNN is ~10 static + 1 blog + hundreds of scripture chapters.

- [ ] **Step 3: Verify sitemap structure**

```bash
head -20 sitemap.xml && echo "..." && grep -c '<url>' sitemap.xml
```

Expected: XML with `<lastmod>` dates on every `<url>`, and a count in the hundreds.

- [ ] **Step 4: Commit**

```bash
git add _build.js sitemap.xml
git commit -m "feat: generated sitemap with lastmod dates and scripture deep routes"
```

---

## Task 5: BlogPosting Structured Data (Audit #5)

Inject `BlogPosting` JSON-LD into blog post pages via the Worker.

**Files:**
- Modify: `_worker.js`

- [ ] **Step 1: Generate and inject BlogPosting JSON-LD**

In the blog SSR section of `_worker.js` (inside the `if (mdRes.ok)` block added in Task 1), after building `meta.ssrContent`, add:

```javascript
// BlogPosting structured data
if (postsRes.ok) {
  try {
    const posts = await postsRes.json();
    const postMeta = posts.find(p => p.slug === slug);
    if (postMeta) {
      meta.jsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: postMeta.title,
        datePublished: postMeta.date,
        dateModified: postMeta.date,
        description: meta.desc,
        url: meta.canonical,
        author: {
          '@type': 'Person',
          name: 'a9lim',
          url: 'https://a9l.im/about',
          sameAs: ['https://github.com/a9lim', 'https://twitter.com/a9_lim'],
        },
        publisher: {
          '@type': 'Person',
          name: 'a9lim',
          url: 'https://a9l.im',
        },
        isPartOf: {
          '@type': 'Blog',
          name: 'a9l.im Blog',
          url: 'https://a9l.im/blog',
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': meta.canonical },
      });
    }
  } catch (_) { /* proceed without structured data */ }
}
```

Note: the `postsRes` was already fetched in the SSR block from Task 1. Since `.json()` consumes the body, either clone the response before the first `.json()` call, or restructure so the posts data is parsed once and shared between SSR content and JSON-LD generation. The simplest fix: parse posts once into a variable and use it for both.

- [ ] **Step 2: Add HTMLRewriter handler to inject JSON-LD**

In `rewriteHTML()`, add before `.transform(response)`:

```javascript
.on('head', {
  element(el) {
    if (meta.jsonLd) {
      el.append(`<script type="application/ld+json">${meta.jsonLd}</script>`, { html: true });
    }
  },
})
```

- [ ] **Step 3: Verify**

```bash
curl -s http://localhost:8787/blog/hello-world | grep -o 'BlogPosting'
```

Expected: `BlogPosting`

- [ ] **Step 4: Commit**

```bash
git add _worker.js
git commit -m "feat: inject BlogPosting JSON-LD for blog posts via Worker"
```

---

## Task 6: Person Structured Data on About Page (Audit #6)

Inject `Person` JSON-LD when serving `/about`.

**Files:**
- Modify: `_worker.js`

- [ ] **Step 1: Add Person JSON-LD injection for `/about`**

In `_worker.js`, after the `ROUTE_META` object, add:

```javascript
const ABOUT_JSONLD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'a9lim',
  url: 'https://a9l.im/about',
  sameAs: [
    'https://github.com/a9lim',
    'https://twitter.com/a9_lim',
  ],
  description: 'Builder of interactive educational simulations exploring physics, biology, finance, and political science.',
  knowsAbout: [
    'Particle physics simulation',
    'Cellular metabolism',
    'Options pricing',
    'Gerrymandering and electoral fairness',
    'Sacred text analysis',
    'WebGPU',
    'JavaScript',
  ],
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://a9l.im/about' },
});
```

Then in the route handler, after setting `meta` for `/about`, add:

```javascript
if (pathname === '/about') {
  meta.jsonLd = ABOUT_JSONLD;
}
```

The `head` element handler from Task 5 already injects `meta.jsonLd` — no additional HTMLRewriter needed.

- [ ] **Step 2: Verify**

```bash
curl -s http://localhost:8787/about | grep -o '"Person"'
```

Expected: `"Person"`

- [ ] **Step 3: Commit**

```bash
git add _worker.js
git commit -m "feat: inject Person JSON-LD on /about page"
```

---

## Task 7: OG Image Dimensions (Audit #8)

Add `og:image:width`, `og:image:height`, and `og:image:type` to all pages.

**Files:**
- Modify: `index.html:14-15`
- Modify: `geon/index.html`, `cyano/index.html`, `gerry/index.html`, `shoals/index.html`, `scripture/index.html`

- [ ] **Step 1: Add og:image dimension meta tags to `index.html`**

After line 15 (`<meta name="twitter:image" ...>`), add:

```html
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/webp">
```

- [ ] **Step 2: Add the same tags to all subproject index.html files**

In each of `geon/index.html`, `cyano/index.html`, `gerry/index.html`, `shoals/index.html`, `scripture/index.html`, add after the `og:image` or `twitter:image` meta tag:

```html
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/webp">
```

- [ ] **Step 3: Commit**

```bash
git add index.html geon/index.html cyano/index.html gerry/index.html shoals/index.html scripture/index.html
git commit -m "feat: add og:image dimensions and type to all pages"
```

---

## Task 8: Robots Meta Tag with Rich Result Opt-In (Audit #9)

Add explicit `<meta name="robots">` with `max-image-preview:large` and `max-snippet:-1` to opt into rich results.

**Files:**
- Modify: `index.html`
- Modify: `geon/index.html`, `cyano/index.html`, `gerry/index.html`, `shoals/index.html`, `scripture/index.html`

- [ ] **Step 1: Add robots meta to `index.html`**

After the `<meta name="description">` tag (line 7), add:

```html
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
```

- [ ] **Step 2: Add same tag to all subproject index.html files**

After each page's `<meta name="description">`, add the same tag.

- [ ] **Step 3: Commit**

```bash
git add index.html geon/index.html cyano/index.html gerry/index.html shoals/index.html scripture/index.html
git commit -m "feat: add robots meta with rich result opt-in to all pages"
```

---

## Task 9: `Content-Language` Header (Audit #12)

**Files:**
- Modify: `_worker.js:33-41` (SECURITY_HEADERS)
- Modify: `_headers:1-9` (`/*` block)

- [ ] **Step 1: Add `Content-Language` to Worker headers**

In `SECURITY_HEADERS` in `_worker.js`, add:

```javascript
'Content-Language': 'en',
```

- [ ] **Step 2: Add `Content-Language` to `_headers`**

In the `/*` block at the top of `_headers`, add:

```
  Content-Language: en
```

- [ ] **Step 3: Verify**

```bash
curl -sI http://localhost:8787/ | grep -i content-language
```

Expected: `Content-Language: en`

- [ ] **Step 4: Commit**

```bash
git add _worker.js _headers
git commit -m "feat: add Content-Language: en header to all responses"
```

---

## Task 10: Self-Host Google Fonts (Audit #13)

Download font files, create `@font-face` CSS, and update all HTML files to use local fonts instead of Google Fonts. This eliminates a third-party dependency, removes a render-blocking external request, and improves privacy.

**Files:**
- Create: `fonts/` directory with woff2 files
- Create: `fonts/fonts.css`
- Modify: `index.html:24-26`
- Modify: `geon/index.html`, `cyano/index.html`, `gerry/index.html`, `shoals/index.html`, `scripture/index.html` (equivalent font lines)
- Modify: `404.html:9-11`
- Modify: `_headers` (remove font preconnects from Early Hints, add fonts cache rules)
- Modify: `_worker.js` (CSP update: remove fonts.googleapis.com and fonts.gstatic.com)

Fonts needed (latin subset, woff2):
- **Merriweather**: 300, 400, 700, 900, 400i
- **Lato**: 300, 400, 700, 900, 400i
- **Crimson Text**: 400, 600, 700, 400i
- **Recursive**: variable weight 300-700

- [ ] **Step 1: Download font files**

```bash
mkdir -p /Users/a9lim/Work/a9lim.github.io/fonts

# Fetch the CSS to extract woff2 URLs (need modern UA for woff2)
curl -sA "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120" \
  "https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,400&family=Lato:ital,wght@0,300;0,400;0,700;0,900;1,400&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Recursive:wght@300..700&display=swap" \
  -o /Users/a9lim/Work/a9lim.github.io/fonts/google-fonts-response.css
```

Then extract each `/* latin */` block's URL and download the woff2 files:

```bash
cd /Users/a9lim/Work/a9lim.github.io/fonts
cat google-fonts-response.css
```

For each `/* latin */` block, download the URL with descriptive naming:
```bash
curl -sL "https://fonts.gstatic.com/s/merriweather/v30/..." -o merriweather-300.woff2
curl -sL "https://fonts.gstatic.com/s/merriweather/v30/..." -o merriweather-400.woff2
curl -sL "https://fonts.gstatic.com/s/merriweather/v30/..." -o merriweather-400i.woff2
curl -sL "https://fonts.gstatic.com/s/merriweather/v30/..." -o merriweather-700.woff2
curl -sL "https://fonts.gstatic.com/s/merriweather/v30/..." -o merriweather-900.woff2
curl -sL "https://fonts.gstatic.com/s/lato/v24/..." -o lato-300.woff2
curl -sL "https://fonts.gstatic.com/s/lato/v24/..." -o lato-400.woff2
curl -sL "https://fonts.gstatic.com/s/lato/v24/..." -o lato-400i.woff2
curl -sL "https://fonts.gstatic.com/s/lato/v24/..." -o lato-700.woff2
curl -sL "https://fonts.gstatic.com/s/lato/v24/..." -o lato-900.woff2
curl -sL "https://fonts.gstatic.com/s/crimsontext/v19/..." -o crimsontext-400.woff2
curl -sL "https://fonts.gstatic.com/s/crimsontext/v19/..." -o crimsontext-400i.woff2
curl -sL "https://fonts.gstatic.com/s/crimsontext/v19/..." -o crimsontext-600.woff2
curl -sL "https://fonts.gstatic.com/s/crimsontext/v19/..." -o crimsontext-700.woff2
curl -sL "https://fonts.gstatic.com/s/recursive/v37/..." -o recursive-variable.woff2
```

(Exact URLs come from the CSS response — substitute the real URLs.)

- [ ] **Step 2: Create `fonts/fonts.css`**

```css
/* Self-hosted Google Fonts — latin subset only */

/* Merriweather */
@font-face { font-family: 'Merriweather'; font-style: normal; font-weight: 300; font-display: swap; src: url('/fonts/merriweather-300.woff2') format('woff2'); }
@font-face { font-family: 'Merriweather'; font-style: normal; font-weight: 400; font-display: swap; src: url('/fonts/merriweather-400.woff2') format('woff2'); }
@font-face { font-family: 'Merriweather'; font-style: italic; font-weight: 400; font-display: swap; src: url('/fonts/merriweather-400i.woff2') format('woff2'); }
@font-face { font-family: 'Merriweather'; font-style: normal; font-weight: 700; font-display: swap; src: url('/fonts/merriweather-700.woff2') format('woff2'); }
@font-face { font-family: 'Merriweather'; font-style: normal; font-weight: 900; font-display: swap; src: url('/fonts/merriweather-900.woff2') format('woff2'); }

/* Lato */
@font-face { font-family: 'Lato'; font-style: normal; font-weight: 300; font-display: swap; src: url('/fonts/lato-300.woff2') format('woff2'); }
@font-face { font-family: 'Lato'; font-style: normal; font-weight: 400; font-display: swap; src: url('/fonts/lato-400.woff2') format('woff2'); }
@font-face { font-family: 'Lato'; font-style: italic; font-weight: 400; font-display: swap; src: url('/fonts/lato-400i.woff2') format('woff2'); }
@font-face { font-family: 'Lato'; font-style: normal; font-weight: 700; font-display: swap; src: url('/fonts/lato-700.woff2') format('woff2'); }
@font-face { font-family: 'Lato'; font-style: normal; font-weight: 900; font-display: swap; src: url('/fonts/lato-900.woff2') format('woff2'); }

/* Crimson Text */
@font-face { font-family: 'Crimson Text'; font-style: normal; font-weight: 400; font-display: swap; src: url('/fonts/crimsontext-400.woff2') format('woff2'); }
@font-face { font-family: 'Crimson Text'; font-style: italic; font-weight: 400; font-display: swap; src: url('/fonts/crimsontext-400i.woff2') format('woff2'); }
@font-face { font-family: 'Crimson Text'; font-style: normal; font-weight: 600; font-display: swap; src: url('/fonts/crimsontext-600.woff2') format('woff2'); }
@font-face { font-family: 'Crimson Text'; font-style: normal; font-weight: 700; font-display: swap; src: url('/fonts/crimsontext-700.woff2') format('woff2'); }

/* Recursive (variable) */
@font-face { font-family: 'Recursive'; font-style: normal; font-weight: 300 700; font-display: swap; src: url('/fonts/recursive-variable.woff2') format('woff2'); }
```

- [ ] **Step 3: Replace Google Fonts link in `index.html`**

Replace lines 24-26:

```html
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,400&family=Lato:ital,wght@0,300;0,400;0,700;0,900;1,400&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=Recursive:wght@300..700&display=swap" rel="stylesheet">
```

With:

```html
    <link rel="stylesheet" href="fonts/fonts.css">
```

- [ ] **Step 4: Replace in all subproject index.html files and 404.html**

Each file has the same 3-line Google Fonts block. Replace with `<link rel="stylesheet" href="/fonts/fonts.css">` (absolute path for subprojects). `404.html` uses a reduced font set but should also point to the self-hosted CSS.

Files to update: `geon/index.html`, `cyano/index.html`, `gerry/index.html`, `shoals/index.html`, `scripture/index.html`, `404.html`.

- [ ] **Step 5: Update CSP in `_worker.js` and `_headers`**

In `SECURITY_HEADERS` in `_worker.js`, update the CSP. Remove `https://fonts.googleapis.com` from `style-src`, remove `font-src https://fonts.gstatic.com`, add `font-src 'self'`:

```
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; base-uri 'self'; frame-ancestors 'self'
```

Make the same change in `_headers` line 9.

Note: `geon/index.html` loads KaTeX from `cdn.jsdelivr.net`. The current `/*` CSP doesn't include `cdn.jsdelivr.net` — this is a pre-existing issue unrelated to this task. Leave it as-is.

- [ ] **Step 6: Update Early Hints in `_headers`**

Remove all `Link: <https://fonts.googleapis.com>; rel=preconnect` and `Link: <https://fonts.gstatic.com>; rel=preconnect; crossorigin` lines from every Early Hints block (all route blocks: `/`, `/projects`, `/blog`, `/blog/*`, `/about`, `/geon/*`, `/cyano/*`, `/shoals/*`, `/gerry/*`, `/scripture/*`).

Add to each block:

```
  Link: </fonts/fonts.css>; rel=preload; as=style
```

- [ ] **Step 7: Add cache rule for fonts in `_headers`**

```
/fonts/*.woff2
  Cache-Control: public, max-age=31536000, immutable
  Cloudflare-CDN-Cache-Control: public, max-age=31536000, immutable
/fonts/*.css
  Cache-Control: public, max-age=31536000, immutable
  Cloudflare-CDN-Cache-Control: public, max-age=31536000, immutable
```

- [ ] **Step 8: Clean up the downloaded CSS response file**

```bash
rm /Users/a9lim/Work/a9lim.github.io/fonts/google-fonts-response.css
```

- [ ] **Step 9: Verify fonts load locally**

```bash
cd /Users/a9lim/Work/a9lim.github.io && python -m http.server 8080
```

Open `http://localhost:8080` in a browser. Open DevTools Network tab, filter by Font. Confirm woff2 files load from localhost, not from Google.

- [ ] **Step 10: Commit**

```bash
git add fonts/ index.html geon/index.html cyano/index.html gerry/index.html shoals/index.html scripture/index.html 404.html _worker.js _headers
git commit -m "feat: self-host Google Fonts, update CSP and Early Hints"
```

---

## Task 11: Title Separator Consistency (Audit #15)

Standardize on `\u2014` (em dash) as the title separator. Geon uses `|`, others may vary.

**Files:**
- Modify: `geon/index.html:7`
- Modify: `cyano/index.html`, `gerry/index.html`, `shoals/index.html`, `scripture/index.html` (check and fix if needed)

- [ ] **Step 1: Check all subproject titles**

```bash
grep '<title>' geon/index.html cyano/index.html gerry/index.html shoals/index.html scripture/index.html
```

Fix any that use `|` instead of `\u2014`.

- [ ] **Step 2: Update titles**

In `geon/index.html`, change:
```html
<title>Geon | a9l.im</title>
```
to:
```html
<title>Geon \u2014 a9l.im</title>
```

Repeat for any other subproject using `|`.

- [ ] **Step 3: Commit**

```bash
git add geon/index.html cyano/index.html gerry/index.html shoals/index.html scripture/index.html
git commit -m "fix: standardize title separator to em dash across all pages"
```

---

## Task 12: Expand Speculation Rules (Audit #17)

Add internal SPA routes to prefetch and add conservative prerender for high-probability navigations.

**Files:**
- Modify: `index.html:40-42`

- [ ] **Step 1: Replace speculation rules**

Replace the existing `<script type="speculationrules">` block (lines 40-42) with:

```html
    <script type="speculationrules">
    {"prefetch":[{"source":"document","where":{"href_matches":["/projects","/blog","/about","/geon","/cyano","/gerry","/shoals","/scripture","/scripture/*"]},"eagerness":"moderate"}],"prerender":[{"source":"document","where":{"href_matches":["/projects","/blog","/about"]},"eagerness":"conservative"}]}
    </script>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: expand speculation rules with SPA routes and conservative prerender"
```

---

## Task 13: Early Hints modulepreload for `main.js` (Audit #18)

Add `main.js` to Early Hints for the root SPA routes. Subprojects already have modulepreload for their `main.js`.

**Files:**
- Modify: `_headers`

- [ ] **Step 1: Add modulepreload to root route Early Hints**

In each of the root SPA Early Hints blocks (`/`, `/projects`, `/blog`, `/blog/*`, `/about`), add:

```
  Link: </main.js>; rel=modulepreload
```

- [ ] **Step 2: Commit**

```bash
git add _headers
git commit -m "feat: add main.js modulepreload to root SPA Early Hints"
```

---

## Task 14: Cache-Busting for Shared Assets (Audit #19)

The shared JS/CSS files are marked `immutable` in browser cache with no content hash in the filename. CDN cache purges on deploy, but browser cache persists for up to a year.

Option: reduce browser `max-age` to 1 day and keep CDN `immutable`. Matches what subproject assets already do. No build step required.

**Files:**
- Modify: `_headers:91-95`

- [ ] **Step 1: Change shared asset browser cache policy**

Replace:

```
/shared-*.js
  Cache-Control: public, max-age=31536000, immutable
/shared-*.css
  Cache-Control: public, max-age=31536000, immutable
```

With:

```
/shared-*.js
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
  Cloudflare-CDN-Cache-Control: public, max-age=31536000, immutable
/shared-*.css
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800
  Cloudflare-CDN-Cache-Control: public, max-age=31536000, immutable
```

- [ ] **Step 2: Commit**

```bash
git add _headers
git commit -m "fix: reduce shared asset browser cache to 1d, keep CDN immutable"
```

---

## Task 15: Rewrite Meta Descriptions for Search Intent (Audit #22)

Change meta descriptions from implementation-focused to education/benefit-focused.

**Files:**
- Modify: `index.html:7,9`
- Modify: `_worker.js:5-19` (ROUTE_META)
- Modify: `geon/index.html:8,9-10`
- Modify: `cyano/index.html`, `gerry/index.html`, `shoals/index.html`, `scripture/index.html` (equivalent lines)

- [ ] **Step 1: Rewrite root site meta descriptions**

In `index.html`, replace the `<meta name="description">` content:

```html
<meta name="description" content="Free interactive simulations for learning physics, biology, finance, and political science. Explore gravity, metabolism, options trading, gerrymandering, and sacred texts \u2014 all in the browser, no install required.">
```

Replace `og:description`:

```html
<meta property="og:description" content="Free interactive simulations for learning physics, biology, finance, and political science. Explore gravity, metabolism, options trading, gerrymandering, and sacred texts \u2014 all in the browser.">
```

- [ ] **Step 2: Rewrite ROUTE_META descriptions in `_worker.js`**

```javascript
const ROUTE_META = {
  '/projects': {
    title: 'Projects \u2014 a9l.im',
    desc: 'Browse interactive simulations for physics, biology, finance, and political science. Open-source, zero-dependency tools that run entirely in the browser.',
    ogTitle: 'Projects \u2014 a9l.im',
  },
  '/blog': {
    title: 'Blog \u2014 a9l.im',
    desc: 'Articles on building educational simulations, computational physics, browser-based rendering, and interactive learning tools.',
    ogTitle: 'Blog \u2014 a9l.im',
  },
  '/about': {
    title: 'About \u2014 a9l.im',
    desc: 'About a9lim \u2014 building open-source interactive simulations for understanding complex systems in physics, biology, finance, and political science.',
    ogTitle: 'About \u2014 a9l.im',
  },
};
```

- [ ] **Step 3: Rewrite subproject meta descriptions**

**Geon** (`geon/index.html`):
```html
<meta name="description" content="Explore how gravity, electromagnetism, and relativistic effects shape particle motion. An interactive N-body simulator with 11 forces, scalar fields, and 19 educational presets \u2014 running in real time in your browser with WebGPU.">
<meta property="og:description" content="Explore how gravity, electromagnetism, and relativistic effects shape particle motion. An interactive N-body simulator with 19 educational presets, running in real time in your browser.">
```

**Cyano** (`cyano/index.html`): Lead with "Learn how cells produce energy through twelve biochemical pathways" rather than listing pathways.

**Gerry** (`gerry/index.html`): Lead with "See how district boundaries affect election outcomes" rather than listing metrics.

**Shoals** (`shoals/index.html`): Lead with "Learn options trading through simulation" rather than listing pricing models.

**Scripture** (`scripture/index.html`): Lead with "Read and compare sacred texts from world traditions" rather than listing text names.

(Exact wording for each subproject should follow the pattern: what-you-learn first, technical details second.)

- [ ] **Step 4: Commit**

```bash
git add index.html _worker.js geon/index.html cyano/index.html gerry/index.html shoals/index.html scripture/index.html
git commit -m "feat: rewrite meta descriptions for search intent and educational value"
```

---

## Task 16: Wikidata Entity References in JSON-LD (Audit #23)

Add `@id` references to Wikidata entities in the `about` arrays of JSON-LD structured data.

**Files:**
- Modify: `index.html:46-100` (JSON-LD)
- Modify: `geon/index.html:49-90` (JSON-LD about array)
- Modify: `cyano/index.html`, `gerry/index.html`, `shoals/index.html`, `scripture/index.html` (JSON-LD about arrays)

- [ ] **Step 1: Add `about` with Wikidata IDs to root JSON-LD WebSite**

In `index.html`, in the `WebSite` JSON-LD object, add:

```json
"about": [
  {"@type": "Thing", "@id": "https://www.wikidata.org/wiki/Q413", "name": "Physics"},
  {"@type": "Thing", "@id": "https://www.wikidata.org/wiki/Q7162", "name": "Genetics"},
  {"@type": "Thing", "@id": "https://www.wikidata.org/wiki/Q8386", "name": "Option"},
  {"@type": "Thing", "@id": "https://www.wikidata.org/wiki/Q5765940", "name": "Gerrymandering"},
  {"@type": "Thing", "@id": "https://www.wikidata.org/wiki/Q179461", "name": "Religious text"}
]
```

- [ ] **Step 2: Add Wikidata `@id` to existing `about` entries in geon**

In `geon/index.html`, update the `about` array entries to include Wikidata IDs:

```json
"about": [
  {"@type": "Thing", "@id": "https://www.wikidata.org/wiki/Q2539879", "name": "N-body simulation"},
  {"@type": "Thing", "@id": "https://www.wikidata.org/wiki/Q3711325", "name": "Special relativity"},
  {"@type": "Thing", "@id": "https://www.wikidata.org/wiki/Q11406", "name": "Electromagnetism"},
  {"@type": "Thing", "@id": "https://www.wikidata.org/wiki/Q12725", "name": "Particle physics"},
  {"@type": "Thing", "@id": "https://www.wikidata.org/wiki/Q190056", "name": "Scalar field theory"},
  {"@type": "Thing", "@id": "https://www.wikidata.org/wiki/Q106630953", "name": "WebGPU"}
]
```

- [ ] **Step 3: Add Wikidata IDs to other subproject JSON-LD**

Repeat for cyano, gerry, shoals, and scripture. Look up the correct Wikidata Q-IDs during implementation for each project's topics.

- [ ] **Step 4: Commit**

```bash
git add index.html geon/index.html cyano/index.html gerry/index.html shoals/index.html scripture/index.html
git commit -m "feat: add Wikidata entity references to JSON-LD structured data"
```

---

## Task 17: Speakable Markup (Audit #24)

Add `speakable` property to JSON-LD to identify sections suitable for voice assistants.

**Files:**
- Modify: `index.html` (JSON-LD)
- Modify: `geon/index.html`, `cyano/index.html`, `gerry/index.html`, `shoals/index.html`, `scripture/index.html` (JSON-LD)

- [ ] **Step 1: Add speakable to root JSON-LD**

In `index.html`, add to the `WebSite` JSON-LD object:

```json
"speakable": {
  "@type": "SpeakableSpecification",
  "cssSelector": [".hero-tagline", ".hero-sub", "meta[name='description']"]
}
```

- [ ] **Step 2: Add speakable to subproject JSON-LD**

In each subproject's JSON-LD, add:

```json
"speakable": {
  "@type": "SpeakableSpecification",
  "cssSelector": ["meta[name='description']"]
}
```

- [ ] **Step 3: Commit**

```bash
git add index.html geon/index.html cyano/index.html gerry/index.html shoals/index.html scripture/index.html
git commit -m "feat: add speakable markup to JSON-LD for voice assistant discovery"
```

---

## Task 18: Web App Manifest (Audit #31)

Create a PWA manifest for "Add to Home Screen" and mobile engagement signals.

**Files:**
- Create: `manifest.json`
- Modify: `index.html`
- Modify: `_headers`

- [ ] **Step 1: Create `manifest.json`**

```json
{
  "name": "a9l.im \u2014 Interactive Educational Simulations",
  "short_name": "a9l.im",
  "description": "Interactive simulations for physics, biology, finance, and political science.",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#C8553D",
  "background_color": "#FDFBF5",
  "icons": [
    {
      "src": "/favicon.ico",
      "sizes": "48x48",
      "type": "image/x-icon"
    }
  ]
}
```

Note: A proper manifest should have 192x192 and 512x512 PNG icons. If `favicon.ico` is the only icon, this is a placeholder. The manifest is still useful for `theme_color`, `display`, and `start_url` even with a minimal icon set. Generate proper icons as a follow-up.

- [ ] **Step 2: Add manifest link to `index.html`**

After the `<link rel="icon" href="favicon.ico">` line (line 37), add:

```html
    <link rel="manifest" href="manifest.json">
```

- [ ] **Step 3: Add cache rule for manifest in `_headers`**

```
/manifest.json
  Cache-Control: public, max-age=86400
  Cloudflare-CDN-Cache-Control: public, max-age=31536000, immutable
```

- [ ] **Step 4: Commit**

```bash
git add manifest.json index.html _headers
git commit -m "feat: add web app manifest for PWA support"
```

---

## Task 19: Update `robots.txt` with AI Crawler Directives (Audit #4/misc)

Add explicit directives for major AI crawlers. Since the site is AGPL-3.0 and educational, permitting AI crawling is consistent with the mission.

**Files:**
- Modify: `robots.txt`

- [ ] **Step 1: Update `robots.txt`**

```
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://a9l.im/sitemap.xml
```

- [ ] **Step 2: Commit**

```bash
git add robots.txt
git commit -m "feat: add explicit AI crawler directives to robots.txt"
```

---

## Task 20: Verify Build Script

The build script from Task 4 generates `sitemap.xml`. Verify it runs cleanly as a final check.

**Files:**
- No changes — verification only

- [ ] **Step 1: Run the build script**

```bash
cd /Users/a9lim/Work/a9lim.github.io && node _build.js
```

Expected: `sitemap.xml: NNN URLs` with no errors.

- [ ] **Step 2: Verify the generated sitemap is valid**

```bash
head -5 sitemap.xml && tail -5 sitemap.xml && grep -c '<url>' sitemap.xml
```

---

## Dependency Graph

```
Task 1 (Blog SSR)          <- standalone, highest priority
Task 2 (Projects SSR)      <- standalone
Task 3 (About/page SSR)    <- standalone
Task 4 (Sitemap build)     <- standalone
Task 5 (BlogPosting LD)    <- depends on Task 1 (uses meta.jsonLd plumbing)
Task 6 (Person LD)         <- depends on Task 5 (uses meta.jsonLd HTMLRewriter from Task 5)
Task 7 (OG dimensions)     <- standalone
Task 8 (Robots meta)       <- standalone
Task 9 (Content-Language)   <- standalone
Task 10 (Self-host fonts)   <- standalone (large, touches many files — do after other _headers changes)
Task 11 (Title separator)   <- standalone
Task 12 (Speculation)       <- standalone
Task 13 (Early Hints)       <- standalone
Task 14 (Cache-busting)     <- standalone
Task 15 (Meta descriptions) <- standalone
Task 16 (Wikidata entities) <- standalone
Task 17 (Speakable)         <- standalone
Task 18 (Manifest)          <- standalone
Task 19 (robots.txt)        <- standalone
Task 20 (Build verify)      <- depends on Task 4
```

Recommended execution order: Tasks 1-3 first (SSR — highest impact), then 4-6 (sitemap + structured data), then everything else in any order. Task 10 (fonts) is the largest and most file-touching — save it for a focused pass.
