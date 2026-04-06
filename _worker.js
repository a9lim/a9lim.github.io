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
  apoc:      { translator: 'King James Version', lang: 'en', year: 1611 },
  quran:     { translator: 'Marmaduke Pickthall', lang: 'en', year: 1930, wikidata: 'Q428' },
  bom:       { translator: 'Joseph Smith', lang: 'en', year: 1830, wikidata: 'Q374076' },
  dc:        { lang: 'en', year: 1835, wikidata: 'Q217164' },
  pgp:       { lang: 'en', year: 1851, wikidata: 'Q1332454' },
  fourbooks: { translator: 'James Legge', lang: 'en', year: 1893 },
  kj:        { translator: 'Basil Hall Chamberlain', lang: 'en', year: 1919, wikidata: 'Q388841' },
  ttc:       { translator: 'James Legge', lang: 'en', year: 1891, wikidata: 'Q80738' },
  bund:      { translator: 'Edward William West', lang: 'en', year: 1880 },
  lotus:     { translator: 'Hendrik Kern', lang: 'en', year: 1884 },
  bop:       { translator: 'James Legge', lang: 'en', year: 1876 },
  kv:        { translator: 'John Martin Crawford', lang: 'en', year: 1888 },
  poe:       { translator: 'Henry Adams Bellows', lang: 'en', year: 1923 },
  viraf:     { translator: 'Martin Haug & Edward William West', lang: 'en', year: 1872 },
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
    .on('link[rel="canonical"]', {
      element(el) { el.setAttribute('href', meta.canonical); },
    })
    .on('head', {
      element(el) {
        if (meta.jsonLd) {
          el.append(`<script type="application/ld+json">${meta.jsonLd}</script>`, { html: true });
        }
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

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return m[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, origin } = url;

    // Scripture sub-SPA
    if (pathname.startsWith('/scripture')) {
      const res = await env.ASSETS.fetch(new URL('/scripture/index.html', origin));
      if (env.VIEWS) logView(ctx, env.VIEWS, request, pathname);

      // Inject meta tags, BreadcrumbList JSON-LD, verse excerpt, and visible breadcrumb for chapter URLs
      const chapterMatch = pathname.match(/^\/scripture\/([a-z]+)\/(.+)-(\d+)$/);
      if (chapterMatch) {
        const [, workId, bookId, chapterNum] = chapterMatch;
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
                const bookSchema = {
                  '@type': 'Book',
                  name: workTitle,
                  ...(ws.wikidata && { '@id': `https://www.wikidata.org/wiki/${ws.wikidata}` }),
                  ...(ws.translator && { translator: { '@type': 'Person', name: ws.translator } }),
                  inLanguage: ws.lang || 'en',
                  ...(ws.year && { datePublished: String(ws.year) }),
                };
                const meta = {
                  title: `${chapterLabel} \u2014 ${workTitle} | Scripture`,
                  desc: `Read ${chapterLabel} (${workTitle}) \u2014 full-text search, concordance, verse notes, and cross-tradition comparisons.`,
                  ogTitle: `${chapterLabel} \u2014 ${workTitle} | Scripture`,
                  canonical: `https://a9l.im${pathname}`,
                  jsonLd: JSON.stringify({
                    '@context': 'https://schema.org',
                    '@graph': [
                      {
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://a9l.im' },
                          { '@type': 'ListItem', position: 2, name: 'Scripture', item: 'https://a9l.im/scripture/' },
                          { '@type': 'ListItem', position: 3, name: workTitle, item: `https://a9l.im/scripture/${workId}` },
                          { '@type': 'ListItem', position: 4, name: chapterLabel, item: `https://a9l.im${pathname}` },
                        ],
                      },
                      {
                        '@type': 'CreativeWork',
                        name: chapterLabel,
                        url: `https://a9l.im${pathname}`,
                        inLanguage: 'en',
                        isPartOf: bookSchema,
                      },
                    ],
                  }),
                  ssrBreadcrumb: `<a href="/scripture/">Scripture</a> <span aria-hidden="true">\u203a</span> <a href="/scripture/${workId}">${mdEsc(workTitle)}</a> <span aria-hidden="true">\u203a</span> <span>${mdEsc(chapterLabel)}</span>`,
                };

                // SSR: inject first ~500 chars of verse text for crawlers
                try {
                  const chapterRes = await env.ASSETS.fetch(new URL(`/scripture/data/${workId}/chapters/${bookId}-${chapterNum}.json`, origin));
                  if (chapterRes.ok) {
                    const chapter = await chapterRes.json();
                    const raw = chapter.sections.flatMap(s => s.verses).join(' ');
                    const excerpt = raw.length > 500 ? raw.slice(0, raw.lastIndexOf(' ', 500)) + '\u2026' : raw;
                    meta.ssrVerses = `<p>${mdEsc(excerpt)}</p>`;
                  }
                } catch (_) { /* verse SSR failed — client JS will hydrate */ }

                return secure(rewriteHTML(res, meta));
              }
            }
          } catch (_) { /* fall through to default */ }
        }
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
        meta = { ...meta, canonical: `https://a9l.im${pathname}` };

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
                          publisher: { '@type': 'Person', name: 'a9lim', url: 'https://a9l.im' },
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
        } else {
          meta.jsonLd = JSON.stringify({ '@context': 'https://schema.org', ...breadcrumb });
        }
      }

      if (env.VIEWS) logView(ctx, env.VIEWS, request, pathname);
      return secure(rewriteHTML(response, meta));
    }

    // Everything else: 404 (not CDN-cached, noindex)
    const page = await env.ASSETS.fetch(new URL('/404.html', origin));
    if (env.VIEWS) logView(ctx, env.VIEWS, request, pathname);
    const notFound = new HTMLRewriter()
      .on('head', {
        element(el) {
          el.append('<meta name="robots" content="noindex, nofollow">', { html: true });
        },
      })
      .transform(new Response(page.body, { status: 404, headers: page.headers }));
    return secure(notFound, { 'Cloudflare-CDN-Cache-Control': 'no-store' });
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
