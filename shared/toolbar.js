/* ═══════════════════════════════════════════════
   shared/toolbar.js — Toolbar strip utilities of the pre-overhaul sims:
   play/pause and speed buttons, the sidebar toggle. The theme forwards to
   shared/colophon.js. Delete this file with shared/hud.css when the last
   sim moves to the colophon (docs/sim-overhaul/PLAN.md).
   ═══════════════════════════════════════════════ */

// eslint-disable-next-line no-unused-vars
var _toolbar = (function () {
    'use strict';

    // ── Play / Pause ──
    // Uses _ICON from shared/icons.js (must be loaded first).
    // Safe: _ICON contains only hardcoded SVG markup, never user input.

    function updatePlayBtn(btn, playing) {
        btn.setAttribute('aria-label', playing ? 'Pause simulation' : 'Play simulation');
        btn.title = playing ? 'Pause' : 'Play';
        var markup = playing ? _ICON.pause : _ICON.play;
        btn.textContent = '';
        btn.insertAdjacentHTML('afterbegin', markup);
        btn.classList.toggle('playing', playing);
    }

    // ── Speed ──

    /**
     * Update a speed button's label and title.
     * @param {HTMLElement} btn - The speed button element (must contain a .speed-label span).
     * @param {number} speed - The current speed multiplier value.
     */
    function updateSpeedBtn(btn, speed) {
        var label = btn.querySelector('.speed-label');
        if (label) label.textContent = speed + 'x';
        btn.title = 'Speed: ' + speed + 'x';
    }

    // ── Sidebar ──

    /**
     * Toggle sidebar panel open/closed. Updates active class and aria-expanded.
     * @param {HTMLElement} toggleBtn - The sidebar toggle button.
     * @param {HTMLElement} panel - The sidebar panel element.
     * @returns {boolean} Whether the panel is now open.
     */
    function toggleSidebar(toggleBtn, panel) {
        panel.classList.toggle('open');
        var isOpen = panel.classList.contains('open');
        if (toggleBtn) {
            toggleBtn.classList.toggle('active', isOpen);
            toggleBtn.setAttribute('aria-expanded', String(isOpen));
        }
        return isOpen;
    }

    /**
     * Force-close a sidebar panel.
     * @param {HTMLElement} toggleBtn - The sidebar toggle button.
     * @param {HTMLElement} panel - The sidebar panel element.
     */
    function closeSidebar(toggleBtn, panel) {
        panel.classList.remove('open');
        if (toggleBtn) {
            toggleBtn.classList.remove('active');
            toggleBtn.setAttribute('aria-expanded', 'false');
        }
    }

    /**
     * Full sidebar setup: toggle button, close button, swipe dismiss, optional desktop auto-open.
     * @param {HTMLElement} toggleBtn - The sidebar toggle button.
     * @param {HTMLElement} panel - The sidebar panel element.
     * @param {HTMLElement} [closeBtn] - Optional close/X button inside the panel.
     * @param {Object} [opts]
     * @param {function} [opts.onToggle] - Called with isOpen boolean after any open/close.
     * @param {boolean} [opts.openOnDesktop=true] - Auto-open when viewport > 900px. Set false to disable.
     */
    function initSidebar(toggleBtn, panel, closeBtn, opts) {
        var onToggle = (opts && opts.onToggle) || null;

        toggleBtn.addEventListener('click', function () {
            var isOpen = toggleSidebar(toggleBtn, panel);
            if (typeof _haptics !== 'undefined') _haptics.trigger('light');
            if (onToggle) onToggle(isOpen);
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                closeSidebar(toggleBtn, panel);
                if (typeof _haptics !== 'undefined') _haptics.trigger('light');
                if (onToggle) onToggle(false);
            });
        }

        // Swipe-to-dismiss on mobile bottom sheet
        if (typeof initSwipeDismiss === 'function') {
            initSwipeDismiss(panel, {
                onDismiss: function () {
                    closeSidebar(toggleBtn, panel);
                    if (onToggle) onToggle(false);
                }
            });
        }

        // Auto-open on desktop (default true), animated via double-rAF
        if (!(opts && opts.openOnDesktop === false) && window.innerWidth > 900) {
            var openAnimated = function () {
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        panel.classList.add('open');
                        toggleBtn.classList.add('active');
                        toggleBtn.setAttribute('aria-expanded', 'true');
                        if (onToggle) onToggle(true);
                    });
                });
            };
            if (document.body.classList.contains('app-ready')) {
                openAnimated();
            } else {
                var obs = new MutationObserver(function (mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                        if (document.body.classList.contains('app-ready')) {
                            obs.disconnect();
                            openAnimated();
                            return;
                        }
                    }
                });
                obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
            }
        }
    }

    return {
        updatePlayBtn: updatePlayBtn,
        updateSpeedBtn: updateSpeedBtn,
        // The theme lives in shared/colophon.js, which loads first.
        initTheme: _colophon.initTheme,
        toggleTheme: _colophon.toggleTheme,
        toggleSidebar: toggleSidebar,
        closeSidebar: closeSidebar,
        initSidebar: initSidebar
    };
})();