// ─── SPA Path Router ───
// Routes: /, /sims, /projects, /blog, /blog/{slug}.
// The Worker serves index.html for these paths and injects first-response SEO.
// A delegated click handler on document intercepts [data-page] links.

import { HOME_META, ROUTE_META, BLOG_META } from './route-meta.js';

const PAGES = ['home', 'sims', 'projects', 'blog'];
const SITE = 'https://a9l.im';

function localized(meta) {
    if (!meta) return null;
    const lang = window._i18n && window._i18n.getLang ? window._i18n.getLang() : 'en';
    if (lang === 'en') return meta;
    return {
        ...meta,
        title: meta['title_' + lang] || meta.title,
        desc: meta['desc_' + lang] || meta.desc,
        ogTitle: meta['ogTitle_' + lang] || meta.ogTitle,
        twitterDesc: meta['twitterDesc_' + lang] || meta.twitterDesc,
    };
}

function setMeta(selector, value) {
    const element = document.head.querySelector(selector);
    if (element && value) element.setAttribute('content', value);
}

function updateRouteMetadata(page, slug) {
    const pathname = page === 'home' ? '/' : '/' + page + (slug ? '/' + slug : '');
    let meta = page === 'home'
        ? HOME_META
        : page === 'blog' && slug
            ? BLOG_META[slug]
            : ROUTE_META[pathname];

    if (!meta && page === 'blog' && slug) {
        const pretty = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        meta = {
            title: `${pretty} | a9l.im`,
            desc: ROUTE_META['/blog'].desc,
            ogTitle: `${pretty} | a9l.im`,
        };
    }
    meta = localized(meta);
    if (!meta) return;

    const canonical = page === 'home' ? SITE : SITE + pathname;
    document.title = meta.title;
    setMeta('meta[name="description"]', meta.desc);
    setMeta('meta[property="og:title"]', meta.ogTitle || meta.title);
    setMeta('meta[property="og:description"]', meta.desc);
    setMeta('meta[property="og:url"]', canonical);
    setMeta('meta[property="og:type"]', page === 'blog' && slug ? 'article' : 'website');
    setMeta('meta[name="twitter:title"]', meta.ogTitle || meta.title);
    setMeta('meta[name="twitter:description"]', meta.twitterDesc || meta.desc);
    const canonicalLink = document.head.querySelector('link[rel="canonical"]');
    if (canonicalLink) canonicalLink.setAttribute('href', canonical);
}

export function parsePath() {
    const raw = location.pathname.replace(/^\//, '').replace(/\/$/, '');
    const parts = raw.split('/');
    const page = PAGES.includes(parts[0]) ? parts[0] : 'home';
    const slug = page === 'blog' && parts[1] ? parts[1] : null;
    return { page, slug };
}

export function navigateTo(page, slug, deps) {
    const { $, pages, navLinks, triggerFadeIns, showBlogPost, showBlogListing } = deps;

    const bc = document.getElementById('breadcrumb');
    if (bc) { bc.textContent = ''; bc.hidden = true; }

    pages.forEach(p => p.classList.remove('active'));
    navLinks.forEach(l => { l.classList.remove('active'); l.removeAttribute('aria-current'); });

    const target = document.getElementById('page-' + page);
    if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0 });
    }

    navLinks.forEach(l => {
        if (l.dataset.page === page) { l.classList.add('active'); l.setAttribute('aria-current', 'page'); }
    });

    $.mobileNav.classList.remove('open');
    $.menuToggle.setAttribute('aria-expanded', 'false');

    if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
    }

    if (page === 'blog') {
        if (slug) {
            showBlogPost(slug);
        } else {
            showBlogListing();
        }
    } else {
        triggerFadeIns(target);
    }

    updateRouteMetadata(page, slug);
}

export function initRouter(deps) {
    function onRoute() {
        const { page, slug } = parsePath();
        navigateTo(page, slug, deps);
    }

    window.addEventListener('popstate', onRoute);

    if (window._i18n && window._i18n.onChange) {
        window._i18n.onChange(() => {
            const { page, slug } = parsePath();
            updateRouteMetadata(page, slug);
        });
    }

    document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-page]');
        if (!link) return;

        // Blog entry links have data-page="blog" and a full path href
        const href = link.getAttribute('href');
        if (href && href.startsWith('/blog/')) {
            e.preventDefault();
            history.pushState(null, '', href);
            onRoute();
            return;
        }

        e.preventDefault();
        const page = link.dataset.page;
        const path = page === 'home' ? '/' : '/' + page;
        history.pushState(null, '', path);
        onRoute();
    });

    onRoute();
}
