/* ═══════════════════════════════════════════════
   shared/colophon.js — The colophon, the figure caption, and the theme
   Every sim sets its seal and name at the top left, in the same size and
   place, with play, step, theme and help beside them; everything else is the
   sim's own. Under its scene each sim keeps a live figure caption that says
   what you are looking at, with current values (docs/sim-overhaul/PLAN.md).

   Markup (the sim writes it; icons fill in from shared/icons.js):
     <header class="colophon">
       <a class="colophon-seal" href="/" title="a9l.im" data-icon="seal" data-icon-size="24"></a>
       <h1 class="colophon-name">Worldline</h1>
       <div class="colophon-tools" role="toolbar" aria-label="Simulation">
         <button class="colophon-btn" data-colophon="play"></button>
         <button class="colophon-btn" data-colophon="step" data-icon="step"></button>
         <button class="colophon-btn" data-colophon="theme" data-icon="theme"></button>
         <button class="colophon-btn" data-colophon="help" data-icon="about"></button>
       </div>
     </header>
     <p class="caption"><span class="caption-n">Fig.</span> <span id="…"></span></p>

   The root site uses the theme functions alone.
   ═══════════════════════════════════════════════ */

// eslint-disable-next-line no-unused-vars
var _colophon = (function () {
    'use strict';

    // Simulation canvases draw Greek, operators and arrows that only the STIX
    // Two fallback faces carry; start loading them before the first frame.
    if (document.body && document.body.classList.contains('sim-body') && typeof _loadTextFonts === 'function') {
        _loadTextFonts();
    }

    // ── Theme ──

    /** Set <meta name="theme-color"> to the current canvas color (Safari/iOS status bar). */
    function syncThemeColor() {
        var theme = document.documentElement.dataset.theme || 'light';
        var color = (typeof _PALETTE !== 'undefined' && _PALETTE[theme])
            ? _PALETTE[theme].canvas
            : (theme === 'dark' ? '#121111' : '#FCFCFB');
        var meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'theme-color';
            document.head.appendChild(meta);
        }
        meta.content = color;
    }

    /**
     * Read the saved theme or the system preference and set data-theme on <html>.
     * Follows later system changes while nothing is saved.
     * @param {string} [storageKey] - localStorage key; omit to skip persistence.
     * @param {function} [onChange] - Called with the new theme after an automatic change.
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
        syncThemeColor();
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            if (storageKey) {
                try { if (localStorage.getItem(storageKey)) return; } catch (ex) { /* ignore */ }
            }
            document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
            syncThemeColor();
            if (onChange) onChange(document.documentElement.dataset.theme);
        });
    }

    /**
     * Flip data-theme between light and dark, persisting it if storageKey is given.
     * @param {string} [storageKey]
     * @returns {string} The new theme.
     */
    function toggleTheme(storageKey) {
        var html = document.documentElement;
        var next = html.dataset.theme === 'dark' ? 'light' : 'dark';
        html.dataset.theme = next;
        if (storageKey) {
            try { localStorage.setItem(storageKey, next); } catch (e) { /* ignore */ }
        }
        syncThemeColor();
        return next;
    }

    // ── Colophon ──

    function setPlayIcon(btn, playing) {
        if (!btn) return;
        btn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
        btn.title = playing ? 'Pause (Space)' : 'Play (Space)';
        btn.textContent = '';
        btn.insertAdjacentHTML('afterbegin', playing ? _ICON.pause : _ICON.play); // eslint-disable-line no-unsanitized/method
        btn.setAttribute('aria-pressed', String(!playing));
    }

    /**
     * Wire the page's .colophon. Each handler is optional; a button whose
     * handler is missing is removed, so a sim with no step loses that button.
     * @param {Object} opts
     * @param {string} [opts.themeKey] - localStorage key for the theme.
     * @param {function} [opts.onTheme] - Called with the theme after any change.
     * @param {function} [opts.onPlay] - Toggles running; returns the new state.
     * @param {boolean} [opts.playing] - Initial running state.
     * @param {function} [opts.onStep]
     * @param {function} [opts.onHelp]
     * @returns {{ el: HTMLElement, setPlaying: function(boolean) }}
     */
    function mount(opts) {
        opts = opts || {};
        var el = document.querySelector('.colophon');
        var btn = function (name) { return el ? el.querySelector('[data-colophon="' + name + '"]') : null; };
        var tap = function () { if (typeof _haptics !== 'undefined') _haptics.trigger('light'); };

        initTheme(opts.themeKey, opts.onTheme);

        var wire = function (name, handler, label) {
            var b = btn(name);
            if (!b) return null;
            if (!handler) { b.remove(); return null; }
            if (label) { b.setAttribute('aria-label', label); if (!b.title) b.title = label; }
            b.type = 'button';
            b.addEventListener('click', function () { tap(); handler(); });
            return b;
        };

        var playBtn = wire('play', opts.onPlay && function () { setPlayIcon(playBtn, opts.onPlay()); });
        setPlayIcon(playBtn, opts.playing !== false);
        wire('step', opts.onStep, 'Step');
        wire('theme', function () {
            var t = toggleTheme(opts.themeKey);
            if (opts.onTheme) opts.onTheme(t);
        }, 'Light or dark');
        wire('help', opts.onHelp, 'About and shortcuts (?)');

        return {
            el: el,
            setPlaying: function (playing) { setPlayIcon(playBtn, playing); },
        };
    }

    // ── Caption ──

    /**
     * A setter for a live caption. It writes only when the text changes, at most
     * every minInterval ms unless forced, so a sim can call it every frame.
     * @param {HTMLElement} el - The element whose text is the caption.
     * @param {number} [minInterval=200]
     * @returns {function(string, boolean=)}
     */
    function caption(el, minInterval) {
        var gap = minInterval == null ? 200 : minInterval;
        var last = 0, text = '';
        return function (t, force) {
            if (!el) return;
            var now = performance.now();
            if (!force && now - last < gap) return;
            last = now;
            if (t !== text) { text = t; el.textContent = t; }
        };
    }

    return {
        initTheme: initTheme,
        toggleTheme: toggleTheme,
        syncThemeColor: syncThemeColor,
        mount: mount,
        setPlayIcon: setPlayIcon,
        caption: caption,
    };
})();
