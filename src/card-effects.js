// ─── Card Effects ───
// 3D perspective tilt + shimmer hover for carousel and project cards.
// Skipped on touch devices (no mousemove). The shimmer radial gradient
// follows --mouse-x/--mouse-y CSS custom properties set here.

const TILT_PERSPECTIVE = 800;
const TILT_MAX_DEG = 12;

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
        function onMove(e) {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const rx = (0.5 - y) * maxTilt;
            const ry = (x - 0.5) * maxTilt;
            card.style.transform = `perspective(${perspective}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`;
            card.style.setProperty('--mouse-x', (x * 100) + '%');
            card.style.setProperty('--mouse-y', (y * 100) + '%');
        }

        function onLeave() {
            card.style.transition = 'transform 0.4s var(--ease-spring), box-shadow 0.3s var(--ease-out)';
            card.style.transform = '';
        }

        function onEnter() {
            card.style.transition = 'transform 0.15s var(--ease-out), box-shadow 0.3s var(--ease-out)';
        }

        card.addEventListener('mousemove', onMove);
        card.addEventListener('mouseleave', onLeave);
        card.addEventListener('mouseenter', onEnter);

        cleanups.push(() => {
            card.removeEventListener('mousemove', onMove);
            card.removeEventListener('mouseleave', onLeave);
            card.removeEventListener('mouseenter', onEnter);
        });
    });

    return () => cleanups.forEach(fn => fn());
}
