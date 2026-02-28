// ─── Blog Listing & Post Rendering ───
import { parseMarkdown } from './markdown.js';
import { triggerFadeIns } from './animations.js';

let postsCache = null;
const mdCache = {};

function escapeHtmlBasic(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

export async function showBlogListing($) {
    $.blogListing.style.display = '';
    $.blogPost.style.display = 'none';

    if (!postsCache) {
        $.blogListCt.innerHTML = '<p class="blog-loading">Loading&hellip;</p>';
        try {
            const res = await fetch('posts.json');
            postsCache = await res.json();
        } catch (e) {
            $.blogListCt.innerHTML = '<div class="blog-empty"><p>Could not load posts.</p></div>';
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
        return '<a href="#blog/' + escapeHtmlBasic(p.slug) + '" class="blog-entry">'
            + '<span class="blog-date">' + formatDate(p.date) + '</span>'
            + '<span class="blog-title">' + escapeHtmlBasic(p.title) + '</span>'
            + (p.tag ? '<span class="blog-tag">' + escapeHtmlBasic(p.tag) + '</span>' : '')
            + '</a>';
    }).join('');

    triggerFadeIns(document.getElementById('page-blog'));
}

export async function showBlogPost(slug, $) {
    $.blogListing.style.display = 'none';
    $.blogPost.style.display = '';
    $.blogContent.innerHTML = '<p class="blog-loading">Loading&hellip;</p>';
    triggerFadeIns(document.getElementById('page-blog'));

    if (!mdCache[slug]) {
        try {
            const res = await fetch('posts/' + encodeURIComponent(slug) + '.md');
            if (!res.ok) throw new Error(res.status);
            mdCache[slug] = await res.text();
        } catch (e) {
            $.blogContent.innerHTML = '<p class="blog-empty">Post not found.</p>';
            triggerFadeIns(document.getElementById('page-blog'));
            return;
        }
    }

    if (!postsCache) {
        try {
            const res = await fetch('posts.json');
            postsCache = await res.json();
        } catch (e) { /* continue without metadata */ }
    }

    const meta = postsCache ? postsCache.find(p => p.slug === slug) : null;

    let header = '<div class="blog-post-header">';
    if (meta) {
        header += '<span class="blog-post-date">' + formatDate(meta.date)
            + (meta.tag ? ' &middot; ' + escapeHtmlBasic(meta.tag) : '') + '</span>';
        header += '<h1 class="blog-post-title">' + escapeHtmlBasic(meta.title) + '</h1>';
    }
    header += '</div>';

    $.blogContent.innerHTML = header + '<div class="blog-content">' + parseMarkdown(mdCache[slug]) + '</div>';
    triggerFadeIns(document.getElementById('page-blog'));
}
