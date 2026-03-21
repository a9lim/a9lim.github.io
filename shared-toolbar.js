/* ═══════════════════════════════════════════════
   shared-toolbar.js — Toolbar button utilities
   Shared across all projects for consistent toolbar controls:
   play/pause, speed, theme toggle, sidebar toggle.
   ═══════════════════════════════════════════════ */

// eslint-disable-next-line no-unused-vars
var _toolbar = (function () {
    'use strict';

    var NS = 'http://www.w3.org/2000/svg';
    var _playSvg = null;
    var _pauseSvg = null;

    function _svg() {
        var svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('width', '18');
        svg.setAttribute('height', '18');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        return svg;
    }

    function _getPlaySvg() {
        if (_playSvg) return _playSvg;
        var svg = _svg();
        var poly = document.createElementNS(NS, 'polygon');
        poly.setAttribute('points', '5 3 19 12 5 21 5 3');
        svg.appendChild(poly);
        _playSvg = svg;
        return svg;
    }

    function _getPauseSvg() {
        if (_pauseSvg) return _pauseSvg;
        var svg = _svg();
        var coords = [[6, 4, 4, 16], [14, 4, 4, 16]];
        for (var i = 0; i < coords.length; i++) {
            var rect = document.createElementNS(NS, 'rect');
            rect.setAttribute('x', coords[i][0]);
            rect.setAttribute('y', coords[i][1]);
            rect.setAttribute('width', coords[i][2]);
            rect.setAttribute('height', coords[i][3]);
            svg.appendChild(rect);
        }
        _pauseSvg = svg;
        return svg;
    }

    // ── Play / Pause ──

    /**
     * Update a play/pause button's icon and accessibility attributes.
     * @param {HTMLElement} btn - The play/pause button element.
     * @param {boolean} playing - Whether the simulation is currently playing.
     */
    function updatePlayBtn(btn, playing) {
        btn.setAttribute('aria-label', playing ? 'Pause simulation' : 'Play simulation');
        btn.title = playing ? 'Pause' : 'Play';
        btn.textContent = '';
        btn.appendChild((playing ? _getPauseSvg() : _getPlaySvg()).cloneNode(true));
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

    // ── Theme ──

    /**
     * Read saved theme or system preference and set data-theme on <html>.
     * Wires a system-preference change listener (only fires when no explicit save).
     * @param {string} [storageKey] - localStorage key for persistence. Omit to skip persistence.
     * @param {function} [onChange] - Called with the new theme string after any automatic change.
     */
    function initTheme(storageKey, onChange) {
        var saved = null;
        if (storageKey) {
            try { saved = localStorage.getItem(storageKey); } catch (e) { /* ignore */ }
        }
        if (saved === 'dark' || saved === 'light') {
            document.documentElement.dataset.theme = saved;
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.dataset.theme = 'dark';
        }
        // Follow system preference when user hasn't made an explicit choice
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            if (storageKey) {
                try { if (localStorage.getItem(storageKey)) return; } catch (ex) { /* ignore */ }
            }
            document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
            if (onChange) onChange(document.documentElement.dataset.theme);
        });
    }

    /**
     * Toggle data-theme between light/dark and persist if storageKey given.
     * @param {string} [storageKey] - localStorage key for persistence.
     * @returns {string} The new theme ('light' or 'dark').
     */
    function toggleTheme(storageKey) {
        var html = document.documentElement;
        var next = html.dataset.theme === 'dark' ? 'light' : 'dark';
        html.dataset.theme = next;
        if (storageKey) {
            try { localStorage.setItem(storageKey, next); } catch (e) { /* ignore */ }
        }
        return next;
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
     * @param {boolean} [opts.openOnDesktop] - If true, auto-open when viewport > 900px.
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

        // Auto-open on desktop
        if (opts && opts.openOnDesktop && window.innerWidth > 900) {
            panel.classList.add('open');
            toggleBtn.classList.add('active');
            toggleBtn.setAttribute('aria-expanded', 'true');
            if (onToggle) onToggle(true);
        }
    }

    return {
        updatePlayBtn: updatePlayBtn,
        updateSpeedBtn: updateSpeedBtn,
        initTheme: initTheme,
        toggleTheme: toggleTheme,
        toggleSidebar: toggleSidebar,
        closeSidebar: closeSidebar,
        initSidebar: initSidebar
    };
})();