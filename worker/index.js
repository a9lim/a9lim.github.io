// Content-derived data is generated into the ignored .build/ tree and bundled
// into the Worker; deploy artifacts never live beside source files.
import { ROUTE_META, BLOG_META, SIMS_SSR, PROJECTS_SSR, SIMS_ITEMLIST, PROJECTS_ITEMLIST } from '../.build/content.generated.mjs';
// Markdown rendering shares the client's parser — single source of truth.
import { parseMarkdown, mdEsc, stripFrontmatter } from '../site/src/markdown.js';
import { logView } from './analytics.js';
import { secure } from './http.js';
import { apiJSON, contributeSurvey } from './surveys.js';

// ROUTE_META / BLOG_META are imported from .build/content.generated.mjs above.



// SIMS_SSR / PROJECTS_SSR are imported from .build/content.generated.mjs above.

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
        if (meta.articlePublished) el.append(`<meta property="article:published_time" content="${meta.articlePublished}">`, { html: true });
        if (meta.articleModified) el.append(`<meta property="article:modified_time" content="${meta.articleModified}">`, { html: true });
        if (meta.articleAuthor) el.append(`<meta property="article:author" content="${meta.articleAuthor}">`, { html: true });
        if (meta.articleTag) {
          const tags = Array.isArray(meta.articleTag) ? meta.articleTag : [meta.articleTag];
          for (const t of tags) el.append(`<meta property="article:tag" content="${t}">`, { html: true });
        }
        if (meta.canonical) {
          el.append(`<link rel="alternate" hreflang="en" href="${meta.canonical}">`, { html: true });
          // ?lang=ja is the same URL with a query param — same content, JS-side
          // translation. Tells crawlers a JA variant exists at this URL.
          const jaUrl = meta.canonical + (meta.canonical.includes('?') ? '&' : '?') + 'lang=ja';
          el.append(`<link rel="alternate" hreflang="ja" href="${jaUrl}">`, { html: true });
          el.append(`<link rel="alternate" hreflang="x-default" href="${meta.canonical}">`, { html: true });
        }
      },
    })
    .on('#breadcrumb', {
      element(el) {
        if (meta.ssrBreadcrumb) {
          el.setInnerContent(meta.ssrBreadcrumb, { html: true });
          el.removeAttribute('hidden');
        }
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
    .on('.sims-grid', {
      element(el) {
        if (meta.canonical === 'https://a9l.im/sims') {
          el.setInnerContent(SIMS_SSR, { html: true });
        }
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
    .on('#page-sims', {
      element(el) {
        if (meta.canonical === 'https://a9l.im/sims') {
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

// Markdown parsing + HTML escaping imported from ./src/markdown.js above.

function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return m[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, origin } = url;
    if (pathname === '/api/surveys') {
      if (request.method === 'POST') return contributeSurvey(request, env, origin);
      return apiJSON({ error: 'Method Not Allowed' }, 405, { Allow: 'POST' });
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    // Folded /about into / — preserve inbound links with a permanent redirect
    if (pathname === '/about' || pathname === '/about/') {
      return Response.redirect(`${origin}/`, 308);
    }

    // Webpage resume removed — the PDF is canonical. Redirect inbound links.
    if (pathname === '/resume' || pathname === '/resume/') {
      return Response.redirect(`${origin}/resume.pdf`, 308);
    }

    // Geon and Cyano were renamed Worldline and Lumen (2026-10-23). Their old
    // paths have no assets, so they fall through to here.
    const renamed = pathname.match(/^\/(geon|cyano)(\/.*)?$/);
    if (renamed) {
      const target = renamed[1] === 'geon' ? '/worldline' : '/lumen';
      return Response.redirect(`${origin}${target}${renamed[2] || ''}${url.search}`, 308);
    }

    // Root SPA routes — serve index.html with per-route meta injection
    if (pathname === '/sims' || pathname === '/projects' || pathname === '/blog' || pathname.startsWith('/blog/')) {
      const response = await env.ASSETS.fetch(new URL('/index.html', origin));

      let meta;
      if (pathname.startsWith('/blog/')) {
        const slug = pathname.slice(6);
        meta = BLOG_META[slug];
        if (!meta) {
          const pretty = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          meta = {
            title: `${pretty} | a9l.im`,
            desc: 'Writeups on LLM interpretability, computational science, and the tools and simulations behind this site.',
            ogTitle: `${pretty} | a9l.im`,
          };
        }
        meta = { ...meta, canonical: `https://a9l.im${pathname}`, ogType: 'article' };

        // SSR: fetch markdown and render to HTML for crawlers
        if (slug && !slug.includes('/') && !slug.includes('..')) {
          try {
            const [mdRes, postsRes] = await Promise.all([
              env.ASSETS.fetch(new URL(`/content/posts/${slug}.md`, origin)),
              env.ASSETS.fetch(new URL('/posts.json', origin)),
            ]);
            if (mdRes.ok) {
              const mdText = stripFrontmatter(await mdRes.text());
              const renderedBody = parseMarkdown(mdText);

              let postHeader = '';
              if (postsRes.ok) {
                try {
                  const posts = await postsRes.json();
                  const postMeta = posts.find(p => p.slug === slug);
                  if (postMeta) {
                    if (postMeta.excerpt) meta.desc = postMeta.excerpt;
                    meta.articlePublished = postMeta.date;
                    meta.articleModified = postMeta.updated || postMeta.date;
                    meta.articleAuthor = 'https://a9l.im/';
                    if (postMeta.tag) meta.articleTag = Array.isArray(postMeta.tag) ? postMeta.tag : [postMeta.tag];
                    const tagDisplay = Array.isArray(postMeta.tag) ? postMeta.tag.join(', ') : postMeta.tag;
                    // Byline mirrors postByline() in site/src/blog.js — keep
                    // the two in step so SSR and the client render alike.
                    const bylineBits = [];
                    if (Array.isArray(postMeta.authors) && postMeta.authors.length) {
                      bylineBits.push(`<span class="blog-post-authors">${postMeta.authors.map(mdEsc).join(' &middot; ')}</span>`);
                    }
                    if (Array.isArray(postMeta.links) && postMeta.links.length) {
                      bylineBits.push(`<span class="blog-post-links">${postMeta.links.map(l => `<a href="${mdEsc(l.href)}">${mdEsc(l.label)}</a>`).join(' &middot; ')}</span>`);
                    }
                    const byline = bylineBits.length ? `<span class="blog-post-byline">${bylineBits.join(' &middot; ')}</span>` : '';
                    postHeader = `<div class="blog-post-meta"><span class="blog-post-date">${fmtDate(postMeta.date)}${postMeta.tag ? ' &middot; ' + mdEsc(tagDisplay) : ''}</span>${byline}</div><h1 class="blog-post-title">${mdEsc(postMeta.title)}</h1>`;
                    const wordCount = mdText.replace(/[#*_`>\-\[\]()]/g, '').split(/\s+/).filter(Boolean).length;
                    const plainText = renderedBody.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
                    const articleBody = plainText.length > 500 ? plainText.slice(0, plainText.lastIndexOf(' ', 500)) + '\u2026' : plainText;
                    meta.jsonLd = JSON.stringify({
                      '@context': 'https://schema.org',
                      '@graph': [
                        {
                          '@type': 'BlogPosting',
                          '@id': meta.canonical,
                          headline: postMeta.title,
                          datePublished: postMeta.date,
                          dateModified: postMeta.updated || postMeta.date,
                          description: meta.desc,
                          url: meta.canonical,
                          wordCount,
                          articleBody,
                          ...(postMeta.tag && { articleSection: Array.isArray(postMeta.tag) ? postMeta.tag[0] : postMeta.tag }),
                          speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.blog-post-title', '.blog-content p:first-of-type'] },
                          image: 'https://a9l.im/og-image.webp?v=20261023',
                          author: { '@type': 'Person', '@id': 'https://a9l.im/#person', name: 'a9lim', url: 'https://a9l.im/', sameAs: ['https://github.com/a9lim', 'https://twitter.com/_a9lim'] },
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
        const pageName = pathname === '/sims' ? 'Simulations' : pathname === '/projects' ? 'Projects' : 'Blog';
        meta.ssrBreadcrumb = `<a href="/">Home</a> <span aria-hidden="true">\u203a</span> <span>${pageName}</span>`;
        const navElement = {
          '@type': 'SiteNavigationElement',
          name: 'Main Navigation',
          hasPart: [
            { '@type': 'WebPage', name: 'Home', url: 'https://a9l.im' },
            { '@type': 'WebPage', name: 'Simulations', url: 'https://a9l.im/sims' },
            { '@type': 'WebPage', name: 'Projects', url: 'https://a9l.im/projects' },
            { '@type': 'WebPage', name: 'Blog', url: 'https://a9l.im/blog' },
          ],
        };
        const breadcrumb = {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://a9l.im' },
            { '@type': 'ListItem', position: 2, name: pageName, item: `https://a9l.im${pathname}` },
          ],
        };
        if (pathname === '/sims') {
          const simItems = SIMS_ITEMLIST.map(p => ({ '@type': 'ListItem', ...p }));
          meta.jsonLd = JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              { '@type': 'CollectionPage', '@id': 'https://a9l.im/sims', name: 'Simulations', url: 'https://a9l.im/sims', mainEntity: { '@type': 'ItemList', itemListElement: simItems } },
              breadcrumb,
              navElement,
            ],
          });
        } else if (pathname === '/projects') {
          const projectItems = PROJECTS_ITEMLIST.map(p => ({ '@type': 'ListItem', ...p }));
          meta.jsonLd = JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              { '@type': 'CollectionPage', '@id': 'https://a9l.im/projects', name: 'Projects', url: 'https://a9l.im/projects', mainEntity: { '@type': 'ItemList', itemListElement: projectItems } },
              breadcrumb,
              navElement,
            ],
          });
        } else if (pathname === '/blog') {
          // Blog listing SSR — will be overridden below if posts.json loads
          meta.jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': [breadcrumb, navElement] });
        } else {
          meta.jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': [breadcrumb, navElement] });
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
                  { '@type': 'Blog', '@id': 'https://a9l.im/blog', name: 'a9l.im Blog', url: 'https://a9l.im/blog', blogPost: posts.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `https://a9l.im/blog/${p.slug}`, datePublished: p.date })) },
                  { '@type': 'ItemList', '@id': 'https://a9l.im/blog#list', itemListElement: blogItems },
                  breadcrumb,
                  navElement,
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
