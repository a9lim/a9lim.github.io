# Elastic UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the site's visual rendering with a fullscreen WebGPU canvas where every UI element is a deformable rubber mesh that users can click-drag to stretch, squish, and jiggle.

**Architecture:** A single WebGPU canvas covers the viewport. The DOM remains invisible underneath for accessibility and hit-testing. Each UI element is rasterized to a texture, mapped onto a spring-mass triangle mesh, and simulated via GPU compute shaders. The existing simplex noise background is ported to WGSL and rendered as the first layer.

**Tech Stack:** WebGPU (WGSL shaders), Canvas 2D (rasterization), vanilla JS (no frameworks)

**Spec:** `docs/superpowers/specs/2026-04-03-elastic-ui-design.md`

---

## File Structure

```
src/elastic/
  index.js          — WebGPU detection, orchestrates init, main loop
  device.js         — GPUDevice/adapter/canvas setup
  atlas.js          — Texture atlas bin-packing, GPU upload
  rasterizer.js     — Per-element Canvas 2D draw functions
  mesh.js           — Triangle grid + spring network generation
  physics.js        — Compute pipeline: spring forces + Verlet integration
  collision.js      — AABB overlap detection + collision compute dispatch
  renderer.js       — Render pipeline: background quad + textured meshes
  interaction.js    — Pointer event capture, drag state machine, impulses
  layout.js         — DOM rect reading, element→mesh registry, route/resize hooks
  shaders/
    physics.wgsl    — Spring force + Verlet compute shader
    collision.wgsl  — Inter-element collision compute shader
    background.wgsl — Simplex noise (port of src/shader.js GLSL)
    mesh.wgsl       — Vertex + fragment shader for textured mesh triangles
```

**Existing files modified:**
- `main.js` — add WebGPU branch at top
- `index.html` — no changes needed (canvas element reused)

**Existing files bypassed (not modified, just skipped in WebGPU mode):**
- `src/shader.js`, `src/card-effects.js`, `src/animations.js` (visual parts)

---

### Task 1: WebGPU Device Setup

**Files:**
- Create: `src/elastic/device.js`

This module requests a GPU adapter and device, configures the canvas context, and exposes the device + context for all other modules.

- [ ] **Step 1: Create `src/elastic/device.js`**

```js
// src/elastic/device.js
// Requests WebGPU adapter + device, configures canvas context.

/**
 * @param {HTMLCanvasElement} canvas - The #shader-bg canvas element
 * @returns {Promise<{device: GPUDevice, context: GPUCanvasContext, format: GPUTextureFormat}|null>}
 */
export async function initDevice(canvas) {
    if (!navigator.gpu) return null;

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return null;

    const device = await adapter.requestDevice();

    const context = canvas.getContext('webgpu');
    const format = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
        device,
        format,
        alphaMode: 'premultiplied',
    });

    return { device, context, format };
}

/**
 * Resize canvas to match viewport at full DPR (capped at 2).
 * @returns {{width: number, height: number}} Pixel dimensions
 */
export function resizeCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
    }
    return { width: w, height: h };
}
```

- [ ] **Step 2: Verify the file loads without errors**

Open the browser console and temporarily import the module from the console or add a test import in `main.js`:
```js
// temporary test in main.js — remove after verification
import('./src/elastic/device.js').then(m => console.log('device module loaded', m));
```

Open `http://localhost:8000` (via `python -m http.server`), check console for "device module loaded" with the exported functions. Remove the test import.

- [ ] **Step 3: Commit**

```bash
git add src/elastic/device.js
git commit -m "feat(elastic): add WebGPU device setup module"
```

---

### Task 2: Background Shader (WGSL Port)

**Files:**
- Create: `src/elastic/shaders/background.wgsl`

Port the existing simplex noise fragment shader from `src/shader.js` (GLSL) to WGSL. Same algorithm: three-octave simplex noise + domain-warped splotch layer + vignette.

- [ ] **Step 1: Create `src/elastic/shaders/background.wgsl`**

```wgsl
// src/elastic/shaders/background.wgsl
// Simplex noise background — port of src/shader.js GLSL to WGSL.

struct Uniforms {
    time: f32,
    scroll: f32,
    dark: f32,
    _pad0: f32,
    resolution: vec2f,
    _pad1: vec2f,
    accent: vec3f,
    _pad2: f32,
    canvas_light: vec3f,
    _pad3: f32,
    canvas_dark: vec3f,
    _pad4: f32,
};

@group(0) @binding(0) var<uniform> u: Uniforms;

// Fullscreen triangle vertex shader (3 vertices, no vertex buffer needed)
@vertex
fn vs_main(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
    // Generates a fullscreen triangle from vertex index 0,1,2
    let x = f32(i32(vi) / 2) * 4.0 - 1.0;
    let y = f32(i32(vi) % 2) * 4.0 - 1.0;
    return vec4f(x, y, 0.0, 1.0);
}

// ── Simplex noise helpers ──
fn mod289_3(x: vec3f) -> vec3f { return x - floor(x / 289.0) * 289.0; }
fn mod289_2(x: vec2f) -> vec2f { return x - floor(x / 289.0) * 289.0; }
fn permute(x: vec3f) -> vec3f { return mod289_3((x * 34.0 + 1.0) * x); }

fn snoise(v: vec2f) -> f32 {
    let C = vec4f(0.211324865405187, 0.366025403784439,
                  -0.577350269189626, 0.024390243902439);
    let i = floor(v + dot(v, C.yy));
    let x0 = v - i + dot(i, C.xx);
    let i1 = select(vec2f(0.0, 1.0), vec2f(1.0, 0.0), x0.x > x0.y);
    let x12 = x0.xyxy + C.xxzz - vec4f(i1, 0.0, 0.0);
    let im = mod289_2(i);
    let p = permute(permute(im.y + vec3f(0.0, i1.y, 1.0)) + im.x + vec3f(0.0, i1.x, 1.0));
    var m = max(vec3f(0.5) - vec3f(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), vec3f(0.0));
    m = m * m;
    m = m * m;
    let x_val = 2.0 * fract(p * C.www) - 1.0;
    let h = abs(x_val) - 0.5;
    let ox = floor(x_val + 0.5);
    let a0 = x_val - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    let g = vec3f(a0.x * x0.x + h.x * x0.y,
                  a0.y * x12.x + h.y * x12.y,
                  a0.z * x12.z + h.z * x12.w);
    return 130.0 * dot(m, g);
}

@fragment
fn fs_main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / u.resolution;
    let t = u.time * 0.18;
    let sc = u.scroll * 0.5;

    // Three octaves
    let n1 = snoise(uv * 1.8 + vec2f(t * 0.7 + sc, t * 0.3)) * 0.5 + 0.5;
    let n2 = snoise(uv * 3.5 + vec2f(-t * 0.5, t * 0.8 + sc * 0.7)) * 0.5 + 0.5;
    let n3 = snoise(uv * 0.8 + vec2f(t * 0.2 + sc * 0.3, -t * 0.4)) * 0.5 + 0.5;
    let noise = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

    // Domain-warped splotch
    let warp_x = snoise(uv * 3.0 + vec2f(t * 0.8, t * -0.5)) * 0.4;
    let warp_y = snoise(uv * 2.5 + vec2f(t * -0.6, t * 0.9)) * 0.4;
    let splotch_uv = uv * 2.4 + vec2f(warp_x, warp_y - sc * 3.0);
    let splotch_raw = snoise(splotch_uv);
    let splotch = smoothstep(-0.2, 0.7, splotch_raw);

    let canvas_bg = mix(u.canvas_light, u.canvas_dark, u.dark);
    let base = mix(canvas_bg, u.accent * 0.3, noise * 0.15);
    let color = mix(base, u.accent, splotch * 0.3);

    // Vignette
    let vig_raw = 1.0 - length(uv - 0.5) * 0.85;
    let vig = smoothstep(0.0, 0.8, vig_raw);

    let alpha = noise * vig * mix(0.18, 0.12, u.dark)
              + splotch * vig * 0.08;
    return vec4f(color * alpha, alpha); // premultiplied
}
```

- [ ] **Step 2: Commit**

```bash
git add src/elastic/shaders/background.wgsl
git commit -m "feat(elastic): port simplex noise shader to WGSL"
```

---

### Task 3: Mesh Shader (WGSL)

**Files:**
- Create: `src/elastic/shaders/mesh.wgsl`

Vertex shader reads deformed positions from a storage buffer, passes UVs to fragment shader which samples the texture atlas.

- [ ] **Step 1: Create `src/elastic/shaders/mesh.wgsl`**

```wgsl
// src/elastic/shaders/mesh.wgsl
// Renders textured triangle meshes for elastic UI elements.

struct Globals {
    viewport: vec2f,   // canvas pixel dimensions
    _pad: vec2f,
};

// Per-node data: current position (xy) + texture UV (uv)
struct Node {
    x: f32,
    y: f32,
    u: f32,
    v: f32,
    rest_x: f32,
    rest_y: f32,
};

@group(0) @binding(0) var<uniform> globals: Globals;
@group(0) @binding(1) var<storage, read> nodes: array<Node>;
@group(0) @binding(2) var atlas_tex: texture_2d<f32>;
@group(0) @binding(3) var atlas_sampler: sampler;

struct VertexOut {
    @builtin(position) pos: vec4f,
    @location(0) uv: vec2f,
};

@vertex
fn vs_main(@builtin(vertex_index) vi: u32) -> VertexOut {
    let node = nodes[vi];
    // Convert pixel coords to clip space: [0, width] → [-1, 1]
    let clip_x = (node.x / globals.viewport.x) * 2.0 - 1.0;
    let clip_y = 1.0 - (node.y / globals.viewport.y) * 2.0; // Y flipped
    var out: VertexOut;
    out.pos = vec4f(clip_x, clip_y, 0.0, 1.0);
    out.uv = vec2f(node.u, node.v);
    return out;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4f {
    return textureSample(atlas_tex, atlas_sampler, in.uv);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/elastic/shaders/mesh.wgsl
git commit -m "feat(elastic): add mesh vertex/fragment shader"
```

---

### Task 4: Physics Compute Shader (WGSL)

**Files:**
- Create: `src/elastic/shaders/physics.wgsl`

Compute shader that runs spring forces and Verlet integration on all mesh nodes in parallel.

- [ ] **Step 1: Create `src/elastic/shaders/physics.wgsl`**

```wgsl
// src/elastic/shaders/physics.wgsl
// Spring-mass physics: compute forces + Verlet integration.

struct PhysicsParams {
    dt: f32,              // timestep (1/120)
    stiffness: f32,       // spring constant (~20)
    damping: f32,         // velocity damping (~0.4)
    max_stretch: f32,     // max stretch ratio (1.8)
    node_count: u32,
    spring_count: u32,
    _pad: vec2u,
};

struct Node {
    x: f32,
    y: f32,
    u: f32,         // texture UV — unchanged by physics
    v: f32,
    rest_x: f32,
    rest_y: f32,
};

struct Velocity {
    vx: f32,
    vy: f32,
};

struct Spring {
    a: u32,           // node index A
    b: u32,           // node index B
    rest_len: f32,
    _pad: f32,
};

// Pin data: if pin_strength > 0, node is pinned to (pin_x, pin_y)
struct Pin {
    pin_x: f32,
    pin_y: f32,
    pin_strength: f32, // 0 = free, 1 = hard pin
    _pad: f32,
};

@group(0) @binding(0) var<uniform> params: PhysicsParams;
@group(0) @binding(1) var<storage, read_write> nodes: array<Node>;
@group(0) @binding(2) var<storage, read_write> velocities: array<Velocity>;
@group(0) @binding(3) var<storage, read> springs: array<Spring>;
@group(0) @binding(4) var<storage, read_write> forces: array<vec2f>;
@group(0) @binding(5) var<storage, read> pins: array<Pin>;

// Pass 1: Accumulate spring forces
@compute @workgroup_size(256)
fn compute_forces(@builtin(global_invocation_id) gid: vec3u) {
    let sid = gid.x;
    if (sid >= params.spring_count) { return; }

    let s = springs[sid];
    let na = nodes[s.a];
    let nb = nodes[s.b];

    let dx = nb.x - na.x;
    let dy = nb.y - na.y;
    let dist = max(sqrt(dx * dx + dy * dy), 0.001);

    // Clamp stretch ratio for nonlinear stiffening
    let stretch = dist / s.rest_len;
    let clamped_stretch = min(stretch, params.max_stretch);
    let stiffness = select(params.stiffness, params.stiffness * (1.0 + (stretch - params.max_stretch) * 4.0), stretch > params.max_stretch);

    let displacement = dist - s.rest_len * clamped_stretch / stretch;
    let force_mag = stiffness * displacement;

    let fx = force_mag * dx / dist;
    let fy = force_mag * dy / dist;

    // Atomic add — WGSL doesn't have atomicAdd for f32, so we use
    // a force accumulation buffer indexed by spring, then reduce per-node in pass 2.
    // For simplicity, store per-spring force; pass 2 scatters to nodes.
    forces[sid] = vec2f(fx, fy);
}

// Pass 2: Integrate velocities + positions (per-node)
@compute @workgroup_size(256)
fn integrate(@builtin(global_invocation_id) gid: vec3u) {
    let nid = gid.x;
    if (nid >= params.node_count) { return; }

    var fx: f32 = 0.0;
    var fy: f32 = 0.0;

    // Gather forces from all springs connected to this node.
    // This is O(springs) per node — acceptable for our small meshes (~500 nodes total).
    // A more optimized approach would use adjacency lists, but for <1000 springs this is fine.
    for (var i: u32 = 0u; i < params.spring_count; i++) {
        let s = springs[i];
        let f = forces[i];
        if (s.a == nid) {
            fx += f.x;
            fy += f.y;
        } else if (s.b == nid) {
            fx -= f.x;
            fy -= f.y;
        }
    }

    var vel = velocities[nid];
    let pin = pins[nid];

    // Apply force (F = ma, m = 1)
    vel.vx = (vel.vx + fx * params.dt) * (1.0 - params.damping * params.dt);
    vel.vy = (vel.vy + fy * params.dt) * (1.0 - params.damping * params.dt);

    var node = nodes[nid];

    // Integrate position
    node.x += vel.vx * params.dt;
    node.y += vel.vy * params.dt;

    // Apply pin constraint: lerp toward pin position
    if (pin.pin_strength > 0.0) {
        node.x = mix(node.x, pin.pin_x, pin.pin_strength);
        node.y = mix(node.y, pin.pin_y, pin.pin_strength);
        vel.vx *= (1.0 - pin.pin_strength);
        vel.vy *= (1.0 - pin.pin_strength);
    }

    nodes[nid] = node;
    velocities[nid] = vel;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/elastic/shaders/physics.wgsl
git commit -m "feat(elastic): add spring-mass physics compute shader"
```

---

### Task 5: Collision Compute Shader (WGSL)

**Files:**
- Create: `src/elastic/shaders/collision.wgsl`

Compute shader that detects and resolves inter-element node penetration.

- [ ] **Step 1: Create `src/elastic/shaders/collision.wgsl`**

```wgsl
// src/elastic/shaders/collision.wgsl
// Inter-element collision: pushes nodes apart when meshes overlap.

struct CollisionParams {
    node_count_a: u32,
    node_count_b: u32,
    offset_a: u32,       // start index of element A's nodes in global buffer
    offset_b: u32,       // start index of element B's nodes in global buffer
    repulsion: f32,      // repulsion force strength
    _pad: vec3f,
};

struct Node {
    x: f32,
    y: f32,
    u: f32,
    v: f32,
    rest_x: f32,
    rest_y: f32,
};

struct Velocity {
    vx: f32,
    vy: f32,
};

// AABB of an element mesh
struct AABB {
    min_x: f32,
    min_y: f32,
    max_x: f32,
    max_y: f32,
};

@group(0) @binding(0) var<uniform> params: CollisionParams;
@group(0) @binding(1) var<storage, read_write> nodes: array<Node>;
@group(0) @binding(2) var<storage, read_write> velocities: array<Velocity>;
@group(0) @binding(3) var<storage, read> aabb_b: AABB;

// For each node in element A, check if it's inside element B's AABB.
// If so, apply repulsion toward the nearest AABB edge.
@compute @workgroup_size(64)
fn collide(@builtin(global_invocation_id) gid: vec3u) {
    let lid = gid.x;
    if (lid >= params.node_count_a) { return; }

    let nid = params.offset_a + lid;
    let node = nodes[nid];
    let bb = aabb_b;

    // Check if node is inside B's AABB
    if (node.x < bb.min_x || node.x > bb.max_x ||
        node.y < bb.min_y || node.y > bb.max_y) {
        return;
    }

    // Find nearest edge and push out
    let d_left = node.x - bb.min_x;
    let d_right = bb.max_x - node.x;
    let d_top = node.y - bb.min_y;
    let d_bottom = bb.max_y - node.y;

    let min_d = min(min(d_left, d_right), min(d_top, d_bottom));

    var push = vec2f(0.0, 0.0);
    if (min_d == d_left) { push.x = -params.repulsion; }
    else if (min_d == d_right) { push.x = params.repulsion; }
    else if (min_d == d_top) { push.y = -params.repulsion; }
    else { push.y = params.repulsion; }

    var vel = velocities[nid];
    vel.vx += push.x;
    vel.vy += push.y;
    velocities[nid] = vel;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/elastic/shaders/collision.wgsl
git commit -m "feat(elastic): add collision compute shader"
```

---

### Task 6: Mesh Generation

**Files:**
- Create: `src/elastic/mesh.js`

Generates triangle grid topology and spring network for a rectangular element.

- [ ] **Step 1: Create `src/elastic/mesh.js`**

```js
// src/elastic/mesh.js
// Generates deformable triangle grids and spring networks for elastic elements.

/**
 * Generate a rectangular grid of nodes with triangle indices and spring connections.
 *
 * @param {number} x       - Top-left pixel X
 * @param {number} y       - Top-left pixel Y
 * @param {number} w       - Width in pixels
 * @param {number} h       - Height in pixels
 * @param {number} cols    - Grid columns (e.g. 16)
 * @param {number} rows    - Grid rows (e.g. 16)
 * @param {number} atlasU  - Atlas region left U [0..1]
 * @param {number} atlasV  - Atlas region top V [0..1]
 * @param {number} atlasUW - Atlas region width in UV
 * @param {number} atlasVH - Atlas region height in UV
 * @returns {{nodes: Float32Array, indices: Uint32Array, springs: Float32Array}}
 */
export function generateMesh(x, y, w, h, cols, rows, atlasU, atlasV, atlasUW, atlasVH) {
    const nodeCount = cols * rows;
    // Per node: x, y, u, v, restX, restY = 6 floats
    const nodes = new Float32Array(nodeCount * 6);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const i = (r * cols + c) * 6;
            const px = x + (c / (cols - 1)) * w;
            const py = y + (r / (rows - 1)) * h;
            const u = atlasU + (c / (cols - 1)) * atlasUW;
            const v = atlasV + (r / (rows - 1)) * atlasVH;
            nodes[i]     = px;    // x
            nodes[i + 1] = py;    // y
            nodes[i + 2] = u;     // u
            nodes[i + 3] = v;     // v
            nodes[i + 4] = px;    // restX
            nodes[i + 5] = py;    // restY
        }
    }

    // Triangle indices: two triangles per cell
    const cellCount = (cols - 1) * (rows - 1);
    const indices = new Uint32Array(cellCount * 6);
    let idx = 0;
    for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
            const tl = r * cols + c;
            const tr = tl + 1;
            const bl = (r + 1) * cols + c;
            const br = bl + 1;
            indices[idx++] = tl; indices[idx++] = bl; indices[idx++] = tr;
            indices[idx++] = tr; indices[idx++] = bl; indices[idx++] = br;
        }
    }

    // Springs: structural + shear + bend
    const springList = [];

    function addSpring(a, b) {
        const ax = nodes[a * 6], ay = nodes[a * 6 + 1];
        const bx = nodes[b * 6], by = nodes[b * 6 + 1];
        const restLen = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
        springList.push(a, b, restLen, 0); // 4 floats per spring (a, b, restLen, pad)
    }

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const i = r * cols + c;
            // Structural (right, down)
            if (c < cols - 1) addSpring(i, i + 1);
            if (r < rows - 1) addSpring(i, i + cols);
            // Shear (diagonals)
            if (c < cols - 1 && r < rows - 1) addSpring(i, i + cols + 1);
            if (c > 0 && r < rows - 1) addSpring(i, i + cols - 1);
            // Bend (skip-one: right 2, down 2)
            if (c < cols - 2) addSpring(i, i + 2);
            if (r < rows - 2) addSpring(i, i + cols * 2);
        }
    }

    const springs = new Float32Array(springList);

    return { nodes, indices, springs, nodeCount, springCount: springList.length / 4 };
}
```

- [ ] **Step 2: Verify with a quick manual test**

Open browser console on `http://localhost:8000` and run:
```js
import('./src/elastic/mesh.js').then(m => {
    const result = m.generateMesh(100, 100, 200, 50, 8, 4, 0, 0, 0.5, 0.25);
    console.log('nodes:', result.nodeCount, 'springs:', result.springCount);
    console.log('indices length:', result.indices.length);
});
```
Expected: `nodes: 32 springs: ~100 indices length: 126` (7×3 cells × 6 indices).

- [ ] **Step 3: Commit**

```bash
git add src/elastic/mesh.js
git commit -m "feat(elastic): add mesh generation with spring networks"
```

---

### Task 7: Texture Atlas

**Files:**
- Create: `src/elastic/atlas.js`

Bin-packing atlas that assigns rectangular regions to elements and uploads to a GPU texture.

- [ ] **Step 1: Create `src/elastic/atlas.js`**

```js
// src/elastic/atlas.js
// Texture atlas: bin-packs element textures into a single GPU texture.

const ATLAS_SIZE = 4096;

/**
 * Simple shelf-based bin packer.
 * Packs rectangles left-to-right, top-to-bottom in rows.
 */
class ShelfPacker {
    constructor(size) {
        this.size = size;
        this.shelfY = 0;      // current shelf top
        this.shelfH = 0;      // current shelf height
        this.cursorX = 0;     // next X position on current shelf
    }

    /** @returns {{x: number, y: number}|null} pixel position, or null if full */
    pack(w, h) {
        if (w > this.size) return null;

        // Doesn't fit on current shelf? Start new shelf.
        if (this.cursorX + w > this.size) {
            this.shelfY += this.shelfH;
            this.shelfH = 0;
            this.cursorX = 0;
        }

        // Doesn't fit vertically?
        if (this.shelfY + h > this.size) return null;

        const pos = { x: this.cursorX, y: this.shelfY };
        this.cursorX += w;
        this.shelfH = Math.max(this.shelfH, h);
        return pos;
    }

    reset() {
        this.shelfY = 0;
        this.shelfH = 0;
        this.cursorX = 0;
    }
}

export class Atlas {
    constructor(device) {
        this.device = device;
        this.packer = new ShelfPacker(ATLAS_SIZE);
        this.texture = device.createTexture({
            size: [ATLAS_SIZE, ATLAS_SIZE],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING |
                   GPUTextureUsage.COPY_DST |
                   GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.sampler = device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
        });
        /** @type {Map<string, {x:number, y:number, w:number, h:number, u:number, v:number, uw:number, vh:number}>} */
        this.regions = new Map();
    }

    /**
     * Upload a rasterized element bitmap to the atlas.
     * @param {string} id          - Unique element ID
     * @param {ImageBitmap|OffscreenCanvas|HTMLCanvasElement} source
     * @param {number} w           - Pixel width
     * @param {number} h           - Pixel height
     * @returns {{u: number, v: number, uw: number, vh: number}|null}
     */
    upload(id, source, w, h) {
        const pos = this.packer.pack(w, h);
        if (!pos) return null;

        this.device.queue.copyExternalImageToTexture(
            { source },
            { texture: this.texture, origin: [pos.x, pos.y] },
            [w, h]
        );

        const region = {
            x: pos.x, y: pos.y, w, h,
            u: pos.x / ATLAS_SIZE,
            v: pos.y / ATLAS_SIZE,
            uw: w / ATLAS_SIZE,
            vh: h / ATLAS_SIZE,
        };
        this.regions.set(id, region);
        return region;
    }

    /** Clear all regions and reset packer for full rebuild. */
    clear() {
        this.regions.clear();
        this.packer.reset();
    }

    destroy() {
        this.texture.destroy();
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/elastic/atlas.js
git commit -m "feat(elastic): add texture atlas with shelf bin-packing"
```

---

### Task 8: Element Rasterizer

**Files:**
- Create: `src/elastic/rasterizer.js`

Canvas 2D drawing functions that produce element bitmaps for the atlas.

- [ ] **Step 1: Create `src/elastic/rasterizer.js`**

```js
// src/elastic/rasterizer.js
// Draws UI elements to OffscreenCanvas for GPU texture upload.

/**
 * Read current theme's CSS custom properties.
 * @returns {Object} Token values as CSS color strings
 */
function getTokens() {
    const s = getComputedStyle(document.documentElement);
    return {
        bgCanvas:    s.getPropertyValue('--bg-canvas').trim(),
        bgPanel:     s.getPropertyValue('--bg-panel-solid').trim() || s.getPropertyValue('--bg-panel').trim(),
        bgElevated:  s.getPropertyValue('--bg-elevated').trim(),
        text:        s.getPropertyValue('--text').trim(),
        textSecondary: s.getPropertyValue('--text-secondary').trim(),
        textMuted:   s.getPropertyValue('--text-muted').trim(),
        accent:      s.getPropertyValue('--accent').trim(),
        accentLight: s.getPropertyValue('--accent-light').trim(),
        accentSubtle: s.getPropertyValue('--accent-subtle').trim(),
        fontBody:    s.getPropertyValue('--font-body').trim() || 'Lato, system-ui, sans-serif',
        fontDisplay: s.getPropertyValue('--font-display').trim() || 'Merriweather, Georgia, serif',
        fontMono:    s.getPropertyValue('--font-mono').trim() || 'Recursive, monospace',
    };
}

/**
 * Create an OffscreenCanvas and 2D context at the given pixel dimensions.
 * @param {number} w
 * @param {number} h
 * @returns {{canvas: OffscreenCanvas, ctx: OffscreenCanvasRenderingContext2D}}
 */
function makeCanvas(w, h) {
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    return { canvas, ctx };
}

/**
 * Draw a rounded rectangle path.
 */
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/**
 * Draw text with automatic word-wrapping.
 * @returns {number} Total height consumed
 */
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let curY = y;
    for (const word of words) {
        const test = line + (line ? ' ' : '') + word;
        if (ctx.measureText(test).width > maxWidth && line) {
            ctx.fillText(line, x, curY);
            line = word;
            curY += lineHeight;
        } else {
            line = test;
        }
    }
    if (line) {
        ctx.fillText(line, x, curY);
        curY += lineHeight;
    }
    return curY - y;
}

/**
 * Draw a pill-shaped tag.
 */
function drawTag(ctx, text, x, y, bgColor, textColor, fontSize) {
    ctx.font = `500 ${fontSize}px Lato, system-ui`;
    const tw = ctx.measureText(text).width;
    const pw = tw + fontSize * 1.2;
    const ph = fontSize * 1.8;
    const r = ph / 2;
    ctx.fillStyle = bgColor;
    roundRect(ctx, x, y, pw, ph, r);
    ctx.fill();
    ctx.fillStyle = textColor;
    ctx.fillText(text, x + fontSize * 0.6, y + ph * 0.65);
    return pw;
}

// ─── Per-Element Rasterizers ───

/**
 * @param {DOMRect} rect
 * @param {number} dpr
 */
export function rasterizeNavbar(rect, dpr, navData) {
    const w = Math.ceil(rect.width * dpr);
    const h = Math.ceil(rect.height * dpr);
    const { canvas, ctx } = makeCanvas(w, h);
    const t = getTokens();
    const scale = dpr;

    // Background
    ctx.fillStyle = t.bgPanel;
    roundRect(ctx, 0, 0, w, h, 20 * scale);
    ctx.fill();

    // Brand text
    ctx.fillStyle = t.text;
    ctx.font = `700 ${14 * scale}px Lato, system-ui`;
    ctx.fillText(navData.brand || 'a9l.im', 24 * scale, h * 0.6);

    // Nav links (centered)
    const links = navData.links || ['Home', 'Projects', 'Blog', 'About'];
    ctx.font = `500 ${11 * scale}px Lato, system-ui`;
    const totalW = links.reduce((sum, l) => sum + ctx.measureText(l.toUpperCase()).width + 24 * scale, 0);
    let linkX = (w - totalW) / 2;
    for (const link of links) {
        const upper = link.toUpperCase();
        const isActive = link === navData.activePage;
        ctx.fillStyle = isActive ? t.accent : t.textMuted;
        ctx.fillText(upper, linkX, h * 0.6);
        linkX += ctx.measureText(upper).width + 24 * scale;
    }

    // Right-side icon placeholders (circles)
    const iconR = 10 * scale;
    const iconY = h / 2;
    ctx.fillStyle = t.textMuted + '40';
    for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.arc(w - (24 + i * 36) * scale, iconY, iconR, 0, Math.PI * 2);
        ctx.fill();
    }

    return canvas;
}

export function rasterizeHero(rect, dpr, heroData) {
    const w = Math.ceil(rect.width * dpr);
    const h = Math.ceil(rect.height * dpr);
    const { canvas, ctx } = makeCanvas(w, h);
    const t = getTokens();
    const scale = dpr;

    // Subtle background
    ctx.fillStyle = t.bgCanvas + '10';
    roundRect(ctx, 0, 0, w, h, 24 * scale);
    ctx.fill();

    // Title
    const titleSize = Math.min(56 * scale, w * 0.08);
    ctx.font = `400 ${titleSize}px Merriweather, Georgia, serif`;
    ctx.fillStyle = t.text;
    ctx.textAlign = 'center';
    ctx.fillText('Building', w / 2, h * 0.35);

    // Italic accent word
    ctx.font = `italic 400 ${titleSize}px Merriweather, Georgia, serif`;
    ctx.fillStyle = t.accent;
    ctx.fillText('interactive', w / 2, h * 0.35 + titleSize * 1.2);

    // "simulations"
    ctx.font = `400 ${titleSize}px Merriweather, Georgia, serif`;
    ctx.fillStyle = t.text;
    ctx.fillText('simulations', w / 2, h * 0.35 + titleSize * 2.4);

    // Subtitle
    ctx.font = `400 ${14 * scale}px Lato, system-ui`;
    ctx.fillStyle = t.textSecondary;
    const subtitle = heroData.subtitle || 'Exploring physics, biology, finance, and political science through code.';
    ctx.fillText(subtitle, w / 2, h * 0.35 + titleSize * 3.4);

    ctx.textAlign = 'left';
    return canvas;
}

export function rasterizeCard(rect, dpr, project, image) {
    const w = Math.ceil(rect.width * dpr);
    const h = Math.ceil(rect.height * dpr);
    const { canvas, ctx } = makeCanvas(w, h);
    const t = getTokens();
    const scale = dpr;
    const radius = 20 * scale;

    // Clip to rounded rect
    roundRect(ctx, 0, 0, w, h, radius);
    ctx.clip();

    // Background image
    if (image && image.complete) {
        ctx.drawImage(image, 0, 0, w, h);
    } else {
        ctx.fillStyle = t.bgElevated;
        ctx.fillRect(0, 0, w, h);
    }

    // Gradient overlay at bottom
    const grad = ctx.createLinearGradient(0, h * 0.4, 0, h);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${18 * scale}px Lato, system-ui`;
    ctx.fillText(project.title, 20 * scale, h - 60 * scale);

    // Description
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `400 ${12 * scale}px Lato, system-ui`;
    drawWrappedText(ctx, project.shortDesc, 20 * scale, h - 40 * scale, w - 40 * scale, 16 * scale);

    // Tags
    let tagX = 20 * scale;
    const tagY = h - 24 * scale;
    for (const tag of (project.tags || []).slice(0, 3)) {
        const pw = drawTag(ctx, tag, tagX, tagY - 10 * scale, 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.8)', 10 * scale);
        tagX += pw + 6 * scale;
    }

    return canvas;
}

export function rasterizeProjectCard(rect, dpr, project) {
    const w = Math.ceil(rect.width * dpr);
    const h = Math.ceil(rect.height * dpr);
    const { canvas, ctx } = makeCanvas(w, h);
    const t = getTokens();
    const scale = dpr;

    // Background
    ctx.fillStyle = t.bgElevated;
    roundRect(ctx, 0, 0, w, h, 20 * scale);
    ctx.fill();

    // Title
    ctx.fillStyle = t.text;
    ctx.font = `600 ${18 * scale}px Lato, system-ui`;
    ctx.fillText(project.title, 24 * scale, 40 * scale);

    // Description
    ctx.fillStyle = t.textSecondary;
    ctx.font = `400 ${13 * scale}px Lato, system-ui`;
    drawWrappedText(ctx, project.longDesc || project.shortDesc, 24 * scale, 64 * scale, w - 48 * scale, 18 * scale);

    // Tags at bottom
    let tagX = 24 * scale;
    for (const tag of (project.tags || []).slice(0, 4)) {
        const pw = drawTag(ctx, tag, tagX, h - 36 * scale, t.accentSubtle, t.accent, 10 * scale);
        tagX += pw + 6 * scale;
    }

    return canvas;
}

export function rasterizeBlogEntry(rect, dpr, entry) {
    const w = Math.ceil(rect.width * dpr);
    const h = Math.ceil(rect.height * dpr);
    const { canvas, ctx } = makeCanvas(w, h);
    const t = getTokens();
    const scale = dpr;

    ctx.fillStyle = t.bgElevated;
    roundRect(ctx, 0, 0, w, h, 16 * scale);
    ctx.fill();

    // Date
    ctx.fillStyle = t.textMuted;
    ctx.font = `400 ${12 * scale}px Recursive, monospace`;
    ctx.fillText(entry.date || '', 20 * scale, h * 0.6);

    // Title
    ctx.fillStyle = t.text;
    ctx.font = `500 ${15 * scale}px Lato, system-ui`;
    ctx.fillText(entry.title || '', 110 * scale, h * 0.6);

    return canvas;
}

export function rasterizeFooter(rect, dpr) {
    const w = Math.ceil(rect.width * dpr);
    const h = Math.ceil(rect.height * dpr);
    const { canvas, ctx } = makeCanvas(w, h);
    const t = getTokens();
    const scale = dpr;

    ctx.fillStyle = t.bgElevated;
    roundRect(ctx, 0, 0, w, h, 20 * scale);
    ctx.fill();

    // Accent line
    ctx.fillStyle = t.accent;
    roundRect(ctx, (w - 48 * scale) / 2, 12 * scale, 48 * scale, 2 * scale, 1);
    ctx.fill();

    // Nav links
    ctx.fillStyle = t.textMuted;
    ctx.font = `400 ${12 * scale}px Lato, system-ui`;
    ctx.textAlign = 'center';
    const links = ['Home', 'Projects', 'Blog', 'About'];
    const totalW = links.length * 80 * scale;
    let lx = (w - totalW) / 2 + 40 * scale;
    for (const l of links) {
        ctx.fillText(l, lx, h * 0.45);
        lx += 80 * scale;
    }

    // Copyright
    ctx.font = `400 ${11 * scale}px Lato, system-ui`;
    ctx.fillStyle = t.textMuted;
    ctx.fillText('AGPL-3.0 | GitHub', w / 2, h * 0.75);

    ctx.textAlign = 'left';
    return canvas;
}

export function rasterizeGeneric(rect, dpr) {
    const w = Math.ceil(rect.width * dpr);
    const h = Math.ceil(rect.height * dpr);
    const { canvas, ctx } = makeCanvas(w, h);
    const t = getTokens();

    ctx.fillStyle = t.bgElevated;
    roundRect(ctx, 0, 0, w, h, 20 * Math.min(window.devicePixelRatio || 1, 2));
    ctx.fill();

    return canvas;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/elastic/rasterizer.js
git commit -m "feat(elastic): add per-element Canvas 2D rasterizers"
```

---

### Task 9: Layout Manager

**Files:**
- Create: `src/elastic/layout.js`

Reads DOM layout, creates mesh + atlas entries for each elastic element, and handles route/resize re-registration.

- [ ] **Step 1: Create `src/elastic/layout.js`**

```js
// src/elastic/layout.js
// Maps DOM elements to elastic meshes. Reads layout rects, drives rasterization + mesh creation.

import { generateMesh } from './mesh.js';
import * as R from './rasterizer.js';

/**
 * @typedef {Object} ElasticElement
 * @property {string} id
 * @property {HTMLElement} dom
 * @property {string} type - 'navbar'|'hero'|'card'|'projectCard'|'blogEntry'|'footer'|'generic'
 * @property {DOMRect} rect
 * @property {number} cols
 * @property {number} rows
 * @property {Object} meshData - from generateMesh()
 * @property {Object} atlasRegion - UV region from atlas
 * @property {any} extra - type-specific data (project, entry, etc.)
 */

/** Grid resolution presets by element type */
const GRID = {
    navbar:      [32, 4],
    hero:        [24, 16],
    card:        [16, 20],
    carouselDots:[16, 2],
    projectCard: [16, 16],
    blogEntry:   [24, 4],
    blogPost:    [24, 32],
    aboutBio:    [16, 16],
    contactCard: [16, 12],
    worldMap:    [32, 20],
    footer:      [32, 4],
    generic:     [12, 12],
};

/**
 * Scan the visible page and build the element registry.
 * @param {Atlas} atlas
 * @param {number} dpr
 * @param {Object} pageData - { projects, activePage, blogEntries }
 * @returns {ElasticElement[]}
 */
export function scanElements(atlas, dpr, pageData) {
    atlas.clear();
    const elements = [];
    let idCounter = 0;

    function register(dom, type, extra) {
        const rect = dom.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return; // hidden
        const id = `el-${idCounter++}`;
        const [cols, rows] = GRID[type] || GRID.generic;

        // Rasterize
        let canvas;
        switch (type) {
            case 'navbar':
                canvas = R.rasterizeNavbar(rect, dpr, extra || {});
                break;
            case 'hero':
                canvas = R.rasterizeHero(rect, dpr, extra || {});
                break;
            case 'card':
                canvas = R.rasterizeCard(rect, dpr, extra.project, extra.image);
                break;
            case 'projectCard':
                canvas = R.rasterizeProjectCard(rect, dpr, extra.project);
                break;
            case 'blogEntry':
                canvas = R.rasterizeBlogEntry(rect, dpr, extra.entry);
                break;
            case 'footer':
                canvas = R.rasterizeFooter(rect, dpr);
                break;
            default:
                canvas = R.rasterizeGeneric(rect, dpr);
        }

        const w = Math.ceil(rect.width * dpr);
        const h = Math.ceil(rect.height * dpr);
        const region = atlas.upload(id, canvas, w, h);
        if (!region) return; // atlas full

        const meshData = generateMesh(
            rect.left * dpr, rect.top * dpr, rect.width * dpr, rect.height * dpr,
            cols, rows,
            region.u, region.v, region.uw, region.vh
        );

        elements.push({ id, dom, type, rect, cols, rows, meshData, atlasRegion: region, extra });
    }

    // Navbar
    const navbar = document.getElementById('navbar');
    if (navbar) register(navbar, 'navbar', { brand: 'a9l.im', links: ['Home', 'Projects', 'Blog', 'About'], activePage: pageData.activePage });

    // Active page content
    const activePage = document.querySelector('.page-section.active');
    if (!activePage) return elements;

    const pageId = activePage.id;

    if (pageId === 'page-home') {
        // Hero
        const hero = activePage.querySelector('.hero');
        if (hero) register(hero, 'hero', { subtitle: 'Exploring physics, biology, finance, and political science through code.' });

        // Carousel cards
        const cards = activePage.querySelectorAll('.carousel-card');
        cards.forEach((card, i) => {
            const project = pageData.projects?.[i];
            const img = card.querySelector('img');
            if (project) register(card, 'card', { project, image: img });
        });

        // Carousel dots
        const dots = activePage.querySelector('.carousel-dots');
        if (dots) register(dots, 'carouselDots');

        // Inspirational quote
        const inspire = activePage.querySelector('.inspire-section');
        if (inspire) register(inspire, 'generic');
    }

    if (pageId === 'page-projects') {
        const cards = activePage.querySelectorAll('.project-card');
        cards.forEach((card, i) => {
            const project = pageData.projects?.[i];
            if (project) register(card, 'projectCard', { project });
        });
    }

    if (pageId === 'page-blog') {
        const entries = activePage.querySelectorAll('.blog-entry');
        entries.forEach((entry) => {
            const title = entry.querySelector('.blog-entry-title')?.textContent || '';
            const date = entry.querySelector('.blog-entry-date')?.textContent || '';
            register(entry, 'blogEntry', { entry: { title, date } });
        });

        const blogPost = activePage.querySelector('#blog-post-content');
        if (blogPost && blogPost.children.length > 0) register(blogPost, 'blogPost');
    }

    if (pageId === 'page-about') {
        const bio = activePage.querySelector('.about-bio');
        if (bio) register(bio, 'aboutBio');
        const contact = activePage.querySelector('.contact-section');
        if (contact) register(contact, 'contactCard');
        const map = activePage.querySelector('.world-map-wrap');
        if (map) register(map, 'worldMap');
    }

    // Footer
    const footer = document.querySelector('.site-footer');
    if (footer) register(footer, 'footer');

    return elements;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/elastic/layout.js
git commit -m "feat(elastic): add layout scanner and element registry"
```

---

### Task 10: Physics Pipeline (JS)

**Files:**
- Create: `src/elastic/physics.js`

Creates GPU buffers and compute pipelines for the physics simulation. Dispatches compute passes.

- [ ] **Step 1: Create `src/elastic/physics.js`**

```js
// src/elastic/physics.js
// Sets up GPU buffers + compute pipelines for spring-mass physics.

export class PhysicsSystem {
    /**
     * @param {GPUDevice} device
     * @param {string} shaderCode - physics.wgsl source
     */
    constructor(device, shaderCode) {
        this.device = device;
        this.shaderModule = device.createShaderModule({ code: shaderCode });

        // Pipelines created after buffers are allocated
        this.forcesPipeline = null;
        this.integratePipeline = null;
        this.bindGroup = null;

        // Buffers
        this.nodeBuffer = null;
        this.velocityBuffer = null;
        this.springBuffer = null;
        this.forceBuffer = null;
        this.pinBuffer = null;
        this.paramsBuffer = null;

        this.nodeCount = 0;
        this.springCount = 0;

        /** @type {Map<string, {nodeOffset: number, nodeCount: number}>} element offsets */
        this.elementOffsets = new Map();
    }

    /**
     * Allocate buffers and build pipelines from scanned elements.
     * @param {import('./layout.js').ElasticElement[]} elements
     */
    build(elements) {
        const device = this.device;

        // Concatenate all node/spring data
        let totalNodes = 0;
        let totalSprings = 0;
        for (const el of elements) {
            totalNodes += el.meshData.nodeCount;
            totalSprings += el.meshData.springCount;
        }

        this.nodeCount = totalNodes;
        this.springCount = totalSprings;

        // Merge node data
        const allNodes = new Float32Array(totalNodes * 6);
        const allVelocities = new Float32Array(totalNodes * 2);
        const allPins = new Float32Array(totalNodes * 4);
        let nodeOffset = 0;

        // Merge spring data (adjust indices by element offset)
        const allSprings = new Float32Array(totalSprings * 4);
        let springOffset = 0;

        for (const el of elements) {
            const md = el.meshData;
            const baseNode = nodeOffset / 6;

            // Copy nodes
            allNodes.set(md.nodes, nodeOffset);
            this.elementOffsets.set(el.id, { nodeOffset: baseNode, nodeCount: md.nodeCount });
            nodeOffset += md.nodeCount * 6;

            // Copy springs with index offset
            for (let i = 0; i < md.springCount; i++) {
                const si = i * 4;
                const di = (springOffset + i) * 4;
                allSprings[di]     = md.springs[si] + baseNode;     // node A
                allSprings[di + 1] = md.springs[si + 1] + baseNode; // node B
                allSprings[di + 2] = md.springs[si + 2];            // rest length
                allSprings[di + 3] = 0;                              // padding
            }
            springOffset += md.springCount;
        }

        // Create GPU buffers
        this.nodeBuffer = device.createBuffer({
            size: allNodes.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
            mappedAtCreation: true,
        });
        new Float32Array(this.nodeBuffer.getMappedRange()).set(allNodes);
        this.nodeBuffer.unmap();

        this.velocityBuffer = device.createBuffer({
            size: Math.max(allVelocities.byteLength, 16),
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });
        new Float32Array(this.velocityBuffer.getMappedRange()).set(allVelocities);
        this.velocityBuffer.unmap();

        this.springBuffer = device.createBuffer({
            size: Math.max(allSprings.byteLength, 16),
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });
        new Float32Array(this.springBuffer.getMappedRange()).set(allSprings);
        this.springBuffer.unmap();

        this.forceBuffer = device.createBuffer({
            size: Math.max(totalSprings * 8, 16), // vec2f per spring
            usage: GPUBufferUsage.STORAGE,
        });

        this.pinBuffer = device.createBuffer({
            size: Math.max(allPins.byteLength, 16),
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });
        new Float32Array(this.pinBuffer.getMappedRange()).set(allPins);
        this.pinBuffer.unmap();

        // Params uniform
        const paramsData = new ArrayBuffer(32);
        const paramsF = new Float32Array(paramsData);
        const paramsU = new Uint32Array(paramsData);
        paramsF[0] = 1 / 120;   // dt
        paramsF[1] = 20;        // stiffness
        paramsF[2] = 0.4;       // damping
        paramsF[3] = 1.8;       // max_stretch
        paramsU[4] = totalNodes;
        paramsU[5] = totalSprings;

        this.paramsBuffer = device.createBuffer({
            size: 32,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });
        new Float32Array(this.paramsBuffer.getMappedRange()).set(new Float32Array(paramsData));
        this.paramsBuffer.unmap();

        // Bind group layout + pipelines
        const bindGroupLayout = device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
                { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
                { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
                { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
                { binding: 5, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
            ],
        });

        const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });

        this.forcesPipeline = device.createComputePipeline({
            layout: pipelineLayout,
            compute: { module: this.shaderModule, entryPoint: 'compute_forces' },
        });

        this.integratePipeline = device.createComputePipeline({
            layout: pipelineLayout,
            compute: { module: this.shaderModule, entryPoint: 'integrate' },
        });

        this.bindGroup = device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.paramsBuffer } },
                { binding: 1, resource: { buffer: this.nodeBuffer } },
                { binding: 2, resource: { buffer: this.velocityBuffer } },
                { binding: 3, resource: { buffer: this.springBuffer } },
                { binding: 4, resource: { buffer: this.forceBuffer } },
                { binding: 5, resource: { buffer: this.pinBuffer } },
            ],
        });
    }

    /**
     * Encode physics compute passes (2 substeps).
     * @param {GPUCommandEncoder} encoder
     */
    encode(encoder) {
        const springWG = Math.ceil(this.springCount / 256);
        const nodeWG = Math.ceil(this.nodeCount / 256);

        for (let sub = 0; sub < 2; sub++) {
            const pass = encoder.beginComputePass();
            pass.setPipeline(this.forcesPipeline);
            pass.setBindGroup(0, this.bindGroup);
            pass.dispatchWorkgroups(springWG);
            pass.end();

            const pass2 = encoder.beginComputePass();
            pass2.setPipeline(this.integratePipeline);
            pass2.setBindGroup(0, this.bindGroup);
            pass2.dispatchWorkgroups(nodeWG);
            pass2.end();
        }
    }

    /**
     * Write pin data for a specific element.
     * @param {string} elementId
     * @param {Float32Array} pinData - 4 floats per node: [px, py, strength, pad]
     */
    writePins(elementId, pinData) {
        const off = this.elementOffsets.get(elementId);
        if (!off) return;
        this.device.queue.writeBuffer(
            this.pinBuffer,
            off.nodeOffset * 16, // 4 floats × 4 bytes per node
            pinData
        );
    }

    /**
     * Clear all pins (set strength to 0).
     */
    clearPins(elementId) {
        const off = this.elementOffsets.get(elementId);
        if (!off) return;
        const zeros = new Float32Array(off.nodeCount * 4);
        this.device.queue.writeBuffer(this.pinBuffer, off.nodeOffset * 16, zeros);
    }

    destroy() {
        this.nodeBuffer?.destroy();
        this.velocityBuffer?.destroy();
        this.springBuffer?.destroy();
        this.forceBuffer?.destroy();
        this.pinBuffer?.destroy();
        this.paramsBuffer?.destroy();
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/elastic/physics.js
git commit -m "feat(elastic): add physics system with GPU buffer management"
```

---

### Task 11: Collision System (JS)

**Files:**
- Create: `src/elastic/collision.js`

CPU-side AABB tracking and GPU collision dispatch for overlapping element pairs.

- [ ] **Step 1: Create `src/elastic/collision.js`**

```js
// src/elastic/collision.js
// AABB overlap detection + collision compute dispatch.

export class CollisionSystem {
    /**
     * @param {GPUDevice} device
     * @param {string} shaderCode - collision.wgsl source
     */
    constructor(device, shaderCode) {
        this.device = device;
        this.shaderModule = device.createShaderModule({ code: shaderCode });
        this.pipeline = null;
        this.bindGroupLayout = null;

        /** @type {Map<string, {minX:number,minY:number,maxX:number,maxY:number}>} */
        this.aabbs = new Map();
    }

    init() {
        this.bindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
                { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
                { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
            ],
        });

        this.pipeline = this.device.createComputePipeline({
            layout: this.device.createPipelineLayout({ bindGroupLayouts: [this.bindGroupLayout] }),
            compute: { module: this.shaderModule, entryPoint: 'collide' },
        });
    }

    /**
     * Update AABB for an element from its current node positions.
     * @param {string} id
     * @param {Float32Array} nodeData - raw node buffer slice for this element
     * @param {number} nodeCount
     */
    updateAABB(id, nodeData, nodeCount) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let i = 0; i < nodeCount; i++) {
            const x = nodeData[i * 6];
            const y = nodeData[i * 6 + 1];
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
        this.aabbs.set(id, { minX, minY, maxX, maxY });
    }

    /**
     * Find overlapping AABB pairs.
     * @returns {Array<[string, string]>} pairs of element IDs
     */
    findOverlaps() {
        const ids = [...this.aabbs.keys()];
        const pairs = [];
        for (let i = 0; i < ids.length; i++) {
            for (let j = i + 1; j < ids.length; j++) {
                const a = this.aabbs.get(ids[i]);
                const b = this.aabbs.get(ids[j]);
                if (a.minX < b.maxX && a.maxX > b.minX &&
                    a.minY < b.maxY && a.maxY > b.minY) {
                    pairs.push([ids[i], ids[j]]);
                }
            }
        }
        return pairs;
    }

    /**
     * Encode collision passes for overlapping pairs.
     * @param {GPUCommandEncoder} encoder
     * @param {import('./physics.js').PhysicsSystem} physics
     * @param {Array<[string, string]>} pairs
     */
    encode(encoder, physics, pairs) {
        for (const [idA, idB] of pairs) {
            const offA = physics.elementOffsets.get(idA);
            const offB = physics.elementOffsets.get(idB);
            if (!offA || !offB) continue;

            const bb = this.aabbs.get(idB);

            // Params uniform
            const paramsData = new Float32Array(8);
            const paramsU = new Uint32Array(paramsData.buffer);
            paramsU[0] = offA.nodeCount;
            paramsU[1] = offB.nodeCount;
            paramsU[2] = offA.nodeOffset;
            paramsU[3] = offB.nodeOffset;
            paramsData[4] = 50.0; // repulsion strength

            const paramsBuffer = this.device.createBuffer({
                size: 32,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            });
            new Float32Array(paramsBuffer.getMappedRange()).set(paramsData);
            paramsBuffer.unmap();

            const aabbData = new Float32Array([bb.minX, bb.minY, bb.maxX, bb.maxY]);
            const aabbBuffer = this.device.createBuffer({
                size: 16,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            });
            new Float32Array(aabbBuffer.getMappedRange()).set(aabbData);
            aabbBuffer.unmap();

            const bindGroup = this.device.createBindGroup({
                layout: this.bindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: paramsBuffer } },
                    { binding: 1, resource: { buffer: physics.nodeBuffer } },
                    { binding: 2, resource: { buffer: physics.velocityBuffer } },
                    { binding: 3, resource: { buffer: aabbBuffer } },
                ],
            });

            const pass = encoder.beginComputePass();
            pass.setPipeline(this.pipeline);
            pass.setBindGroup(0, bindGroup);
            pass.dispatchWorkgroups(Math.ceil(offA.nodeCount / 64));
            pass.end();

            // These per-frame temp buffers are cleaned up by GC after submit
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/elastic/collision.js
git commit -m "feat(elastic): add AABB collision detection and compute dispatch"
```

---

### Task 12: Render Pipeline (JS)

**Files:**
- Create: `src/elastic/renderer.js`

Sets up render pipelines for the background quad and textured meshes, and encodes render passes.

- [ ] **Step 1: Create `src/elastic/renderer.js`**

```js
// src/elastic/renderer.js
// Render pipeline: background simplex noise + textured elastic meshes.

import { getTheme } from '../theme.js';
import { getScrollNorm } from '../animations.js';

export class Renderer {
    /**
     * @param {GPUDevice} device
     * @param {GPUTextureFormat} format
     * @param {string} bgShaderCode - background.wgsl source
     * @param {string} meshShaderCode - mesh.wgsl source
     */
    constructor(device, format, bgShaderCode, meshShaderCode) {
        this.device = device;
        this.format = format;
        this.startTime = performance.now();

        // ── Background pipeline ──
        const bgModule = device.createShaderModule({ code: bgShaderCode });
        this.bgUniformBuffer = device.createBuffer({
            size: 80, // Uniforms struct size (padded to 16-byte alignment)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const bgBindGroupLayout = device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
            ],
        });

        this.bgBindGroup = device.createBindGroup({
            layout: bgBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.bgUniformBuffer } },
            ],
        });

        this.bgPipeline = device.createRenderPipeline({
            layout: device.createPipelineLayout({ bindGroupLayouts: [bgBindGroupLayout] }),
            vertex: { module: bgModule, entryPoint: 'vs_main' },
            fragment: {
                module: bgModule,
                entryPoint: 'fs_main',
                targets: [{
                    format,
                    blend: {
                        color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
                        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
                    },
                }],
            },
            primitive: { topology: 'triangle-list' },
        });

        // ── Mesh pipeline ──
        const meshModule = device.createShaderModule({ code: meshShaderCode });

        this.meshGlobalsBuffer = device.createBuffer({
            size: 16, // vec2f viewport + pad
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.meshBindGroupLayout = device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
                { binding: 3, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
            ],
        });

        this.meshPipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [this.meshBindGroupLayout] });

        this.meshPipeline = device.createRenderPipeline({
            layout: this.meshPipelineLayout,
            vertex: { module: meshModule, entryPoint: 'vs_main' },
            fragment: {
                module: meshModule,
                entryPoint: 'fs_main',
                targets: [{
                    format,
                    blend: {
                        color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
                        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
                    },
                }],
            },
            primitive: { topology: 'triangle-list' },
        });

        /** @type {GPUBindGroup|null} */
        this.meshBindGroup = null;
        /** @type {GPUBuffer|null} */
        this.indexBuffer = null;
        /** @type {Array<{indexOffset: number, indexCount: number}>} */
        this.drawCalls = [];
    }

    /**
     * Build mesh bind group and index buffer after physics is initialized.
     * @param {import('./physics.js').PhysicsSystem} physics
     * @param {import('./atlas.js').Atlas} atlas
     * @param {import('./layout.js').ElasticElement[]} elements
     */
    buildMeshData(physics, atlas, elements) {
        // Concatenate all index buffers with node offsets
        let totalIndices = 0;
        for (const el of elements) totalIndices += el.meshData.indices.length;

        const allIndices = new Uint32Array(totalIndices);
        this.drawCalls = [];
        let idxOffset = 0;

        for (const el of elements) {
            const off = physics.elementOffsets.get(el.id);
            if (!off) continue;
            const baseVertex = off.nodeOffset;
            const count = el.meshData.indices.length;

            for (let i = 0; i < count; i++) {
                allIndices[idxOffset + i] = el.meshData.indices[i] + baseVertex;
            }

            this.drawCalls.push({ indexOffset: idxOffset, indexCount: count });
            idxOffset += count;
        }

        this.indexBuffer?.destroy();
        this.indexBuffer = this.device.createBuffer({
            size: Math.max(allIndices.byteLength, 4),
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });
        new Uint32Array(this.indexBuffer.getMappedRange()).set(allIndices);
        this.indexBuffer.unmap();

        this.meshBindGroup = this.device.createBindGroup({
            layout: this.meshBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.meshGlobalsBuffer } },
                { binding: 1, resource: { buffer: physics.nodeBuffer } },
                { binding: 2, resource: atlas.texture.createView() },
                { binding: 3, resource: atlas.sampler },
            ],
        });
    }

    /**
     * Encode a full render frame.
     * @param {GPUCommandEncoder} encoder
     * @param {GPUTextureView} targetView
     * @param {number} width - canvas pixel width
     * @param {number} height - canvas pixel height
     */
    encode(encoder, targetView, width, height) {
        const t = (performance.now() - this.startTime) / 1000;
        const isDark = getTheme() === 'dark' ? 1.0 : 0.0;
        const scroll = getScrollNorm();

        // Update background uniforms
        const [ar, ag, ab] = _parseHex(_PALETTE.accent);
        const [clr, clg, clb] = _parseHex(_PALETTE.light.canvas);
        const [cdr, cdg, cdb] = _parseHex(_PALETTE.dark.canvas);

        const bgUniforms = new Float32Array(20);
        bgUniforms[0] = t;           // time
        bgUniforms[1] = scroll;      // scroll
        bgUniforms[2] = isDark;      // dark
        bgUniforms[3] = 0;           // pad
        bgUniforms[4] = width;       // resolution.x
        bgUniforms[5] = height;      // resolution.y
        bgUniforms[6] = 0;           // pad
        bgUniforms[7] = 0;           // pad
        bgUniforms[8] = ar;          // accent.r
        bgUniforms[9] = ag;          // accent.g
        bgUniforms[10] = ab;         // accent.b
        bgUniforms[11] = 0;          // pad
        bgUniforms[12] = clr;        // canvas_light.r
        bgUniforms[13] = clg;        // canvas_light.g
        bgUniforms[14] = clb;        // canvas_light.b
        bgUniforms[15] = 0;          // pad
        bgUniforms[16] = cdr;        // canvas_dark.r
        bgUniforms[17] = cdg;        // canvas_dark.g
        bgUniforms[18] = cdb;        // canvas_dark.b
        bgUniforms[19] = 0;          // pad
        this.device.queue.writeBuffer(this.bgUniformBuffer, 0, bgUniforms);

        // Update mesh globals
        const meshGlobals = new Float32Array([width, height, 0, 0]);
        this.device.queue.writeBuffer(this.meshGlobalsBuffer, 0, meshGlobals);

        // Render pass
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: targetView,
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: 'clear',
                storeOp: 'store',
            }],
        });

        // Draw background
        pass.setPipeline(this.bgPipeline);
        pass.setBindGroup(0, this.bgBindGroup);
        pass.draw(3); // fullscreen triangle

        // Draw meshes
        if (this.meshBindGroup && this.indexBuffer) {
            pass.setPipeline(this.meshPipeline);
            pass.setBindGroup(0, this.meshBindGroup);
            pass.setIndexBuffer(this.indexBuffer, 'uint32');
            for (const dc of this.drawCalls) {
                pass.drawIndexed(dc.indexCount, 1, dc.indexOffset);
            }
        }

        pass.end();
    }

    destroy() {
        this.bgUniformBuffer?.destroy();
        this.meshGlobalsBuffer?.destroy();
        this.indexBuffer?.destroy();
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/elastic/renderer.js
git commit -m "feat(elastic): add renderer with background + mesh render passes"
```

---

### Task 13: Interaction System

**Files:**
- Create: `src/elastic/interaction.js`

Pointer event capture, drag state machine, pin/impulse application to physics.

- [ ] **Step 1: Create `src/elastic/interaction.js`**

```js
// src/elastic/interaction.js
// Drag state machine + click squish impulse for elastic elements.

const DRAG_THRESHOLD = 4;    // px movement before entering drag mode
const CLICK_TIMEOUT = 200;   // ms — shorter = click, longer = potential drag
const PIN_RADIUS = 3;        // grid cells radius for soft-pinning
const SQUISH_IMPULSE = 800;  // base impulse strength for click squish

export class Interaction {
    /**
     * @param {import('./physics.js').PhysicsSystem} physics
     * @param {import('./layout.js').ElasticElement[]} elements
     */
    constructor(physics, elements) {
        this.physics = physics;
        this.elements = elements;

        this.state = 'IDLE'; // IDLE | PRESSED | DRAGGING
        this.activeElement = null;
        this.grabNodeIndex = -1;      // nearest node in element-local coords
        this.startX = 0;
        this.startY = 0;
        this.startTime = 0;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
    }

    attach() {
        document.addEventListener('pointerdown', this._onPointerDown);
        document.addEventListener('pointermove', this._onPointerMove);
        document.addEventListener('pointerup', this._onPointerUp);
    }

    detach() {
        document.removeEventListener('pointerdown', this._onPointerDown);
        document.removeEventListener('pointermove', this._onPointerMove);
        document.removeEventListener('pointerup', this._onPointerUp);
    }

    /**
     * Find which element and node a screen-space point hits.
     * @param {number} sx - screen X
     * @param {number} sy - screen Y
     * @returns {{element: Object, nodeIndex: number}|null}
     */
    hitTest(sx, sy) {
        const px = sx * this.dpr;
        const py = sy * this.dpr;

        for (const el of this.elements) {
            const rect = el.rect;
            if (sx < rect.left || sx > rect.right || sy < rect.top || sy > rect.bottom) continue;

            // Find nearest node
            const off = this.physics.elementOffsets.get(el.id);
            if (!off) continue;

            let bestDist = Infinity;
            let bestIdx = 0;
            const nodes = el.meshData.nodes;
            for (let i = 0; i < el.meshData.nodeCount; i++) {
                const nx = nodes[i * 6];
                const ny = nodes[i * 6 + 1];
                const d = (nx - px) ** 2 + (ny - py) ** 2;
                if (d < bestDist) {
                    bestDist = d;
                    bestIdx = i;
                }
            }

            return { element: el, nodeIndex: bestIdx };
        }
        return null;
    }

    _onPointerDown(e) {
        if (e.button !== 0) return; // left click only
        const hit = this.hitTest(e.clientX, e.clientY);
        if (!hit) return;

        this.state = 'PRESSED';
        this.activeElement = hit.element;
        this.grabNodeIndex = hit.nodeIndex;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.startTime = performance.now();
    }

    _onPointerMove(e) {
        if (this.state === 'IDLE') return;

        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;

        if (this.state === 'PRESSED') {
            // Check drag threshold
            if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
                // On mobile, yield to scroll if movement is primarily vertical
                if (e.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx) * 1.5) {
                    this.state = 'IDLE';
                    return;
                }
                this.state = 'DRAGGING';
            } else {
                return;
            }
        }

        if (this.state === 'DRAGGING') {
            this._updatePins(e.clientX * this.dpr, e.clientY * this.dpr);
        }
    }

    _onPointerUp(e) {
        if (this.state === 'IDLE') return;

        if (this.state === 'PRESSED' && (performance.now() - this.startTime) < CLICK_TIMEOUT) {
            // Click — apply squish impulse
            this._applySquish(e.clientX * this.dpr, e.clientY * this.dpr);
        }

        if (this.state === 'DRAGGING') {
            // Release — clear all pins
            this.physics.clearPins(this.activeElement.id);
        }

        this.state = 'IDLE';
        this.activeElement = null;
    }

    /**
     * Pin nodes near the grab point to the cursor position.
     */
    _updatePins(px, py) {
        const el = this.activeElement;
        const off = this.physics.elementOffsets.get(el.id);
        if (!off) return;

        const cols = el.cols;
        const grabRow = Math.floor(this.grabNodeIndex / cols);
        const grabCol = this.grabNodeIndex % cols;

        const pinData = new Float32Array(el.meshData.nodeCount * 4);

        for (let i = 0; i < el.meshData.nodeCount; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const dist = Math.sqrt((row - grabRow) ** 2 + (col - grabCol) ** 2);

            if (dist <= PIN_RADIUS) {
                const strength = dist === 0 ? 1.0 : Math.max(0, 1.0 - dist / PIN_RADIUS) * 0.6;
                pinData[i * 4]     = px;       // pin_x
                pinData[i * 4 + 1] = py;       // pin_y
                pinData[i * 4 + 2] = strength; // pin_strength
                pinData[i * 4 + 3] = 0;        // pad
            }
            // else leave as 0 (free)
        }

        this.physics.writePins(el.id, pinData);
    }

    /**
     * Apply a radial outward impulse for click squish.
     */
    _applySquish(px, py) {
        const el = this.activeElement;
        const off = this.physics.elementOffsets.get(el.id);
        if (!off) return;

        // Write velocity impulses directly
        const velData = new Float32Array(el.meshData.nodeCount * 2);
        const nodes = el.meshData.nodes;

        for (let i = 0; i < el.meshData.nodeCount; i++) {
            const nx = nodes[i * 6];
            const ny = nodes[i * 6 + 1];
            const dx = nx - px;
            const dy = ny - py;
            const distSq = dx * dx + dy * dy;
            const dist = Math.max(Math.sqrt(distSq), 1);
            const magnitude = SQUISH_IMPULSE / (1 + distSq * 0.001);

            velData[i * 2]     = (dx / dist) * magnitude;
            velData[i * 2 + 1] = (dy / dist) * magnitude;
        }

        this.physics.device.queue.writeBuffer(
            this.physics.velocityBuffer,
            off.nodeOffset * 8, // 2 floats × 4 bytes
            velData
        );
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/elastic/interaction.js
git commit -m "feat(elastic): add drag state machine and squish impulse"
```

---

### Task 14: Main Orchestrator

**Files:**
- Create: `src/elastic/index.js`

Ties everything together: detection, init, main loop, route/resize/theme hooks.

- [ ] **Step 1: Create `src/elastic/index.js`**

```js
// src/elastic/index.js
// Elastic UI entry point: WebGPU detection, init, main render loop.

import { initDevice, resizeCanvas } from './device.js';
import { Atlas } from './atlas.js';
import { PhysicsSystem } from './physics.js';
import { CollisionSystem } from './collision.js';
import { Renderer } from './renderer.js';
import { Interaction } from './interaction.js';
import { scanElements } from './layout.js';

/**
 * Attempt to initialize the elastic rendering system.
 * @param {HTMLCanvasElement} canvas - #shader-bg canvas element
 * @param {Object} pageData - { projects, activePage, blogEntries }
 * @returns {Promise<boolean>} true if WebGPU elastic mode is active
 */
export async function initElastic(canvas, pageData) {
    const gpu = await initDevice(canvas);
    if (!gpu) return false;

    const { device, context, format } = gpu;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Load shader sources
    const [bgSrc, meshSrc, physicsSrc, collisionSrc] = await Promise.all([
        fetch('./src/elastic/shaders/background.wgsl').then(r => r.text()),
        fetch('./src/elastic/shaders/mesh.wgsl').then(r => r.text()),
        fetch('./src/elastic/shaders/physics.wgsl').then(r => r.text()),
        fetch('./src/elastic/shaders/collision.wgsl').then(r => r.text()),
    ]);

    // Core systems
    const atlas = new Atlas(device);
    const physics = new PhysicsSystem(device, physicsSrc);
    const collision = new CollisionSystem(device, collisionSrc);
    collision.init();
    const renderer = new Renderer(device, format, bgSrc, meshSrc);

    let elements = [];
    let interaction = null;

    function rebuild() {
        resizeCanvas(canvas);
        physics.destroy();
        elements = scanElements(atlas, dpr, pageData);
        if (elements.length === 0) return;

        physics.build(elements);
        renderer.buildMeshData(physics, atlas, elements);

        interaction?.detach();
        interaction = new Interaction(physics, elements);
        interaction.attach();
    }

    rebuild();

    // Hide DOM visual layer — keep it for accessibility
    const domVisuals = document.querySelectorAll(
        '#navbar, .page-section, .site-footer, .grain-overlay, .hero-orb'
    );
    domVisuals.forEach(el => {
        el.style.opacity = '0';
        el.style.pointerEvents = 'auto';
    });

    // Make the canvas visible and full-viewport
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.zIndex = '9999';
    canvas.style.opacity = '1';

    // ── Main loop ──
    let running = true;
    let raf = 0;

    function frame() {
        if (!running) return;

        const { width, height } = resizeCanvas(canvas);
        const encoder = device.createCommandEncoder();

        // Physics
        physics.encode(encoder);

        // Collision (CPU AABB check, GPU resolve)
        // Note: we'd need to read back node positions for AABB update.
        // For now, skip collision on first pass — add readback in optimization pass.

        // Render
        const targetView = context.getCurrentTexture().createView();
        renderer.encode(encoder, targetView, width, height);

        device.queue.submit([encoder.finish()]);
        raf = requestAnimationFrame(frame);
    }

    // Respect prefers-reduced-motion: render static (no physics loop)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const { width, height } = resizeCanvas(canvas);
        const encoder = device.createCommandEncoder();
        const targetView = context.getCurrentTexture().createView();
        renderer.encode(encoder, targetView, width, height);
        device.queue.submit([encoder.finish()]);
    } else {
        raf = requestAnimationFrame(frame);
    }

    // Pause when tab is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            running = false;
            cancelAnimationFrame(raf);
        } else {
            running = true;
            raf = requestAnimationFrame(frame);
        }
    });

    // Rebuild on resize (debounced)
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(rebuild, 200);
    });

    // Rebuild on theme change
    const themeObs = new MutationObserver(() => rebuild());
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Expose rebuild for route changes
    window._elasticRebuild = (newPageData) => {
        Object.assign(pageData, newPageData);
        rebuild();
    };

    return true;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/elastic/index.js
git commit -m "feat(elastic): add main orchestrator with render loop"
```

---

### Task 15: Wire Into main.js

**Files:**
- Modify: `main.js:1-53`

Add the WebGPU elastic branch. If it succeeds, skip visual init (shader, card-effects, scroll-reveal). Keep router, theme, data, mobile-menu.

- [ ] **Step 1: Modify `main.js`**

Replace the entire file with:

```js
// Entry point for a9l.im portfolio. Wires DOM cache, renders dynamic cards,
// and boots all subsystems (router, shader, carousel, etc.).
// WebGPU elastic mode takes over rendering if available.

import { initRouter, parseHash } from './src/router.js';
import { initTheme } from './src/theme.js';
import { initMobileMenu } from './src/mobile-menu.js';
import { triggerFadeIns, initNavbarScroll, initScrollReveal } from './src/animations.js';
import { initShader } from './src/shader.js';
import { initCarousel, renderCarouselCards } from './src/carousel.js';
import { showBlogListing, showBlogPost } from './src/blog.js';
import { initWorldMap } from './src/world-map.js';
import { PROJECTS } from './src/projects.js';
import { renderProjectCards } from './src/projects-page.js';

// ─── DOM Cache ───
const $ = {
    navbar:      document.getElementById('navbar'),
    themeToggle: document.getElementById('theme-toggle'),
    menuToggle:  document.getElementById('menu-toggle'),
    mobileNav:   document.getElementById('mobile-nav'),
    shaderBg:    document.getElementById('shader-bg'),
    blogListing: document.getElementById('blog-listing'),
    blogPost:    document.getElementById('blog-post'),
    blogListCt:  document.getElementById('blog-list-container'),
    blogContent: document.getElementById('blog-post-content'),
};

const navLinks = document.querySelectorAll('.nav-link');
const pages    = document.querySelectorAll('.page-section');

// Both carousel (home) and project grid share the PROJECTS data array
renderCarouselCards(document.querySelector('.carousel-track'), PROJECTS);
renderProjectCards(document.querySelector('.projects-grid'), PROJECTS);

// ─── Always-active subsystems ───
initTheme($);
initMobileMenu($);

const routerDeps = {
    $,
    pages,
    navLinks,
    triggerFadeIns,
    showBlogPost: (slug) => showBlogPost(slug, $),
    showBlogListing: () => showBlogListing($),
};

initRouter(routerDeps);

// ─── WebGPU Elastic Mode ───
(async () => {
    try {
        const { initElastic } = await import('./src/elastic/index.js');
        const { page } = parseHash();
        const ok = await initElastic($.shaderBg, {
            projects: PROJECTS,
            activePage: page,
        });
        if (ok) {
            // Elastic mode active — hook route changes to rebuild
            window.addEventListener('hashchange', () => {
                const { page: newPage } = parseHash();
                if (window._elasticRebuild) {
                    // Small delay to let DOM update first
                    setTimeout(() => window._elasticRebuild({ activePage: newPage }), 50);
                }
            });
            return; // Skip legacy visual init
        }
    } catch (e) {
        console.warn('Elastic mode unavailable:', e);
    }

    // ─── Fallback: Legacy visual init ───
    initNavbarScroll($);
    initShader($);
    initScrollReveal();
    initCarousel();
    initWorldMap();
})();
```

- [ ] **Step 2: Test in browser**

Open `http://localhost:8000` in Chrome (113+). Expected:
- If WebGPU is available: fullscreen canvas with simplex noise background and textured element meshes. DOM is invisible. Clicking/dragging elements should deform them.
- If WebGPU is unavailable: falls back to existing site appearance (shader, CSS animations, etc.).

Check the console for any errors. Common issues:
- WGSL compilation errors → fix syntax in `.wgsl` files
- Buffer size mismatches → check alignment padding
- Texture format issues → check atlas upload dimensions

- [ ] **Step 3: Commit**

```bash
git add main.js
git commit -m "feat(elastic): wire WebGPU elastic mode into main.js with fallback"
```

---

### Task 16: Integration Testing & Tuning

**Files:**
- Modify: various files for bug fixes found during testing

This task is for manual browser testing and fixing issues that emerge.

- [ ] **Step 1: Test background shader**

Open the site. The simplex noise background should render identically to the old WebGL version. Compare side-by-side by toggling between fallback (disable WebGPU in chrome://flags) and elastic mode.

Fix any visual differences in `src/elastic/shaders/background.wgsl`.

- [ ] **Step 2: Test element rendering**

Check that all elements are visible as textured meshes:
- Navbar with brand, links, icons
- Hero text block
- Carousel cards with images
- Carousel dots
- Footer

Navigate to Projects, Blog, About pages and verify elements appear correctly after route change.

- [ ] **Step 3: Test drag interaction**

Click and drag on various elements:
- Navbar should stretch horizontally, thinning in the middle
- Cards should deform freely in all directions
- Hero text should warp when pulled
- Release should trigger 3-5 oscillation jiggle

Tune constants if needed:
- `physics.wgsl` stiffness (15-25 range)
- `interaction.js` PIN_RADIUS and SQUISH_IMPULSE
- `physics.js` damping (0.3-0.5)

- [ ] **Step 4: Test click squish**

Click (don't drag) on various elements. Should see localized outward bulge that fades with distance from click point, then settles back.

Tune SQUISH_IMPULSE in `interaction.js` if too strong/weak.

- [ ] **Step 5: Test mobile touch**

Open in Chrome DevTools responsive mode or on a real device. Single-finger drag should stretch elements. Vertical scroll should still work (not captured by drag handler). Tapping should trigger squish.

- [ ] **Step 6: Test theme toggle**

Toggle light/dark mode. All element textures should re-rasterize with correct theme colors. Background shader should update u_dark.

- [ ] **Step 7: Test accessibility**

- Tab through the page — focus should move through the invisible DOM elements
- Screen reader (VoiceOver on Mac) should read all text content
- `prefers-reduced-motion: reduce` should render static meshes with no animation

- [ ] **Step 8: Commit all fixes**

```bash
git add -A src/elastic/
git commit -m "fix(elastic): integration testing fixes and physics tuning"
```

---

### Task 17: Collision Integration

**Files:**
- Modify: `src/elastic/index.js` — add collision AABB readback
- Modify: `src/elastic/collision.js` — wire into frame loop

Collision was stubbed in Task 14. This task adds the CPU-side AABB update using a readback buffer and wires collision dispatch into the frame loop.

- [ ] **Step 1: Add readback buffer to physics.js**

Add to the end of `PhysicsSystem.build()`:

```js
        // Readback buffer for CPU-side AABB computation
        this.readbackBuffer = device.createBuffer({
            size: allNodes.byteLength,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        });
```

And add a readback method:

```js
    /**
     * Copy node positions to readback buffer. Call once per frame before collision.
     * @param {GPUCommandEncoder} encoder
     */
    encodeReadback(encoder) {
        encoder.copyBufferToBuffer(this.nodeBuffer, 0, this.readbackBuffer, 0, this.readbackBuffer.size);
    }

    /**
     * Map the readback buffer and return node data.
     * @returns {Promise<Float32Array>}
     */
    async readNodes() {
        await this.readbackBuffer.mapAsync(GPUMapMode.READ);
        const data = new Float32Array(this.readbackBuffer.getMappedRange().slice(0));
        this.readbackBuffer.unmap();
        return data;
    }
```

- [ ] **Step 2: Update frame loop in index.js**

Replace the collision comment in the `frame()` function with actual collision dispatch. Since readback is async, run collision every few frames:

```js
    let frameCount = 0;
    let pendingCollision = false;

    function frame() {
        if (!running) return;

        const { width, height } = resizeCanvas(canvas);
        const encoder = device.createCommandEncoder();

        physics.encode(encoder);

        // Collision every 4 frames (async readback)
        if (frameCount % 4 === 0 && !pendingCollision && elements.length > 1) {
            physics.encodeReadback(encoder);
            pendingCollision = true;

            device.queue.submit([encoder.finish()]);

            physics.readNodes().then(nodeData => {
                // Update AABBs
                for (const el of elements) {
                    const off = physics.elementOffsets.get(el.id);
                    if (!off) continue;
                    const slice = nodeData.subarray(off.nodeOffset * 6, (off.nodeOffset + off.nodeCount) * 6);
                    collision.updateAABB(el.id, slice, off.nodeCount);
                }

                // Find overlaps and dispatch collision
                const pairs = collision.findOverlaps();
                if (pairs.length > 0) {
                    const colEncoder = device.createCommandEncoder();
                    collision.encode(colEncoder, physics, pairs);
                    device.queue.submit([colEncoder.finish()]);
                }

                pendingCollision = false;
            });
        } else {
            const targetView = context.getCurrentTexture().createView();
            renderer.encode(encoder, targetView, width, height);
            device.queue.submit([encoder.finish()]);
        }

        // Always render (collision frame already submitted physics)
        if (frameCount % 4 === 0 && !pendingCollision) {
            // Already submitted above
        }

        frameCount++;
        raf = requestAnimationFrame(frame);
    }
```

Note: This is a simplified collision integration. The async readback means collision is 4 frames behind, which is acceptable for the subtle push effect.

- [ ] **Step 3: Test collision**

Stretch a carousel card far enough to overlap with an adjacent card. The adjacent card should dimple/dent where the stretched card pushes into it.

- [ ] **Step 4: Commit**

```bash
git add src/elastic/index.js src/elastic/physics.js src/elastic/collision.js
git commit -m "feat(elastic): integrate collision with async AABB readback"
```

---

### Task 18: Performance Optimization

**Files:**
- Modify: various elastic modules as needed

- [ ] **Step 1: Profile GPU frame time**

Open Chrome DevTools → Performance tab → record a few seconds of interaction. Check:
- GPU frame time should be <4ms for 60fps headroom
- No layout thrashing from DOM reads during render loop
- No excessive garbage collection from per-frame allocations

- [ ] **Step 2: Fix any identified bottlenecks**

Common fixes:
- Pre-allocate typed arrays instead of creating new ones per frame
- Batch `writeBuffer` calls
- Reduce mesh resolution for off-screen or small elements
- Skip physics for elements that haven't been interacted with recently (add an "active" flag)

- [ ] **Step 3: Test on lower-end hardware**

If available, test on an older laptop or integrated GPU. Reduce mesh resolution or skip collision if frame time exceeds 8ms.

- [ ] **Step 4: Commit optimizations**

```bash
git add -A src/elastic/
git commit -m "perf(elastic): optimize frame allocations and GPU dispatch"
```
