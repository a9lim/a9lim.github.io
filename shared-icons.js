/* ═══════════════════════════════════════════════
   shared-icons.js — Shared SVG icon library
   Single source of truth for all toolbar icons.
   Exposes window._ICON with SVG markup strings.

   Usage:
     Static:  <button data-icon="reset">       → auto-populated on DOMContentLoaded
     Dynamic: btn.innerHTML = _ICON.play;       → swap at runtime (safe: all strings are hardcoded)
     Compound: data-icon="theme"                → injects sun + moon with CSS classes
   ═══════════════════════════════════════════════ */

// eslint-disable-next-line no-unused-vars
var _ICON = (function () {
    'use strict';

    // Standard stroke-icon attributes
    var A = ' width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"';

    function s(d, a) { return '<svg' + (a || A) + '>' + d + '</svg>'; }

    // ── Reusable path fragments ──
    var SUN   = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
    var MOON  = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    var SUNF  = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="4" stroke="currentColor" stroke-width="3" stroke-linecap="square"/><line x1="12" y1="20" x2="12" y2="23" stroke="currentColor" stroke-width="3" stroke-linecap="square"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34" stroke="currentColor" stroke-width="3" stroke-linecap="square"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="3" stroke-linecap="square"/><line x1="1" y1="12" x2="4" y2="12" stroke="currentColor" stroke-width="3" stroke-linecap="square"/><line x1="20" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="3" stroke-linecap="square"/><line x1="4.22" y1="19.78" x2="6.34" y2="17.66" stroke="currentColor" stroke-width="3" stroke-linecap="square"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="3" stroke-linecap="square"/>';
    var FILL  = ' width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"';
    var MENU  = '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>';
    var ABOUT = '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>';
    var RESET = '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3.7 7.3"/><path d="M3 3v5h5"/>';
    var SAVE  = '<path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>';
    var LOAD  = '<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>';
    var CLOSE = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
    var PLUS  = '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>';
    var M20   = ' width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"';

    var icons = {
        // ── Simulation controls ──
        play:     s('<polygon points="5 3 19 12 5 21 5 3"/>'),
        pause:    s('<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'),
        step:     s('<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>'),
        reset:    s(RESET),

        // ── Theme (individual) ──
        sun:      s(SUN),
        moon:     s(MOON),

        // ── Theme (compound — multiple SVGs with CSS visibility classes) ──
        theme:     s(SUN, ' class="icon-sun"' + A) +
                   s(MOON, ' class="icon-moon"' + A),

        themeAuto: s('<circle cx="12" cy="12" r="5"/><path d="M12 7v10"/><path d="M12 7a5 5 0 0 0 0 10" fill="currentColor" opacity="0.25" stroke="none"/>', ' class="icon-auto"' + A) +
                   s(SUN, ' class="icon-sun"' + A) +
                   s(MOON, ' class="icon-moon"' + A),

        // ── Utility ──
        about:    s(ABOUT),
        menu:     s(MENU),
        gear:     s('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>'),

        // ── File operations ──
        save:     s(SAVE),
        load:     s(LOAD),

        // ── History ──
        undo:     s('<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1.7 9.3"/>'),
        redo:     s('<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L22.3 9.3"/>'),

        // ── Content tools ──
        search:   s('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
        download: s('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="14" x2="12" y2="3"/>'),
        speaker:  s('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>'),
        eye:      s('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
        copy:     s('<rect x="9" y="9" width="10" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>'),
        link:     s('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
        dice:     s('<rect x="1" y="1" width="22" height="22" rx="4"/><circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1.5" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>'),

        // ── Map tools (gerry) ──
        eraser:      s('<path d="M20 20H7L3 16c-.8-.8-.8-2 0-2.8L14.6 1.6c.8-.8 2-.8 2.8 0L21 5.2c.8.8.8 2 0 2.8L11 18"/><line x1="6" y1="20" x2="20" y2="20"/>'),
        trash:       s('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>'),
        move:        s('<polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/>'),
        autofill:    s('<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/>'),
        gerrymander: s('<path d="M4 4h6v6H4zM14 4h6v16h-6zM4 14h6v6H4z"/>'),
        fairDraw:    s('<path d="M12 3v18M3 12l4-4v8l-4-4M21 12l-4-4v8l4-4"/>'),
        chart:       s('<path d="M3 3v18h18M7 14l4-4 4 4 4-4"/>'),
        document:    s('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'),
        shuffle:     s('<path d="M16 3h5v5"/><path d="M4 20L20.3 3.7"/><path d="M21 16v5h-5"/><path d="M15 15l5.3 5.3"/><path d="M4 4l5 5"/>'),

        // ── Social ──
        github:   s('<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>'),
        twitter:  s('<path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>', ' width="18" height="18" viewBox="0 0 24 24" fill="currentColor"'),
        linkedin: s('<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>', ' width="18" height="18" viewBox="0 0 24 24" fill="currentColor"'),

        // ── Navigation ──
        backArrow: s('<path d="M19 12H6M12 19l-7-7 7-7"/>'),

        // ── Common UI ──
        close:    s(CLOSE),
        plus:     s(PLUS),
        minus:    s('<line x1="5" y1="12" x2="19" y2="12"/>'),
        fitView:  s('<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M20.3 3.7l-6.3 6.3"/><path d="M3.7 20.3l6.3-6.3"/>'),
        stop:     s('<rect x="4" y="4" width="16" height="16" rx="2"/>'),
        bookmark:       s('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>'),
        bookmarkFilled: s('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>', ' width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"'),

        // ── Toggle icons (small, filled, for toggle switches) ──
        togSun:  s(SUNF, FILL),
        togMoon: s(MOON, FILL),

        // ── Mode toggles (project-specific, kept inline for CSS/JS toggling) ──
        modeNormal:  s('<circle cx="12" cy="12" r="9"/><line x1="8" y1="12" x2="16" y2="12"/>', M20),

        modeCyano:   s('<line x1="6" y1="12" x2="17" y2="12"/><polyline points="14,8 18,12 14,16"/>', ' class="mode-fwd"' + M20) +
                     s('<line x1="7" y1="12" x2="18" y2="12"/><polyline points="10,8 6,12 10,16"/>', ' class="mode-rev"' + M20),

        modeShoals:  s('<polyline points="2,14 6,10 10,12 15.4,4.8"/><polyline points="12,4 16,4 16,8"/>', ' id="mode-icon-buy" width="20" height="18" viewBox="0 0 20 18"' + A.slice(A.indexOf(' fill'))) +
                     s('<polyline points="2,4 6,8 10,6 15.4,13.2"/><polyline points="12,14 16,14 16,10"/>', ' id="mode-icon-sell" width="20" height="18" viewBox="0 0 20 18"' + A.slice(A.indexOf(' fill')) + ' style="display:none"'),

        // ── Project icons (portfolio cards) ──
        projGeon:       '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><line x1="1" y1="12" x2="23" y2="12"/></svg>',
        projCyano:      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>',
        projGerry:      '<svg viewBox="0 0 24 24"><path d="M12 2l5.2 3v6L12 14 6.8 11V5zM6.8 11L1.6 14v6l5.2 3 5.2-3v-6M17.2 11l5.2 3v6l-5.2 3-5.2-3v-6"/></svg>',
        projShoals:     '<svg viewBox="0 0 24 24"><path d="M3 21V3"/><path d="M3 21h18"/><polyline points="3,17 7,13 11,15 15,9 19,5"/></svg>',
        projScripture:  '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
        projShannon:    '<svg viewBox="0 0 24 24"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1.07A7 7 0 0 1 14 22h-4a7 7 0 0 1-6.93-6H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/></svg>',
        projRaiko:      '<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
        projFaithful:   '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
        projCatppuccin: '<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',

        // ── Project card arrow ──
        projectArrow: '<svg viewBox="0 0 24 24"><path d="M7 17L16.3 7.7M17 7H7M17 7v10"/></svg>'
    };

    /**
     * Return icon markup at a custom size. Falls back to the standard icon if
     * the name isn't found. Safe: all markup is hardcoded, never user input.
     * @param {string} name - Icon name.
     * @param {number|string} size - Desired width/height in px.
     * @returns {string} SVG markup string.
     */
    icons.at = function (name, size) {
        var markup = icons[name] || '';
        if (!size || !markup) return markup;
        return markup.replace(/width="18"/g, 'width="' + size + '"')
                     .replace(/height="18"/g, 'height="' + size + '"');
    };

    // Auto-populate elements with data-icon attribute.
    // Safe: all markup is hardcoded above, never from user input.
    function init() {
        var els = document.querySelectorAll('[data-icon]');
        for (var i = 0; i < els.length; i++) {
            var name = els[i].getAttribute('data-icon');
            if (!icons[name]) continue;
            var markup = icons[name];
            var size = els[i].getAttribute('data-icon-size');
            if (size) {
                markup = markup.replace(/width="18"/g, 'width="' + size + '"')
                               .replace(/height="18"/g, 'height="' + size + '"');
            }
            els[i].textContent = '';
            els[i].insertAdjacentHTML('afterbegin', markup); // eslint-disable-line no-unsanitized/method
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    icons.init = init;
    return icons;
})();
