/* ═══════════════════════════════════════════════
   shared/icons.js — Shared SVG icon library
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
    var A = ' width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"';

    function s(d, a) { return '<svg aria-hidden="true"' + (a || A) + '>' + d + '</svg>'; }

    // ── Reusable path fragments ──
    var SUN   = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="1" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="23" y2="12"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/>';
    var MOON  = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    var SUNF  = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="1" y1="12" x2="5" y2="12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="19" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="4.22" y1="19.78" x2="6.34" y2="17.66" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>';
    var FILL  = ' width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"';
    var MENU  = '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="17" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>';
    var ABOUT = '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>';
    var RESET = '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3,3 3,8 8,8"/>';
    var SAVE  = '<path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>';
    var LOAD  = '<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>';
    var CLOSE = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
    var PLUS  = '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>';
    var M20   = ' width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"';

    var icons = {
        // ── Simulation controls ──
        play:     s('<polygon points="6,3 20,12 6,21"/>'),
        pause:    s('<rect x="5" y="3" width="5" height="18"/><rect x="14" y="3" width="5" height="18"/>'),
        step:     s('<polygon points="5,4 15,12 5,20"/><line x1="19" y1="4" x2="19" y2="20"/><line x1="18" y1="12" x2="20" y2="12" stroke-width="1" opacity="0.4"/>'),
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
        search:   s('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="17" y2="17"/><line x1="9" y1="11" x2="13" y2="11" stroke-width="1" opacity="0.4"/><line x1="11" y1="9" x2="11" y2="13" stroke-width="1" opacity="0.4"/>'),
        download: s('<path d="M21 15v4H3v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="14" x2="12" y2="3"/>'),
        speaker:  s('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>'),
        eye:      s('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="7" x2="12" y2="8" stroke-width="1" opacity="0.4"/><line x1="12" y1="16" x2="12" y2="17" stroke-width="1" opacity="0.4"/>'),
        copy:     s('<rect x="9" y="9" width="10" height="11"/><path d="M5 15V5h10"/>'),
        link:     s('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
        dice:     s('<rect x="1" y="1" width="22" height="22"/><rect x="6.5" y="6.5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="14.5" y="6.5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="6.5" y="14.5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="14.5" y="14.5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="10.5" y="10.5" width="3" height="3" fill="currentColor" stroke="none"/>'),

        // ── Map tools ──
        eraser:      s('<path d="M20 20H7L3 16c-.8-.8-.8-2 0-2.8L14.6 1.6c.8-.8 2-.8 2.8 0L21 5.2c.8.8.8 2 0 2.8L11 18"/><line x1="6" y1="20" x2="20" y2="20"/>'),
        trash:       s('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>'),
        move:        s('<polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/>'),
        autofill:    s('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/><line x1="12" y1="2" x2="12" y2="4" stroke-width="1" opacity="0.4"/><line x1="12" y1="20" x2="12" y2="22" stroke-width="1" opacity="0.4"/><line x1="2" y1="12" x2="4" y2="12" stroke-width="1" opacity="0.4"/><line x1="20" y1="12" x2="22" y2="12" stroke-width="1" opacity="0.4"/>'),
        chart:       s('<path d="M3 3v18h18M7 14l4-4 4 4 4-4"/>'),
        document:    s('<path d="M14 2H4v20h16V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>'),
        shuffle:     s('<path d="M16 3h5v5"/><path d="M4 20L20.3 3.7"/><path d="M21 16v5h-5"/><path d="M15 15l5.3 5.3"/><path d="M4 4l5 5"/>'),

        // ── Social ──
        mail:     s('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/>'),
        github:   s('<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>'),
        twitter:  s('<path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>', ' width="18" height="18" viewBox="0 0 24 24" fill="currentColor"'),
        discord:  s('<path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.128 12.299 12.299 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.42 0-1.333.956-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.419 0 1.334-.956 2.42-2.157 2.42zm7.974 0c-1.183 0-2.157-1.085-2.157-2.42 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.419 0 1.334-.946 2.42-2.157 2.42z"/>', ' width="18" height="18" viewBox="0 0 24 24" fill="currentColor"'),
        linkedin: s('<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>', ' width="18" height="18" viewBox="0 0 24 24" fill="currentColor"'),

        // ── Navigation ──
        backArrow: s('<path d="M19 12H6M12 19l-7-7 7-7"/>'),

        // ── Common UI ──
        close:    s(CLOSE),
        plus:     s(PLUS),
        minus:    s('<line x1="5" y1="12" x2="19" y2="12"/>'),
        fitView:  s('<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M20.3 3.7l-6.3 6.3"/><path d="M3.7 20.3l6.3-6.3"/>'),
        stop:     s('<rect x="4" y="4" width="16" height="16"/>'),
        bookmark:       s('<path d="M19 21l-7-5-7 5V3h14z"/>'),
        bookmarkFilled: s('<path d="M19 21l-7-5-7 5V3h14z"/>', ' width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"'),

        // ── Toggle icons (small, filled, for toggle switches) ──
        togSun:  s(SUNF, FILL),
        togMoon: s(MOON, FILL),

        // ── Mode toggles (project-specific, kept inline for CSS/JS toggling) ──
        modeNormal:  s('<circle cx="12" cy="12" r="9"/><line x1="8" y1="12" x2="16" y2="12"/>', M20),

        modeLumen:   s('<line x1="6" y1="12" x2="17" y2="12"/><polyline points="14,8 18,12 14,16"/>', ' class="mode-fwd"' + M20) +
                     s('<line x1="7" y1="12" x2="18" y2="12"/><polyline points="10,8 6,12 10,16"/>', ' class="mode-rev"' + M20),

        modeShoals:  s('<polyline points="2,14 6,10 10,10 15,5"/><polyline points="12,4 16,4 16,8"/>', ' id="mode-icon-buy" width="20" height="18" viewBox="0 0 20 18"' + A.slice(A.indexOf(' fill'))) +
                     s('<polyline points="2,4 6,8 10,8 15,13"/><polyline points="12,14 16,14 16,10"/>', ' id="mode-icon-sell" width="20" height="18" viewBox="0 0 20 18"' + A.slice(A.indexOf(' fill')) + ' style="display:none"'),

        // ── The seal (a9l.im's mark), in currentColor ──
        seal: '<svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 360 360" fill="currentColor"><path transform="matrix(0.93,0,0,-0.93,-117.19,320.32)" d="M 319.6 344.4 L 126 203.8 L 199.9 -23.7 L 439.2 -23.7 L 513.1 203.8 L 319.6 344.4 z M 315.6 247.3 C 316.1 247.3 316.7 247.2 317.5 247.1 C 319.2 246.9 321 246.1 323 244.7 C 328.4 241.3 331.9 238.4 333.8 235.9 C 335.5 233.6 337 229.7 338.1 224.3 L 340.2 214.5 L 352 213.9 C 359.8 213.7 364.4 212.5 366 210.3 C 367.8 208.1 368.2 206.4 367.2 205 C 366.2 203.7 363 201.6 357.6 198.7 C 346.5 192.2 340.3 186.7 339.1 181.9 C 338.6 179.6 339.5 178.1 342 177.5 C 344 176.9 346.6 175.8 349.8 174.4 C 352 173.3 353.3 172.4 353.7 171.5 C 354.1 170.6 354.3 168.9 354.2 166.2 C 353.7 162.3 352.1 157.8 349.2 152.5 C 347.3 148.7 346.2 146 346 144.3 C 345.7 142.7 346.1 139.7 347 135.2 C 348.8 128.1 351.4 119.4 354.7 108.9 C 358 98.6 360.4 91.8 362 88.4 C 363.7 84.3 365 79.5 365.8 74.1 C 366.2 69.5 365.7 66.5 364.3 65.1 C 363 63.8 360.2 63.4 355.9 64.1 C 353 64.5 350.4 65.6 348.1 67.4 C 345.9 69.5 342.4 73.7 337.5 80.1 C 337.5 80.4 337.1 80.8 336.5 81.3 C 328.2 92.7 322.9 98.9 320.7 99.8 C 318.5 100.7 315.1 98 310.5 91.9 C 310.2 91.6 307.9 88.7 303.5 83.1 C 299 77.5 296.7 70.7 296.3 62.9 C 296.2 60.6 295.9 58.9 295.2 57.9 C 294.4 57.1 293.2 56.4 291.5 55.9 C 289.5 55.4 288 55.4 287 56 C 286.1 56.6 284.7 58 282.9 60.3 C 280.4 64.2 278.1 69 275.9 74.5 C 274.2 79.3 272.6 81.6 271.4 81.4 C 270.1 81.4 268.5 79 266.6 74.2 C 264.9 69.5 262.5 64.5 259.3 59.2 C 257.3 55.7 255.9 53.6 255.1 52.9 C 254.2 52.3 253.1 52.4 251.6 53.1 C 249.4 54.5 247.3 57.3 245.4 61.4 C 244.2 64 243.5 65.9 243.3 67.2 C 243.3 68.7 243.7 70.4 244.6 72.5 C 247 77.7 250.2 87.8 254.1 102.6 C 258 117.5 260.3 128.4 261.1 135.3 C 261.6 139.1 261.7 141.4 261.4 142.3 C 261.2 143.3 260.5 143.8 259.3 144 C 257.5 144 254.2 141.9 249.6 137.7 C 240.5 128.8 231.3 126.5 222.2 130.6 C 215.5 133.6 212.6 136.1 213.5 138.1 C 213.8 138.7 214.3 139.1 214.9 139.2 C 216.8 139.7 222.1 143.9 230.8 151.6 C 245.2 164.2 252.8 171.5 253.6 173.5 C 254.2 174.8 253.9 180.3 252.7 189.8 C 251.4 199.5 250 207.2 248.5 212.8 C 247.2 217.7 247.2 220.4 248.6 220.8 C 249.9 221.1 251.9 220.6 254.4 219.1 C 257.1 217.9 259.4 216.3 261.3 214.6 C 263 212.7 264.5 209.1 266 203.7 C 267.5 198.5 267.9 195.5 267.1 194.7 C 266 193.5 265.7 192.2 266.5 190.8 C 267.2 189.3 268.3 188.8 269.8 189.2 C 271.7 189.7 273.6 191.2 275.5 193.7 C 277.5 196.1 280.8 197.3 285.4 197.6 C 289.9 198 293.9 197.2 297.6 195.2 C 301.1 193 303.2 190.7 303.9 188.2 C 304.5 185.8 303.5 184 300.6 182.9 C 297.5 181.6 294.2 179.6 290.6 177 C 287.1 174.6 284.4 172.2 282.4 169.9 C 280.6 167.6 280 166 280.8 165 C 281.6 164.3 282 161.6 281.9 157 C 282 152.4 282.3 149.9 282.9 149.6 C 283.7 149.3 285.3 151.2 287.8 155.3 C 290.5 159.5 294.5 163.2 299.9 166.4 C 305.3 169.5 310.8 173.6 316.4 178.5 C 322 183.6 324.9 187 325 188.7 C 325.3 190.6 324.4 198.6 322.2 212.9 C 320.1 227.3 318.2 235.4 316.4 237.2 C 314.8 239.1 313.6 241.1 313.1 243.2 C 312.4 245.8 313.2 247.2 315.6 247.3 z M 326.8 162.1 C 326 162.1 324.2 160.7 321.7 157.7 C 319.3 155 316.3 153.1 312.6 152.1 C 309.1 151.2 305.6 151.3 302.3 152.6 C 299.2 154 297.1 154.6 296.2 154.4 C 295.1 154.1 293.4 151.3 291 146.1 C 288.6 140.8 286.7 135.4 285.1 129.7 C 283.4 123.6 282.6 119.2 282.7 116.5 C 282.7 113.8 283.9 107.4 286.3 97.2 C 289.4 83.6 291.4 76.6 292.5 76.2 C 293.4 75.9 296 79.3 300.4 86.2 C 304.8 93.1 306.8 97.2 306.5 98.4 C 306.2 99.4 307 101.6 308.9 105.2 C 310.7 108.8 315 116.2 321.7 127.4 C 325.9 134.4 328.5 140.1 329.5 144.3 C 330.6 148.5 330.6 152.9 329.4 157.3 C 328.6 160.6 327.7 162.2 326.9 162.1 C 326.9 162.1 326.9 162.1 326.8 162.1 z M 381.9 141.1 C 385.3 141 390.3 140.4 396.7 139.1 C 409.8 136.4 421.6 132.2 432.3 126.7 C 436.5 124.7 438.8 121.6 439.2 117.5 C 439.6 113.5 437.9 110.3 434.1 108 C 430.5 105.5 422 107.4 408.7 113.5 C 404 115.7 397.5 118.3 389.1 121.3 C 380.8 124.3 374.8 126.2 371.4 126.9 C 368.4 127.6 364 129.4 358.1 132.2 C 352.2 135.1 349.9 136.6 351 136.7 C 352 137 357.5 138 367.2 139.6 C 373.5 140.8 378.4 141.3 381.9 141.1 z M 335.3 121.8 C 334.1 121.8 331.4 119.5 327.2 114.8 C 323 109.9 321 106.8 321.3 105.6 C 321.8 103.8 325.6 101.2 332.8 97.8 C 342.3 93.5 346.8 92.1 346.2 93.8 L 345.1 95 C 344.3 95.7 342.6 100.3 340.2 108.7 C 338 117.1 336.4 121.5 335.5 121.7 C 335.4 121.8 335.4 121.8 335.3 121.8 z"/></svg>',

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
