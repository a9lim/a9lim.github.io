// ─── Blog Listing & Post Rendering ───
// Fetches posts.json for the listing and individual .md files from posts/.
// Caches both in memory. Shows shimmer skeletons during loads.
//
// i18n: posts whose entry in posts.json has `translations: ["ja"]` get a
// sibling JA markdown file at /posts/{slug}.ja.md. When window._i18n.getLang()
// returns 'ja' we fetch the JA file (and fall back to EN if it 404s). Listing
// titles/excerpts/tags also pick up `_ja` variants when present.

import { parseMarkdown } from './markdown.js';
import { triggerFadeIns } from './animations.js';

let postsCache = null;   // posts.json result (fetched once)
const mdCache = {};      // `${slug}:${lang}` -> raw markdown text
let katexLoaded = false;
let _currentPostSlug = null;  // tracks rendered post so onChange can rerender

const FETCH_TIMEOUT = 10000;
const KATEX_VERSION = '0.16.11';
const KATEX_BASE = 'https://cdn.jsdelivr.net/npm/katex@' + KATEX_VERSION + '/dist';

function loadKaTeX() {
    if (katexLoaded) return Promise.resolve();
    katexLoaded = true;
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = KATEX_BASE + '/katex.min.css';
    css.crossOrigin = 'anonymous';
    document.head.appendChild(css);
    return new Promise(function (resolve) {
        const js = document.createElement('script');
        js.src = KATEX_BASE + '/katex.min.js';
        js.crossOrigin = 'anonymous';
        js.onload = function () {
            const ar = document.createElement('script');
            ar.src = KATEX_BASE + '/contrib/auto-render.min.js';
            ar.crossOrigin = 'anonymous';
            ar.onload = resolve;
            document.head.appendChild(ar);
        };
        document.head.appendChild(js);
    });
}

function renderMath(el) {
    if (typeof renderMathInElement === 'function') {
        renderMathInElement(el, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
            ],
            throwOnError: false
        });
    }
}

function formatDate(iso) {
    // Append time to avoid timezone-shift date drift
    const d = new Date(iso + 'T00:00:00');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

/** Shimmer skeleton placeholders matching blog-entry layout. */
function skeletonEntries(n) {
    let html = '';
    for (let i = 0; i < n; i++) {
        html += '<div class="skeleton-entry">'
            + '<span class="skeleton skeleton-date"></span>'
            + '<span class="skeleton skeleton-title" style="max-width:' + (200 + Math.random() * 200) + 'px"></span>'
            + '<span class="skeleton skeleton-tag"></span>'
            + '</div>';
    }
    return html;
}

function fetchWithTimeout(url, ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal })
        .finally(() => clearTimeout(timer));
}

function currentLang() {
    return (window._i18n && window._i18n.getLang) ? window._i18n.getLang() : 'en';
}

function pickPostField(post, base) {
    if (!post) return undefined;
    const lang = currentLang();
    if (lang !== 'en') {
        const k = base + '_' + lang;
        if (Object.prototype.hasOwnProperty.call(post, k) && post[k] != null) return post[k];
    }
    return post[base];
}

function postHasTranslation(post, lang) {
    if (!post) return false;
    if (lang === 'en') return true;
    return Array.isArray(post.translations) && post.translations.indexOf(lang) >= 0;
}

function localizedI18n(key, fallback) {
    if (window._i18n && window._i18n.t) return window._i18n.t(key, fallback);
    return fallback;
}

function clearNode(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
}

function renderListingError($, msg) {
    clearNode($.blogListCt);
    const wrap = document.createElement('div');
    wrap.className = 'blog-error';
    const p = document.createElement('p');
    p.textContent = msg;
    wrap.appendChild(p);
    $.blogListCt.appendChild(wrap);
    triggerFadeIns(document.getElementById('page-blog'));
}

function renderListingEmpty($, msg) {
    clearNode($.blogListCt);
    const wrap = document.createElement('div');
    wrap.className = 'blog-empty';
    const p = document.createElement('p');
    p.textContent = msg;
    wrap.appendChild(p);
    $.blogListCt.appendChild(wrap);
    triggerFadeIns(document.getElementById('page-blog'));
}

function injectPostLangSwitch(contentRoot, meta) {
    const header = contentRoot.querySelector('.blog-post-header');
    if (!header) return;
    // Avoid duplicates if re-rendered.
    const existing = header.querySelector('.blog-lang-switch');
    if (existing) existing.remove();
    const wrap = document.createElement('div');
    wrap.className = 'blog-lang-switch';
    const label = document.createElement('span');
    label.className = 'blog-lang-switch-label';
    label.textContent = localizedI18n('blog.langLabel', 'Read in:');
    wrap.appendChild(label);
    // Two buttons: en (always) + each declared translation.
    const langs = ['en'].concat(Array.isArray(meta.translations) ? meta.translations : []);
    const current = currentLang();
    for (const code of langs) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'blog-lang-btn';
        if (code === current) btn.classList.add('active');
        btn.dataset.lang = code;
        btn.textContent = code === 'ja'
            ? localizedI18n('blog.toJA', '日本語')
            : localizedI18n('blog.toEN', 'EN');
        btn.addEventListener('click', function () {
            if (window._i18n && window._i18n.setLang) window._i18n.setLang(code);
        });
        wrap.appendChild(btn);
    }
    header.appendChild(wrap);
}

function renderListingPosts($, posts) {
    clearNode($.blogListCt);
    for (const p of posts) {
        const title = pickPostField(p, 'title');
        const tags = pickPostField(p, 'tag');
        const a = document.createElement('a');
        a.href = '/blog/' + p.slug;
        a.className = 'blog-entry';
        a.setAttribute('data-page', 'blog');
        const dateEl = document.createElement('span');
        dateEl.className = 'blog-date';
        dateEl.textContent = formatDate(p.date);
        a.appendChild(dateEl);
        const titleEl = document.createElement('span');
        titleEl.className = 'blog-title';
        titleEl.textContent = title;
        a.appendChild(titleEl);
        if (tags) {
            const tagArr = Array.isArray(tags) ? tags : [tags];
            for (const t of tagArr) {
                const tEl = document.createElement('span');
                tEl.className = 'blog-tag';
                tEl.textContent = t;
                a.appendChild(tEl);
            }
        }
        $.blogListCt.appendChild(a);
    }
    triggerFadeIns(document.getElementById('page-blog'));
}

export async function showBlogListing($) {
    $.blogListing.style.display = '';
    $.blogPost.style.display = 'none';
    _currentPostSlug = null;

    if (!postsCache) {
        $.blogListCt.innerHTML = skeletonEntries(5);
        try {
            const res = await fetchWithTimeout('/posts.json', FETCH_TIMEOUT);
            postsCache = await res.json();
        } catch (e) {
            const msg = e.name === 'AbortError'
                ? localizedI18n('blog.timeout', 'Request timed out. Please try again.')
                : localizedI18n('blog.loadErr', 'Could not load posts.');
            renderListingError($, msg);
            return;
        }
    }

    if (!postsCache.length) {
        renderListingEmpty($, localizedI18n('blog.empty', 'No posts yet.'));
        return;
    }

    renderListingPosts($, postsCache);

    triggerFadeIns(document.getElementById('page-blog'));
}

export async function showBlogPost(slug, $) {
    $.blogListing.style.display = 'none';
    $.blogPost.style.display = '';
    _currentPostSlug = slug;
    $.blogContent.innerHTML = '<div class="skeleton" style="height:24px;width:120px;margin-bottom:12px"></div>'
        + '<div class="skeleton" style="height:36px;width:80%;margin-bottom:40px"></div>'
        + '<div class="skeleton" style="height:14px;width:100%;margin-bottom:10px"></div>'
        + '<div class="skeleton" style="height:14px;width:90%;margin-bottom:10px"></div>'
        + '<div class="skeleton" style="height:14px;width:95%;margin-bottom:10px"></div>'
        + '<div class="skeleton" style="height:14px;width:70%"></div>';
    triggerFadeIns(document.getElementById('page-blog'));

    // Metadata is optional for rendering — post body works without it.
    // We fetch it first so the lang-aware fetch below knows whether a JA
    // sibling exists.
    if (!postsCache) {
        try {
            const res = await fetchWithTimeout('/posts.json', FETCH_TIMEOUT);
            postsCache = await res.json();
        } catch (e) { /* continue without metadata */ }
    }

    const meta = postsCache ? postsCache.find(p => p.slug === slug) : null;
    const lang = currentLang();
    // Use the JA sibling only when both the user has chosen JA AND the post
    // declares a JA translation. Otherwise fall through to the EN .md.
    const useJa = lang === 'ja' && postHasTranslation(meta, 'ja');
    const fetchLang = useJa ? 'ja' : 'en';
    const cacheKey = slug + ':' + fetchLang;
    const fetchUrl = useJa
        ? '/posts/' + encodeURIComponent(slug) + '.ja.md'
        : '/posts/' + encodeURIComponent(slug) + '.md';

    if (!mdCache[cacheKey]) {
        try {
            const res = await fetchWithTimeout(fetchUrl, FETCH_TIMEOUT);
            if (!res.ok) throw new Error(res.status);
            mdCache[cacheKey] = await res.text();
        } catch (e) {
            // Fall back to EN if the JA sibling is missing.
            if (useJa) {
                try {
                    const res2 = await fetchWithTimeout('/posts/' + encodeURIComponent(slug) + '.md', FETCH_TIMEOUT);
                    if (res2.ok) {
                        mdCache[slug + ':en'] = await res2.text();
                        mdCache[cacheKey] = mdCache[slug + ':en'];
                    } else { throw e; }
                } catch (e2) {
                    const msg = e.name === 'AbortError'
                        ? localizedI18n('blog.timeout', 'Request timed out. Please try again.')
                        : localizedI18n('blog.notfound', 'Post not found.');
                    $.blogContent.innerHTML = '<p class="blog-error">' + escapeHtml(msg) + '</p>';
                    triggerFadeIns(document.getElementById('page-blog'));
                    return;
                }
            } else {
                const msg = e.name === 'AbortError'
                    ? localizedI18n('blog.timeout', 'Request timed out. Please try again.')
                    : localizedI18n('blog.notfound', 'Post not found.');
                $.blogContent.innerHTML = '<p class="blog-error">' + escapeHtml(msg) + '</p>';
                triggerFadeIns(document.getElementById('page-blog'));
                return;
            }
        }
    }

    const displayTitle = meta ? pickPostField(meta, 'title') : null;
    const displayTags = meta ? pickPostField(meta, 'tag') : null;

    let header = '<div class="blog-post-header">';
    if (meta) {
        header += '<span class="blog-post-date">' + formatDate(meta.date)
            + (displayTags ? ' &middot; ' + (Array.isArray(displayTags) ? displayTags : [displayTags]).map(escapeHtml).join(', ') : '') + '</span>';
        header += '<h1 class="blog-post-title">' + escapeHtml(displayTitle) + '</h1>';
    }
    header += '</div>';

    const rendered = parseMarkdown(mdCache[cacheKey]);
    // Content is from trusted local markdown files (posts/*.md), not user input
    $.blogContent.innerHTML = header + '<div class="blog-content">' + rendered + '</div>';

    if (/\$/.test(mdCache[cacheKey])) {
        loadKaTeX().then(function () { renderMath($.blogContent); });
    }

    // If this post has translations, inject a language pill into the header
    // so the reader can swap registers without leaving the post.
    if (meta && Array.isArray(meta.translations) && meta.translations.length) {
        injectPostLangSwitch($.blogContent, meta);
    }

    // Wire up any switcher figures emitted by the markdown parser. Each
    // figure has a `.mode-toggles` + `.mode-btn[data-panel]` group; the
    // shared `_forms.bindModeGroup` handles the sliding indicator and
    // active-state swap. Panel visibility is driven by `.active`.
    $.blogContent.querySelectorAll('.switcher-figure').forEach(function (fig) {
        var toggles = fig.querySelector('.mode-toggles');
        var panels = fig.querySelectorAll('.switcher-panel');
        if (!toggles || !panels.length || typeof _forms === 'undefined') return;
        _forms.bindModeGroup(toggles, 'panel', function (idx) {
            var i = parseInt(idx, 10);
            panels.forEach(function (p, n) { p.classList.toggle('active', n === i); });
        });
    });

    bindImageLightbox($.blogContent);

    triggerFadeIns(document.getElementById('page-blog'));
}

let _lightboxLastFocus = null;
let _lightboxEscHandler = null;

function openLightbox(src, alt) {
    closeLightbox();
    _lightboxLastFocus = document.activeElement;
    const overlay = document.createElement('div');
    overlay.className = 'blog-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', alt || 'image');
    overlay.tabIndex = -1;
    const inner = document.createElement('div');
    inner.className = 'blog-lightbox-inner';
    const img = document.createElement('img');
    img.src = src;
    if (alt) img.alt = alt;
    inner.appendChild(img);
    overlay.appendChild(inner);
    overlay.addEventListener('click', closeLightbox);
    document.body.appendChild(overlay);
    document.body.classList.add('blog-lightbox-open');
    overlay.focus();
    _lightboxEscHandler = function (e) {
        if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
    };
    document.addEventListener('keydown', _lightboxEscHandler);
}

function closeLightbox() {
    const overlay = document.querySelector('.blog-lightbox');
    if (!overlay) return;
    overlay.remove();
    document.body.classList.remove('blog-lightbox-open');
    if (_lightboxEscHandler) {
        document.removeEventListener('keydown', _lightboxEscHandler);
        _lightboxEscHandler = null;
    }
    if (_lightboxLastFocus && typeof _lightboxLastFocus.focus === 'function') {
        _lightboxLastFocus.focus();
    }
    _lightboxLastFocus = null;
}

function bindImageLightbox(root) {
    root.querySelectorAll('img').forEach(function (img) {
        img.classList.add('zoomable');
        img.addEventListener('click', function (e) {
            e.preventDefault();
            openLightbox(img.currentSrc || img.src, img.alt || '');
        });
        img.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLightbox(img.currentSrc || img.src, img.alt || '');
            }
        });
        img.tabIndex = 0;
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', 'open ' + (img.alt || 'image') + ' full size');
    });
}

// ─── i18n: re-render on language change ───
// When the navbar lang toggle fires, the listing needs new titles/excerpts
// and an in-progress post needs to refetch its JA sibling (or fall back to
// EN). We hold $ at module scope by re-using the DOM cache via showBlogPost
// / showBlogListing arguments; export a hook that main.js can wire.
let _i18nWired = false;
export function wireBlogI18n($) {
    if (_i18nWired) return;
    if (!window._i18n || !window._i18n.onChange) return;
    _i18nWired = true;
    window._i18n.onChange(function () {
        // Re-render listing if it's visible.
        if ($.blogListing && $.blogListing.style.display !== 'none') {
            // posts.json is already cached; re-render synchronously.
            if (postsCache && postsCache.length) renderListingPosts($, postsCache);
        }
        // Re-render the current post if one is showing.
        if (_currentPostSlug && $.blogPost && $.blogPost.style.display !== 'none') {
            showBlogPost(_currentPostSlug, $);
        }
    });
}
