/* ═══════════════════════════════════════════════
   shared-info.js — Info tip popover system for the
   three a9l.im simulation projects.
   Desktop: hover/focus to show. Mobile: tap to toggle.
   Renders KaTeX math in body if KaTeX is loaded.
   ═══════════════════════════════════════════════ */

/**
 * Attach an info tip popover to a trigger element (typically a "?" button).
 *
 * On desktop (fine pointer): show on mouseenter/focus, hide on mouseleave/blur.
 * On mobile (coarse pointer): tap toggles visibility; includes a close button
 * and dismisses on outside tap.
 *
 * @param {HTMLElement} triggerEl  Element that opens the popover
 * @param {Object} opts
 * @param {string} opts.title        Popover heading
 * @param {string} opts.body         HTML body (KaTeX-rendered if available)
 * @param {number} [opts.maxWidth=280]
 * @returns {Function} Cleanup function (removes listeners and popover DOM)
 */
function createInfoTip(triggerEl, opts) {
    if (!opts) opts = {};
    var maxWidth = opts.maxWidth || 280;
    var popover = null;
    // Checked once at init — pointer type doesn't change mid-session in practice
    var isCoarse = window.matchMedia('(pointer: coarse)').matches;
    var outsideHandler = null;

    function buildPopover() {
        var el = document.createElement('div');
        el.className = 'info-popover';
        el.setAttribute('role', 'tooltip');
        el.style.maxWidth = maxWidth + 'px';

        var id = 'info-' + Math.random().toString(36).slice(2, 9);
        el.id = id;
        triggerEl.setAttribute('aria-describedby', id);

        if (opts.title) {
            var titleEl = document.createElement('div');
            titleEl.className = 'info-popover-title';
            titleEl.innerHTML = opts.title; // trusted project-defined HTML, not user input
            el.appendChild(titleEl);
        }

        if (opts.body) {
            var bodyEl = document.createElement('div');
            bodyEl.className = 'info-popover-body';
            bodyEl.innerHTML = opts.body; // trusted project-defined HTML, not user input
            el.appendChild(bodyEl);
        }

        // KaTeX is only loaded by projects that need it; guard avoids ReferenceError
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(el, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false }
                ],
                throwOnError: false
            });
        }

        if (isCoarse) {
            var closeBtn = document.createElement('button');
            closeBtn.className = 'info-popover-close';
            closeBtn.setAttribute('aria-label', 'Close');
            closeBtn.innerHTML = '&#215;';
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                hide();
            });
            el.appendChild(closeBtn);
        }

        return el;
    }

    /**
     * Position the popover relative to the trigger.
     * Prefers above; falls back to below if insufficient space.
     * Clamps horizontally and vertically to keep 8px viewport margin.
     */
    function position(el) {
        var rect = triggerEl.getBoundingClientRect();
        var vw = window.innerWidth;
        var vh = window.innerHeight;

        // Append hidden to measure actual dimensions before final placement
        el.style.visibility = 'hidden';
        el.style.display = '';
        document.body.appendChild(el);
        var pw = el.offsetWidth;
        var ph = el.offsetHeight;

        var above = rect.top - ph - 8 > 0;
        var top = above ? rect.top - ph - 8 : rect.bottom + 8;
        // Center horizontally on trigger
        var left = rect.left + rect.width / 2 - pw / 2;

        if (left < 8) left = 8;
        if (left + pw > vw - 8) left = vw - 8 - pw;
        if (top < 8) top = 8;
        if (top + ph > vh - 8) top = vh - 8 - ph;

        el.style.position = 'fixed';
        el.style.top = top + 'px';
        el.style.left = left + 'px';
        el.style.visibility = '';
        // CSS class controls arrow direction
        el.classList.toggle('info-popover-below', !above);
    }

    function show() {
        if (popover) return;
        popover = buildPopover();
        position(popover);
        // rAF ensures initial state is painted before transition class triggers fade-in
        requestAnimationFrame(function() {
            if (popover) popover.classList.add('info-popover-visible');
        });

        if (isCoarse) {
            outsideHandler = function(e) {
                if (popover && !popover.contains(e.target) && e.target !== triggerEl) {
                    hide();
                }
            };
            // Deferred to next tick so the opening tap doesn't immediately dismiss
            setTimeout(function() {
                document.addEventListener('click', outsideHandler, true);
            }, 0);
        }
    }

    function hide() {
        if (!popover) return;
        triggerEl.removeAttribute('aria-describedby');
        popover.classList.remove('info-popover-visible');
        var el = popover;
        popover = null;
        // 200ms matches CSS fade-out transition before DOM removal
        setTimeout(function() {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 200);

        if (outsideHandler) {
            document.removeEventListener('click', outsideHandler, true);
            outsideHandler = null;
        }
    }

    if (isCoarse) {
        triggerEl.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (popover) hide();
            else show();
        });
    } else {
        triggerEl.addEventListener('mouseenter', show);
        triggerEl.addEventListener('mouseleave', hide);
        triggerEl.addEventListener('focus', show);
        triggerEl.addEventListener('blur', hide);
    }

    return function cleanup() {
        hide();
        if (isCoarse) {
            // Anonymous click listener on triggerEl can't be removed, but the
            // popover is destroyed and outsideHandler is cleaned up — safe to leak
        } else {
            triggerEl.removeEventListener('mouseenter', show);
            triggerEl.removeEventListener('mouseleave', hide);
            triggerEl.removeEventListener('focus', show);
            triggerEl.removeEventListener('blur', hide);
        }
    };
}

/**
 * Register info tips for all .info-trigger[data-info] elements on the page.
 * Each trigger's data-info attribute is looked up in the data object.
 * @param {Object} data  Map of key → { title, body } objects.
 */
function registerInfoTips(data) {
    if (typeof createInfoTip !== 'function') return;
    var triggers = document.querySelectorAll('.info-trigger[data-info]');
    for (var i = 0; i < triggers.length; i++) {
        var key = triggers[i].dataset.info;
        if (data[key]) createInfoTip(triggers[i], data[key]);
    }
}

/**
 * Initialize a reference overlay with KaTeX rendering and dismiss controls.
 * Caches rendered HTML per key so KaTeX cost is paid only on first open.
 * Content is trusted static HTML from project-defined reference.js files (not user input).
 * @param {HTMLElement} overlayEl  The overlay container.
 * @param {HTMLElement} titleEl    Element for the reference title.
 * @param {HTMLElement} bodyEl     Element for the reference body content.
 * @param {HTMLElement} closeBtn   Close button.
 * @param {Object} referenceData   Map of key → { title, body } (trusted HTML).
 * @returns {function} openReference(key) — call to open a reference by key.
 */
function initReferenceOverlay(overlayEl, titleEl, bodyEl, closeBtn, referenceData) {
    if (!overlayEl) return function() {};
    var cache = {};

    function openReference(key) {
        var ref = referenceData[key];
        if (!ref) return;
        titleEl.textContent = ref.title;
        if (cache[key]) {
            // Trusted cached content from reference.js — not user input
            bodyEl.innerHTML = cache[key];
        } else {
            // Trusted static content from reference.js — not user input
            bodyEl.innerHTML = ref.body;
            if (typeof renderMathInElement === 'function') {
                renderMathInElement(bodyEl, { delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false }
                ]});
            }
            cache[key] = bodyEl.innerHTML;
        }
        overlayEl.hidden = false;
    }

    if (typeof initOverlayDismiss === 'function') {
        initOverlayDismiss(overlayEl, closeBtn);
    } else {
        closeBtn.addEventListener('click', function() { overlayEl.hidden = true; });
        overlayEl.addEventListener('click', function(e) {
            if (e.target === overlayEl) overlayEl.hidden = true;
        });
    }

    return openReference;
}

/**
 * Bind Shift+click (desktop) and long-press (mobile, 500ms) on all
 * .info-trigger[data-info] elements to open a reference overlay.
 * @param {function} openFn  The openReference(key) function from initReferenceOverlay.
 */
function bindReferenceTriggers(openFn) {
    var triggers = document.querySelectorAll('.info-trigger[data-info]');
    for (var i = 0; i < triggers.length; i++) {
        (function(trigger) {
            trigger.addEventListener('click', function(e) {
                if (!e.shiftKey) return;
                e.stopPropagation();
                openFn(trigger.dataset.info);
            });
            var timer = 0;
            trigger.addEventListener('touchstart', function() {
                timer = setTimeout(function() {
                    openFn(trigger.dataset.info);
                    timer = 0;
                }, 500);
            }, { passive: false });
            trigger.addEventListener('touchend', function() {
                if (timer) { clearTimeout(timer); timer = 0; }
            });
            trigger.addEventListener('touchmove', function() {
                if (timer) { clearTimeout(timer); timer = 0; }
            });
        })(triggers[i]);
    }
}
