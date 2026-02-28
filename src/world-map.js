// ─── World Map SVG (About Page) ───

const NS = 'http://www.w3.org/2000/svg';

// Geo coordinates
const SG = { lat: 1.35, lon: 103.82 };
const SD = { lat: 32.72, lon: -117.16 };

// Calibrated from 18 country centroids in world-map.svg
const PROJ_LON_SCALE = 2.3638;
const PROJ_LON_OFFSET = 411.0;
const PROJ_LAT_SCALE = -2.8979;
const PROJ_LAT_OFFSET = 530.0;

const ARC_BULGE = 0.15;
const DOT_RADIUS_RATIO = 0.004;
const GLOW_RADIUS_RATIO = 0.014;
const ARC_DRAW_SPEED = 0.025;
const ARC_FALLBACK_MS = 2500;

function project(lat, lon) {
    const x = PROJ_LON_SCALE * lon + PROJ_LON_OFFSET;
    const y = PROJ_LAT_SCALE * lat + PROJ_LAT_OFFSET;
    return [x, y];
}

export function initWorldMap() {
    const container = document.getElementById('world-map-container');
    if (!container) return;

    fetch('world-map.svg')
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

            const overlaySvg = document.createElementNS(NS, 'svg');
            overlaySvg.setAttribute('viewBox', vb);
            overlaySvg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
            overlaySvg.setAttribute('class', 'map-overlay-svg');
            container.parentElement.appendChild(overlaySvg);

            const [sdX, sdY] = project(SD.lat, SD.lon);
            const [sgX, sgY] = project(SG.lat, SG.lon);
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

            let arcLen = 0;
            let animProgress = 0;
            function animate() {
                if (!arcDrawn) {
                    if (!arcLen) arcLen = setupArcDash();
                    animProgress = Math.min(1, animProgress + ARC_DRAW_SPEED);
                    arcLine.style.strokeDashoffset = arcLen * (1 - animProgress);
                    if (animProgress >= 1) arcDrawn = true;
                }

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
