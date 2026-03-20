/* ═══════════════════════════════════════════════
   shared-tooltip.js — Cursor-following tooltip for
   all a9l.im sim projects. Lightweight positioned
   overlay with fade transition.

   CSS: .sim-tooltip / .sim-tooltip.visible in
   shared-base.css.
   ═══════════════════════════════════════════════ */

/**
 * Create a tooltip instance.
 *
 * @returns {{ show(cx,cy,text?), hide(), el: HTMLElement }}
 *   - show(clientX, clientY, text?) — position & reveal; sets textContent if text given
 *   - hide() — fade out
 *   - el — the DOM element for direct innerHTML / textContent manipulation
 */
function createSimTooltip() {
    var el = document.createElement('div');
    el.className = 'sim-tooltip';
    el.setAttribute('role', 'tooltip');
    document.body.appendChild(el);

    function _position(cx, cy) {
        var pad = 12;
        var left = cx + pad;
        var top = cy - 10;
        var vw = window.innerWidth;
        var vh = window.innerHeight;
        if (left + el.offsetWidth > vw - 8) left = cx - el.offsetWidth - 8;
        if (top + el.offsetHeight > vh - 8) top = vh - 8 - el.offsetHeight;
        if (top < 8) top = 8;
        el.style.left = left + 'px';
        el.style.top = top + 'px';
    }

    return {
        el: el,
        show: function(cx, cy, text) {
            if (text !== undefined) el.textContent = text;
            _position(cx, cy);
            el.classList.add('visible');
        },
        hide: function() {
            el.classList.remove('visible');
        }
    };
}
