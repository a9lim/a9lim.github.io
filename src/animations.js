// ─── Scroll Animations & Fade-Ins ───
// Two independent reveal systems: `.fade-in` (page-nav triggered) and
// `.scroll-reveal` (IntersectionObserver, one-shot). Also drives the
// accent stripe slide-in and exposes scrollNorm for the shader.

let scrollNorm = 0;

/** Normalized scroll position [0..1], consumed by the shader uniform u_scroll. */
export function getScrollNorm() {
    return scrollNorm;
}

function updateScrollNorm() {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    scrollNorm = window.scrollY / maxScroll;
}

/**
 * Replay entrance animations on all `.fade-in` children of container.
 * Double-rAF ensures the browser flushes the class removal before re-adding,
 * so the CSS transition fires even when navigating to the same page twice.
 */
export function triggerFadeIns(container) {
    if (!container) return;
    const els = container.querySelectorAll('.fade-in');
    els.forEach(el => el.classList.remove('visible'));
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            els.forEach(el => el.classList.add('visible'));
        });
    });
}

/** Add `.scrolled` shadow class to navbar on scroll (rAF-throttled). */
export function initNavbarScroll($) {
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                $.navbar.classList.toggle('scrolled', window.scrollY > 20);
                ticking = false;
            });
            ticking = true;
        }
    });
}

/** Wire up scroll-reveal observer and parallax. */
export function initScrollReveal() {
    const revealEls = document.querySelectorAll('.scroll-reveal');

    // One-shot reveal: unobserved after first intersection
    if (revealEls.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach(el => observer.observe(el));
    }

    // Parallax elements: hero orbs float with scroll
    const orbs = document.querySelectorAll('.hero-orb');

    function onScroll() {
        updateScrollNorm();

        // Subtle parallax on hero orbs
        if (orbs.length) {
            const sy = window.scrollY;
            orbs.forEach((orb, i) => {
                const speed = (i + 1) * 0.15;
                orb.style.transform = `translateY(${sy * speed}px) scale(${1 - sy * 0.0003})`;
            });
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
}
