#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   tests/wgsl-transpile/bench.js — emit-pipeline microbench.

   Four kernels, each run baseline (polymorphic rt.*) and inlined
   (scalar/vec emit) configurations. The four kernels target distinct
   parts of the perf envelope so each upcoming optimization has a
   principled "before/after" measurement:

     A. vec3 FMA loop — pure arithmetic, allocation-bound. Stresses the
        component-wise lowering that phase 4 added; shows the maximum
        win available when every binop fuses into a single object
        literal. Synthetic — overstates real-shader gains.

     B. Verlet spring step — storage-I/O dominant, with a neighbor read,
        sqrt+max, branch early-out, and dual write-back. Shape mirrors
        a real plasma/geon physics step. Honest baseline for measuring
        Tier 1 emitter changes (write-through, flat TypedArray) against.

     C. N-body short-range accumulator — `var` accumulator + compound
        assigns (`+=`/`-=`) in a small loop. Today's emitter scalarizes
        let/const vec locals but leaves `var` vec locals as live object
        allocations. This kernel's `var force = vec3(0); ... force +=
        ...` pattern is the canonical target for the upcoming var-SROA
        pass. Also exercises conditional reassignment (`var damped` in
        an `if` branch) — the other thing var-SROA has to model.

     D. Helper-heavy spring step — same shape as kernel B but factored
        through three small fns (`safe_normalize`, `spring_force`,
        `clamp_speed`). Each helper returns a fresh vec, so today's
        emitter materializes one object per call site (4 per particle
        per step). Target for upcoming small-fn inlining; after inline,
        every helper's vec arithmetic should collapse into the entry
        fn's component-wise stream.

   Usage:
     node tests/wgsl-transpile/bench.js
     BENCH_N=50000 BENCH_ITERS=20 node tests/wgsl-transpile/bench.js

   Output is human-readable per-line; exits 0 always (no pass/fail
   semantics, this is a measurement tool).
   ─────────────────────────────────────────────────────────────────── */

import { compileWGSL } from '../../shared-wgsl-transpile.js';

// ── Bench parameters ──────────────────────────────────────────────
const N     = +process.env.BENCH_N     || 10000;
const ITERS = +process.env.BENCH_ITERS || 10;
const WARMUP = 3;

// ── Deterministic LCG for synthetic inputs ────────────────────────
function lcg(seed = 0x12345678) {
    let s = seed >>> 0;
    return () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return (s / 0x100000000) * 2 - 1;
    };
}

// ── Kernel A: vec3 FMA loop ───────────────────────────────────────
// Each invocation does:
//   acc = vec3(0)
//   loop 8x:  acc = acc + (av * k + bv) * k - av
// Exercises: scalar*vec, vec+vec, vec-vec, vec assignment, plus
// storage reads (a[i], b[i]) and writes (c[i]).
const KERNEL_FMA = `
struct Uniforms { n: u32, k: f32, _pad0: f32, _pad1: f32, };

@group(0) @binding(0) var<uniform> U: Uniforms;
@group(0) @binding(1) var<storage, read>       a: array<vec3<f32>>;
@group(0) @binding(2) var<storage, read>       b: array<vec3<f32>>;
@group(0) @binding(3) var<storage, read_write> c: array<vec3<f32>>;

@compute @workgroup_size(64, 1, 1)
fn fma(@builtin(global_invocation_id) gid: vec3<u32>) {
    let i = gid.x;
    if (i >= U.n) { return; }
    let av = a[i];
    let bv = b[i];
    var acc = vec3<f32>(0.0, 0.0, 0.0);
    for (var j = 0u; j < 8u; j = j + 1u) {
        acc = acc + (av * U.k + bv) * U.k - av;
    }
    c[i] = acc;
}
`;

function makeFmaInputs(n) {
    const nxt = lcg(0x12345678);
    const a = new Array(n);
    const b = new Array(n);
    const c = new Array(n);
    for (let i = 0; i < n; i++) {
        a[i] = { x: nxt(), y: nxt(), z: nxt() };
        b[i] = { x: nxt(), y: nxt(), z: nxt() };
        c[i] = { x: 0, y: 0, z: 0 };
    }
    return { a, b, c };
}

function makeFmaInputsFlat(n) {
    const nxt = lcg(0x12345678);
    const a = new Float32Array(n * 3);
    const b = new Float32Array(n * 3);
    const c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
        a[i*3+0] = nxt(); a[i*3+1] = nxt(); a[i*3+2] = nxt();
        b[i*3+0] = nxt(); b[i*3+1] = nxt(); b[i*3+2] = nxt();
    }
    return { a, b, c };
}

function runFma(label, compileOpts = {}) {
    const flat = !!compileOpts.flatStorage;
    const mod = compileWGSL(KERNEL_FMA, compileOpts);
    const inputs = flat ? makeFmaInputsFlat(N) : makeFmaInputs(N);
    const bindings = {
        U: { n: N, k: 0.5, _pad0: 0, _pad1: 0 },
        a: inputs.a, b: inputs.b, c: inputs.c,
    };
    const workgroups = [Math.ceil(N / 64), 1, 1];

    // Warmup — gives V8 a chance to optimize, also surfaces any errors
    // before we time anything.
    for (let i = 0; i < WARMUP; i++) mod.entry.fma({ workgroups, bindings });

    const cs = flat
        ? inputs.c[0] + inputs.c[1] + inputs.c[2]
        : inputs.c[0].x + inputs.c[0].y + inputs.c[0].z;
    if (!Number.isFinite(cs) || cs === 0) {
        console.error(`  ✗ ${label}  — checksum looks wrong (${cs})`);
        return null;
    }

    const t0 = performance.now();
    for (let i = 0; i < ITERS; i++) mod.entry.fma({ workgroups, bindings });
    const t1 = performance.now();

    const ms = t1 - t0;
    // Vec ops per iteration: 8 inner × 4 vec ops × 3 components = 96.
    const vecOps = N * ITERS * 8 * 4 * 3;
    const mvops  = (vecOps / (ms / 1000)) / 1e6;
    console.log(
        `  ${label.padEnd(40)}  ${ms.toFixed(1).padStart(8)}ms  ` +
        `${(ms / ITERS).toFixed(2).padStart(6)}ms/iter  ` +
        `${mvops.toFixed(1).padStart(7)} Mvops/sec`
    );
    return ms;
}

// ── Kernel B: verlet spring step ──────────────────────────────────
// Spring-coupled particle chain, one velocity-verlet step per call.
// Reads pos_in[i], vel_in[i] plus neighbor pos_in[i+1] (clamped),
// computes spring force toward neighbor with damping, writes new
// pos_out[i] and vel_out[i].
//
// Shape captures the "real shader" perf envelope:
//   - 3 storage reads per invocation (2 self + 1 neighbor)
//   - 2 storage writes per invocation
//   - vec3 arithmetic mixed with scalar (sqrt, max, reciprocal)
//   - early-out branch
//   - integer arithmetic with min(i+1, n-1) bound clamp
const KERNEL_VERLET = `
struct Uniforms { n: u32, dt: f32, damping: f32, k_spring: f32, };

@group(0) @binding(0) var<uniform>             U:       Uniforms;
@group(0) @binding(1) var<storage, read>       pos_in:  array<vec3<f32>>;
@group(0) @binding(2) var<storage, read>       vel_in:  array<vec3<f32>>;
@group(0) @binding(3) var<storage, read_write> pos_out: array<vec3<f32>>;
@group(0) @binding(4) var<storage, read_write> vel_out: array<vec3<f32>>;

@compute @workgroup_size(64, 1, 1)
fn step(@builtin(global_invocation_id) gid: vec3<u32>) {
    let i = gid.x;
    if (i >= U.n) { return; }
    let p = pos_in[i];
    let v = vel_in[i];
    // Spring force toward next neighbor (clamped at the end of the chain).
    let j = min(i + 1u, U.n - 1u);
    let q = pos_in[j];
    let d = q - p;
    let dlen = sqrt(d.x*d.x + d.y*d.y + d.z*d.z);
    let inv = 1.0 / max(dlen, 1e-6);
    let dir = d * inv;
    let f = dir * (U.k_spring * dlen) - v * U.damping;
    let vn = v + f * U.dt;
    let pn = p + vn * U.dt;
    pos_out[i] = pn;
    vel_out[i] = vn;
}
`;

function makeVerletInputs(n) {
    const nxt = lcg(0xCAFEBABE);
    const pos_in  = new Array(n);
    const vel_in  = new Array(n);
    const pos_out = new Array(n);
    const vel_out = new Array(n);
    // Spread particles along x with small random offsets so neighbors
    // aren't coincident (would force dlen → 0 path every iteration).
    for (let i = 0; i < n; i++) {
        pos_in[i]  = { x: i * 0.1 + nxt() * 0.01, y: nxt(), z: nxt() };
        vel_in[i]  = { x: nxt() * 0.1, y: nxt() * 0.1, z: nxt() * 0.1 };
        pos_out[i] = { x: 0, y: 0, z: 0 };
        vel_out[i] = { x: 0, y: 0, z: 0 };
    }
    return { pos_in, vel_in, pos_out, vel_out };
}

function makeVerletInputsFlat(n) {
    const nxt = lcg(0xCAFEBABE);
    const pos_in  = new Float32Array(n * 3);
    const vel_in  = new Float32Array(n * 3);
    const pos_out = new Float32Array(n * 3);
    const vel_out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
        pos_in[i*3+0] = i * 0.1 + nxt() * 0.01; pos_in[i*3+1] = nxt(); pos_in[i*3+2] = nxt();
        vel_in[i*3+0] = nxt() * 0.1; vel_in[i*3+1] = nxt() * 0.1; vel_in[i*3+2] = nxt() * 0.1;
    }
    return { pos_in, vel_in, pos_out, vel_out };
}

function runVerlet(label, compileOpts = {}) {
    const flat = !!compileOpts.flatStorage;
    const mod = compileWGSL(KERNEL_VERLET, compileOpts);
    const inputs = flat ? makeVerletInputsFlat(N) : makeVerletInputs(N);
    const bindings = {
        U: { n: N, dt: 0.01, damping: 0.05, k_spring: 10.0 },
        pos_in: inputs.pos_in, vel_in: inputs.vel_in,
        pos_out: inputs.pos_out, vel_out: inputs.vel_out,
    };
    const workgroups = [Math.ceil(N / 64), 1, 1];

    for (let i = 0; i < WARMUP; i++) mod.entry.step({ workgroups, bindings });

    const cs = flat
        ? inputs.pos_out[0] + inputs.pos_out[1] + inputs.pos_out[2]
        : inputs.pos_out[0].x + inputs.pos_out[0].y + inputs.pos_out[0].z;
    if (!Number.isFinite(cs) || cs === 0) {
        console.error(`  ✗ ${label}  — checksum looks wrong (${cs})`);
        return null;
    }

    const t0 = performance.now();
    for (let i = 0; i < ITERS; i++) mod.entry.step({ workgroups, bindings });
    const t1 = performance.now();

    const ms = t1 - t0;
    const particleSteps = N * ITERS;
    const mps = (particleSteps / (ms / 1000)) / 1e6;
    console.log(
        `  ${label.padEnd(40)}  ${ms.toFixed(1).padStart(8)}ms  ` +
        `${(ms / ITERS).toFixed(2).padStart(6)}ms/iter  ` +
        `${mps.toFixed(2).padStart(7)} Mparticle-steps/sec`
    );
    return ms;
}

// ── Kernel C: var accumulator + compound assigns ──────────────────
// Short-range N-body force accumulation. Each invocation walks an
// 8-element neighbor window, accumulating attract/repel components
// into `var force` via `+=`/`-=`. Then a conditional reassignment of
// `var damped` (the canonical "var SROA must model branch escape"
// case), then a single position write.
//
// What this exercises that A/B don't:
//   - `var force = vec3(0)` followed by 16 compound-assign updates.
//     Today: each `force += ...` reads force.{x,y,z}, computes rhs as
//     a fresh object, writes force = {x:..,y:..,z:..}. After var SROA:
//     `force_x += ...; force_y += ...; force_z += ...` directly.
//   - `var damped = v` reassigned inside `if`. Var SROA must scalarize
//     the binding AND propagate scalar names through both branches.
const KERNEL_NBODY = `
struct Uniforms {
    n: u32, k_attract: f32, k_repel: f32, dt: f32,
    drag: f32, _pad0: f32, _pad1: f32, _pad2: f32,
};

@group(0) @binding(0) var<uniform>             U:   Uniforms;
@group(0) @binding(1) var<storage, read>       pos: array<vec3<f32>>;
@group(0) @binding(2) var<storage, read>       vel: array<vec3<f32>>;
@group(0) @binding(3) var<storage, read_write> out: array<vec3<f32>>;

@compute @workgroup_size(64, 1, 1)
fn nbody(@builtin(global_invocation_id) gid: vec3<u32>) {
    let i = gid.x;
    if (i >= U.n) { return; }
    let p = pos[i];
    let v = vel[i];
    var force = vec3<f32>(0.0, 0.0, 0.0);
    for (var k = 1u; k <= 8u; k = k + 1u) {
        let j = (i + k) % U.n;
        let q = pos[j];
        let d = q - p;
        let r2 = d.x*d.x + d.y*d.y + d.z*d.z + 1e-6;
        let inv_r = 1.0 / sqrt(r2);
        let dir = d * inv_r;
        force += dir * (U.k_attract / r2);
        force -= dir * (U.k_repel * inv_r * inv_r * inv_r);
    }
    var damped = v;
    if (force.x*force.x + force.y*force.y + force.z*force.z > 1.0) {
        damped = v * 0.5;
    }
    let a = force - damped * U.drag;
    out[i] = p + (damped + a * U.dt) * U.dt;
}
`;

function makeNbodyInputs(n) {
    const nxt = lcg(0xDEADBEEF);
    const pos = new Array(n);
    const vel = new Array(n);
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
        // Spread on a 3D lattice-ish layout — guarantees non-coincident
        // neighbors so the 1/r^2 branch is well-defined.
        pos[i] = { x: nxt() * 5.0, y: nxt() * 5.0, z: nxt() * 5.0 };
        vel[i] = { x: nxt() * 0.1, y: nxt() * 0.1, z: nxt() * 0.1 };
        out[i] = { x: 0, y: 0, z: 0 };
    }
    return { pos, vel, out };
}

function makeNbodyInputsFlat(n) {
    const nxt = lcg(0xDEADBEEF);
    const pos = new Float32Array(n * 3);
    const vel = new Float32Array(n * 3);
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
        pos[i*3+0] = nxt() * 5.0; pos[i*3+1] = nxt() * 5.0; pos[i*3+2] = nxt() * 5.0;
        vel[i*3+0] = nxt() * 0.1; vel[i*3+1] = nxt() * 0.1; vel[i*3+2] = nxt() * 0.1;
    }
    return { pos, vel, out };
}

function runNbody(label, compileOpts = {}) {
    const flat = !!compileOpts.flatStorage;
    const mod = compileWGSL(KERNEL_NBODY, compileOpts);
    const inputs = flat ? makeNbodyInputsFlat(N) : makeNbodyInputs(N);
    const bindings = {
        U: { n: N, k_attract: 0.05, k_repel: 0.01, dt: 0.01,
             drag: 0.1, _pad0: 0, _pad1: 0, _pad2: 0 },
        pos: inputs.pos, vel: inputs.vel, out: inputs.out,
    };
    const workgroups = [Math.ceil(N / 64), 1, 1];

    for (let i = 0; i < WARMUP; i++) mod.entry.nbody({ workgroups, bindings });

    const cs = flat
        ? inputs.out[0] + inputs.out[1] + inputs.out[2]
        : inputs.out[0].x + inputs.out[0].y + inputs.out[0].z;
    if (!Number.isFinite(cs) || cs === 0) {
        console.error(`  ✗ ${label}  — checksum looks wrong (${cs})`);
        return null;
    }

    const t0 = performance.now();
    for (let i = 0; i < ITERS; i++) mod.entry.nbody({ workgroups, bindings });
    const t1 = performance.now();

    const ms = t1 - t0;
    const particleSteps = N * ITERS;
    const mps = (particleSteps / (ms / 1000)) / 1e6;
    console.log(
        `  ${label.padEnd(40)}  ${ms.toFixed(1).padStart(8)}ms  ` +
        `${(ms / ITERS).toFixed(2).padStart(6)}ms/iter  ` +
        `${mps.toFixed(2).padStart(7)} Mparticle-steps/sec`
    );
    return ms;
}

// ── Kernel D: helper-heavy spring step ────────────────────────────
// Same physics as kernel B (one-neighbor spring + damping + write-back)
// but factored through three vec-returning helpers. Each call site
// today materializes one fresh vec3 object that the entry then
// immediately consumes. Target for small-fn inlining: after inline,
// the helper bodies fold into the entry's component-wise stream and
// the four intermediate vecs (drag, f, v_new, p_new pieces) disappear.
const KERNEL_HELPERS = `
struct Uniforms {
    n: u32, dt: f32, damping: f32, k_spring: f32,
    rest_len: f32, v_max: f32, _pad0: f32, _pad1: f32,
};

@group(0) @binding(0) var<uniform>             U:       Uniforms;
@group(0) @binding(1) var<storage, read>       pos_in:  array<vec3<f32>>;
@group(0) @binding(2) var<storage, read>       vel_in:  array<vec3<f32>>;
@group(0) @binding(3) var<storage, read_write> pos_out: array<vec3<f32>>;
@group(0) @binding(4) var<storage, read_write> vel_out: array<vec3<f32>>;

fn safe_normalize(d: vec3<f32>) -> vec3<f32> {
    let len = sqrt(d.x*d.x + d.y*d.y + d.z*d.z);
    return d * (1.0 / max(len, 1e-6));
}

fn spring_force(p: vec3<f32>, q: vec3<f32>, k: f32, rest: f32) -> vec3<f32> {
    let d = q - p;
    let len = sqrt(d.x*d.x + d.y*d.y + d.z*d.z);
    let dir = d * (1.0 / max(len, 1e-6));
    return dir * (k * (len - rest));
}

fn clamp_speed(v: vec3<f32>, mx: f32) -> vec3<f32> {
    let s = sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
    if (s > mx) { return v * (mx / s); }
    return v;
}

@compute @workgroup_size(64, 1, 1)
fn step(@builtin(global_invocation_id) gid: vec3<u32>) {
    let i = gid.x;
    if (i >= U.n) { return; }
    let p = pos_in[i];
    let v = vel_in[i];
    let j = min(i + 1u, U.n - 1u);
    let q = pos_in[j];
    let f = spring_force(p, q, U.k_spring, U.rest_len);
    let drag = safe_normalize(v) * U.damping;
    let v_new = clamp_speed(v - drag + f * U.dt, U.v_max);
    let p_new = p + v_new * U.dt;
    pos_out[i] = p_new;
    vel_out[i] = v_new;
}
`;

function makeHelpersInputs(n) {
    const nxt = lcg(0xABCDEF01);
    const pos_in  = new Array(n);
    const vel_in  = new Array(n);
    const pos_out = new Array(n);
    const vel_out = new Array(n);
    for (let i = 0; i < n; i++) {
        // Match kernel B's input shape — spread on x with jitter, small
        // random velocity. Keeps the helper-vs-monolithic comparison
        // apples-to-apples on the storage side.
        pos_in[i]  = { x: i * 0.1 + nxt() * 0.01, y: nxt(), z: nxt() };
        vel_in[i]  = { x: nxt() * 0.1, y: nxt() * 0.1, z: nxt() * 0.1 };
        pos_out[i] = { x: 0, y: 0, z: 0 };
        vel_out[i] = { x: 0, y: 0, z: 0 };
    }
    return { pos_in, vel_in, pos_out, vel_out };
}

function makeHelpersInputsFlat(n) {
    const nxt = lcg(0xABCDEF01);
    const pos_in  = new Float32Array(n * 3);
    const vel_in  = new Float32Array(n * 3);
    const pos_out = new Float32Array(n * 3);
    const vel_out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
        pos_in[i*3+0] = i * 0.1 + nxt() * 0.01; pos_in[i*3+1] = nxt(); pos_in[i*3+2] = nxt();
        vel_in[i*3+0] = nxt() * 0.1; vel_in[i*3+1] = nxt() * 0.1; vel_in[i*3+2] = nxt() * 0.1;
    }
    return { pos_in, vel_in, pos_out, vel_out };
}

function runHelpers(label, compileOpts = {}) {
    const flat = !!compileOpts.flatStorage;
    const mod = compileWGSL(KERNEL_HELPERS, compileOpts);
    const inputs = flat ? makeHelpersInputsFlat(N) : makeHelpersInputs(N);
    const bindings = {
        U: { n: N, dt: 0.01, damping: 0.05, k_spring: 10.0,
             rest_len: 0.1, v_max: 5.0, _pad0: 0, _pad1: 0 },
        pos_in: inputs.pos_in, vel_in: inputs.vel_in,
        pos_out: inputs.pos_out, vel_out: inputs.vel_out,
    };
    const workgroups = [Math.ceil(N / 64), 1, 1];

    for (let i = 0; i < WARMUP; i++) mod.entry.step({ workgroups, bindings });

    const cs = flat
        ? inputs.pos_out[0] + inputs.pos_out[1] + inputs.pos_out[2]
        : inputs.pos_out[0].x + inputs.pos_out[0].y + inputs.pos_out[0].z;
    if (!Number.isFinite(cs) || cs === 0) {
        console.error(`  ✗ ${label}  — checksum looks wrong (${cs})`);
        return null;
    }

    const t0 = performance.now();
    for (let i = 0; i < ITERS; i++) mod.entry.step({ workgroups, bindings });
    const t1 = performance.now();

    const ms = t1 - t0;
    const particleSteps = N * ITERS;
    const mps = (particleSteps / (ms / 1000)) / 1e6;
    console.log(
        `  ${label.padEnd(40)}  ${ms.toFixed(1).padStart(8)}ms  ` +
        `${(ms / ITERS).toFixed(2).padStart(6)}ms/iter  ` +
        `${mps.toFixed(2).padStart(7)} Mparticle-steps/sec`
    );
    return ms;
}

// ── Main ──────────────────────────────────────────────────────────
function speedupTag(ratio) {
    if (ratio >= 2)   return '🚀';
    if (ratio >= 1.2) return '↑';
    if (ratio >= 0.9) return '·';
    return '↓';
}

console.log(`wgsl-transpile bench`);
console.log(`  N=${N} elements × ${ITERS} iters  (+${WARMUP} warmup)`);
console.log();

function reportSpeedups({ base, inl, flat }) {
    if (base && inl) {
        const r = base / inl;
        console.log(`  speedup (inlined vs baseline):   ${r.toFixed(2)}x  ${speedupTag(r)}`);
    }
    if (inl && flat) {
        const r = inl / flat;
        console.log(`  speedup (flat vs inlined):       ${r.toFixed(2)}x  ${speedupTag(r)}`);
    }
    if (base && flat) {
        const r = base / flat;
        console.log(`  cumulative (flat vs baseline):   ${r.toFixed(2)}x  ${speedupTag(r)}`);
    }
}

console.log(`kernel A: vec3 FMA loop (pure arithmetic, allocation-bound)`);
const fmaBase = runFma('baseline (polymorphic rt.*):', { polymorphic: true });
const fmaInl  = runFma('inlined  (scalar/vec emit):');
const fmaFlat = runFma('flat     (TypedArray storage):', { flatStorage: true });
reportSpeedups({ base: fmaBase, inl: fmaInl, flat: fmaFlat });
console.log();

console.log(`kernel B: verlet spring step (storage I/O dominant, real-shader shape)`);
const vrlBase = runVerlet('baseline (polymorphic rt.*):', { polymorphic: true });
const vrlInl  = runVerlet('inlined  (scalar/vec emit):');
const vrlFlat = runVerlet('flat     (TypedArray storage):', { flatStorage: true });
reportSpeedups({ base: vrlBase, inl: vrlInl, flat: vrlFlat });
console.log();

console.log(`kernel C: n-body var accumulator (compound assigns, target for var-SROA)`);
const nbBase = runNbody('baseline (polymorphic rt.*):', { polymorphic: true });
const nbInl  = runNbody('inlined  (scalar/vec emit):');
const nbFlat = runNbody('flat     (TypedArray storage):', { flatStorage: true });
reportSpeedups({ base: nbBase, inl: nbInl, flat: nbFlat });
console.log();

console.log(`kernel D: helper-heavy spring step (target for small-fn inlining)`);
const hpBase = runHelpers('baseline (polymorphic rt.*):', { polymorphic: true });
const hpInl  = runHelpers('inlined  (scalar/vec emit):');
const hpFlat = runHelpers('flat     (TypedArray storage):', { flatStorage: true });
reportSpeedups({ base: hpBase, inl: hpInl, flat: hpFlat });
console.log();
