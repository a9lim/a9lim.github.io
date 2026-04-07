// ─── WebGL Shader Background ───
// Full-viewport geometric dual-layer system rendered to #shader-bg at half
// resolution (0.5x DPR): dot grid substrate + topographic contour lines with
// accent-colored hotspots at contour density peaks (via screen-space derivatives).
// On-demand rendering: a rAF loop runs on scroll/resize/theme-change and
// auto-stops after 1s of inactivity. Initial load runs 2s for entrance anim.
// Canvas uses alpha blending so the layers are semi-transparent over the page bg.

import { getTheme } from './theme.js';
import { getScrollNorm } from './animations.js';

const VERT_SRC = `
  attribute vec2 pos;
  void main() { gl_Position = vec4(pos, 0.0, 1.0); }
`;

// Uniforms:
//   u_time        - elapsed seconds (drives animation speed)
//   u_res         - canvas pixel dimensions
//   u_accent      - accent color RGB [0..1]
//   u_canvasLight - light theme background RGB
//   u_canvasDark  - dark theme background RGB
//   u_dark        - 0.0 (light) or 1.0 (dark) — lerps canvas bg and alpha
//   u_scroll      - normalized scroll [0..1] — shifts noise vertically
const FRAG_SRC = `
  #extension GL_OES_standard_derivatives : enable
  precision mediump float;
  uniform float u_time;
  uniform vec2  u_res;
  uniform vec3  u_accent;
  uniform vec3  u_canvasLight;
  uniform vec3  u_canvasDark;
  uniform float u_dark;
  uniform float u_scroll;

  // ── Simplex noise (Ashima Arts) ──
  // mod289 avoids precision loss in the permutation hash
  vec3 mod289(vec3 x) { return x - floor(x / 289.0) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x / 289.0) * 289.0; }
  vec3 permute(vec3 x) { return mod289((x * 34.0 + 1.0) * x); }

  // 2D simplex noise, returns [-1, 1]
  float snoise(vec2 v) {
    // C.x = (3-sqrt(3))/6, C.y = (sqrt(3)-1)/2 — skew/unskew constants
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    float t = u_time * 0.12;
    float sc = u_scroll * 0.5;

    // ── Layer 1: Dot grid substrate ──
    float gridSize = 25.0;
    vec2 gridUV = fract(uv * u_res / gridSize);
    float dotDist = length(gridUV - 0.5);
    float dot = smoothstep(0.08, 0.02, dotDist);

    // Vary dot brightness with slow noise field
    float dotNoise = snoise(uv * 3.0 + vec2(t * 0.3, sc)) * 0.5 + 0.5;
    float dotLayer = dot * dotNoise * mix(0.06, 0.04, u_dark);

    // ── Layer 2: Topographic contours ──
    float field = snoise(uv * 2.5 + vec2(t * 0.5 + sc, t * 0.2));
    float field2 = snoise(uv * 1.2 + vec2(-t * 0.3, t * 0.4 + sc * 0.6));
    float combined = field * 0.6 + field2 * 0.4;

    // Extract isolines: sharp bands at regular intervals
    float contourFreq = 12.0;
    float contourRaw = fract(combined * contourFreq);
    float contour = 1.0 - smoothstep(0.0, 0.06, abs(contourRaw - 0.5) - 0.44);

    // Accent hotspots at contour density peaks
    float density = abs(dFdx(combined) * u_res.x) + abs(dFdy(combined) * u_res.y);
    float hotspot = smoothstep(1.5, 4.0, density * contourFreq);

    // ── Compose ──
    vec3 canvasBg = mix(u_canvasLight, u_canvasDark, u_dark);

    float contourAlpha = contour * mix(0.08, 0.06, u_dark);
    vec3 contourColor = mix(vec3(1.0), u_accent, hotspot * 0.6);

    // Angular vignette: corners darken more than edges
    vec2 vUV = abs(uv - 0.5) * 2.0;
    float vig = 1.0 - pow(max(vUV.x, vUV.y), 2.5) * 0.6;

    // Final composite
    float alpha = (dotLayer + contourAlpha) * vig;
    vec3 color = mix(vec3(1.0), contourColor, contour / max(contour + dotLayer * 10.0, 0.001));

    gl_FragColor = vec4(color * canvasBg + contourColor * contourAlpha * 2.0, alpha);
  }
`;

function compileShader(gl, src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
    }
    return s;
}

export function initShader($) {
    const canvas = $.shaderBg;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;
    gl.getExtension('OES_standard_derivatives');

    const vs = compileShader(gl, VERT_SRC, gl.VERTEX_SHADER);
    const fs = compileShader(gl, FRAG_SRC, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, 'pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime        = gl.getUniformLocation(prog, 'u_time');
    const uRes         = gl.getUniformLocation(prog, 'u_res');
    const uAccent      = gl.getUniformLocation(prog, 'u_accent');
    const uCanvasLight = gl.getUniformLocation(prog, 'u_canvasLight');
    const uCanvasDark  = gl.getUniformLocation(prog, 'u_canvasDark');
    const uDark        = gl.getUniformLocation(prog, 'u_dark');
    const uScroll      = gl.getUniformLocation(prog, 'u_scroll');

    // Pre-parse palette colors to [0..1] floats for uniforms
    const [ar, ag, ab] = _parseHex(_PALETTE.accent);
    const [clr, clg, clb] = _parseHex(_PALETTE.light.canvas);
    const [cdr, cdg, cdb] = _parseHex(_PALETTE.dark.canvas);

    // Non-premultiplied alpha — shader output blends over the page background
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    function resize() {
        // Render at half resolution (0.5x DPR, capped at 2x) for performance
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.floor(window.innerWidth * dpr * 0.5);
        const h = Math.floor(window.innerHeight * dpr * 0.5);
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            gl.viewport(0, 0, w, h);
        }
    }

    const start = performance.now();
    let raf = 0;
    let rendering = false;
    let idleTimer = 0;

    function render() {
        resize();
        const t = (performance.now() - start) / 1000;
        const isDark = getTheme() === 'dark' ? 1.0 : 0.0;

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(uTime, t);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform3f(uAccent, ar, ag, ab);
        gl.uniform3f(uCanvasLight, clr, clg, clb);
        gl.uniform3f(uCanvasDark, cdr, cdg, cdb);
        gl.uniform1f(uDark, isDark);
        gl.uniform1f(uScroll, getScrollNorm());
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function startLoop() {
        if (rendering) return;
        rendering = true;
        function loop() {
            if (!rendering) return;
            render();
            raf = requestAnimationFrame(loop);
        }
        raf = requestAnimationFrame(loop);
    }

    function stopLoop() {
        rendering = false;
        cancelAnimationFrame(raf);
    }

    function scheduleIdle() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(stopLoop, 1000);
    }

    function requestRender() {
        startLoop();
        scheduleIdle();
    }

    // Wake the render loop on any visual-state change
    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', requestRender, { passive: true });
    const themeObs = new MutationObserver(requestRender);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Pause completely when tab is hidden to save GPU cycles
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopLoop();
            clearTimeout(idleTimer);
        } else {
            requestRender();
        }
    });

    // Respect prefers-reduced-motion: render once, skip animation loop
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        render();
        return;
    }

    // Run 2s on load for the entrance animation, then let the idle timer take over
    startLoop();
    setTimeout(() => {
        if (rendering) scheduleIdle();
    }, 2000);
}
