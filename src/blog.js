// ─── Blog Listing & Post Rendering ───
// Fetches posts.json for the listing and individual .md files from posts/.
// Caches both in memory. Shows shimmer skeletons during loads.

import { parseMarkdown } from './markdown.js';
import { triggerFadeIns } from './animations.js';

let postsCache = null;   // posts.json result (fetched once)
const mdCache = {};      // slug -> raw markdown text
let katexLoaded = false;

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

export async function showBlogListing($) {
    $.blogListing.style.display = '';
    $.blogPost.style.display = 'none';

    if (!postsCache) {
        $.blogListCt.innerHTML = skeletonEntries(5);
        try {
            const res = await fetchWithTimeout('/posts.json', FETCH_TIMEOUT);
            postsCache = await res.json();
        } catch (e) {
            const msg = e.name === 'AbortError'
                ? 'Request timed out. Please try again.'
                : 'Could not load posts.';
            $.blogListCt.innerHTML = '<div class="blog-error"><p>' + escapeHtml(msg) + '</p></div>';
            triggerFadeIns(document.getElementById('page-blog'));
            return;
        }
    }

    if (!postsCache.length) {
        $.blogListCt.innerHTML = '<div class="blog-empty"><p>No posts yet.</p></div>';
        triggerFadeIns(document.getElementById('page-blog'));
        return;
    }

    $.blogListCt.innerHTML = postsCache.map(function (p) {
        return '<a href="/blog/' + escapeHtml(p.slug) + '" class="blog-entry" data-page="blog">'
            + '<span class="blog-date">' + formatDate(p.date) + '</span>'
            + '<span class="blog-title">' + escapeHtml(p.title) + '</span>'
            + (p.tag ? (Array.isArray(p.tag) ? p.tag : [p.tag]).map(t => '<span class="blog-tag">' + escapeHtml(t) + '</span>').join('') : '')
            + '</a>';
    }).join('');

    triggerFadeIns(document.getElementById('page-blog'));
}

export async function showBlogPost(slug, $) {
    $.blogListing.style.display = 'none';
    $.blogPost.style.display = '';
    $.blogContent.innerHTML = '<div class="skeleton" style="height:24px;width:120px;margin-bottom:12px"></div>'
        + '<div class="skeleton" style="height:36px;width:80%;margin-bottom:40px"></div>'
        + '<div class="skeleton" style="height:14px;width:100%;margin-bottom:10px"></div>'
        + '<div class="skeleton" style="height:14px;width:90%;margin-bottom:10px"></div>'
        + '<div class="skeleton" style="height:14px;width:95%;margin-bottom:10px"></div>'
        + '<div class="skeleton" style="height:14px;width:70%"></div>';
    triggerFadeIns(document.getElementById('page-blog'));

    if (!mdCache[slug]) {
        try {
            const res = await fetchWithTimeout('/posts/' + encodeURIComponent(slug) + '.md', FETCH_TIMEOUT);
            if (!res.ok) throw new Error(res.status);
            mdCache[slug] = await res.text();
        } catch (e) {
            const msg = e.name === 'AbortError'
                ? 'Request timed out. Please try again.'
                : 'Post not found.';
            $.blogContent.innerHTML = '<p class="blog-error">' + escapeHtml(msg) + '</p>';
            triggerFadeIns(document.getElementById('page-blog'));
            return;
        }
    }

    // Metadata is optional for rendering — post body works without it
    if (!postsCache) {
        try {
            const res = await fetchWithTimeout('/posts.json', FETCH_TIMEOUT);
            postsCache = await res.json();
        } catch (e) { /* continue without metadata */ }
    }

    const meta = postsCache ? postsCache.find(p => p.slug === slug) : null;

    let header = '<div class="blog-post-header">';
    if (meta) {
        header += '<span class="blog-post-date">' + formatDate(meta.date)
            + (meta.tag ? ' &middot; ' + (Array.isArray(meta.tag) ? meta.tag : [meta.tag]).map(escapeHtml).join(', ') : '') + '</span>';
        header += '<h1 class="blog-post-title">' + escapeHtml(meta.title) + '</h1>';
    }
    header += '</div>';

    const rendered = parseMarkdown(mdCache[slug]);
    // Content is from trusted local markdown files (posts/*.md), not user input
    $.blogContent.innerHTML = header + '<div class="blog-content">' + rendered + '</div>';

    if (/\$/.test(mdCache[slug])) {
        loadKaTeX().then(function () { renderMath($.blogContent); });
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
