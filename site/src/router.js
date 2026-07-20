// ─── SPA Path Router ───
// Routes: /, /sims, /projects, /blog, /blog/{slug}.
// Cloudflare Pages _redirects serves index.html for these paths.
// A delegated click handler on document intercepts [data-page] links.

const PAGES = ['home', 'sims', 'projects', 'blog'];

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
}

export function initRouter(deps) {
    function onRoute() {
        const { page, slug } = parsePath();
        navigateTo(page, slug, deps);
    }

    window.addEventListener('popstate', onRoute);

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
