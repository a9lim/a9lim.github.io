/* ═══════════════════════════════════════════════
   shared-camera.js — Reusable viewport/camera module
   for all a9l.im simulation projects.
   Loaded after shared-utils.js, before colors.js.
   ═══════════════════════════════════════════════ */

/**
 * Create a camera/viewport controller.
 *
 * State model: (x, y) = world coordinate at viewport center, zoom = scale.
 * Works for both Canvas 2D and SVG viewBox rendering.
 *
 * @param {Object} opts
 * @param {number} opts.width       Viewport width in CSS pixels
 * @param {number} opts.height      Viewport height in CSS pixels
 * @param {number} [opts.zoom=1]    Initial zoom level
 * @param {number} [opts.minZoom=0.25]  Minimum zoom
 * @param {number} [opts.maxZoom=4]     Maximum zoom
 * @param {number} [opts.x=0]       Initial world X at center
 * @param {number} [opts.y=0]       Initial world Y at center
 * @param {Function} [opts.onUpdate]   Called after any camera state change
 * @param {Function} [opts.clamp]      Custom clamp(cam) called after moves
 * @param {number} [opts.wheelFactor=1.1]  Wheel zoom step multiplier
 * @param {number} [opts.zoomDuration=0]   Animated zoom duration in ms (0 = instant)
 * @returns {Object} camera instance
 */
var ZOOM_BUTTON_FACTOR = 1.25;

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

        // ─── Internal animation state ───
        _animId: 0,

        // ─── Viewport ───

        setViewport: function(w, h) {
            this.viewportW = w;
            this.viewportH = h;
            if (this.clampFn) this.clampFn(this);
            this._notify();
        },

        // ─── Coordinate transforms ───

        /** Convert screen pixel coordinates to world coordinates */
        screenToWorld: function(sx, sy) {
            return {
                x: this.x + (sx - this.viewportW / 2) / this.zoom,
                y: this.y + (sy - this.viewportH / 2) / this.zoom
            };
        },

        /** Convert world coordinates to screen pixel coordinates */
        worldToScreen: function(wx, wy) {
            return {
                x: (wx - this.x) * this.zoom + this.viewportW / 2,
                y: (wy - this.y) * this.zoom + this.viewportH / 2
            };
        },

        // ─── Camera movement ───

        /**
         * Zoom by a factor, preserving the world point under (cx, cy) screen coords.
         * If cx/cy omitted, zooms from viewport center.
         */
        zoomBy: function(factor, cx, cy) {
            if (cx === undefined) cx = this.viewportW / 2;
            if (cy === undefined) cy = this.viewportH / 2;

            // World point under cursor before zoom
            var wx = this.x + (cx - this.viewportW / 2) / this.zoom;
            var wy = this.y + (cy - this.viewportH / 2) / this.zoom;

            var newZoom = clamp(this.zoom * factor, this.minZoom, this.maxZoom);
            if (newZoom === this.zoom) return;

            // Adjust camera so (cx, cy) still maps to (wx, wy)
            this.x = wx - (cx - this.viewportW / 2) / newZoom;
            this.y = wy - (cy - this.viewportH / 2) / newZoom;
            this.zoom = newZoom;

            if (this.clampFn) this.clampFn(this);
            this._notify();
        },

        /** Set zoom directly, preserving world point under (cx, cy) */
        setZoom: function(newZoom, cx, cy) {
            if (cx === undefined) cx = this.viewportW / 2;
            if (cy === undefined) cy = this.viewportH / 2;

            var wx = this.x + (cx - this.viewportW / 2) / this.zoom;
            var wy = this.y + (cy - this.viewportH / 2) / this.zoom;

            newZoom = clamp(newZoom, this.minZoom, this.maxZoom);
            if (newZoom === this.zoom) return;

            this.x = wx - (cx - this.viewportW / 2) / newZoom;
            this.y = wy - (cy - this.viewportH / 2) / newZoom;
            this.zoom = newZoom;

            if (this.clampFn) this.clampFn(this);
            this._notify();
        },

        /** Pan by screen-space delta */
        panBy: function(dx, dy) {
            this.x -= dx / this.zoom;
            this.y -= dy / this.zoom;
            if (this.clampFn) this.clampFn(this);
            this._notify();
        },

        /** Set camera position directly */
        setPosition: function(wx, wy) {
            this.x = wx;
            this.y = wy;
            if (this.clampFn) this.clampFn(this);
            this._notify();
        },

        /**
         * Animate camera to fit a bounding box.
         * @param {{ x: number, y: number, w: number, h: number }} bounds
         * @param {number} [duration=300] Animation duration in ms
         * @param {Function} [easeFn] Easing function (default: easeOutCubic)
         */
        zoomToFit: function(bounds, duration, easeFn) {
            if (!duration) duration = 300;
            if (!easeFn) easeFn = function(t) { return 1 - Math.pow(1 - t, 3); };

            var targetX = bounds.x + bounds.w / 2;
            var targetY = bounds.y + bounds.h / 2;
            var zw = this.viewportW / bounds.w;
            var zh = this.viewportH / bounds.h;
            var targetZoom = clamp(Math.min(zw, zh) * 0.9, this.minZoom, this.maxZoom);

            this._animateTo(targetX, targetY, targetZoom, duration, easeFn);
        },

        /** Reset to initial state */
        reset: function(x, y, zoom) {
            this._cancelAnim();
            this.x = x !== undefined ? x : (opts.x || 0);
            this.y = y !== undefined ? y : (opts.y || 0);
            this.zoom = zoom !== undefined ? zoom : (opts.zoom || 1);
            if (this.clampFn) this.clampFn(this);
            this._notify();
        },

        // ─── Canvas 2D integration ───

        /** Apply camera transform to a Canvas 2D context */
        applyToCanvas: function(ctx) {
            ctx.translate(this.viewportW / 2, this.viewportH / 2);
            ctx.scale(this.zoom, this.zoom);
            ctx.translate(-this.x, -this.y);
        },

        // ─── SVG integration ───

        /** Get SVG viewBox values as { x, y, w, h } */
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

        /** Get SVG viewBox as a string for setAttribute */
        getViewBoxString: function() {
            var vb = this.getViewBox();
            return vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h;
        },

        /**
         * Set camera state from an SVG viewBox { x, y, w, h }.
         * Useful when initializing from existing SVG dimensions.
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
         * @param {HTMLElement} el Target element
         * @returns {Function} Cleanup function
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
            el.addEventListener('wheel', onWheel, { passive: false });
            return function() { el.removeEventListener('wheel', onWheel); };
        },

        /**
         * Bind touch gestures (pinch-zoom + two-finger pan).
         * Single-finger behavior is NOT bound here — projects handle it
         * (physsim: spawn particles, biosim: pan, gerry: paint).
         *
         * @param {HTMLElement} el Target element
         * @param {Object} [options]
         * @param {boolean} [options.singleFingerPan=false] Also bind single-finger pan
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

                    // Pinch zoom
                    if (lastDist > 0) {
                        var factor = d / lastDist;
                        self.zoomBy(factor, cx, cy);
                    }

                    // Two-finger pan
                    var dx = cx - lastCX;
                    var dy = cy - lastCY;
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
         * Bind mouse-button pan (default: middle-click, button 1).
         * @param {HTMLElement} el Target element
         * @param {Object} [options]
         * @param {number} [options.button=1] Mouse button (0=left, 1=middle, 2=right)
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
         * Bind zoom-in / zoom-out / reset buttons and an optional zoom display.
         * @param {Object} opts
         * @param {HTMLElement} [opts.zoomIn]    Zoom-in button element
         * @param {HTMLElement} [opts.zoomOut]   Zoom-out button element
         * @param {HTMLElement} [opts.reset]     Reset/fit button element
         * @param {HTMLElement} [opts.display]   Element to show zoom percentage
         * @param {number}     [opts.factor=1.25]  Zoom step multiplier
         * @param {number}     [opts.duration=200] Animation duration in ms
         * @param {Function}   [opts.ease]      Easing function (default easeOutCubic)
         * @param {Function}   [opts.onReset]   Custom reset callback
         * @param {Function}   [opts.formatZoom] Custom display formatter (zoom) => string
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
         * Animate camera to a target state.
         * @param {number} tx Target world X
         * @param {number} ty Target world Y
         * @param {number} tz Target zoom
         * @param {number} duration Duration in ms
         * @param {Function} easeFn Easing function t -> t
         */
        _animateTo: function(tx, ty, tz, duration, easeFn) {
            this._cancelAnim();
            var self = this;
            var sx = this.x, sy = this.y, sz = this.zoom;
            var start = performance.now();
            var id = ++this._animId;

            function tick(now) {
                if (id !== self._animId) return;
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
