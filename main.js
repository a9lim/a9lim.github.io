// Entry point for a9l.im portfolio. Wires DOM cache, renders dynamic cards,
// and boots all subsystems (router, shader, carousel, etc.).

import { initRouter } from './src/router.js';
import { initTheme } from './src/theme.js';
import { initMobileMenu } from './src/mobile-menu.js';
import { triggerFadeIns, initNavbarScroll, initScrollReveal } from './src/animations.js';
import { initShader } from './src/shader.js';
import { initCarousel, renderCarouselCards } from './src/carousel.js';
import { showBlogListing, showBlogPost } from './src/blog.js';
import { initWorldMap } from './src/world-map.js';
import { PROJECTS } from './src/projects.js';
import { renderProjectCards } from './src/projects-page.js';

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

// Both carousel (home) and project grid share the PROJECTS data array
renderCarouselCards(document.querySelector('.carousel-track'), PROJECTS);
renderProjectCards(document.querySelector('.projects-grid'), PROJECTS);

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
initCarousel();
initWorldMap();
