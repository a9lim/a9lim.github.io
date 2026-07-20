/* ═══════════════════════════════════════════════
   shared-camera.js — Reusable viewport/camera module
   for the three a9l.im simulation projects (geon, cyano, gerry).
   Supports Canvas 2D and SVG viewBox rendering, mouse/touch/button input.
   ═══════════════════════════════════════════════ */

var ZOOM_BUTTON_FACTOR = 1.25;

/**
 * Create a camera/viewport controller.
 *
 * Coordinate model: (x, y) is the world-space point at viewport center;
 * zoom is the scale factor (world units -> screen pixels).
 *
 * @param {Object} [opts]
 * @param {number} [opts.width=800]       Viewport width in CSS px
 * @param {number} [opts.height=600]      Viewport height in CSS px
 * @param {number} [opts.zoom=1]          Initial zoom
 * @param {number} [opts.minZoom=0.25]
 * @param {number} [opts.maxZoom=4]
 * @param {number} [opts.x=0]             Initial world X at center
 * @param {number} [opts.y=0]             Initial world Y at center
 * @param {Function} [opts.onUpdate]      Called after any state change
 * @param {Function} [opts.clamp]         Custom bounds enforcer: clamp(cam)
 * @param {number} [opts.wheelFactor=1.1] Multiplier per wheel tick
 * @param {number} [opts.zoomDuration=0]  Animated zoom duration (0 = instant)
 * @returns {Object} Camera instance
 */
function createCamera(opts) {
    if (!opts) opts = {};

    const cam = {
        // ─── State ───
        x: opts.x || 0,
        y: opts.y || 0,
        zoom: opts.zoom || 1,

        // ─── Config ───
        minZoom: opts.minZoom !== undefined ? opts.minZoom : 0.25,
        maxZoom: opts.maxZoom !== undefined ? opts.maxZoom : 4,
        viewportW: opts.width || 800,
        viewportH: opts.height || 600,
        wheelFactor: opts.wheelFactor || 1.1,
        zoomDuration: opts.zoomDuration || 0,

        // ─── Callbacks ───
        onUpdate: opts.onUpdate || null,
        clampFn: opts.clamp || null,

        // Monotonic counter — incremented to cancel in-flight animations
        _animId: 0,

        // ─── Viewport ───

        /** Update viewport dimensions (e.g. on window resize). */
        setViewport: function(w, h) {
            this.viewportW = w;
            this.viewportH = h;
            if (this.clampFn) this.clampFn(this);
            this._notify();
        },

        // ─── Coordinate transforms ───
        // Convention: screen origin is top-left of viewport element;
        // world origin is wherever (0, 0) falls in the simulation.

        /**
         * Convert screen pixel position to world coordinates.
         * @param {number} sx  Screen X (px from viewport left)
         * @param {number} sy  Screen Y (px from viewport top)
         * @returns {{ x: number, y: number }}
         */
        screenToWorld: function(sx, sy) {
            return {
                x: this.x + (sx - this.viewportW / 2) / this.zoom,
                y: this.y + (sy - this.viewportH / 2) / this.zoom
            };
        },

        /**
         * Convert world coordinates to screen pixel position.
         * @param {number} wx  World X
         * @param {number} wy  World Y
         * @returns {{ x: number, y: number }}
         */
        worldToScreen: function(wx, wy) {
            return {
                x: (wx - this.x) * this.zoom + this.viewportW / 2,
                y: (wy - this.y) * this.zoom + this.viewportH / 2
            };
        },

        /**
         * Convert a world X coordinate to screen X pixel position.
         * Avoids object allocation when only the X component is needed.
         * @param {number} wx  World X
         * @returns {number} Screen X in pixels
         */
        worldToScreenX: function(wx) {
            return (wx - this.x) * this.zoom + this.viewportW / 2;
        },

        /**
         * Convert a screen X pixel position to world X coordinate.
         * Avoids object allocation when only the X component is needed.
         * @param {number} sx  Screen X in pixels
         * @returns {number} World X
         */
        screenToWorldX: function(sx) {
            return this.x + (sx - this.viewportW / 2) / this.zoom;
        },

        // ─── Camera movement ───

        /**
         * Zoom by a multiplicative factor, keeping the world point under
         * screen position (cx, cy) stationary — the standard "zoom toward cursor" UX.
         * @param {number} factor       Zoom multiplier (>1 = zoom in)
         * @param {number} [cx]         Screen X pivot (default: viewport center)
         * @param {number} [cy]         Screen Y pivot (default: viewport center)
         */
        /**
         * Internal: apply a new zoom level while keeping the world point under
         * screen position (cx, cy) stationary. Shared by zoomBy and setZoom.
         */
        _applyZoom: function(newZoom, cx, cy) {
            newZoom = clamp(newZoom, this.minZoom, this.maxZoom);
            if (newZoom === this.zoom) return;
            if (cx === undefined) cx = this.viewportW / 2;
            if (cy === undefined) cy = this.viewportH / 2;
            var offX = cx - this.viewportW / 2;
            var offY = cy - this.viewportH / 2;
            // World point under cursor
            var wx = this.x + offX / this.zoom;
            var wy = this.y + offY / this.zoom;
            // Solve for camera pos that maps (cx,cy) back to (wx,wy) at new zoom
            this.x = wx - offX / newZoom;
            this.y = wy - offY / newZoom;
            this.zoom = newZoom;
            if (this.clampFn) this.clampFn(this);
            this._notify();
        },

        zoomBy: function(factor, cx, cy) {
            this._applyZoom(this.zoom * factor, cx, cy);
        },

        /**
         * Set zoom to an absolute value, preserving the world point under (cx, cy).
         * @param {number} newZoom
         * @param {number} [cx]    Screen X pivot
         * @param {number} [cy]    Screen Y pivot
         */
        setZoom: function(newZoom, cx, cy) {
            this._applyZoom(newZoom, cx, cy);
        },

        /**
         * Pan by a screen-space delta. Divides by zoom so screen px translate
         * to the correct world-space displacement regardless of zoom level.
         * @param {number} dx  Screen px rightward
         * @param {number} dy  Screen px downward
         */
        panBy: function(dx, dy) {
            this.x -= dx / this.zoom;
            this.y -= dy / this.zoom;
            if (this.clampFn) this.clampFn(this);
            this._notify();
        },

        /**
         * Set camera center to an absolute world position.
         * @param {number} wx  World X
         * @param {number} wy  World Y
         */
        setPosition: function(wx, wy) {
            this.x = wx;
            this.y = wy;
            if (this.clampFn) this.clampFn(this);
            this._notify();
        },

        /**
         * Animate camera to fit a world-space bounding box with 10% padding.
         * @param {{ x: number, y: number, w: number, h: number }} bounds
         * @param {number} [duration=300]
         * @param {Function} [easeFn]  Default: easeOutCubic
         */
        zoomToFit: function(bounds, duration, easeFn) {
            if (!duration) duration = 300;
            if (!easeFn) easeFn = function(t) { return 1 - Math.pow(1 - t, 3); };

            var targetX = bounds.x + bounds.w / 2;
            var targetY = bounds.y + bounds.h / 2;
            var zw = this.viewportW / bounds.w;
            var zh = this.viewportH / bounds.h;
            // 0.9 factor leaves 10% padding around the bounding box
            var targetZoom = clamp(Math.min(zw, zh) * 0.9, this.minZoom, this.maxZoom);

            this._animateTo(targetX, targetY, targetZoom, duration, easeFn);
        },

        /**
         * Reset to initial state (or explicit overrides).
         * @param {number} [x]    World X (default: opts.x or 0)
         * @param {number} [y]    World Y (default: opts.y or 0)
         * @param {number} [zoom] Zoom (default: opts.zoom or 1)
         */
        reset: function(x, y, zoom) {
            this._cancelAnim();
            this.x = x !== undefined ? x : (opts.x || 0);
            this.y = y !== undefined ? y : (opts.y || 0);
            this.zoom = zoom !== undefined ? zoom : (opts.zoom || 1);
            if (this.clampFn) this.clampFn(this);
            this._notify();
        },

        // ─── Canvas 2D integration ───

        /**
         * Apply camera transform to a Canvas 2D context.
         * Translates to viewport center, scales, then offsets to camera position.
         * @param {CanvasRenderingContext2D} ctx
         */
        applyToCanvas: function(ctx) {
            ctx.translate(this.viewportW / 2, this.viewportH / 2);
            ctx.scale(this.zoom, this.zoom);
            ctx.translate(-this.x, -this.y);
        },

        // ─── SVG integration ───

        /**
         * Compute the SVG viewBox that corresponds to the current camera state.
         * @returns {{ x: number, y: number, w: number, h: number }}
         */
        getViewBox: function() {
            var w = this.viewportW / this.zoom;
            var h = this.viewportH / this.zoom;
            return {
                x: this.x - w / 2,
                y: this.y - h / 2,
                w: w,
                h: h
            };
        },

        /**
         * @returns {string} viewBox as "x y w h" for setAttribute
         */
        getViewBoxString: function() {
            var vb = this.getViewBox();
            return vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h;
        },

        /**
         * Initialize camera state from an SVG viewBox.
         * Derives zoom from width ratio and centers on the viewBox midpoint.
         * @param {{ x: number, y: number, w: number, h: number }} vb
         */
        setFromViewBox: function(vb) {
            this.zoom = this.viewportW / vb.w;
            this.x = vb.x + vb.w / 2;
            this.y = vb.y + vb.h / 2;
            if (this.clampFn) this.clampFn(this);
            this._notify();
        },

        // ─── Input binding helpers ───

        /**
         * Bind mouse wheel zoom to an element.
         * @param {HTMLElement} el
         * @returns {Function} Cleanup function to remove listener
         */
        bindWheel: function(el) {
            var self = this;
            function onWheel(e) {
                e.preventDefault();
                var rect = el.getBoundingClientRect();
                var cx = e.clientX - rect.left;
                var cy = e.clientY - rect.top;
                var factor = e.deltaY > 0 ? (1 / self.wheelFactor) : self.wheelFactor;
                self.zoomBy(factor, cx, cy);
            }
            // passive: false required — we call preventDefault to stop page scroll
            el.addEventListener('wheel', onWheel, { passive: false });
            return function() { el.removeEventListener('wheel', onWheel); };
        },

        /**
         * Bind touch gestures (pinch-zoom + two-finger pan).
         * Single-finger gestures are intentionally left unbound — each project
         * uses single-finger for different things (geon: spawn, cyano: pan,
         * gerry: paint hexes).
         *
         * @param {HTMLElement} el
         * @param {Object} [options]
         * @param {boolean} [options.singleFingerPan=false]  Also bind single-finger pan
         * @returns {Function} Cleanup function
         */
        bindTouch: function(el, options) {
            if (!options) options = {};
            var self = this;
            var lastDist = 0;
            var lastCX = 0, lastCY = 0;
            var singleTouch = null;
            var singleFingerPan = !!options.singleFingerPan;

            function dist(t1, t2) {
                var dx = t1.clientX - t2.clientX;
                var dy = t1.clientY - t2.clientY;
                return Math.sqrt(dx * dx + dy * dy);
            }

            function mid(t1, t2) {
                return {
                    x: (t1.clientX + t2.clientX) / 2,
                    y: (t1.clientY + t2.clientY) / 2
                };
            }

            function onTouchStart(e) {
                if (e.touches.length === 2) {
                    e.preventDefault();
                    lastDist = dist(e.touches[0], e.touches[1]);
                    var m = mid(e.touches[0], e.touches[1]);
                    var rect = el.getBoundingClientRect();
                    lastCX = m.x - rect.left;
                    lastCY = m.y - rect.top;
                    singleTouch = null;
                } else if (e.touches.length === 1 && singleFingerPan) {
                    singleTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                }
            }

            function onTouchMove(e) {
                if (e.touches.length === 2) {
                    e.preventDefault();
                    var d = dist(e.touches[0], e.touches[1]);
                    var m = mid(e.touches[0], e.touches[1]);
                    var rect = el.getBoundingClientRect();
                    var cx = m.x - rect.left;
                    var cy = m.y - rect.top;

                    if (lastDist > 0) {
                        var factor = d / lastDist;
                        self.zoomBy(factor, cx, cy);
                    }

                    var dx = cx - lastCX;
                    var dy = cy - lastCY;
                    // 0.5px deadzone avoids jitter from floating-point touch coords
                    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                        self.panBy(dx, dy);
                    }

                    lastDist = d;
                    lastCX = cx;
                    lastCY = cy;
                    singleTouch = null;
                } else if (e.touches.length === 1 && singleTouch && singleFingerPan) {
                    var dx2 = e.touches[0].clientX - singleTouch.x;
                    var dy2 = e.touches[0].clientY - singleTouch.y;
                    self.panBy(dx2, dy2);
                    singleTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                }
            }

            function onTouchEnd() {
                lastDist = 0;
                singleTouch = null;
            }

            // passive: false — two-finger gestures call preventDefault to block page scroll
            el.addEventListener('touchstart', onTouchStart, { passive: false });
            el.addEventListener('touchmove', onTouchMove, { passive: false });
            el.addEventListener('touchend', onTouchEnd);
            el.addEventListener('touchcancel', onTouchEnd);

            return function() {
                el.removeEventListener('touchstart', onTouchStart);
                el.removeEventListener('touchmove', onTouchMove);
                el.removeEventListener('touchend', onTouchEnd);
                el.removeEventListener('touchcancel', onTouchEnd);
            };
        },

        /**
         * Bind mouse-button pan (default: middle-click).
         * Listens on `window` for move/up so dragging outside the element works.
         * @param {HTMLElement} el
         * @param {Object} [options]
         * @param {number} [options.button=1]  Mouse button (0=left, 1=middle, 2=right)
         * @returns {Function} Cleanup function
         */
        bindMousePan: function(el, options) {
            if (!options) options = {};
            var self = this;
            var button = options.button !== undefined ? options.button : 1;
            var panning = false;
            var lastX = 0, lastY = 0;

            function onDown(e) {
                if (e.button === button) {
                    e.preventDefault();
                    panning = true;
                    lastX = e.clientX;
                    lastY = e.clientY;
                    el.style.cursor = 'grabbing';
                }
            }

            function onMove(e) {
                if (!panning) return;
                var dx = e.clientX - lastX;
                var dy = e.clientY - lastY;
                self.panBy(dx, dy);
                lastX = e.clientX;
                lastY = e.clientY;
            }

            function onUp(e) {
                if (e.button === button && panning) {
                    panning = false;
                    el.style.cursor = '';
                }
            }

            function onContextMenu(e) {
                if (button === 2) e.preventDefault();
            }

            el.addEventListener('mousedown', onDown);
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
            if (button === 2) el.addEventListener('contextmenu', onContextMenu);

            return function() {
                el.removeEventListener('mousedown', onDown);
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
                if (button === 2) el.removeEventListener('contextmenu', onContextMenu);
            };
        },

        // ─── Zoom button binding ───

        /**
         * Wire zoom-in/out/reset buttons and an optional zoom percentage display.
         * Wraps the original onUpdate callback to also refresh the display.
         * @param {Object} opts
         * @param {HTMLElement} [opts.zoomIn]
         * @param {HTMLElement} [opts.zoomOut]
         * @param {HTMLElement} [opts.reset]
         * @param {HTMLElement} [opts.display]     Element to show zoom %
         * @param {number}     [opts.factor=1.25]  Zoom step multiplier
         * @param {number}     [opts.duration=200] Animation duration in ms
         * @param {Function}   [opts.ease]         Easing (default: easeOutCubic)
         * @param {Function}   [opts.onReset]      Custom reset handler
         * @param {Function}   [opts.formatZoom]   (zoom) => display string
         */
        bindZoomButtons: function(opts) {
            if (!opts) opts = {};
            var self = this;
            var factor = opts.factor || ZOOM_BUTTON_FACTOR;
            var dur = opts.duration !== undefined ? opts.duration : 200;
            var ease = opts.ease || function(t) { return 1 - Math.pow(1 - t, 3); };

            function animZoom(f) {
                var nz = clamp(self.zoom * f, self.minZoom, self.maxZoom);
                if (nz === self.zoom) return;
                self._animateTo(self.x, self.y, nz, dur, ease);
            }

            if (opts.zoomIn) opts.zoomIn.addEventListener('click', function() { animZoom(factor); });
            if (opts.zoomOut) opts.zoomOut.addEventListener('click', function() { animZoom(1 / factor); });
            if (opts.reset) opts.reset.addEventListener('click', function() {
                if (opts.onReset) opts.onReset();
                else self.reset();
            });

            if (opts.display) {
                var fmt = opts.formatZoom || function(z) { return Math.round(z * 100) + '%'; };
                var origOnUpdate = self.onUpdate;
                self.onUpdate = function(cam) {
                    if (origOnUpdate) origOnUpdate(cam);
                    opts.display.textContent = fmt(cam.zoom);
                };
                opts.display.textContent = fmt(self.zoom);
            }
        },

        // ─── Animated transitions ───

        /**
         * Smoothly interpolate camera to target state over `duration` ms.
         * Uses rAF; cancelled by any subsequent _animateTo or _cancelAnim call
         * via the monotonic _animId counter.
         */
        _animateTo: function(tx, ty, tz, duration, easeFn) {
            this._cancelAnim();
            var self = this;
            var sx = this.x, sy = this.y, sz = this.zoom;
            var start = performance.now();
            var id = ++this._animId;

            function tick(now) {
                if (id !== self._animId) return; // superseded by newer animation
                var elapsed = now - start;
                var t = Math.min(elapsed / duration, 1);
                var e = easeFn(t);

                self.x = lerp(sx, tx, e);
                self.y = lerp(sy, ty, e);
                self.zoom = lerp(sz, tz, e);
                if (self.clampFn) self.clampFn(self);
                self._notify();

                if (t < 1) requestAnimationFrame(tick);
            }

            requestAnimationFrame(tick);
        },

        _cancelAnim: function() {
            this._animId++;
        },

        _notify: function() {
            if (this.onUpdate) this.onUpdate(this);
        }
    };

    return cam;
}
