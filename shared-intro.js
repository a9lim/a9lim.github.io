/* ═══════════════════════════════════════════════
   shared-intro.js — Intro screen dismiss utility
   Shared across sim projects for consistent intro-screen
   dismissal with app-ready gating and haptic feedback.
   ═══════════════════════════════════════════════ */

// eslint-disable-next-line no-unused-vars
var _intro = (function () {
    'use strict';

    /**
     * Wire an intro screen dismiss button. On click:
     * 1. Adds 'hidden' class to introEl (triggers CSS fade-out)
     * 2. Adds 'app-ready' class to body (gates entrance animations)
     * 3. Fires 'medium' haptic
     * 4. Calls onDismiss callback (e.g. auto-open sidebar)
     * 5. After 850ms, sets display:none on introEl
     *
     * @param {HTMLElement} introEl  The intro screen overlay element.
     * @param {HTMLElement} startBtn The CTA button that dismisses the intro.
     * @param {function} [onDismiss] Called after dismiss animation starts.
     */
    function init(introEl, startBtn, onDismiss) {
        if (!introEl || !startBtn) return;
        startBtn.addEventListener('click', function () {
            introEl.classList.add('hidden');
            document.body.classList.add('app-ready');
            if (typeof _haptics !== 'undefined') _haptics.trigger('medium');
            if (onDismiss) onDismiss();
            setTimeout(function () { introEl.style.display = 'none'; }, 850);
        });
    }

    return { init: init };
})();
