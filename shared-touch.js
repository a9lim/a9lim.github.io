/* ===================================================================
   shared-touch.js — Swipe-to-dismiss for bottom sheet panels
   Loaded by all simulation projects (physsim, biosim, gerry).
   Only activates at <= 900px viewport width.
   =================================================================== */

/**
 * Attach swipe-to-dismiss behavior to a bottom-sheet panel.
 *
 * @param {HTMLElement} panel        — the panel element (must have .open class when visible)
 * @param {Object}      options
 * @param {Function}    options.onDismiss      — called when sheet is swiped away
 * @param {string}     [options.handleSelector] — CSS selector for the drag handle (default: '.sheet-handle')
 */
function initSwipeDismiss(panel, options = {}) {
    const handleSel = options.handleSelector || '.sheet-handle';
    const THRESHOLD_RATIO = 0.3;   // dismiss if dragged past 30% of panel height
    const VELOCITY_THRESHOLD = 0.5; // px/ms

    let startY = 0;
    let currentY = 0;
    let startTime = 0;
    let dragging = false;

    function getHandle() {
        return panel.querySelector(handleSel);
    }

    function onTouchStart(e) {
        if (window.innerWidth > 900) return;
        if (!panel.classList.contains('open')) return;

        // Only start drag from the handle or inside it
        const handle = getHandle();
        if (!handle || !handle.contains(e.target)) return;

        dragging = true;
        startY = e.touches[0].clientY;
        currentY = startY;
        startTime = Date.now();

        panel.style.transition = 'none';
    }

    function onTouchMove(e) {
        if (!dragging) return;

        currentY = e.touches[0].clientY;
        const dy = currentY - startY;

        // Only allow dragging downward
        if (dy < 0) {
            panel.style.transform = '';
            return;
        }

        panel.style.transform = 'translateY(' + dy + 'px)';
        e.preventDefault();
    }

    function onTouchEnd() {
        if (!dragging) return;
        dragging = false;

        const dy = currentY - startY;
        const elapsed = Date.now() - startTime;
        const velocity = elapsed > 0 ? dy / elapsed : 0;
        const panelH = panel.offsetHeight;

        // Restore transition for snap/dismiss animation
        panel.style.transition = '';

        if (dy > panelH * THRESHOLD_RATIO || velocity > VELOCITY_THRESHOLD) {
            // Dismiss
            panel.style.transform = '';
            panel.classList.remove('open');
            if (options.onDismiss) options.onDismiss();
        } else {
            // Snap back
            panel.style.transform = '';
        }
    }

    panel.addEventListener('touchstart', onTouchStart, { passive: true });
    panel.addEventListener('touchmove', onTouchMove, { passive: false });
    panel.addEventListener('touchend', onTouchEnd, { passive: true });
}
