// ─── Scroll Animations & Fade-Ins ───

let scrollNorm = 0;

export function getScrollNorm() {
    return scrollNorm;
}

function updateScrollNorm() {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    scrollNorm = window.scrollY / maxScroll;
}

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

export function initScrollReveal() {
    const revealEls = document.querySelectorAll('.scroll-reveal');

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

    // Scroll-driven stripe band
    const stripeBand = document.querySelector('.stripe-band');
    const stripeSection = document.querySelector('.stripe-section');
    let stripeTicking = false;

    function onScroll() {
        updateScrollNorm();
        if (stripeBand && stripeSection && !stripeTicking) {
            stripeTicking = true;
            requestAnimationFrame(() => {
                const rect = stripeSection.getBoundingClientRect();
                const vh = window.innerHeight;
                const progress = 1 - (rect.top / vh);
                const tx = Math.max(-120, Math.min(10, (progress - 0.15) * 180 - 120));
                stripeBand.style.transform = `translateX(${tx}%) rotate(-3deg)`;
                stripeTicking = false;
            });
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
}
