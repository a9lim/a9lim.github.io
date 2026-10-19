// ─── Fade-ins ───
// `.fade-in` elements reveal by opacity when their page is shown.

/**
 * Replay entrance fades on all `.fade-in` children of container.
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
