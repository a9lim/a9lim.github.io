// ─── World Map SVG (About Page) ───
// Fetches world-map.svg, overlays city dots with pulsing glows, and draws
// an animated arc between Singapore and San Diego. Triggered by
// IntersectionObserver when the map section scrolls into view.

const NS = 'http://www.w3.org/2000/svg';

const SG = { lat: 1.35, lon: 103.82 };   // Singapore
const SD = { lat: 32.72, lon: -117.16 };  // San Diego

// Mercator projection constants calibrated by least-squares fit against 18
// known country centroids in world-map.svg's coordinate space. The SVG uses
// an equirectangular-like projection so a simple linear transform suffices.
const PROJ_LON_SCALE = 2.3638;
const PROJ_LON_OFFSET = 411.0;
const PROJ_LAT_SCALE = -2.8979;   // negative because SVG y-axis points down
const PROJ_LAT_OFFSET = 530.0;

const ARC_BULGE = 0.15;           // quadratic control point height as fraction of viewBox height
const DOT_RADIUS_RATIO = 0.004;   // city dot radius relative to viewBox width
const GLOW_RADIUS_RATIO = 0.014;  // pulsing halo radius relative to viewBox width
const ARC_DRAW_SPEED = 0.025;     // dashoffset decrement per frame (~40 frames to complete)
const ARC_FALLBACK_MS = 2500;     // force-draw arc if animation hasn't finished

/** Convert lat/lon to SVG viewBox coordinates. */
function project(lat, lon) {
    const x = PROJ_LON_SCALE * lon + PROJ_LON_OFFSET;
    const y = PROJ_LAT_SCALE * lat + PROJ_LAT_OFFSET;
    return [x, y];
}

export function initWorldMap() {
    const container = document.getElementById('world-map-container');
    if (!container) return;

    fetch('/world-map.svg')
        .then(r => r.text())
        .then(svgText => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, 'image/svg+xml');
            const svg = doc.querySelector('svg');
            if (!svg) return;

            const vb = svg.getAttribute('viewBox');
            const [, , vbW, vbH] = vb.split(/\s+/).map(Number);

            svg.removeAttribute('width');
            svg.removeAttribute('height');
            svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
            svg.style.width = '100%';
            svg.style.height = '100%';
            container.appendChild(svg);

            // Separate overlay SVG for dots and arc (z-index above the map's mask)
            const overlaySvg = document.createElementNS(NS, 'svg');
            overlaySvg.setAttribute('viewBox', vb);
            overlaySvg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
            overlaySvg.setAttribute('class', 'map-overlay-svg');
            container.parentElement.appendChild(overlaySvg);

            const [sdX, sdY] = project(SD.lat, SD.lon);
            const [sgX, sgY] = project(SG.lat, SG.lon);
            // Quadratic bezier control point: midpoint horizontally, bulged upward
            const cpX = (sdX + sgX) / 2;
            const cpY = Math.min(sdY, sgY) - vbH * ARC_BULGE;
            const fullArcD = `M${sgX},${sgY} Q${cpX},${cpY} ${sdX},${sdY}`;

            const arcLine = document.createElementNS(NS, 'path');
            arcLine.setAttribute('class', 'map-arc');
            overlaySvg.appendChild(arcLine);

            const dotR = vbW * DOT_RADIUS_RATIO;
            const glowR = vbW * GLOW_RADIUS_RATIO;

            [SD, SG].forEach(city => {
                const [cx, cy] = project(city.lat, city.lon);
                const glow = document.createElementNS(NS, 'circle');
                glow.setAttribute('cx', cx);
                glow.setAttribute('cy', cy);
                glow.setAttribute('r', glowR);
                glow.setAttribute('class', 'map-dot-glow');
                overlaySvg.appendChild(glow);

                const dot = document.createElementNS(NS, 'circle');
                dot.setAttribute('cx', cx);
                dot.setAttribute('cy', cy);
                dot.setAttribute('r', dotR);
                dot.setAttribute('class', 'map-dot');
                overlaySvg.appendChild(dot);
            });

            const glows = overlaySvg.querySelectorAll('.map-dot-glow');
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            // Arc draw: progressive dashoffset animation, with fallback instant draw
            let arcDrawn = false;
            let animFrame = null;

            function drawFullArc() {
                arcLine.setAttribute('d', fullArcD);
                arcLine.style.strokeDasharray = 'none';
                arcDrawn = true;
            }

            function setupArcDash() {
                arcLine.setAttribute('d', fullArcD);
                const len = arcLine.getTotalLength();
                arcLine.style.strokeDasharray = len;
                arcLine.style.strokeDashoffset = len;
                return len;
            }

            // Reduced motion: show final state immediately, no pulsing glows
            if (prefersReducedMotion) {
                drawFullArc();
                glows.forEach(g => {
                    g.setAttribute('r', glowR);
                    g.setAttribute('opacity', '0.25');
                });
                return;
            }

            let arcLen = 0;
            let animProgress = 0;
            function animate() {
                // Progressively reveal arc via shrinking dashoffset
                if (!arcDrawn) {
                    if (!arcLen) arcLen = setupArcDash();
                    animProgress = Math.min(1, animProgress + ARC_DRAW_SPEED);
                    arcLine.style.strokeDashoffset = arcLen * (1 - animProgress);
                    if (animProgress >= 1) arcDrawn = true;
                }

                // Continuous sine-wave pulse on city glow circles
                const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.003);
                const r = glowR * (0.8 + pulse * 0.5);
                const op = 0.15 + pulse * 0.2;
                glows.forEach(g => {
                    g.setAttribute('r', r);
                    g.setAttribute('opacity', op);
                });

                animFrame = requestAnimationFrame(animate);
            }

            let started = false;
            const mapSection = document.querySelector('.map-section');
            const mapObs = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !started) {
                        started = true;
                        animate();
                        setTimeout(() => { if (!arcDrawn) drawFullArc(); }, ARC_FALLBACK_MS);
                        mapObs.disconnect();
                    }
                });
            }, { threshold: 0.1 });

            if (mapSection) mapObs.observe(mapSection);

            document.addEventListener('visibilitychange', () => {
                if (!started) return;
                if (document.hidden) {
                    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
                } else {
                    if (!arcDrawn) drawFullArc();
                    if (!animFrame) animFrame = requestAnimationFrame(animate);
                }
            });
        })
        .catch(() => { /* SVG load failed — silent fallback */ });
}
