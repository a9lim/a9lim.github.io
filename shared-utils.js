/* ═══════════════════════════════════════════════
   shared-utils.js — Pure utility functions for all a9l.im sites.
   Loaded after shared-tokens.js; exposes globals consumed by
   ES6 modules and plain scripts across all four projects.
   ═══════════════════════════════════════════════ */

/**
 * Escape a string for safe insertion as HTML text content.
 * Uses the browser's own text node escaping via a detached element.
 * @param {string} str  Raw string
 * @returns {string} HTML-safe string
 */
function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

/**
 * @param {Function} fn  Function to debounce
 * @param {number} ms    Delay in milliseconds
 * @returns {Function}
 */
function debounce(fn, ms) {
    let t;
    return function(...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), ms);
    };
}

/**
 * Leading-edge throttle: fires immediately, then suppresses for `ms`.
 * @param {Function} fn  Function to throttle
 * @param {number} ms    Minimum interval in milliseconds
 * @returns {Function}
 */
function throttle(fn, ms) {
    let last = 0;
    return function(...args) {
        const now = Date.now();
        if (now - last >= ms) {
            last = now;
            fn.apply(this, args);
        }
    };
}

/** @param {number} val @param {number} min @param {number} max @returns {number} */
function clamp(val, min, max) {
    return val < min ? min : val > max ? max : val;
}

/** @param {number} a @param {number} b @param {number} t  Interpolant [0, 1] @returns {number} */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Return an easing function for a CSS cubic-bezier(x1, y1, x2, y2).
 * Inverts the x(u) Bezier to find the parameter u for a given time t,
 * then evaluates y(u). Uses Newton-Raphson iteration (up to 8 steps)
 * because the x->u mapping has no closed-form inverse.
 * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
 * @returns {(t: number) => number} Easing function mapping [0,1] -> [0,1]
 */
function cubicBezier(x1, y1, x2, y2) {
    return function(t) {
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        let u = t;
        for (let i = 0; i < 8; i++) {
            const a = 1 - u;
            // x(u) - t: residual of cubic Bezier x-component minus target time
            const xu = 3 * a * a * u * x1 + 3 * a * u * u * x2 + u * u * u - t;
            // dx/du: derivative for Newton step
            const dxu = 3 * a * a * x1 + 6 * a * u * (x2 - x1) + 3 * u * u * (1 - x2);
            if (Math.abs(dxu) < 1e-6) break; // near-zero derivative — avoid divergence
            u -= xu / dxu;
        }
        u = clamp(u, 0, 1);
        const a = 1 - u;
        return 3 * a * a * u * y1 + 3 * a * u * u * y2 + u * u * u;
    };
}

/**
 * Show a brief toast notification. Creates the container on first use.
 * Styled by `.toast` / `#toast-container` in shared-base.css.
 * @param {string} message  Text to display
 * @param {number} [duration=2000]  Visible time in ms before fade-out
 */
/**
 * Wire backdrop-click and close-button dismiss for a modal overlay.
 * Clicking the overlay background (not its children) or the close button
 * calls the hide function to dismiss the overlay.
 * @param {HTMLElement} overlayEl  The overlay container (backdrop).
 * @param {HTMLElement} [closeBtn] Optional close button inside the overlay.
 * @param {function} [hideFn]     Custom hide function. Default: sets overlayEl.hidden = true.
 */
function initOverlayDismiss(overlayEl, closeBtn, hideFn) {
    if (!overlayEl) return;
    var hide = hideFn || function() { overlayEl.hidden = true; };
    if (closeBtn) closeBtn.addEventListener('click', hide);
    overlayEl.addEventListener('click', function(e) {
        if (e.target === overlayEl) hide();
    });
}

/**
 * Resize a canvas buffer to match its CSS size × devicePixelRatio.
 * Only reassigns width/height when the buffer size actually changed
 * (avoids clearing the canvas on every call). Sets the 2D context
 * transform so draw calls use CSS-pixel coordinates.
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx
 * @returns {{ width: number, height: number, dpr: number }} CSS dimensions and DPR.
 */
function resizeCanvasDPR(canvas, ctx) {
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    var bw = Math.round(w * dpr);
    var bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width: w, height: h, dpr: dpr };
}

function showToast(message, duration) {
    if (duration === undefined) duration = 2000;
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    // rAF ensures the initial state is painted before adding .visible triggers transition
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300); // matches CSS transition duration
    }, duration);
}
