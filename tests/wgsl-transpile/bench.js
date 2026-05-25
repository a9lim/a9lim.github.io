#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   tests/wgsl-transpile/bench.js — emit-pipeline microbench.

   Compiles a synthetic vec3-heavy kernel through the transpiler and
   measures wall-time. Right now there's one configuration (the current
   polymorphic-rt.* emit). Phase 4 of the resolver arc lands an
   inlined-scalar-and-vec emit path; this bench will then run both
   configurations back-to-back and report the speedup ratio.

   The kernel deliberately stresses the codepath phase 4 optimizes:
   scalar↔vec broadcasting, vec↔vec arithmetic, and storage-array
   loads/stores. Every iteration of the inner loop allocates fresh
   `{x,y,z}` objects under the polymorphic emit (since `rt.add` etc.
   return new objects); the inlined emit will fuse those into a single
   object literal per statement, which is the whole point of the win.

   Usage:
     node tests/wgsl-transpile/bench.js
     BENCH_N=50000 BENCH_ITERS=20 node tests/wgsl-transpile/bench.js

   Output is human-readable per-line; exits 0 always (no pass/fail
   semantics, this is a measurement tool).
   ─────────────────────────────────────────────────────────────────── */

import { compileWGSL } from '../../shared-wgsl-transpile.js';

// ── Synthetic kernel ──────────────────────────────────────────────
// vec3 FMA + accumulator loop. Each invocation does:
//   acc = vec3(0)
//   loop 8x:  acc = acc + (av * k + bv) * k - av
// which exercises: scalar*vec, vec+vec, vec-vec, vec assignment, plus
// storage reads (a[i], b[i]) and writes (c[i]).
const KERNEL = `
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

// ── Bench parameters ──────────────────────────────────────────────
const N     = +process.env.BENCH_N     || 10000;
const ITERS = +process.env.BENCH_ITERS || 10;
const WARMUP = 3;

// ── Deterministic synthetic inputs (LCG, fixed seed) ──────────────
// Vec storage as {x,y,z} objects — matches the polymorphic emit's
// expected layout. Phase 4's flat-TypedArray follow-up may change this.
function makeInputs(n) {
    let s = 0x12345678 >>> 0;
    const nxt = () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return (s / 0x100000000) * 2 - 1;
    };
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

// ── Run one configuration ─────────────────────────────────────────
function runConfig(label, compileOpts = {}) {
    const mod = compileWGSL(KERNEL, compileOpts);
    const inputs = makeInputs(N);
    const bindings = {
        U: { n: N, k: 0.5, _pad0: 0, _pad1: 0 },
        a: inputs.a, b: inputs.b, c: inputs.c,
    };
    const workgroups = [Math.ceil(N / 64), 1, 1];

    // Warmup — gives V8 a chance to optimize, also surfaces any errors
    // before we time anything.
    for (let i = 0; i < WARMUP; i++) mod.entry.fma({ workgroups, bindings });

    // Sanity: c should now contain non-trivial values. Quick checksum
    // so the bench can't accidentally measure a no-op (e.g. if the
    // emitted entry silently returns early).
    const cs = inputs.c[0].x + inputs.c[0].y + inputs.c[0].z;
    if (!Number.isFinite(cs) || cs === 0) {
        console.error(`  ✗ ${label}  — checksum looks wrong (${cs})`);
        return null;
    }

    const t0 = performance.now();
    for (let i = 0; i < ITERS; i++) mod.entry.fma({ workgroups, bindings });
    const t1 = performance.now();

    const ms = t1 - t0;
    // Vec ops per iteration: 8 inner × (scalar*vec + vec+vec + scalar*vec + vec-vec) = 32 per particle.
    const vecOps = N * ITERS * 8 * 4;
    const mvops  = (vecOps / (ms / 1000)) / 1e6;
    console.log(
        `  ${label.padEnd(38)}  ${ms.toFixed(1).padStart(8)}ms  ` +
        `${(ms / ITERS).toFixed(2).padStart(6)}ms/iter  ` +
        `${mvops.toFixed(2).padStart(7)} Mvops/sec`
    );
    return ms;
}

// ── Main ──────────────────────────────────────────────────────────
console.log(`wgsl-transpile bench: vec3 FMA loop`);
console.log(`  N=${N} particles × 8 inner × ${ITERS} iters  (+${WARMUP} warmup)`);
console.log();

const baseline = runConfig('baseline (polymorphic rt.*):');

// Phase 4 will add a second config here once `compileWGSL` accepts an
// inline-emit flag, then print a speedup ratio:
//   const inlined = runConfig('inlined  (scalar/vec emit):', { inline: true });
//   if (baseline && inlined) {
//       console.log(`\n  speedup: ${(baseline / inlined).toFixed(2)}x`);
//   }

console.log();
