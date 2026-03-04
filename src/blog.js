// ─── Blog Listing & Post Rendering ───
// Fetches posts.json for the listing and individual .md files from posts/.
// Caches both in memory. Shows shimmer skeletons during loads.

import { parseMarkdown } from './markdown.js';
import { triggerFadeIns } from './animations.js';

let postsCache = null;   // posts.json result (fetched once)
const mdCache = {};      // slug -> raw markdown text

const FETCH_TIMEOUT = 10000;

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
            const res = await fetchWithTimeout('posts.json', FETCH_TIMEOUT);
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
        return '<a href="#blog/' + escapeHtml(p.slug) + '" class="blog-entry">'
            + '<span class="blog-date">' + formatDate(p.date) + '</span>'
            + '<span class="blog-title">' + escapeHtml(p.title) + '</span>'
            + (p.tag ? '<span class="blog-tag">' + escapeHtml(p.tag) + '</span>' : '')
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
            const res = await fetchWithTimeout('posts/' + encodeURIComponent(slug) + '.md', FETCH_TIMEOUT);
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
            const res = await fetchWithTimeout('posts.json', FETCH_TIMEOUT);
            postsCache = await res.json();
        } catch (e) { /* continue without metadata */ }
    }

    const meta = postsCache ? postsCache.find(p => p.slug === slug) : null;

    let header = '<div class="blog-post-header">';
    if (meta) {
        header += '<span class="blog-post-date">' + formatDate(meta.date)
            + (meta.tag ? ' &middot; ' + escapeHtml(meta.tag) : '') + '</span>';
        header += '<h1 class="blog-post-title">' + escapeHtml(meta.title) + '</h1>';
    }
    header += '</div>';

    $.blogContent.innerHTML = header + '<div class="blog-content">' + parseMarkdown(mdCache[slug]) + '</div>';
    triggerFadeIns(document.getElementById('page-blog'));
}
