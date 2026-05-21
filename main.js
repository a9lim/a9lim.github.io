// Entry point for a9l.im portfolio. Wires DOM cache, renders dynamic cards,
// and boots all subsystems (router, shader, home, etc.).

import { initRouter } from './src/router.js';
import { initTheme } from './src/theme.js';
import { initMobileMenu } from './src/mobile-menu.js';
import { triggerFadeIns, initNavbarScroll, initScrollReveal } from './src/animations.js';
import { initShader } from './src/shader.js';
import { initCardTilt } from './src/card-effects.js';
import { showBlogListing, showBlogPost, wireBlogI18n } from './src/blog.js';
import { PROJECTS } from './src/projects.js';
import { renderProjectCards } from './src/projects-page.js';
import { initHome } from './src/home.js';

// ─── DOM Cache ───
// Passed into subsystem init functions so they never call getElementById themselves
const $ = {
    navbar:      document.getElementById('navbar'),
    themeToggle: document.getElementById('theme-toggle'),
    menuToggle:  document.getElementById('menu-toggle'),
    mobileNav:   document.getElementById('mobile-nav'),
    shaderBg:    document.getElementById('shader-bg'),
    blogListing: document.getElementById('blog-listing'),
    blogPost:    document.getElementById('blog-post'),
    blogListCt:  document.getElementById('blog-list-container'),
    blogContent: document.getElementById('blog-post-content'),
};

const navLinks = document.querySelectorAll('.nav-link');
const pages    = document.querySelectorAll('.page-section');

renderProjectCards(document.querySelector('.sims-grid'), PROJECTS.filter(p => p.kind === 'sim'));
renderProjectCards(document.querySelector('.projects-grid'), PROJECTS.filter(p => p.kind === 'project'));

// ─── Init ───
initTheme($);
initMobileMenu($);
initNavbarScroll($);

initRouter({
    $,
    pages,
    navLinks,
    triggerFadeIns,
    showBlogPost: (slug) => showBlogPost(slug, $),
    showBlogListing: () => showBlogListing($),
});

initShader($);
initScrollReveal();
initCardTilt('.project-card');
initCardTilt('.contact-section');
initHome();
wireBlogI18n($);

// ─── Language switcher ───
// The button label always reads "the other language" — click flips between
// en/ja. _i18n handles DOM swap, ?lang= URL param sync, and localStorage.
// On every user-initiated swap to JA, surface a toast disclosing that the
// JA text is Claude-drafted, not authored. Initial-load detection (URL param,
// localStorage, navigator.language) is silent — _i18n.onChange only fires
// on setLang(), not on the synchronous init detect, so the toast naturally
// skips first paint and triggers only when the user clicks the switcher.
if (window._i18n && window._i18n.onChange) {
    window._i18n.onChange((lang) => {
        if (lang === 'ja' && typeof showToast === 'function') {
            showToast(window._i18n.t('toast.translated.ja'), 3500);
        }
    });
}
const langBtn = document.getElementById('lang-toggle');
if (langBtn && window._i18n) {
    langBtn.addEventListener('click', () => {
        const next = window._i18n.getLang() === 'ja' ? 'en' : 'ja';
        window._i18n.setLang(next);
    });
}
