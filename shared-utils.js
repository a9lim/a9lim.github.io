/* ═══════════════════════════════════════════════
   shared-utils.js — Shared utilities for all a9l.im sites
   Loaded after shared-tokens.js, before colors.js.
   ═══════════════════════════════════════════════ */

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function debounce(fn, ms) {
    let t;
    return function(...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), ms);
    };
}

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

function clamp(val, min, max) {
    return val < min ? min : val > max ? max : val;
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

// Attempt to create a shared cubic bezier solver (Newton-Raphson).
// Based on proven implementation from gerry/src/config.js.
function cubicBezier(x1, y1, x2, y2) {
    return function(t) {
        if (t <= 0) return 0;
        if (t >= 1) return 1;
        let u = t;
        for (let i = 0; i < 8; i++) {
            const a = 1 - u;
            const xu = 3 * a * a * u * x1 + 3 * a * u * u * x2 + u * u * u - t;
            const dxu = 3 * a * a * x1 + 6 * a * u * (x2 - x1) + 3 * u * u * (1 - x2);
            if (Math.abs(dxu) < 1e-6) break;
            u -= xu / dxu;
        }
        u = clamp(u, 0, 1);
        const a = 1 - u;
        return 3 * a * a * u * y1 + 3 * a * u * u * y2 + u * u * u;
    };
}

// Toast notification helper
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
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
