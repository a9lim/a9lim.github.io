/* ═══════════════════════════════════════════════
   shared-sparkline.js — Lightweight sparkline renderer for
   all a9l.im sim projects. Ring-buffer data storage with
   polyline canvas drawing.
   ═══════════════════════════════════════════════ */

/**
 * Create a ring-buffer history for sparkline data.
 * @param {number} capacity  Maximum samples stored
 * @returns {{ data: Float32Array, head: number, count: number, cap: number }}
 */
function createSparkHistory(capacity) {
    return { data: new Float32Array(capacity), head: 0, count: 0, cap: capacity };
}

/**
 * Push a sample into the ring buffer.
 * @param {{ data: Float32Array, head: number, count: number, cap: number }} h
 * @param {number} value
 */
function pushSparkSample(h, value) {
    h.data[h.head] = value;
    h.head = (h.head + 1) % h.cap;
    if (h.count < h.cap) h.count++;
}

/**
 * Reset a sparkline history to empty.
 * @param {{ data: Float32Array, head: number, count: number, cap: number }} h
 */
function resetSparkHistory(h) {
    h.head = 0;
    h.count = 0;
    h.data.fill(0);
}

/**
 * Draw a polyline sparkline onto a canvas 2D context.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ data: Float32Array, head: number, count: number, cap: number }} h
 * @param {number} w       Canvas width (CSS pixels)
 * @param {number} hh      Canvas height (CSS pixels)
 * @param {string} color   Stroke color (hex)
 * @param {string} dimColor  Dim color for the "now" marker (hex with alpha)
 */
function drawSparkline(ctx, h, w, hh, color, dimColor) {
    ctx.clearRect(0, 0, w, hh);
    if (h.count < 2) return;

    // Find min/max for auto-scaling
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < h.count; i++) {
        const idx = (h.head - h.count + i + h.cap) % h.cap;
        const v = h.data[idx];
        if (v < min) min = v;
        if (v > max) max = v;
    }
    const range = max - min || 1;
    const pad = hh * 0.1; // 10% vertical padding
    const plotH = hh - 2 * pad;

    // Draw polyline
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;

    for (let i = 0; i < h.count; i++) {
        const idx = (h.head - h.count + i + h.cap) % h.cap;
        const x = (i / (h.cap - 1)) * w;
        const y = pad + plotH - ((h.data[idx] - min) / range) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Dashed vertical at the data frontier (visible when buffer not yet full)
    if (h.count < h.cap) {
        const nowX = (h.count / h.cap) * w;
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = dimColor;
        ctx.beginPath();
        ctx.moveTo(nowX, 0);
        ctx.lineTo(nowX, hh);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}
