// ─── SPA Hash Router ───

export function parseHash() {
    const raw = location.hash.replace('#', '');
    const parts = raw.split('/');
    const page = ['home', 'projects', 'blog', 'about'].includes(parts[0]) ? parts[0] : 'home';
    const slug = page === 'blog' && parts[1] ? parts[1] : null;
    return { page, slug };
}

export function navigateTo(page, slug, { $, pages, navLinks, triggerFadeIns, showBlogPost, showBlogListing }) {
    pages.forEach(p => p.classList.remove('active'));
    navLinks.forEach(l => l.classList.remove('active'));

    const target = document.getElementById('page-' + page);
    if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0 });
    }

    navLinks.forEach(l => {
        if (l.dataset.page === page) l.classList.add('active');
    });

    $.mobileNav.classList.remove('open');
    $.menuToggle.setAttribute('aria-expanded', 'false');

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
    function onHashChange() {
        const { page, slug } = parseHash();
        navigateTo(page, slug, deps);
    }

    window.addEventListener('hashchange', onHashChange);

    document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-page]');
        if (link) {
            e.preventDefault();
            location.hash = link.dataset.page;
        }
    });

    // Initial route
    onHashChange();
}
