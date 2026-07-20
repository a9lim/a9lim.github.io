// ─── Card Effects ───
// 3D perspective tilt + shimmer hover + cursor glow for project cards
// and the contact section. Skipped on touch devices (no mousemove).
// The shimmer radial gradient follows --mouse-x/--mouse-y CSS custom
// properties set here.

const TILT_PERSPECTIVE = 800;
const TILT_MAX_DEG = 12;
const LERP_FACTOR = 0.12;

/**
 * @param {string} selector  CSS selector for target cards
 * @param {Object} [opts]    maxTilt (deg), scale, perspective overrides
 * @returns {Function|null}  Cleanup function, or null on touch devices
 */
export function initCardTilt(selector, opts) {
    if ('ontouchstart' in window) return null;

    const maxTilt = (opts && opts.maxTilt) || TILT_MAX_DEG;
    const scale = (opts && opts.scale) || 1.03;
    const perspective = (opts && opts.perspective) || TILT_PERSPECTIVE;

    const cards = document.querySelectorAll(selector);
    if (!cards.length) return null;

    const cleanups = [];

    cards.forEach(card => {
        let targetRx = 0, targetRy = 0;
        let currentRx = 0, currentRy = 0;
        let currentScale = 1;
        let mouseX = 0.5, mouseY = 0.5;
        let hovering = false;
        let rafId = null;

        card.style.transition = 'box-shadow 0.2s var(--ease-out)';

        function animate() {
            currentRx += (targetRx - currentRx) * LERP_FACTOR;
            currentRy += (targetRy - currentRy) * LERP_FACTOR;
            const targetScale = hovering ? scale : 1;
            currentScale += (targetScale - currentScale) * LERP_FACTOR;

            if (!hovering &&
                Math.abs(currentRx) < 0.01 &&
                Math.abs(currentRy) < 0.01 &&
                Math.abs(currentScale - 1) < 0.001) {
                currentRx = 0;
                currentRy = 0;
                currentScale = 1;
                card.style.transform = '';
                rafId = null;
                return;
            }

            card.style.transform = `perspective(${perspective}px) rotateX(${currentRx}deg) rotateY(${currentRy}deg) scale(${currentScale})`;
            card.style.setProperty('--mouse-x', (mouseX * 100) + '%');
            card.style.setProperty('--mouse-y', (mouseY * 100) + '%');

            rafId = requestAnimationFrame(animate);
        }

        function startLoop() {
            if (!rafId) rafId = requestAnimationFrame(animate);
        }

        function onMove(e) {
            const rect = card.getBoundingClientRect();
            mouseX = (e.clientX - rect.left) / rect.width;
            mouseY = (e.clientY - rect.top) / rect.height;
            targetRx = (0.5 - mouseY) * maxTilt;
            targetRy = (mouseX - 0.5) * maxTilt;
            startLoop();
        }

        function onLeave() {
            hovering = false;
            targetRx = 0;
            targetRy = 0;
            startLoop();
        }

        function onEnter() {
            hovering = true;
            startLoop();
        }

        card.addEventListener('mousemove', onMove);
        card.addEventListener('mouseleave', onLeave);
        card.addEventListener('mouseenter', onEnter);

        cleanups.push(() => {
            card.removeEventListener('mousemove', onMove);
            card.removeEventListener('mouseleave', onLeave);
            card.removeEventListener('mouseenter', onEnter);
            if (rafId) cancelAnimationFrame(rafId);
        });
    });

    return () => cleanups.forEach(fn => fn());
}
