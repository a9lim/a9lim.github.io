/* ═══════════════════════════════════════════════
   shared-info.js — Info tip popover system
   for all a9l.im sites.
   Loaded after shared-utils.js, before colors.js.
   ═══════════════════════════════════════════════ */

/**
 * Create an info tip popover attached to a trigger element.
 *
 * Desktop (fine pointer): show on mouseenter/focus, hide on mouseleave/blur.
 * Mobile (coarse pointer): show on click/tap, include close button, dismiss on outside click.
 *
 * @param {HTMLElement} triggerEl  The element that triggers the popover (typically a ? button)
 * @param {Object} opts
 * @param {string} opts.title     Popover title text
 * @param {string} opts.body      Popover body text (supports HTML)
 * @param {number} [opts.maxWidth=280]  Max width in pixels
 * @returns {Function} Cleanup function to remove event listeners and popover
 */
function createInfoTip(triggerEl, opts) {
    if (!opts) opts = {};
    var maxWidth = opts.maxWidth || 280;
    var popover = null;
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
            titleEl.textContent = opts.title;
            el.appendChild(titleEl);
        }

        if (opts.body) {
            var bodyEl = document.createElement('div');
            bodyEl.className = 'info-popover-body';
            bodyEl.innerHTML = opts.body;
            if (typeof renderMathInElement === 'function') {
                renderMathInElement(bodyEl, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false }
                    ],
                    throwOnError: false
                });
            }
            el.appendChild(bodyEl);
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

    function position(el) {
        var rect = triggerEl.getBoundingClientRect();
        var vw = window.innerWidth;
        var vh = window.innerHeight;

        // Temporarily add to DOM to measure
        el.style.visibility = 'hidden';
        el.style.display = '';
        document.body.appendChild(el);
        var pw = el.offsetWidth;
        var ph = el.offsetHeight;

        // Prefer above, fall back to below
        var above = rect.top - ph - 8 > 0;
        var top = above ? rect.top - ph - 8 : rect.bottom + 8;
        var left = rect.left + rect.width / 2 - pw / 2;

        // Clamp horizontal
        if (left < 8) left = 8;
        if (left + pw > vw - 8) left = vw - 8 - pw;

        // Clamp vertical
        if (top < 8) top = 8;
        if (top + ph > vh - 8) top = vh - 8 - ph;

        el.style.position = 'fixed';
        el.style.top = top + 'px';
        el.style.left = left + 'px';
        el.style.visibility = '';
        el.classList.toggle('info-popover-below', !above);
    }

    function show() {
        if (popover) return;
        popover = buildPopover();
        position(popover);
        requestAnimationFrame(function() {
            if (popover) popover.classList.add('info-popover-visible');
        });

        if (isCoarse) {
            outsideHandler = function(e) {
                if (popover && !popover.contains(e.target) && e.target !== triggerEl) {
                    hide();
                }
            };
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
        setTimeout(function() {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 200);

        if (outsideHandler) {
            document.removeEventListener('click', outsideHandler, true);
            outsideHandler = null;
        }
    }

    // Bind events
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

    // Return cleanup function
    return function cleanup() {
        hide();
        if (isCoarse) {
            // Listeners are anonymous, but popover is removed
        } else {
            triggerEl.removeEventListener('mouseenter', show);
            triggerEl.removeEventListener('mouseleave', hide);
            triggerEl.removeEventListener('focus', show);
            triggerEl.removeEventListener('blur', hide);
        }
    };
}
