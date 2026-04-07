// ─── Project Carousel ───
// Desktop (>900px): JS-driven translateX pagination with wheel/touch nav.
// Mobile (<=900px): native overflow-x scroll-snap (CSS !important disables
// the JS transform). Dots, lazy-load images, and 3D card tilt handled here.

import { initCardTilt } from './card-effects.js';

/** Populate .carousel-track with card markup from PROJECTS data. */
export function renderCarouselCards(container, projects) {
    container.innerHTML = projects.map(p => {
        const ext = p.external ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${escapeHtml(p.href)}" class="carousel-card scroll-reveal"${ext}>
            <div class="carousel-card-visual">
                <img class="carousel-card-img" data-src="${escapeHtml(p.image)}" alt="" onerror="this.remove()">
            </div>
            <div class="carousel-card-overlay"></div>
            <div class="carousel-card-info">
                <h3>${escapeHtml(p.title)}</h3>
                <p>${escapeHtml(p.shortDesc)}</p>
                <div class="carousel-card-tags">
                    ${p.tags.map(t => `<span>${escapeHtml(t)}</span>`).join('')}
                </div>
            </div>
        </a>`;
    }).join('');
}

const CARDS_PER_PAGE = 3;
const SWIPE_THRESHOLD = 50;
const WHEEL_COOLDOWN_MS = 600;

export function initCarousel() {
    const carouselTrack = document.querySelector('.carousel-track');
    const dotsContainer = document.querySelector('.carousel-dots');
    const cards = document.querySelectorAll('.carousel-card');

    if (!carouselTrack || !dotsContainer || !cards.length) return;

    const totalPages = Math.ceil(cards.length / CARDS_PER_PAGE);
    let currentPage = 0;
    const isMobile = () => window.innerWidth <= 900;

    dotsContainer.setAttribute('role', 'tablist');

    for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Page ' + (i + 1));
        dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        dot.addEventListener('click', () => goToPage(i));
        dotsContainer.appendChild(dot);
    }
    const dots = dotsContainer.querySelectorAll('.carousel-dot');

    function updateDots() {
        dots.forEach((d, i) => {
            d.classList.toggle('active', i === currentPage);
            d.setAttribute('aria-selected', i === currentPage ? 'true' : 'false');
        });
    }

    function goToPage(n) {
        const prevPage = currentPage;
        currentPage = Math.max(0, Math.min(totalPages - 1, n));
        if (currentPage !== prevPage && typeof _haptics !== 'undefined') _haptics.trigger('selection');
        if (isMobile()) {
            const target = cards[currentPage * CARDS_PER_PAGE];
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
            if (currentPage === 0) {
                carouselTrack.style.transform = 'translateX(0)';
            } else {
                const offset = cards[currentPage * CARDS_PER_PAGE].offsetLeft - cards[0].offsetLeft;
                carouselTrack.style.transform = 'translateX(-' + offset + 'px)';
            }
        }
        updateDots();
    }

    // Wheel → page advance (desktop only, debounced to prevent rapid flipping)
    let wheelCooldown = false;
    carouselTrack.addEventListener('wheel', (e) => {
        if (isMobile()) return;
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            if (wheelCooldown) return;
            wheelCooldown = true;
            goToPage(currentPage + (e.deltaY > 0 ? 1 : -1));
            setTimeout(() => { wheelCooldown = false; }, WHEEL_COOLDOWN_MS);
        }
    }, { passive: false });

    // Touch swipe with 1:1 drag tracking (desktop mode only — mobile uses native scroll)
    let touchStartX = 0, touchCurrentX = 0, touchDragging = false, baseOffset = 0;

    carouselTrack.addEventListener('touchstart', (e) => {
        if (isMobile()) return;
        touchStartX = e.touches[0].clientX;
        touchCurrentX = touchStartX;
        touchDragging = true;
        carouselTrack.style.transition = 'none';
        baseOffset = currentPage === 0 ? 0
            : cards[currentPage * CARDS_PER_PAGE].offsetLeft - cards[0].offsetLeft;
    }, { passive: true });

    carouselTrack.addEventListener('touchmove', (e) => {
        if (!touchDragging || isMobile()) return;
        e.preventDefault();
        touchCurrentX = e.touches[0].clientX;
        const delta = touchCurrentX - touchStartX;
        carouselTrack.style.transform = 'translateX(' + (-baseOffset + delta) + 'px)';
    }, { passive: false });

    carouselTrack.addEventListener('touchend', () => {
        if (!touchDragging || isMobile()) return;
        touchDragging = false;
        carouselTrack.style.transition = '';
        const delta = touchCurrentX - touchStartX;
        if (delta < -SWIPE_THRESHOLD) goToPage(currentPage + 1);
        else if (delta > SWIPE_THRESHOLD) goToPage(currentPage - 1);
        else goToPage(currentPage);
    });

    // Sync dot state from native scroll position on mobile
    let dotTicking = false;
    carouselTrack.addEventListener('scroll', () => {
        if (!isMobile()) return;
        if (!dotTicking) {
            dotTicking = true;
            requestAnimationFrame(() => {
                const scrollLeft = carouselTrack.scrollLeft;
                const cardW = cards[0].offsetWidth + 24;
                const cardIdx = Math.round(scrollLeft / cardW);
                currentPage = Math.min(totalPages - 1, Math.floor(cardIdx / CARDS_PER_PAGE));
                updateDots();
                dotTicking = false;
            });
        }
    }, { passive: true });

    // Keyboard navigation: arrow keys advance carousel pages
    const viewport = document.querySelector('.carousel-viewport');
    if (viewport) {
        viewport.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') { e.preventDefault(); goToPage(currentPage - 1); }
            else if (e.key === 'ArrowRight') { e.preventDefault(); goToPage(currentPage + 1); }
        });
    }
    dotsContainer.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); goToPage(currentPage - 1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); goToPage(currentPage + 1); }
    });

    initCardTilt('.carousel-card');
    initCardTilt('.project-card');
    initCardTilt('.contact-section');

    // Debounced resize: reset transform mode when crossing the 900px breakpoint
    window.addEventListener('resize', debounce(() => {
        if (isMobile()) {
            carouselTrack.style.transform = '';
            carouselTrack.style.transition = '';
        } else {
            goToPage(currentPage);
        }
    }, 150));

    // Cards start with scroll-reveal hidden state; mark visible immediately
    // since the carousel manages its own viewport clipping
    cards.forEach(card => {
        card.classList.add('visible');
    });

    // Lazy-load: data-src → src when card nears viewport (200px lookahead)
    const images = carouselTrack.querySelectorAll('img[data-src]');
    if (images.length && 'IntersectionObserver' in window) {
        const imgObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    obs.unobserve(img);
                }
            });
        }, { rootMargin: '200px' });
        images.forEach(img => imgObserver.observe(img));
    }
}
