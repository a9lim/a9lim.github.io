// ─── Route metadata for HTMLRewriter SEO injection ───
// Root SPA routes all serve index.html, so meta tags need edge rewriting.

const ROUTE_META = {
  '/projects': {
    title: 'Projects \u2014 a9l.im',
    desc: 'Interactive educational simulations: relativistic physics, cellular metabolism, options trading, gerrymandering, and sacred texts. All in-browser, vanilla JS.',
    ogTitle: 'Projects \u2014 a9l.im',
  },
  '/blog': {
    title: 'Blog \u2014 a9l.im',
    desc: 'Articles on simulation design, computational physics, web development, and educational technology.',
    ogTitle: 'Blog \u2014 a9l.im',
  },
  '/about': {
    title: 'About \u2014 a9l.im',
    desc: 'About a9lim and the educational simulation projects at a9l.im.',
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
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; base-uri 'self'; frame-ancestors 'self'",
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
                    postHeader = `<span class="blog-post-date">${fmtDate(postMeta.date)}${postMeta.tag ? ' &middot; ' + mdEsc(postMeta.tag) : ''}</span><h1 class="blog-post-title">${mdEsc(postMeta.title)}</h1>`;
                  }
                } catch (_) { /* proceed without metadata */ }
              }

              meta.ssrContent = `<div class="blog-post-header">${postHeader}</div><div class="blog-content">${renderedBody}</div>`;
            }
          } catch (_) { /* SSR failed — client JS will hydrate */ }
        }
      } else {
        meta = { ...ROUTE_META[pathname], canonical: `https://a9l.im${pathname}` };
      }

      if (env.VIEWS) logView(ctx, env.VIEWS, request, pathname);
      return secure(rewriteHTML(response, meta));
    }

    // Everything else: 404 (not CDN-cached)
    const page = await env.ASSETS.fetch(new URL('/404.html', origin));
    if (env.VIEWS) logView(ctx, env.VIEWS, request, pathname);
    return secure(
      new Response(page.body, { status: 404, headers: page.headers }),
      { 'Cloudflare-CDN-Cache-Control': 'no-store' },
    );
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
