#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   tests/wgsl-transpile/bench.js — emit-pipeline microbench.

   Two kernels, each run baseline (polymorphic rt.*) and inlined
   (scalar/vec emit) configurations. The two kernels measure different
   parts of the perf envelope:

     A. vec3 FMA loop — pure arithmetic, allocation-bound. Stresses the
        component-wise lowering that phase 4 added; shows the maximum
        win available when every binop fuses into a single object
        literal. Synthetic — overstates real-shader gains.

     B. Verlet spring step — storage-I/O dominant, with a neighbor read,
        sqrt+max, branch early-out, and dual write-back. Shape mirrors
        a real plasma/geon physics step. Honest baseline for measuring
        Tier 1 emitter changes (write-through, flat TypedArray) against.

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

function runFma(label, compileOpts = {}) {
    const mod = compileWGSL(KERNEL_FMA, compileOpts);
    const inputs = makeFmaInputs(N);
    const bindings = {
        U: { n: N, k: 0.5, _pad0: 0, _pad1: 0 },
        a: inputs.a, b: inputs.b, c: inputs.c,
    };
    const workgroups = [Math.ceil(N / 64), 1, 1];

    // Warmup — gives V8 a chance to optimize, also surfaces any errors
    // before we time anything.
    for (let i = 0; i < WARMUP; i++) mod.entry.fma({ workgroups, bindings });

    const cs = inputs.c[0].x + inputs.c[0].y + inputs.c[0].z;
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

function runVerlet(label, compileOpts = {}) {
    const mod = compileWGSL(KERNEL_VERLET, compileOpts);
    const inputs = makeVerletInputs(N);
    const bindings = {
        U: { n: N, dt: 0.01, damping: 0.05, k_spring: 10.0 },
        pos_in: inputs.pos_in, vel_in: inputs.vel_in,
        pos_out: inputs.pos_out, vel_out: inputs.vel_out,
    };
    const workgroups = [Math.ceil(N / 64), 1, 1];

    for (let i = 0; i < WARMUP; i++) mod.entry.step({ workgroups, bindings });

    const cs = inputs.pos_out[0].x + inputs.pos_out[0].y + inputs.pos_out[0].z;
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

console.log(`kernel A: vec3 FMA loop (pure arithmetic, allocation-bound)`);
const fmaBase = runFma('baseline (polymorphic rt.*):', { polymorphic: true });
const fmaInl  = runFma('inlined  (scalar/vec emit):');
if (fmaBase && fmaInl) {
    const r = fmaBase / fmaInl;
    console.log(`  speedup: ${r.toFixed(2)}x  ${speedupTag(r)}`);
}
console.log();

console.log(`kernel B: verlet spring step (storage I/O dominant, real-shader shape)`);
const vrlBase = runVerlet('baseline (polymorphic rt.*):', { polymorphic: true });
const vrlInl  = runVerlet('inlined  (scalar/vec emit):');
if (vrlBase && vrlInl) {
    const r = vrlBase / vrlInl;
    console.log(`  speedup: ${r.toFixed(2)}x  ${speedupTag(r)}`);
}
console.log();
