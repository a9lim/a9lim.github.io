// ─── Project Carousel ───

const CARDS_PER_PAGE = 3;
const SWIPE_THRESHOLD = 50;
const WHEEL_COOLDOWN_MS = 600;
const TILT_PERSPECTIVE = 800;
const TILT_MAX_DEG = 12;

export function initCarousel() {
    const carouselTrack = document.querySelector('.carousel-track');
    const dotsContainer = document.querySelector('.carousel-dots');
    const cards = document.querySelectorAll('.carousel-card');

    if (!carouselTrack || !dotsContainer || !cards.length) return;

    const totalPages = Math.ceil(cards.length / CARDS_PER_PAGE);
    let currentPage = 0;
    const isMobile = () => window.innerWidth <= 900;

    // Create dots
    for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Page ' + (i + 1));
        dot.addEventListener('click', () => goToPage(i));
        dotsContainer.appendChild(dot);
    }
    const dots = dotsContainer.querySelectorAll('.carousel-dot');

    function updateDots() {
        dots.forEach((d, i) => d.classList.toggle('active', i === currentPage));
    }

    function goToPage(n) {
        currentPage = Math.max(0, Math.min(totalPages - 1, n));
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

    // Wheel navigation (desktop)
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

    // Touch swipe (desktop mode)
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

    // Mobile native scroll → update dots
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

    // 3D tilt (non-touch devices)
    if (!('ontouchstart' in window)) {
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                if (isMobile()) return;
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                const rx = (0.5 - y) * TILT_MAX_DEG;
                const ry = (x - 0.5) * TILT_MAX_DEG;
                card.style.transform = `perspective(${TILT_PERSPECTIVE}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.03)`;
                card.style.setProperty('--mouse-x', (x * 100) + '%');
                card.style.setProperty('--mouse-y', (y * 100) + '%');
            });
            card.addEventListener('mouseleave', () => {
                card.style.transition = 'transform 0.4s var(--ease-spring), box-shadow 0.3s var(--ease-out)';
                card.style.transform = '';
            });
            card.addEventListener('mouseenter', () => {
                card.style.transition = 'transform 0.15s var(--ease-out), box-shadow 0.3s var(--ease-out)';
            });
        });
    }

    // Resize handler
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (isMobile()) {
                carouselTrack.style.transform = '';
                carouselTrack.style.transition = '';
            } else {
                goToPage(currentPage);
            }
        }, 150);
    });

    // Force all cards visible + eager load images
    cards.forEach(card => {
        card.classList.add('visible');
        const img = card.querySelector('img');
        if (img) {
            img.loading = 'eager';
            if (!img.complete) img.src = img.src;
        }
    });

    // Project card 3D tilt + shimmer (non-touch devices)
    const projectCards = document.querySelectorAll('.project-card');
    if (projectCards.length && !('ontouchstart' in window)) {
        projectCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                const rx = (0.5 - y) * TILT_MAX_DEG;
                const ry = (x - 0.5) * TILT_MAX_DEG;
                card.style.transform = `perspective(${TILT_PERSPECTIVE}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.03)`;
                card.style.setProperty('--mouse-x', (x * 100) + '%');
                card.style.setProperty('--mouse-y', (y * 100) + '%');
            });
            card.addEventListener('mouseleave', () => {
                card.style.transition = 'transform 0.4s var(--ease-spring), box-shadow 0.3s var(--ease-out)';
                card.style.transform = '';
            });
            card.addEventListener('mouseenter', () => {
                card.style.transition = 'transform 0.15s var(--ease-out), box-shadow 0.3s var(--ease-out)';
            });
        });
    }
}
