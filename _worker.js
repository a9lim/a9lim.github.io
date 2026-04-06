// ─── Scripture work display names (for breadcrumb JSON-LD) ───
const WORK_TITLES = {
  ot: 'Old Testament', nt: 'New Testament', apoc: 'Apocrypha',
  quran: 'Quran', bom: 'Book of Mormon', dc: 'Doctrine and Covenants',
  pgp: 'Pearl of Great Price', fourbooks: 'The Four Books',
  kj: 'Kojiki', ttc: 'Tao Te Ching', bund: 'Bundahishn',
  lotus: 'Lotus Sutra', bop: 'Book of Poetry', kv: 'Kalevala',
  poe: 'Poetic Edda', viraf: 'Arda Viraf',
};

// ─── Scripture work schema metadata (for CreativeWork JSON-LD) ───
const WORK_SCHEMA = {
  ot:        { translator: 'King James Version', lang: 'en', year: 1611, wikidata: 'Q628' },
  nt:        { translator: 'King James Version', lang: 'en', year: 1611, wikidata: 'Q37922' },
  apoc:      { translator: 'King James Version', lang: 'en', year: 1611, wikidata: 'Q151616' },
  quran:     { translator: 'Marmaduke Pickthall', lang: 'en', year: 1930, wikidata: 'Q428' },
  bom:       { translator: 'Joseph Smith', lang: 'en', year: 1830, wikidata: 'Q374076' },
  dc:        { lang: 'en', year: 1835, wikidata: 'Q217164' },
  pgp:       { lang: 'en', year: 1851, wikidata: 'Q1332454' },
  fourbooks: { translator: 'James Legge', lang: 'en', year: 1893, wikidata: 'Q728094' },
  kj:        { translator: 'Basil Hall Chamberlain', lang: 'en', year: 1919, wikidata: 'Q388841' },
  ttc:       { translator: 'James Legge', lang: 'en', year: 1891, wikidata: 'Q80738' },
  bund:      { translator: 'Edward William West', lang: 'en', year: 1880, wikidata: 'Q576019' },
  lotus:     { translator: 'Hendrik Kern', lang: 'en', year: 1884, wikidata: 'Q1046' },
  bop:       { translator: 'James Legge', lang: 'en', year: 1876, wikidata: 'Q756386' },
  kv:        { translator: 'John Martin Crawford', lang: 'en', year: 1888, wikidata: 'Q242309' },
  poe:       { translator: 'Henry Adams Bellows', lang: 'en', year: 1923, wikidata: 'Q174285' },
  viraf:     { translator: 'Martin Haug & Edward William West', lang: 'en', year: 1872, wikidata: 'Q1371791' },
};

// ─── Route metadata for HTMLRewriter SEO injection ───
// Root SPA routes all serve index.html, so meta tags need edge rewriting.

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

const BLOG_META = {
  'hello-world': {
    title: 'Hello, World \u2014 a9l.im',
    desc: 'First post on the a9l.im blog.',
    ogTitle: 'Hello, World \u2014 a9l.im',
  },
};

const ABOUT_JSONLD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': 'https://a9l.im/about',
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

// ─── Security headers for Worker responses ───
// Static assets get these from _headers. Worker-served HTML (SPA routes,
// scripture, 404) must set them here — _headers doesn't apply to Worker responses.
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; base-uri 'self'; frame-ancestors 'self'",
  'Content-Language': 'en',
};

// Wrap a response with security + cache headers.
// Browser always revalidates (max-age=0); CDN caches for 1 hour and serves
// stale while revalidating. Cloudflare purges CDN cache on each deployment.
// `extra` overrides defaults (e.g. Cloudflare-CDN-Cache-Control: no-store for 404s).
function secure(response, extra) {
  const r = new Response(response.body, response);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) r.headers.set(k, v);
  r.headers.set('Cache-Control', 'public, max-age=0, stale-while-revalidate=86400');
  r.headers.set('Cloudflare-CDN-Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  if (extra) for (const [k, v] of Object.entries(extra)) r.headers.set(k, v);
  return r;
}

function rewriteHTML(response, meta) {
  return new HTMLRewriter()
    .on('title', {
      element(el) { el.setInnerContent(meta.title); },
    })
    .on('meta[name="description"]', {
      element(el) { el.setAttribute('content', meta.desc); },
    })
    .on('meta[property="og:title"]', {
      element(el) { el.setAttribute('content', meta.ogTitle); },
    })
    .on('meta[property="og:description"]', {
      element(el) { el.setAttribute('content', meta.desc); },
    })
    .on('meta[property="og:url"]', {
      element(el) { el.setAttribute('content', meta.canonical); },
    })
    .on('meta[name="twitter:card"]', {
      element(el) { el.setAttribute('content', 'summary_large_image'); },
    })
    .on('meta[name="twitter:title"]', {
      element(el) { el.setAttribute('content', meta.ogTitle); },
    })
    .on('meta[name="twitter:description"]', {
      element(el) { el.setAttribute('content', meta.desc); },
    })
    .on('link[rel="canonical"]', {
      element(el) { el.setAttribute('href', meta.canonical); },
    })
    .on('meta[property="og:type"]', {
      element(el) { if (meta.ogType) el.setAttribute('content', meta.ogType); },
    })
    .on('head', {
      element(el) {
        if (meta.jsonLd) {
          el.append(`<script type="application/ld+json">${meta.jsonLd}</script>`, { html: true });
        }
        if (meta.prevUrl) el.append(`<link rel="prev" href="${meta.prevUrl}">`, { html: true });
        if (meta.nextUrl) el.append(`<link rel="next" href="${meta.nextUrl}">`, { html: true });
        if (meta.articlePublished) el.append(`<meta property="article:published_time" content="${meta.articlePublished}">`, { html: true });
        if (meta.articleModified) el.append(`<meta property="article:modified_time" content="${meta.articleModified}">`, { html: true });
        if (meta.articleAuthor) el.append(`<meta property="article:author" content="${meta.articleAuthor}">`, { html: true });
        if (meta.articleTag) el.append(`<meta property="article:tag" content="${meta.articleTag}">`, { html: true });
      },
    })
    .on('#reading-pane', {
      element(el) {
        if (meta.ssrVerses) el.setInnerContent(meta.ssrVerses, { html: true });
      },
    })
    .on('#breadcrumb', {
      element(el) {
        if (meta.ssrBreadcrumb) el.setInnerContent(meta.ssrBreadcrumb, { html: true });
      },
    })
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
    .on('#blog-list-container', {
      element(el) {
        if (meta.ssrBlogList) el.setInnerContent(meta.ssrBlogList, { html: true });
      },
    })
    .on('.projects-grid', {
      element(el) {
        if (meta.canonical === 'https://a9l.im/projects') {
          el.setInnerContent(PROJECTS_SSR, { html: true });
        }
      },
    })
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
    .transform(response);
}

// --- Markdown parser (SSR) ---
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

function slugify(text) {
  return text.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
}

function renderMarkdown(src) {
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
    const hm = line.match(/^(#{1,6})\s+(.+)$/);
    if (hm) { html.push('<h' + hm[1].length + ' id="' + slugify(hm[2]) + '">' + mdInline(mdEsc(hm[2])) + '</h' + hm[1].length + '>'); i++; continue; }
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

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return m[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

const SCRIPTURE_WORKS_SSR = Object.entries(WORK_TITLES).map(([id, title]) => {
  const ws = WORK_SCHEMA[id] || {};
  const detail = ws.translator ? `${ws.translator} translation, ${ws.year}` : (ws.year ? String(ws.year) : '');
  return `<a href="/scripture/${id}" class="work-link"><strong>${title}</strong>${detail ? ` <span>(${detail})</span>` : ''}</a>`;
}).join('\n');

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, origin } = url;

    // Scripture sub-SPA
    if (pathname.startsWith('/scripture')) {
      const res = await env.ASSETS.fetch(new URL('/scripture/index.html', origin));
      if (env.VIEWS) logView(ctx, env.VIEWS, request, pathname);

      // Work-level routes: /scripture/{workId} or /scripture/{workId}/
      const workMatch = pathname.match(/^\/scripture\/([a-z]+)\/?$/);
      if (workMatch) {
        const [, workId] = workMatch;
        const workTitle = WORK_TITLES[workId];
        if (workTitle) {
          const ws = WORK_SCHEMA[workId] || {};
          const translatorPerson = ws.translator ? { '@type': 'Person', name: ws.translator } : undefined;
          const meta = {
            title: `${workTitle} | Scripture`,
            desc: `Read the ${workTitle}${ws.translator ? ' (' + ws.translator + ' translation, ' + ws.year + ')' : ''} \u2014 full-text search, concordance, verse notes, and cross-tradition comparisons.`,
            ogTitle: `${workTitle} | Scripture`,
            canonical: `https://a9l.im/scripture/${workId}`,
            jsonLd: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'BreadcrumbList',
                  itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://a9l.im' },
                    { '@type': 'ListItem', position: 2, name: 'Scripture', item: 'https://a9l.im/scripture/' },
                    { '@type': 'ListItem', position: 3, name: workTitle, item: `https://a9l.im/scripture/${workId}` },
                  ],
                },
                {
                  '@type': 'Book',
                  name: workTitle,
                  url: `https://a9l.im/scripture/${workId}`,
                  inLanguage: ws.lang || 'en',
                  '@id': `https://a9l.im/scripture/${workId}`,
                  ...(ws.wikidata && { translationOfWork: { '@type': 'Book', '@id': `https://www.wikidata.org/wiki/${ws.wikidata}` } }),
                  ...(translatorPerson && { translator: translatorPerson }),
                  ...(ws.year && { datePublished: String(ws.year) }),
                },
              ],
            }),
            ssrBreadcrumb: `<a href="/scripture/">Scripture</a> <span aria-hidden="true">\u203a</span> <span>${mdEsc(workTitle)}</span>`,
          };
          try {
            const manifestRes = await env.ASSETS.fetch(new URL(`/scripture/data/${workId}/manifest.json`, origin));
            if (manifestRes.ok) {
              const manifest = await manifestRes.json();
              const bookList = manifest.books.map(b => {
                const startCh = b.start || 1;
                return `<a href="/scripture/${workId}/${b.id}-${startCh}">${mdEsc(b.name)}</a>`;
              }).join(' ');
              meta.ssrVerses = `<h1>${mdEsc(workTitle)}</h1><nav class="book-listing">${bookList}</nav>`;
            }
          } catch (_) { /* SSR failed — client JS will hydrate */ }
          return secure(rewriteHTML(res, meta));
        }
      }

      // Chapter (and optional verse) routes: /scripture/{workId}/{bookId}-{chapter}[:verse]
      const chapterMatch = pathname.match(/^\/scripture\/([a-z]+)\/(.+)-(\d+)(?::(\d+))?$/);
      if (chapterMatch) {
        const [, workId, bookId, chapterNum, verseNum] = chapterMatch;
        const workTitle = WORK_TITLES[workId];
        if (workTitle) {
          try {
            const manifestRes = await env.ASSETS.fetch(new URL(`/scripture/data/${workId}/manifest.json`, origin));
            if (manifestRes.ok) {
              const manifest = await manifestRes.json();
              const book = manifest.books.find(b => b.id === bookId);
              if (book) {
                const chapterLabel = `${book.name} ${chapterNum}`;
                const ws = WORK_SCHEMA[workId] || {};
                const translatorPerson = ws.translator ? { '@type': 'Person', name: ws.translator } : undefined;
                const bookSchema = {
                  '@type': 'Book',
                  name: workTitle,
                  url: `https://a9l.im/scripture/${workId}`,
                  '@id': `https://a9l.im/scripture/${workId}`,
                  ...(ws.wikidata && { translationOfWork: { '@type': 'Book', '@id': `https://www.wikidata.org/wiki/${ws.wikidata}` } }),
                  ...(translatorPerson && { translator: translatorPerson }),
                  inLanguage: ws.lang || 'en',
                  ...(ws.year && { datePublished: String(ws.year) }),
                };

                // Compute prev/next chapter URLs
                const chapterIdx = parseInt(chapterNum, 10);
                const bookStart = book.start || 1;
                const bookIdx = manifest.books.indexOf(book);
                let prevUrl, nextUrl;
                if (chapterIdx > bookStart) {
                  prevUrl = `https://a9l.im/scripture/${workId}/${bookId}-${chapterIdx - 1}`;
                } else if (bookIdx > 0) {
                  const prevBook = manifest.books[bookIdx - 1];
                  const prevStart = prevBook.start || 1;
                  prevUrl = `https://a9l.im/scripture/${workId}/${prevBook.id}-${prevStart + prevBook.chapters - 1}`;
                }
                if (chapterIdx < bookStart + book.chapters - 1) {
                  nextUrl = `https://a9l.im/scripture/${workId}/${bookId}-${chapterIdx + 1}`;
                } else if (bookIdx < manifest.books.length - 1) {
                  const nextBook = manifest.books[bookIdx + 1];
                  nextUrl = `https://a9l.im/scripture/${workId}/${nextBook.id}-${nextBook.start || 1}`;
                }

                const chapterUrl = `https://a9l.im/scripture/${workId}/${bookId}-${chapterNum}`;
                const breadcrumbItems = [
                  { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://a9l.im' },
                  { '@type': 'ListItem', position: 2, name: 'Scripture', item: 'https://a9l.im/scripture/' },
                  { '@type': 'ListItem', position: 3, name: workTitle, item: `https://a9l.im/scripture/${workId}` },
                  { '@type': 'ListItem', position: 4, name: chapterLabel, item: chapterUrl },
                ];
                const graph = [
                  { '@type': 'BreadcrumbList', itemListElement: breadcrumbItems },
                  {
                    '@type': 'Chapter',
                    name: chapterLabel,
                    url: chapterUrl,
                    inLanguage: ws.lang || 'en',
                    isPartOf: bookSchema,
                    audience: { '@type': 'Audience', audienceType: 'Students, scholars, readers of sacred texts' },
                    ...(translatorPerson && { translator: translatorPerson }),
                  },
                ];

                const isSingleBook = manifest.books.length === 1;
                const meta = {
                  title: `${chapterLabel} \u2014 ${workTitle} | Scripture`,
                  desc: isSingleBook
                    ? `Read ${chapterLabel} \u2014 full-text search, concordance, verse notes, and cross-tradition comparisons.`
                    : `Read ${chapterLabel} (${workTitle}) \u2014 full-text search, concordance, verse notes, and cross-tradition comparisons.`,
                  ogTitle: `${chapterLabel} \u2014 ${workTitle} | Scripture`,
                  canonical: `https://a9l.im${pathname}`,
                  ogType: 'article',
                  prevUrl,
                  nextUrl,
                  ssrBreadcrumb: `<a href="/scripture/">Scripture</a> <span aria-hidden="true">\u203a</span> <a href="/scripture/${workId}">${mdEsc(workTitle)}</a> <span aria-hidden="true">\u203a</span> <span>${mdEsc(chapterLabel)}</span>`,
                };

                // SSR: inject verse text for crawlers
                try {
                  const chapterRes = await env.ASSETS.fetch(new URL(`/scripture/data/${workId}/chapters/${bookId}-${chapterNum}.json`, origin));
                  if (chapterRes.ok) {
                    const chapter = await chapterRes.json();
                    const allVerses = chapter.sections.flatMap(s => s.verses);

                    // Verse-level deep link
                    if (verseNum) {
                      const vi = parseInt(verseNum, 10) - 1;
                      const verseText = vi >= 0 && vi < allVerses.length ? allVerses[vi] : null;
                      if (verseText) {
                        const verseLabel = `${chapterLabel}:${verseNum}`;
                        meta.title = `${verseLabel} (${workTitle}) | Scripture`;
                        meta.ogTitle = `${verseLabel} (${workTitle}) | Scripture`;
                        meta.desc = verseText.length > 160 ? verseText.slice(0, verseText.lastIndexOf(' ', 160)) + '\u2026' : verseText;
                        meta.ssrVerses = `<p><b>${verseNum}.</b> ${mdEsc(verseText)}</p>`;
                        breadcrumbItems.push({ '@type': 'ListItem', position: 5, name: `Verse ${verseNum}`, item: `https://a9l.im${pathname}` });
                        graph.push({
                          '@type': 'Quotation',
                          text: verseText,
                          isPartOf: { '@type': 'CreativeWork', name: chapterLabel, url: chapterUrl },
                        });
                      }
                    } else {
                      const maxVerses = Math.min(allVerses.length, 10);
                      const verseHtml = allVerses.slice(0, maxVerses).map((v, i) =>
                        `<p><b>${i + 1}.</b> ${mdEsc(v)}</p>`
                      ).join('');
                      meta.ssrVerses = verseHtml + (allVerses.length > maxVerses ? `<p><em>${allVerses.length - maxVerses} more verses\u2026</em></p>` : '');
                    }
                  }
                } catch (_) { /* verse SSR failed — client JS will hydrate */ }

                meta.jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
                return secure(rewriteHTML(res, meta));
              }
            }
          } catch (_) { /* fall through to default */ }
        }
      }

      // Scripture index: /scripture or /scripture/
      if (pathname === '/scripture' || pathname === '/scripture/') {
        const indexMeta = {
          title: 'Scripture — a9l.im',
          desc: 'Read sixteen sacred texts spanning Abrahamic, East Asian, Zoroastrian, Buddhist, and Nordic traditions. Full-text search, concordance, verse notes, and cross-tradition comparisons.',
          ogTitle: 'Scripture — Sacred Text Reader',
          canonical: 'https://a9l.im/scripture/',
          jsonLd: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'CollectionPage',
                name: 'Scripture',
                url: 'https://a9l.im/scripture/',
                description: 'A browser-based reader for sixteen sacred texts.',
                mainEntity: {
                  '@type': 'ItemList',
                  itemListElement: Object.entries(WORK_TITLES).map(([id, title], i) => ({
                    '@type': 'ListItem', position: i + 1, name: title, url: `https://a9l.im/scripture/${id}`,
                  })),
                },
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://a9l.im' },
                  { '@type': 'ListItem', position: 2, name: 'Scripture', item: 'https://a9l.im/scripture/' },
                ],
              },
            ],
          }),
          ssrVerses: `<h1>Sacred Texts</h1><nav class="work-listing">${SCRIPTURE_WORKS_SSR}</nav>`,
        };
        return secure(rewriteHTML(res, indexMeta));
      }

      return secure(res);
    }

    // Root SPA routes — serve index.html with per-route meta injection
    if (pathname === '/projects' || pathname === '/blog' || pathname.startsWith('/blog/') || pathname === '/about') {
      const response = await env.ASSETS.fetch(new URL('/index.html', origin));

      let meta;
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
        meta = { ...meta, canonical: `https://a9l.im${pathname}`, ogType: 'article' };

        // SSR: fetch markdown and render to HTML for crawlers
        if (slug && !slug.includes('/') && !slug.includes('..')) {
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
                    if (postMeta.excerpt) meta.desc = postMeta.excerpt;
                    meta.articlePublished = postMeta.date;
                    meta.articleModified = postMeta.updated || postMeta.date;
                    meta.articleAuthor = 'https://a9l.im/about';
                    if (postMeta.tag) meta.articleTag = postMeta.tag;
                    postHeader = `<span class="blog-post-date">${fmtDate(postMeta.date)}${postMeta.tag ? ' &middot; ' + mdEsc(postMeta.tag) : ''}</span><h1 class="blog-post-title">${mdEsc(postMeta.title)}</h1>`;
                    meta.jsonLd = JSON.stringify({
                      '@context': 'https://schema.org',
                      '@graph': [
                        {
                          '@type': 'BlogPosting',
                          headline: postMeta.title,
                          datePublished: postMeta.date,
                          dateModified: postMeta.updated || postMeta.date,
                          description: meta.desc,
                          url: meta.canonical,
                          author: { '@type': 'Person', name: 'a9lim', url: 'https://a9l.im/about', sameAs: ['https://github.com/a9lim', 'https://twitter.com/a9_lim'] },
                          publisher: { '@type': 'Organization', name: 'a9l.im', url: 'https://a9l.im', logo: { '@type': 'ImageObject', url: 'https://a9l.im/icon-192.png', width: 192, height: 192 } },
                          isPartOf: { '@type': 'Blog', name: 'a9l.im Blog', url: 'https://a9l.im/blog' },
                          mainEntityOfPage: { '@type': 'WebPage', '@id': meta.canonical },
                        },
                        {
                          '@type': 'BreadcrumbList',
                          itemListElement: [
                            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://a9l.im' },
                            { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://a9l.im/blog' },
                            { '@type': 'ListItem', position: 3, name: postMeta.title, item: meta.canonical },
                          ],
                        },
                      ],
                    });
                  }
                } catch (_) { /* proceed without metadata */ }
              }

              meta.ssrContent = `<div class="blog-post-header">${postHeader}</div><div class="blog-content">${renderedBody}</div>`;
            }
          } catch (_) { /* SSR failed — client JS will hydrate */ }
        }
      } else {
        meta = { ...ROUTE_META[pathname], canonical: `https://a9l.im${pathname}` };
        const pageName = pathname === '/projects' ? 'Projects' : pathname === '/blog' ? 'Blog' : 'About';
        const breadcrumb = {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://a9l.im' },
            { '@type': 'ListItem', position: 2, name: pageName, item: `https://a9l.im${pathname}` },
          ],
        };
        if (pathname === '/about') {
          const person = JSON.parse(ABOUT_JSONLD);
          delete person['@context'];
          meta.jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': [person, breadcrumb] });
        } else if (pathname === '/projects') {
          const projectItems = [
            { position: 1, name: 'Geon — Relativistic Particle Physics Simulator', url: 'https://a9l.im/geon' },
            { position: 2, name: 'Cyano — Cellular Biochemistry Simulator', url: 'https://a9l.im/cyano' },
            { position: 3, name: 'Gerry — Gerrymandering & Electoral Fairness Simulator', url: 'https://a9l.im/gerry' },
            { position: 4, name: 'Shoals — Options Trading Simulator', url: 'https://a9l.im/shoals' },
            { position: 5, name: 'Scripture — Sacred Text Reader', url: 'https://a9l.im/scripture/' },
          ].map(p => ({ '@type': 'ListItem', ...p }));
          meta.jsonLd = JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              { '@type': 'CollectionPage', name: 'Projects', url: 'https://a9l.im/projects', mainEntity: { '@type': 'ItemList', itemListElement: projectItems } },
              breadcrumb,
            ],
          });
        } else if (pathname === '/blog') {
          // Blog listing SSR — will be overridden below if posts.json loads
          meta.jsonLd = JSON.stringify({ '@context': 'https://schema.org', ...breadcrumb });
        } else {
          meta.jsonLd = JSON.stringify({ '@context': 'https://schema.org', ...breadcrumb });
        }
        // SSR blog listing from posts.json
        if (pathname === '/blog') {
          try {
            const postsRes = await env.ASSETS.fetch(new URL('/posts.json', origin));
            if (postsRes.ok) {
              const posts = await postsRes.json();
              meta.ssrBlogList = posts.map(p =>
                `<article class="blog-post-card"><a href="/blog/${mdEsc(p.slug)}"><h3>${mdEsc(p.title)}</h3><time>${fmtDate(p.date)}</time><p>${mdEsc(p.excerpt || '')}</p></a></article>`
              ).join('');
              const blogItems = posts.map((p, i) => ({
                '@type': 'ListItem', position: i + 1, name: p.title, url: `https://a9l.im/blog/${p.slug}`,
              }));
              meta.jsonLd = JSON.stringify({
                '@context': 'https://schema.org',
                '@graph': [
                  { '@type': 'Blog', name: 'a9l.im Blog', url: 'https://a9l.im/blog', blogPost: posts.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `https://a9l.im/blog/${p.slug}`, datePublished: p.date })) },
                  { '@type': 'ItemList', itemListElement: blogItems },
                  breadcrumb,
                ],
              });
            }
          } catch (_) { /* fall through to basic breadcrumb */ }
        }
      }

      if (env.VIEWS) logView(ctx, env.VIEWS, request, pathname);
      return secure(rewriteHTML(response, meta));
    }

    // Everything else: 404 (not CDN-cached, noindex)
    const page = await env.ASSETS.fetch(new URL('/404.html', origin));
    if (env.VIEWS) logView(ctx, env.VIEWS, request, pathname);
    const notFound = new Response(page.body, { status: 404, headers: page.headers });
    return secure(notFound, { 'Cloudflare-CDN-Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' });
  },
};

// ─── Analytics Engine ───
// Privacy-friendly server-side page view logging (no cookies, no JS snippet).
// Requires an Analytics Engine dataset bound as VIEWS in wrangler.jsonc.
function logView(ctx, views, request, pathname) {
  ctx.waitUntil(
    Promise.resolve().then(() => {
      const cf = request.cf || {};
      views.writeDataPoint({
        blobs: [
          pathname,
          cf.country || '',
          request.headers.get('referer') || '',
          request.headers.get('user-agent') || '',
          cf.city || '',
        ],
        doubles: [cf.asn || 0],
        indexes: [pathname],
      });
    })
  );
}
